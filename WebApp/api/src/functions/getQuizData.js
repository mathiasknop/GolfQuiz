import { app } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const container = client
  .database(process.env.COSMOS_DATABASE || "golf-quiz")
  .container(process.env.COSMOS_CONTAINER || "rounds");

app.http("quiz-data", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "quiz-data",
  handler: async (request, context) => {
    try {
      const { resources: rounds } = await container.items
        .query("SELECT * FROM c ORDER BY c.sortOrder")
        .fetchAll();

      const roundsMap = {};
      const roundOrder = [];

      for (const round of rounds) {
        roundsMap[round.id] = {
          id: round.id,
          name: round.name,
          subtitle: round.subtitle,
          type: round.type,
          maxPts: round.maxPts,
          questions: round.questions,
        };
        roundOrder.push(round.id);
      }

      return {
        jsonBody: { rounds: roundsMap, roundOrder },
      };
    } catch (err) {
      context.error("Failed to fetch quiz data:", err.message);
      return {
        status: 500,
        jsonBody: { error: "Failed to load quiz data" },
      };
    }
  },
});
