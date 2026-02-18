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

// Shared option lists for pick-from-list questions
const VARIA_GOLFER_NAMES = [
  "Jon Rahm", "Tiger Woods", "Ernie Els", "Dustin Johnson", "Brooks Koepka",
  "Justin Rose", "Cameron Smith", "Phil Mickelson", "Xander Schauffele", "Adam Scott",
];

const VARIA_COURSE_LIST = [
  "Shinnecock Hills Golf Club", "National Golf Links of America", "Royal Melbourne Golf Club",
  "Cypress Point Club", "Pine Valley Golf Club", "Muirfield Honourable Company of Edinburgh Golfers",
  "Royal Portrush Golf Club", "Royal County Down", "St. Andrews Links", "Oakmont Country Club",
];

const PHOTO_GOLFER_NAMES = [
  "Adam Scott", "Ángel Cabrera", "Arnold Palmer", "Ben Hogan", "Billy Casper",
  "Bob Ferguson", "Bobby Jones", "Bobby Locke", "Branden Grace", "Brian Harman",
  "Brooks Koepka", "Bryson DeChambeau", "Byron Nelson", "Cameron Smith", "Cary Middlecoff",
  "Charl Schwartzel", "Collin Morikawa", "Darren Clarke", "Danny Willett", "Denny Shute",
  "Ernie Els", "Francesco Molinari", "Fred Couples", "Gary Player", "Gene Sarazen",
  "Graeme McDowell", "Hale Irwin", "Harry Vardon", "Henrik Stenson", "Hideki Matsuyama",
  "Jack Nicklaus", "James Braid", "James Barnes", "Jason Day", "Jason Dufner",
  "Jimmy Demaret", "Johnny Miller", "Jordan Spieth", "Jon Rahm", "Justin Rose",
  "Justin Thomas", "Keegan Bradley", "Larry Nelson", "Lee Trevino", "Leo Diegel",
  "Louis Oosthuizen", "Martin Kaymer", "Matt Fitzpatrick", "Mike Weir", "Nick Faldo",
  "Phil Mickelson", "Pádraig Harrington", "Patrick Reed", "Payne Stewart", "Paul Lawrie",
  "Peter Thomson", "Old Tom Morris", "Olin Dutra", "Ralph Guldahl", "Raymond Floyd",
  "Rory McIlroy", "Sam Snead", "Scottie Scheffler", "Seve Ballesteros", "Shane Lowry",
  "Sergio García", "Tiger Woods", "Tom Kite", "Tom Lehman", "Tom Morris Jr.",
  "Tom Morris Sr.", "Tom Watson", "Tony Lema", "Walter Hagen", "Webb Simpson",
  "Willie Anderson", "Willie Park Sr.", "Willie Park Jr.", "Wyndham Clark",
];

const rounds = [
  {
    id: "series1", name: "Series 1", subtitle: "Ryder Cup", type: "series", maxPts: 6, sortOrder: 1,
    questions: [
      { id: "s1q1", label: "Q1", text: "What is the name of the little brother of the Ryder Cup, pitching Team USA against the rest of the World, excluding Europe?", type: "open", options: null, answer: "President's Cup" },
      { id: "s1q2", label: "Q2", text: "Who holds the record of most appearances (12) for Team Europe?", type: "multiple-choice", options: ["Nick Faldo", "Bernhard Langer", "Sergio Garcia", "Lee Westwood"], answer: "Nick Faldo & Lee Westwood" },
      { id: "s1q3", label: "Q3", text: "In what year did the continental players from Europe join the UK Team?", type: "multiple-choice", options: ["1965", "1979", "1983", "1985"], answer: "1979" },
      { id: "s1q4", label: "Q4", text: "What is the name of this format: golfers compete in teams of two, using only one ball per team, taking alternate shots?", type: "open", options: null, answer: "Foursome" },
      { id: "s1q5", label: "Q5", text: "Which Spanish duo holds the record of the most pairings in Ryder Cup history?", type: "open", options: null, answer: "Seve Ballesteros & José Maria Olazabal" },
      { id: "s1q6", label: "Q6", text: "In which country will the Ryder Cup be played in 2027?", type: "open", options: null, answer: "Ireland" },
    ],
  },
  {
    id: "series2", name: "Series 2", subtitle: "New Superstars", type: "series", maxPts: 6, sortOrder: 2,
    questions: [
      { id: "s2q1", label: "Q1", text: "Who is the only golfer that has won the 4 modern majors in a row?", type: "open", options: null, answer: "Tiger Woods" },
      { id: "s2q2", label: "Q2", text: "Rory has won The Masters in 2025. Which attempt was it?", type: "multiple-choice", options: ["10th", "15th", "17th", "20th"], answer: "17th" },
      { id: "s2q3", label: "Q3", text: "Who is missing? (Look at the projected screen)", type: "image", options: null, answer: "Brooks Koepka" },
      { id: "s2q4", label: "Q4", text: "Olazabal, Ballesteros, and Rahm have won majors. Who is the 4th Spaniard that has won a major?", type: "open", options: null, answer: "Sergio Garcia" },
      { id: "s2q5", label: "Q5", text: "Who has won at Pebble Beach last weekend?", type: "multiple-choice", options: ["Scottie Scheffler", "Colin Morikawa", "Chris Gotterup", "Tommy Fleetwood"], answer: "Colin Morikawa" },
      { id: "s2q6", label: "Q6", text: "What is the only major missing for Scottie Scheffler?", type: "multiple-choice", options: ["The Masters", "The Open", "The PGA", "The US Open"], answer: "The US Open" },
    ],
  },
  {
    id: "series3", name: "Series 3", subtitle: "Women's Golf", type: "series", maxPts: 6, sortOrder: 3,
    questions: [
      { id: "s3q1", label: "Q1", text: "In what year was the first Solheim Cup played?", type: "multiple-choice", options: ["1989", "1990", "1994", "2000"], answer: "1990" },
      { id: "s3q2", label: "Q2", text: "It is said by many that she had the best golf swing ever, man or woman. Who is she?", type: "multiple-choice", options: ["Anika Sörenstam", "Patty Berg", "Mickey Wright", "Nancy Lopez"], answer: "Mickey Wright" },
      { id: "s3q3", label: "Q3", text: "What is the name (first and second) of the highest ranked Belgian female golf player at this moment?", type: "open", options: null, answer: "Manon De Roey" },
      { id: "s3q4", label: "Q4", text: "What is the name of the major which is played every year after the Open, the last weekend of July?", type: "open", options: null, answer: "The Evian Championship" },
      { id: "s3q5", label: "Q5", text: "Who is the highest ranked player from continental Europe?", type: "multiple-choice", options: ["Maja Stark", "Celine Boutier", "Linn Grant", "Esther Henseleit"], answer: "Maja Stark" },
      { id: "s3q6", label: "Q6", text: "Who is the only female player with a 59 score on the LPGA?", type: "multiple-choice", options: ["Patty Berg", "Lydia Ko", "Anika Sörenstam", "Nancy Lopez"], answer: "Anika Sörenstam" },
    ],
  },
  {
    id: "series4", name: "Series 4", subtitle: "Golf in Belgium", type: "series", maxPts: 6, sortOrder: 4,
    questions: [
      { id: "s4q1", label: "Q1", text: "Which player, winner of 2 Masters, has won the Belgian Open in 1988?", type: "open", options: null, answer: "José Maria Olazabal" },
      { id: "s4q2", label: "Q2", text: "On which course did that player win the Belgian Open?", type: "multiple-choice", options: ["Royal Zoute", "Royal Oostende", "Royal Bercuit", "Rinkven International"], answer: "Royal Bercuit" },
      { id: "s4q3", label: "Q3", text: "Who is this 5-time winner (record) of the Belgian Open? (Look at the projected screen)", type: "image", options: null, answer: "Flory Van Donck" },
      { id: "s4q4", label: "Q4", text: "At which golf club was the Belgian Ladies Open played in 2025?", type: "multiple-choice", options: ["Naxhelet Golf Club", "Ravenstein", "Hulencourt Golf Club", "Rinkven International"], answer: "Hulencourt Golf Club" },
      { id: "s4q5", label: "Q5", text: "Which PGA Tour event did Thomas Detry win in 2025?", type: "multiple-choice", options: ["Farmers Insurance Open", "AT&T Pebble Beach", "WM Phoenix Open", "Masters"], answer: "WM Phoenix Open" },
      { id: "s4q6", label: "Q6", text: "Which 2 Belgian golfers have participated in the Ryder Cup?", type: "open", options: null, answer: "Pieters & Colsaerts" },
    ],
  },
  {
    id: "series5", name: "Series 5", subtitle: "Old Superstars", type: "series", maxPts: 6, sortOrder: 5,
    questions: [
      { id: "s5q1", label: "Q1", text: "How many Opens have the first Big 3 (Vardon, Braid, Taylor) won together?", type: "multiple-choice", options: ["10", "12", "14", "16"], answer: "16" },
      { id: "s5q2", label: "Q2", text: "Who has invented the modern sandwedge?", type: "multiple-choice", options: ["Walter Hagen", "Gene Sarazen", "Bobby Jones", "Somebody else"], answer: "Gene Sarazen" },
      { id: "s5q3", label: "Q3", text: "What is the name of this bridge at Hole 15 in Augusta? (Look at the projected screen)", type: "image", options: null, answer: "Sarazen (Bridge)" },
      { id: "s5q4", label: "Q4", text: "With whom does Tiger share the record of 82 victories on the PGA Tour?", type: "multiple-choice", options: ["Sam Snead", "Ben Hogan", "Jack Nicklaus", "Byron Nelson"], answer: "Sam Snead" },
      { id: "s5q5", label: "Q5", text: "How many times was Jack Nicklaus 2nd in a major?", type: "multiple-choice", options: ["7", "10", "12", "19"], answer: "19" },
      { id: "s5q6", label: "Q6", text: "Who was the first European in 1980 to win The Masters?", type: "open", options: null, answer: "Seve Ballesteros" },
    ],
  },
  {
    id: "series6", name: "Series 6", subtitle: "The Open", type: "series", maxPts: 6, sortOrder: 6,
    questions: [
      { id: "s6q1", label: "Q1", text: "Where was the first Open played in 1860?", type: "multiple-choice", options: ["Royal Cinque Ports", "Royal Birkdale", "Musselburgh", "Prestwick"], answer: "Prestwick" },
      { id: "s6q2", label: "Q2", text: "What is the name of this bridge at St. Andrews? (Look at the projected screen)", type: "multiple-choice", options: ["Grannie Clark's Bridge", "Swilcan Bridge", "Byron Nelson Bridge", "Golden Bear Bridge"], answer: "Swilcan Bridge" },
      { id: "s6q3", label: "Q3", text: "Who is this winner of the Open in 1959, 1968 and 1974? (Look at the projected screen)", type: "image", options: null, answer: "Gary Player" },
      { id: "s6q4", label: "Q4", text: "Where will The Open be played in 2026?", type: "multiple-choice", options: ["Royal Liverpool", "Royal Birkdale", "Muirfield", "Royal St. Georges"], answer: "Royal Birkdale" },
      { id: "s6q5", label: "Q5", text: "Who is the last European that has won the Open?", type: "multiple-choice", options: ["Rory McIlroy", "Francesco Molinari", "Shane Lowry", "Jon Rahm"], answer: "Shane Lowry" },
      { id: "s6q6", label: "Q6", text: "Which clubhouse is this? (Look at the projected screen)", type: "multiple-choice", options: ["Muirfield", "St. Andrews", "St. Georges", "Carnoustie"], answer: "Muirfield" },
    ],
  },
  {
    id: "series7", name: "Series 7", subtitle: "The Majors", type: "series", maxPts: 6, sortOrder: 7,
    questions: [
      { id: "s7q1", label: "Q1", text: "Who is the oldest player that has won a major?", type: "multiple-choice", options: ["Phil Mickelson", "Jack Nicklaus", "Sam Snead", "Vijay Singh"], answer: "Phil Mickelson" },
      { id: "s7q2", label: "Q2", text: "Which player has lost in a playoff in all 4 majors?", type: "multiple-choice", options: ["Rickie Fowler", "Jack Nicklaus", "Phil Mickelson", "Greg Norman"], answer: "Greg Norman" },
      { id: "s7q3", label: "Q3", text: "Who is the only golfer that has achieved the Grand Slam, winning all 4 majors in 1 year?", type: "open", options: null, answer: "Bobby Jones" },
      { id: "s7q4", label: "Q4", text: "Jack Nicklaus holds the record of most major appearances. How many?", type: "multiple-choice", options: ["98", "109", "132", "164"], answer: "164" },
      { id: "s7q5", label: "Q5", text: "Who are we looking for? (Look at the projected screen)", type: "multiple-choice", options: ["Justin Thomas", "Jordan Spieth", "Rory McIlroy", "Rickie Fowler"], answer: "Rickie Fowler" },
      { id: "s7q6", label: "Q6", text: "Who is missing from the Career Grand Slam winners: Jack Nicklaus, Tiger Woods, Ben Hogan, Gary Player, Gene Sarazen?", type: "open", options: null, answer: "Rory McIlroy" },
    ],
  },
  {
    id: "varia", name: "Varia Round", subtitle: "During Series 2-3-4", type: "varia", maxPts: 15, sortOrder: 8,
    questions: [
      // Q1-5: Identify golfers from projected photos — pick from list of 10 names
      { id: "vq1", label: "1", text: "Identify the golfer in photo 1 (Look at the projected screen)", type: "pick-from-list", options: VARIA_GOLFER_NAMES, answer: "Brooks Koepka" },
      { id: "vq2", label: "2", text: "Identify the golfer in photo 2 (Look at the projected screen)", type: "pick-from-list", options: VARIA_GOLFER_NAMES, answer: "Dustin Johnson" },
      { id: "vq3", label: "3", text: "Identify the golfer in photo 3 (Look at the projected screen)", type: "pick-from-list", options: VARIA_GOLFER_NAMES, answer: "Cameron Smith" },
      { id: "vq4", label: "4", text: "Identify the golfer in photo 4 (Look at the projected screen)", type: "pick-from-list", options: VARIA_GOLFER_NAMES, answer: "Jon Rahm" },
      { id: "vq5", label: "5", text: "Identify the golfer in photo 5 (Look at the projected screen)", type: "pick-from-list", options: VARIA_GOLFER_NAMES, answer: "Xander Schauffele" },
      // Q6-7: Identify Open Championship venues from projected photos
      { id: "vq6", label: "6", text: "Which Open Championship venue is shown? (Look at the projected screen)", type: "image", options: null, answer: "Royal St George's" },
      { id: "vq7", label: "7", text: "Which Open Championship venue is shown? (Look at the projected screen)", type: "image", options: null, answer: "Royal Portrush" },
      // Q8-11: Identify tournaments from projected images
      { id: "vq8", label: "8", text: "Which tournament is shown? (Look at the projected screen)", type: "image", options: null, answer: "The Players" },
      { id: "vq9", label: "9", text: "Which tournament is shown? (Look at the projected screen)", type: "image", options: null, answer: "Phoenix Open" },
      { id: "vq10", label: "10", text: "Which tournament is shown? (Look at the projected screen)", type: "image", options: null, answer: "Open de France" },
      { id: "vq11", label: "11", text: "Which tournament is shown? (Look at the projected screen)", type: "image", options: null, answer: "BMW PGA Championship" },
      // Q12-15: Identify top 4 courses from a list of top 10 — pick from list
      { id: "vq12", label: "12", text: "Which of the world's top courses is shown? (Look at the projected screen)", type: "pick-from-list", options: VARIA_COURSE_LIST, answer: "Pine Valley Golf Club" },
      { id: "vq13", label: "13", text: "Which of the world's top courses is shown? (Look at the projected screen)", type: "pick-from-list", options: VARIA_COURSE_LIST, answer: "Cypress Point Club" },
      { id: "vq14", label: "14", text: "Which of the world's top courses is shown? (Look at the projected screen)", type: "pick-from-list", options: VARIA_COURSE_LIST, answer: "Shinnecock Hills Golf Club" },
      { id: "vq15", label: "15", text: "Which of the world's top courses is shown? (Look at the projected screen)", type: "pick-from-list", options: VARIA_COURSE_LIST, answer: "Royal County Down" },
    ],
  },
  {
    id: "photo", name: "Photo Round", subtitle: "During Series 5-6", type: "photo", maxPts: 10, sortOrder: 9,
    questions: [
      { id: "pq1", label: "A", text: "Identify the golfer in photo A (Look at the projected screen)", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Gene Sarazen" },
      { id: "pq2", label: "B", text: "Identify the golfer in photo B (Look at the projected screen)", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Johnny Miller" },
      { id: "pq3", label: "C", text: "Identify the golfer in photo C (Look at the projected screen)", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Arnold Palmer" },
      { id: "pq4", label: "D", text: "Identify the golfer in photo D (Look at the projected screen)", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Seve Ballesteros" },
      { id: "pq5", label: "E", text: "Identify the golfer in photo E (Look at the projected screen)", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Nick Faldo" },
      { id: "pq6", label: "F", text: "Identify the golfer in photo F (Look at the projected screen)", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Tom Watson" },
      { id: "pq7", label: "G", text: "Identify the golfer in photo G (Look at the projected screen)", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Fred Couples" },
      { id: "pq8", label: "H", text: "Identify the golfer in photo H (Look at the projected screen)", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Payne Stewart" },
      { id: "pq9", label: "I", text: "Identify the golfer in photo I (Look at the projected screen)", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Sam Snead" },
      { id: "pq10", label: "J", text: "Identify the golfer in photo J (Look at the projected screen)", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Ben Hogan" },
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
    console.log(`  ✓ ${round.id} (${round.name}) — ${round.questions.length} questions`);
  }

  console.log("Done!");
}

seed().catch(err => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
