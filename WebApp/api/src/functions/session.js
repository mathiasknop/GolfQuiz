import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

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

// POST /api/session — create a new session, return its code
app.http("session-create", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "session",
  handler: async (request, context) => {
    try {
      let code;
      let attempts = 0;
      // Generate a unique code (retry on collision)
      while (attempts < 10) {
        code = generateCode();
        try {
          await sessions.item(code, code).read();
          attempts++; // code exists, try again
        } catch (err) {
          if (err.code === 404) break; // code is free
          throw err;
        }
      }

      const doc = {
        id: code,
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

      const { _rid, _self, _etag, _attachments, _ts, ...session } = doc;
      return { jsonBody: { session } };
    } catch (err) {
      context.error("Failed to create session:", err.message);
      return { status: 500, jsonBody: { error: "Failed to create session" } };
    }
  },
});

// GET /api/session/{code} — load a session by code
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
      const { _rid, _self, _etag, _attachments, _ts, ...session } = resource;
      return { jsonBody: { session } };
    } catch (err) {
      if (err.code === 404) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      context.error("Failed to load session:", err.message);
      return { status: 500, jsonBody: { error: "Failed to load session" } };
    }
  },
});

// GET /api/sessions — list all sessions
app.http("sessions-list", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "sessions",
  handler: async (request, context) => {
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

// PATCH /api/session/{code}/status — close or reopen a session
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

// PUT /api/session/{code} — save/update a session by code
app.http("session-save", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "session/{code}",
  handler: async (request, context) => {
    const code = request.params.code.toUpperCase();
    try {
      const body = await request.json();
      // Read existing doc to preserve status field
      let existingStatus = "open";
      let existingAnswers = {};
      try {
        const { resource } = await sessions.item(code, code).read();
        if (resource?.status) existingStatus = resource.status;
        if (resource?.answers) existingAnswers = resource.answers;
      } catch (_) { /* new session, use default */ }
      const doc = {
        id: code,
        teams: body.teams,
        teamCount: body.teamCount,
        scores: body.scores,
        activeRound: body.activeRound,
        view: body.view,
        showAnswers: body.showAnswers,
        answers: existingAnswers,
        status: existingStatus,
        updatedAt: new Date().toISOString(),
      };
      await sessions.items.upsert(doc);
      return { jsonBody: { ok: true } };
    } catch (err) {
      context.error("Failed to save session:", err.message);
      return { status: 500, jsonBody: { error: "Failed to save session" } };
    }
  },
});

// PATCH /api/session/{code}/answer — atomic per-question answer submission
app.http("session-answer", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "session/{code}/answer",
  handler: async (request, context) => {
    const code = request.params.code.toUpperCase();
    try {
      const body = await request.json();
      const { teamIdx, questionId, answer } = body;

      // Validate inputs
      if (typeof teamIdx !== "number" || teamIdx < 0) {
        return { status: 400, jsonBody: { error: "teamIdx must be a non-negative number" } };
      }
      if (!questionId || typeof questionId !== "string") {
        return { status: 400, jsonBody: { error: "questionId is required and must be a string" } };
      }
      if (answer === undefined || answer === null || typeof answer !== "string") {
        return { status: 400, jsonBody: { error: "answer is required and must be a string" } };
      }

      // Trim and limit answer length
      const sanitizedAnswer = answer.trim().slice(0, 500);

      // Read session to verify it exists and is open
      const { resource } = await sessions.item(code, code).read();
      if (!resource) {
        return { status: 404, jsonBody: { error: "Session not found" } };
      }
      if (resource.status !== "open") {
        return { status: 403, jsonBody: { error: "Session is closed" } };
      }

      const patchKey = `${teamIdx}-${questionId}`;

      // Try atomic Cosmos DB patch (set operation)
      try {
        await sessions.item(code, code).patch([
          { op: "set", path: `/answers/${patchKey}`, value: sanitizedAnswer },
        ]);
      } catch (patchErr) {
        // Fallback for old sessions that don't have an 'answers' field:
        // read-modify-write approach
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
