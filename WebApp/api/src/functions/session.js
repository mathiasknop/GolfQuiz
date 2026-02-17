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

// PUT /api/session/{code} — save/update a session by code
app.http("session-save", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "session/{code}",
  handler: async (request, context) => {
    const code = request.params.code.toUpperCase();
    try {
      const body = await request.json();
      const doc = {
        id: code,
        teams: body.teams,
        teamCount: body.teamCount,
        scores: body.scores,
        activeRound: body.activeRound,
        view: body.view,
        showAnswers: body.showAnswers,
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
