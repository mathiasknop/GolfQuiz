import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import crypto from "crypto";

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const sessions = client
  .database(process.env.COSMOS_DATABASE || "golf-quiz")
  .container("sessions");

// GQ-XXXX with no ambiguous chars (0/O/I/1/L)
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generateCode() {
  let code = "";
  for (let i = 0; i < 4; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `GQ-${code}`;
}

function generatePin() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function generateToken() {
  return crypto.randomUUID();
}

function sanitizeSession(resource) {
  const { _rid, _self, _etag, _attachments, _ts, hostPin, playerTokens, ...session } = resource;
  return session;
}

function requireAdminKey(request) {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_KEY;
  if (!expected || key !== expected) {
    return { status: 403, jsonBody: { error: "Admin key required" } };
  }
  return null;
}

// POST /api/session — create a new session, return its code + hostPin
app.http("session-create", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "session",
  handler: async (request, context) => {
    try {
      let code;
      let attempts = 0;
      while (attempts < 10) {
        code = generateCode();
        try {
          await sessions.item(code, code).read();
          attempts++;
        } catch (err) {
          if (err.code === 404) break;
          throw err;
        }
      }

      const hostPin = generatePin();
      const doc = {
        id: code,
        hostPin,
        playerTokens: {},
        teams: Array.from({ length: 10 }, (_, i) => `Team ${i + 1}`),
        teamCount: 10,
        scores: {},
        activeRound: null,
        view: "setup",
        showAnswers: true,
        answers: {},
        status: "open",
        updatedAt: new Date().toISOString(),
      };
      await sessions.items.create(doc);

      return { jsonBody: { session: sanitizeSession(doc), hostPin } };
    } catch (err) {
      context.error("Failed to create session:", err.message);
      return { status: 500, jsonBody: { error: "Failed to create session" } };
    }
  },
});

// GET /api/session/{code} — load a session by code (strips sensitive fields)
app.http("session-get", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "session/{code}",
  handler: async (request, context) => {
    const code = request.params.code.toUpperCase();
    try {
      const { resource } = await sessions.item(code, code).read();
      if (!resource) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      return { jsonBody: { session: sanitizeSession(resource) } };
    } catch (err) {
      if (err.code === 404) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      context.error("Failed to load session:", err.message);
      return { status: 500, jsonBody: { error: "Failed to load session" } };
    }
  },
});

// GET /api/sessions — list all sessions (admin only)
app.http("sessions-list", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "sessions",
  handler: async (request, context) => {
    const authErr = requireAdminKey(request);
    if (authErr) return authErr;
    try {
      const { resources } = await sessions.items
        .query("SELECT c.id, c.teamCount, c.status, c.updatedAt, c.view FROM c ORDER BY c.updatedAt DESC")
        .fetchAll();
      const list = resources.map(r => ({
        id: r.id,
        teamCount: r.teamCount || 0,
        status: r.status || "open",
        updatedAt: r.updatedAt,
        view: r.view,
      }));
      return { jsonBody: { sessions: list } };
    } catch (err) {
      context.error("Failed to list sessions:", err.message);
      return { status: 500, jsonBody: { error: "Failed to list sessions" } };
    }
  },
});

// PATCH /api/session/{code}/status — close or reopen (host PIN or admin key)
app.http("session-status", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "session/{code}/status",
  handler: async (request, context) => {
    const code = request.params.code.toUpperCase();
    try {
      const body = await request.json();
      const newStatus = body.status;
      if (newStatus !== "open" && newStatus !== "closed") {
        return { status: 400, jsonBody: { error: "Status must be 'open' or 'closed'" } };
      }
      const { resource } = await sessions.item(code, code).read();
      if (!resource) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }

      // Require host PIN or admin key
      const pin = request.headers.get("x-host-pin");
      const adminKey = request.headers.get("x-admin-key");
      const validPin = resource.hostPin && pin === resource.hostPin;
      const validAdmin = process.env.ADMIN_KEY && adminKey === process.env.ADMIN_KEY;
      if (!validPin && !validAdmin) {
        return { status: 403, jsonBody: { error: "Invalid host PIN or admin key" } };
      }

      resource.status = newStatus;
      resource.updatedAt = new Date().toISOString();
      await sessions.items.upsert(resource);
      return { jsonBody: { ok: true, status: newStatus } };
    } catch (err) {
      if (err.code === 404) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      context.error("Failed to update session status:", err.message);
      return { status: 500, jsonBody: { error: "Failed to update session status" } };
    }
  },
});

// PUT /api/session/{code} — save/update a session (host PIN required)
app.http("session-save", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "session/{code}",
  handler: async (request, context) => {
    const code = request.params.code.toUpperCase();
    try {
      const body = await request.json();

      // Read existing doc to preserve protected fields and validate PIN
      const { resource: existing } = await sessions.item(code, code).read();

      // Validate host PIN (legacy sessions without hostPin are allowed through)
      if (existing?.hostPin) {
        const pin = request.headers.get("x-host-pin");
        if (pin !== existing.hostPin) {
          return { status: 403, jsonBody: { error: "Invalid host PIN" } };
        }
      }

      const doc = {
        id: code,
        hostPin: existing?.hostPin || null,
        playerTokens: existing?.playerTokens || {},
        teams: body.teams,
        teamCount: body.teamCount,
        scores: body.scores,
        activeRound: body.activeRound,
        view: body.view,
        showAnswers: body.showAnswers,
        answers: existing?.answers || {},
        status: existing?.status || "open",
        updatedAt: new Date().toISOString(),
      };
      await sessions.items.upsert(doc);
      return { jsonBody: { ok: true } };
    } catch (err) {
      if (err.code === 404) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      context.error("Failed to save session:", err.message);
      return { status: 500, jsonBody: { error: "Failed to save session" } };
    }
  },
});

// POST /api/session/{code}/join — player joins a team, gets a token
app.http("session-join", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "session/{code}/join",
  handler: async (request, context) => {
    const code = request.params.code.toUpperCase();
    try {
      const body = await request.json();
      const { teamIdx } = body;

      if (typeof teamIdx !== "number" || teamIdx < 0 || teamIdx > 19) {
        return { status: 400, jsonBody: { error: "teamIdx must be a number 0-19" } };
      }

      const { resource } = await sessions.item(code, code).read();
      if (!resource) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      if (resource.status !== "open") {
        return { status: 403, jsonBody: { error: "Session is closed" } };
      }
      if (teamIdx >= (resource.teamCount || 10)) {
        return { status: 400, jsonBody: { error: "Team index out of range" } };
      }

      const playerToken = generateToken();

      // Try atomic patch first
      try {
        await sessions.item(code, code).patch([
          { op: "set", path: `/playerTokens/${teamIdx}`, value: playerToken },
        ]);
      } catch (patchErr) {
        // Fallback: read-modify-write if playerTokens field doesn't exist
        context.warn("Patch failed, falling back to read-modify-write:", patchErr.message);
        const { resource: current } = await sessions.item(code, code).read();
        if (!current.playerTokens) current.playerTokens = {};
        current.playerTokens[teamIdx] = playerToken;
        await sessions.items.upsert(current);
      }

      return { jsonBody: { playerToken } };
    } catch (err) {
      if (err.code === 404) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      context.error("Failed to join session:", err.message);
      return { status: 500, jsonBody: { error: "Failed to join session" } };
    }
  },
});

// PATCH /api/session/{code}/answer — atomic answer submission (player token required)
app.http("session-answer", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "session/{code}/answer",
  handler: async (request, context) => {
    const code = request.params.code.toUpperCase();
    try {
      const body = await request.json();
      const { teamIdx, questionId, answer } = body;

      if (typeof teamIdx !== "number" || teamIdx < 0) {
        return { status: 400, jsonBody: { error: "teamIdx must be a non-negative number" } };
      }
      if (!questionId || typeof questionId !== "string") {
        return { status: 400, jsonBody: { error: "questionId is required and must be a string" } };
      }
      if (answer === undefined || answer === null || typeof answer !== "string") {
        return { status: 400, jsonBody: { error: "answer is required and must be a string" } };
      }

      const sanitizedAnswer = answer.trim().slice(0, 500);

      const { resource } = await sessions.item(code, code).read();
      if (!resource) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      if (resource.status !== "open") {
        return { status: 403, jsonBody: { error: "Session is closed" } };
      }

      // Validate player token
      const token = request.headers.get("x-player-token");
      if (!token) {
        return { status: 401, jsonBody: { error: "Player token required" } };
      }
      const tokenOwner = Object.entries(resource.playerTokens || {})
        .find(([, t]) => t === token);
      if (!tokenOwner) {
        return { status: 403, jsonBody: { error: "Invalid player token" } };
      }
      if (parseInt(tokenOwner[0]) !== teamIdx) {
        return { status: 403, jsonBody: { error: "Token does not match team" } };
      }

      const patchKey = `${teamIdx}-${questionId}`;

      try {
        await sessions.item(code, code).patch([
          { op: "set", path: `/answers/${patchKey}`, value: sanitizedAnswer },
        ]);
      } catch (patchErr) {
        context.warn("Patch failed, falling back to read-modify-write:", patchErr.message);
        const { resource: current } = await sessions.item(code, code).read();
        if (!current) {
          return { status: 404, jsonBody: { error: "Session not found" } };
        }
        if (!current.answers) current.answers = {};
        current.answers[patchKey] = sanitizedAnswer;
        await sessions.items.upsert(current);
      }

      return { jsonBody: { ok: true } };
    } catch (err) {
      if (err.code === 404) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      context.error("Failed to save answer:", err.message);
      return { status: 500, jsonBody: { error: "Failed to save answer" } };
    }
  },
});

// GET /api/session/{code}/admin — full session with sensitive fields (admin only)
app.http("session-admin-get", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "session/{code}/admin",
  handler: async (request, context) => {
    const authErr = requireAdminKey(request);
    if (authErr) return authErr;

    const code = request.params.code.toUpperCase();
    try {
      const { resource } = await sessions.item(code, code).read();
      if (!resource) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      const { _rid, _self, _etag, _attachments, _ts, ...session } = resource;
      return { jsonBody: { session } };
    } catch (err) {
      if (err.code === 404) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      context.error("Failed to load session admin:", err.message);
      return { status: 500, jsonBody: { error: "Failed to load session" } };
    }
  },
});

// PATCH /api/session/{code}/admin — reset PIN or player token (admin only)
app.http("session-admin-patch", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "session/{code}/admin",
  handler: async (request, context) => {
    const authErr = requireAdminKey(request);
    if (authErr) return authErr;

    const code = request.params.code.toUpperCase();
    try {
      const body = await request.json();
      const { action, teamIdx } = body;

      const { resource } = await sessions.item(code, code).read();
      if (!resource) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }

      if (action === "reset-pin") {
        const newPin = generatePin();
        resource.hostPin = newPin;
        resource.updatedAt = new Date().toISOString();
        await sessions.items.upsert(resource);
        return { jsonBody: { ok: true, hostPin: newPin } };
      }

      if (action === "reset-token") {
        if (typeof teamIdx !== "number" || teamIdx < 0) {
          return { status: 400, jsonBody: { error: "teamIdx required for reset-token" } };
        }
        const newToken = generateToken();
        if (!resource.playerTokens) resource.playerTokens = {};
        resource.playerTokens[teamIdx] = newToken;
        resource.updatedAt = new Date().toISOString();
        await sessions.items.upsert(resource);
        return { jsonBody: { ok: true, playerToken: newToken } };
      }

      return { status: 400, jsonBody: { error: "action must be 'reset-pin' or 'reset-token'" } };
    } catch (err) {
      if (err.code === 404) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      context.error("Failed to admin-patch session:", err.message);
      return { status: 500, jsonBody: { error: "Failed to update session" } };
    }
  },
});
