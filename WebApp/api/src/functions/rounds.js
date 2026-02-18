import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const container = client
  .database(process.env.COSMOS_DATABASE || "golf-quiz")
  .container("rounds");

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

function requireAdminKey(request) {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_KEY;
  if (!expected || key !== expected) {
    return { status: 403, jsonBody: { error: "Admin key required" } };
  }
  return null;
}

// ── 1. PATCH /api/rounds/reorder ─────────────────────────────────────
// Registered FIRST so "reorder" isn't matched as a {roundId} param.
app.http("rounds-reorder", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "rounds/reorder",
  handler: async (request, context) => {
    const authErr = requireAdminKey(request);
    if (authErr) return authErr;
    try {
      const body = await request.json();
      const { order } = body;

      if (!Array.isArray(order) || order.length === 0) {
        return { status: 400, jsonBody: { error: "order must be a non-empty array of round ids" } };
      }

      const ops = order.map((id, index) =>
        container.item(id, id).patch([
          { op: "set", path: "/sortOrder", value: index },
        ])
      );
      await Promise.all(ops);

      return { jsonBody: { ok: true } };
    } catch (err) {
      context.error("Failed to reorder rounds:", err.message);
      return { status: 500, jsonBody: { error: "Failed to reorder rounds" } };
    }
  },
});

// ── 2. PUT /api/rounds/{roundId} ─────────────────────────────────────
app.http("rounds-update", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "rounds/{roundId}",
  handler: async (request, context) => {
    const authErr = requireAdminKey(request);
    if (authErr) return authErr;
    const { roundId } = request.params;
    try {
      const body = await request.json();

      body.id = roundId;
      body.updatedAt = new Date().toISOString();
      const { resource } = await container.items.upsert(body);

      const { _rid, _self, _etag, _attachments, _ts, ...savedRound } = resource;
      return { jsonBody: savedRound };
    } catch (err) {
      context.error("Failed to update round:", err.message);
      return { status: 500, jsonBody: { error: "Failed to update round" } };
    }
  },
});

// ── 3. POST /api/rounds ─────────────────────────────────────────────
app.http("rounds-create", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "rounds",
  handler: async (request, context) => {
    const authErr = requireAdminKey(request);
    if (authErr) return authErr;
    try {
      const body = await request.json();
      const { name, subtitle, type, maxPts, questions } = body;

      if (!name) {
        return { status: 400, jsonBody: { error: "name is required" } };
      }

      const id = body.id || slugify(name);

      // Determine next sortOrder
      const { resources } = await container.items
        .query("SELECT VALUE MAX(c.sortOrder) FROM c")
        .fetchAll();
      const maxSort = resources[0] ?? -1;

      const doc = {
        id,
        name,
        subtitle: subtitle || "",
        type: type || "varia",
        maxPts: maxPts ?? 0,
        sortOrder: maxSort + 1,
        questions: questions || [],
        updatedAt: new Date().toISOString(),
      };

      const { resource } = await container.items.create(doc);
      const { _rid, _self, _etag, _attachments, _ts, ...newRound } = resource;
      return { jsonBody: newRound };
    } catch (err) {
      if (err.code === 409) {
        return { status: 400, jsonBody: { error: "A round with this name already exists" } };
      }
      context.error("Failed to create round:", err.message);
      return { status: 500, jsonBody: { error: "Failed to create round" } };
    }
  },
});

// ── 4. DELETE /api/rounds/{roundId} ──────────────────────────────────
app.http("rounds-delete", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "rounds/{roundId}",
  handler: async (request, context) => {
    const authErr = requireAdminKey(request);
    if (authErr) return authErr;
    const { roundId } = request.params;
    try {
      await container.item(roundId, roundId).delete();
      return { jsonBody: { ok: true } };
    } catch (err) {
      if (err.code === 404) {
        return { status: 404, jsonBody: { error: "Round not found" } };
      }
      context.error("Failed to delete round:", err.message);
      return { status: 500, jsonBody: { error: "Failed to delete round" } };
    }
  },
});
