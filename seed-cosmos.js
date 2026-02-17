/**
 * One-time script to seed Azure Cosmos DB with quiz data.
 *
 * Usage:
 *   COSMOS_ENDPOINT=https://xxx.documents.azure.com:443/ \
 *   COSMOS_KEY=your-key \
 *   node seed-cosmos.js
 */

import { CosmosClient } from "@azure/cosmos";

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = "golf-quiz";
const containerId = "rounds";

if (!endpoint || !key) {
  console.error("Set COSMOS_ENDPOINT and COSMOS_KEY environment variables.");
  process.exit(1);
}

const rounds = [
  {
    id: "series1", name: "Series 1", subtitle: "Ryder Cup", type: "series", maxPts: 6, sortOrder: 1,
    questions: [
      { id: "s1q1", label: "Q1", answer: "President's Cup" },
      { id: "s1q2", label: "Q2", answer: "Nick Faldo & Lee Westwood" },
      { id: "s1q3", label: "Q3", answer: "1979" },
      { id: "s1q4", label: "Q4", answer: "Foursome" },
      { id: "s1q5", label: "Q5", answer: "Seve Ballesteros & José Maria Olazabal" },
      { id: "s1q6", label: "Q6", answer: "Ireland" },
    ],
  },
  {
    id: "series2", name: "Series 2", subtitle: "New Superstars", type: "series", maxPts: 6, sortOrder: 2,
    questions: [
      { id: "s2q1", label: "Q1", answer: "Tiger Woods" },
      { id: "s2q2", label: "Q2", answer: "17th" },
      { id: "s2q3", label: "Q3", answer: "Brooks Koepka" },
      { id: "s2q4", label: "Q4", answer: "Sergio Garcia" },
      { id: "s2q5", label: "Q5", answer: "Colin Morikawa" },
      { id: "s2q6", label: "Q6", answer: "The US Open" },
    ],
  },
  {
    id: "series3", name: "Series 3", subtitle: "Women's Golf", type: "series", maxPts: 6, sortOrder: 3,
    questions: [
      { id: "s3q1", label: "Q1", answer: "1990" },
      { id: "s3q2", label: "Q2", answer: "Mickey Wright" },
      { id: "s3q3", label: "Q3", answer: "Manon De Roey" },
      { id: "s3q4", label: "Q4", answer: "The Evian Championship" },
      { id: "s3q5", label: "Q5", answer: "Maja Stark" },
      { id: "s3q6", label: "Q6", answer: "Anika Sörenstam" },
    ],
  },
  {
    id: "series4", name: "Series 4", subtitle: "Golf in Belgium", type: "series", maxPts: 6, sortOrder: 4,
    questions: [
      { id: "s4q1", label: "Q1", answer: "José Maria Olazabal" },
      { id: "s4q2", label: "Q2", answer: "Royal Bercuit" },
      { id: "s4q3", label: "Q3", answer: "Flory Van Donck" },
      { id: "s4q4", label: "Q4", answer: "Hulencourt Golf Club" },
      { id: "s4q5", label: "Q5", answer: "WM Phoenix Open" },
      { id: "s4q6", label: "Q6", answer: "Pieters & Colsaerts" },
    ],
  },
  {
    id: "series5", name: "Series 5", subtitle: "Old Superstars", type: "series", maxPts: 6, sortOrder: 5,
    questions: [
      { id: "s5q1", label: "Q1", answer: "16" },
      { id: "s5q2", label: "Q2", answer: "Gene Sarazen" },
      { id: "s5q3", label: "Q3", answer: "Sarazen (Bridge)" },
      { id: "s5q4", label: "Q4", answer: "Sam Snead" },
      { id: "s5q5", label: "Q5", answer: "19" },
      { id: "s5q6", label: "Q6", answer: "Seve Ballesteros" },
    ],
  },
  {
    id: "series6", name: "Series 6", subtitle: "The Open", type: "series", maxPts: 6, sortOrder: 6,
    questions: [
      { id: "s6q1", label: "Q1", answer: "Prestwick" },
      { id: "s6q2", label: "Q2", answer: "Swilcan Bridge" },
      { id: "s6q3", label: "Q3", answer: "Gary Player" },
      { id: "s6q4", label: "Q4", answer: "Royal Birkdale" },
      { id: "s6q5", label: "Q5", answer: "Shane Lowry" },
      { id: "s6q6", label: "Q6", answer: "Muirfield" },
    ],
  },
  {
    id: "series7", name: "Series 7", subtitle: "The Majors", type: "series", maxPts: 6, sortOrder: 7,
    questions: [
      { id: "s7q1", label: "Q1", answer: "Phil Mickelson" },
      { id: "s7q2", label: "Q2", answer: "Greg Norman" },
      { id: "s7q3", label: "Q3", answer: "Bobby Jones" },
      { id: "s7q4", label: "Q4", answer: "164" },
      { id: "s7q5", label: "Q5", answer: "Rickie Fowler" },
      { id: "s7q6", label: "Q6", answer: "Rory McIlroy" },
    ],
  },
  {
    id: "varia", name: "Varia Round", subtitle: "During Series 2-3-4", type: "varia", maxPts: 15, sortOrder: 8,
    questions: [
      { id: "vq1", label: "1", answer: "Brooks Koepka" },
      { id: "vq2", label: "2", answer: "Dustin Johnson" },
      { id: "vq3", label: "3", answer: "Cameron Smith" },
      { id: "vq4", label: "4", answer: "Jon Rahm" },
      { id: "vq5", label: "5", answer: "Xander Schauffele" },
      { id: "vq6", label: "6", answer: "Royal St George's" },
      { id: "vq7", label: "7", answer: "Royal Portrush" },
      { id: "vq8", label: "8", answer: "The Players" },
      { id: "vq9", label: "9", answer: "Phoenix Open" },
      { id: "vq10", label: "10", answer: "Open de France" },
      { id: "vq11", label: "11", answer: "BMW PGA Championship" },
      { id: "vq12", label: "12", answer: "Pine Valley Golf Club" },
      { id: "vq13", label: "13", answer: "Cypress Point Club" },
      { id: "vq14", label: "14", answer: "Shinnecock Hills Golf Club" },
      { id: "vq15", label: "15", answer: "Royal County Down" },
    ],
  },
  {
    id: "photo", name: "Photo Round", subtitle: "During Series 5-6", type: "photo", maxPts: 10, sortOrder: 9,
    questions: [
      { id: "pq1", label: "A", answer: "Gene Sarazen" },
      { id: "pq2", label: "B", answer: "Johnny Miller" },
      { id: "pq3", label: "C", answer: "Arnold Palmer" },
      { id: "pq4", label: "D", answer: "Seve Ballesteros" },
      { id: "pq5", label: "E", answer: "Nick Faldo" },
      { id: "pq6", label: "F", answer: "Tom Watson" },
      { id: "pq7", label: "G", answer: "Fred Couples" },
      { id: "pq8", label: "H", answer: "Payne Stewart" },
      { id: "pq9", label: "I", answer: "Sam Snead" },
      { id: "pq10", label: "J", answer: "Ben Hogan" },
    ],
  },
];

const client = new CosmosClient({ endpoint, key });

async function seed() {
  console.log("Creating database and container if needed...");
  const { database } = await client.databases.createIfNotExists({ id: databaseId });
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ["/id"] },
  });

  console.log(`Seeding ${rounds.length} rounds...`);
  for (const round of rounds) {
    await container.items.upsert(round);
    console.log(`  ✓ ${round.id} (${round.name})`);
  }

  console.log("Done!");
}

seed().catch(err => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
