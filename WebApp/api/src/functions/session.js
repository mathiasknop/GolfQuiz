import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const sessions = client
  .database(process.env.COSMOS_DATABASE || "golf-quiz")
  .container("sessions");

const SESSION_ID = "current";

app.http("session-get", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "session",
  handler: async (request, context) => {
    try {
      const { resource } = await sessions.item(SESSION_ID, SESSION_ID).read();
      if (!resource) {
        return { jsonBody: null };
      }
      const { _rid, _self, _etag, _attachments, _ts, ...session } = resource;
      return { jsonBody: session };
    } catch (err) {
      if (err.code === 404) {
        return { jsonBody: null };
      }
      context.error("Failed to load session:", err.message);
      return { status: 500, jsonBody: { error: "Failed to load session" } };
    }
  },
});

app.http("session-save", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "session",
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const doc = {
        id: SESSION_ID,
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

app.http("session-new", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "session/new",
  handler: async (request, context) => {
    try {
      await sessions.item(SESSION_ID, SESSION_ID).delete();
    } catch (err) {
      if (err.code !== 404) {
        context.error("Failed to reset session:", err.message);
        return { status: 500, jsonBody: { error: "Failed to reset session" } };
      }
    }
    return { jsonBody: { ok: true } };
  },
});
