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
      { id: "s1q1", label: "Q1", type: "open", options: null, answer: "President's Cup",
        text: { en: "What is the name of the little brother of the Ryder Cup, pitching Team USA against the rest of the World, excluding Europe?", nl: "Wat is de naam van het kleine broertje van de Ryder Cup, waarin Team USA het opneemt tegen de rest van de wereld, exclusief Europa?", fr: "Quel est le nom du petit frère de la Ryder Cup, opposant l'équipe des États-Unis au reste du monde, à l'exclusion de l'Europe ?" } },
      { id: "s1q2", label: "Q2", type: "multiple-choice", options: ["Nick Faldo", "Bernhard Langer", "Sergio Garcia", "Lee Westwood"], answer: "Nick Faldo & Lee Westwood",
        text: { en: "Who holds the record of most appearances (12) for Team Europe?", nl: "Wie heeft het record van de meeste deelnames (12) voor Team Europa?", fr: "Qui détient le record du plus grand nombre de participations (12) pour l'équipe d'Europe ?" } },
      { id: "s1q3", label: "Q3", type: "multiple-choice", options: ["1965", "1979", "1983", "1985"], answer: "1979",
        text: { en: "In what year did the continental players from Europe join the UK Team?", nl: "In welk jaar sloten de continentale Europese spelers zich aan bij het Britse team?", fr: "En quelle année les joueurs du continent européen ont-ils rejoint l'équipe britannique ?" } },
      { id: "s1q4", label: "Q4", type: "open", options: null, answer: "Foursome",
        text: { en: "What is the name of this format: golfers compete in teams of two, using only one ball per team, taking alternate shots?", nl: "Hoe heet dit format: golfers spelen in teams van twee, gebruiken slechts één bal per team en slaan om beurten?", fr: "Quel est le nom de ce format : les golfeurs jouent en équipes de deux, avec une seule balle par équipe, en frappant à tour de rôle ?" } },
      { id: "s1q5", label: "Q5", type: "open", options: null, answer: "Seve Ballesteros & José Maria Olazabal",
        text: { en: "Which Spanish duo holds the record of the most pairings in Ryder Cup history?", nl: "Welk Spaans duo heeft het record van de meeste samenstellingen in de geschiedenis van de Ryder Cup?", fr: "Quel duo espagnol détient le record du plus grand nombre de pairings dans l'histoire de la Ryder Cup ?" } },
      { id: "s1q6", label: "Q6", type: "open", options: null, answer: "Ireland",
        text: { en: "In which country will the Ryder Cup be played in 2027?", nl: "In welk land wordt de Ryder Cup gespeeld in 2027?", fr: "Dans quel pays la Ryder Cup sera-t-elle jouée en 2027 ?" } },
    ],
  },
  {
    id: "series2", name: "Series 2", subtitle: "New Superstars", type: "series", maxPts: 6, sortOrder: 2,
    questions: [
      { id: "s2q1", label: "Q1", type: "open", options: null, answer: "Tiger Woods",
        text: { en: "Who is the only golfer that has won the 4 modern majors in a row?", nl: "Wie is de enige golfer die de 4 moderne majors op rij heeft gewonnen?", fr: "Qui est le seul golfeur à avoir remporté les 4 majeurs modernes consécutivement ?" } },
      { id: "s2q2", label: "Q2", type: "multiple-choice",
        options: [
          { en: "10th", nl: "10e", fr: "10e" },
          { en: "15th", nl: "15e", fr: "15e" },
          { en: "17th", nl: "17e", fr: "17e" },
          { en: "20th", nl: "20e", fr: "20e" },
        ], answer: "17th",
        text: { en: "Rory has won The Masters in 2025. Which attempt was it?", nl: "Rory heeft The Masters gewonnen in 2025. De hoeveelste poging was het?", fr: "Rory a remporté le Masters en 2025. C'était sa combientième tentative ?" } },
      { id: "s2q3", label: "Q3", type: "image", options: null, answer: "Brooks Koepka",
        text: { en: "Who is missing? (Look at the projected screen)", nl: "Wie ontbreekt? (Kijk naar het projectiescherm)", fr: "Qui manque ? (Regardez l'écran de projection)" } },
      { id: "s2q4", label: "Q4", type: "open", options: null, answer: "Sergio Garcia",
        text: { en: "Olazabal, Ballesteros, and Rahm have won majors. Who is the 4th Spaniard that has won a major?", nl: "Olazabal, Ballesteros en Rahm hebben majors gewonnen. Wie is de 4e Spanjaard die een major heeft gewonnen?", fr: "Olazabal, Ballesteros et Rahm ont remporté des majeurs. Qui est le 4e Espagnol à avoir remporté un majeur ?" } },
      { id: "s2q5", label: "Q5", type: "multiple-choice", options: ["Scottie Scheffler", "Colin Morikawa", "Chris Gotterup", "Tommy Fleetwood"], answer: "Colin Morikawa",
        text: { en: "Who has won at Pebble Beach last weekend?", nl: "Wie heeft afgelopen weekend gewonnen op Pebble Beach?", fr: "Qui a gagné à Pebble Beach le week-end dernier ?" } },
      { id: "s2q6", label: "Q6", type: "multiple-choice", options: ["The Masters", "The Open", "The PGA", "The US Open"], answer: "The US Open",
        text: { en: "What is the only major missing for Scottie Scheffler?", nl: "Welke major ontbreekt nog voor Scottie Scheffler?", fr: "Quel est le seul majeur manquant pour Scottie Scheffler ?" } },
    ],
  },
  {
    id: "series3", name: "Series 3", subtitle: "Women's Golf", type: "series", maxPts: 6, sortOrder: 3,
    questions: [
      { id: "s3q1", label: "Q1", type: "multiple-choice", options: ["1989", "1990", "1994", "2000"], answer: "1990",
        text: { en: "In what year was the first Solheim Cup played?", nl: "In welk jaar werd de eerste Solheim Cup gespeeld?", fr: "En quelle année la première Solheim Cup a-t-elle été jouée ?" } },
      { id: "s3q2", label: "Q2", type: "multiple-choice", options: ["Anika Sörenstam", "Patty Berg", "Mickey Wright", "Nancy Lopez"], answer: "Mickey Wright",
        text: { en: "It is said by many that she had the best golf swing ever, man or woman. Who is she?", nl: "Velen zeggen dat zij de beste golfswing ooit had, man of vrouw. Wie is zij?", fr: "Beaucoup disent qu'elle avait le meilleur swing de golf de tous les temps, homme ou femme. Qui est-elle ?" } },
      { id: "s3q3", label: "Q3", type: "open", options: null, answer: "Manon De Roey",
        text: { en: "What is the name (first and second) of the highest ranked Belgian female golf player at this moment?", nl: "Wat is de naam (voor- en achternaam) van de hoogst gerankte Belgische vrouwelijke golfspeelster op dit moment?", fr: "Quel est le nom (prénom et nom) de la joueuse de golf belge la mieux classée actuellement ?" } },
      { id: "s3q4", label: "Q4", type: "open", options: null, answer: "The Evian Championship",
        text: { en: "What is the name of the major which is played every year after the Open, the last weekend of July?", nl: "Wat is de naam van de major die elk jaar na The Open gespeeld wordt, het laatste weekend van juli?", fr: "Quel est le nom du majeur qui se joue chaque année après l'Open, le dernier week-end de juillet ?" } },
      { id: "s3q5", label: "Q5", type: "multiple-choice", options: ["Maja Stark", "Celine Boutier", "Linn Grant", "Esther Henseleit"], answer: "Maja Stark",
        text: { en: "Who is the highest ranked player from continental Europe?", nl: "Wie is de hoogst gerankte speelster uit continentaal Europa?", fr: "Qui est la joueuse la mieux classée d'Europe continentale ?" } },
      { id: "s3q6", label: "Q6", type: "multiple-choice", options: ["Patty Berg", "Lydia Ko", "Anika Sörenstam", "Nancy Lopez"], answer: "Anika Sörenstam",
        text: { en: "Who is the only female player with a 59 score on the LPGA?", nl: "Wie is de enige vrouwelijke speelster met een score van 59 op de LPGA?", fr: "Qui est la seule joueuse à avoir réalisé un score de 59 sur le circuit LPGA ?" } },
    ],
  },
  {
    id: "series4", name: "Series 4", subtitle: "Golf in Belgium", type: "series", maxPts: 6, sortOrder: 4,
    questions: [
      { id: "s4q1", label: "Q1", type: "open", options: null, answer: "José Maria Olazabal",
        text: { en: "Which player, winner of 2 Masters, has won the Belgian Open in 1988?", nl: "Welke speler, winnaar van 2 Masters, heeft de Belgian Open gewonnen in 1988?", fr: "Quel joueur, vainqueur de 2 Masters, a remporté le Belgian Open en 1988 ?" } },
      { id: "s4q2", label: "Q2", type: "multiple-choice", options: ["Royal Zoute", "Royal Oostende", "Royal Bercuit", "Rinkven International"], answer: "Royal Bercuit",
        text: { en: "On which course did that player win the Belgian Open?", nl: "Op welke golfbaan won die speler de Belgian Open?", fr: "Sur quel parcours ce joueur a-t-il remporté le Belgian Open ?" } },
      { id: "s4q3", label: "Q3", type: "image", options: null, answer: "Flory Van Donck",
        text: { en: "Who is this 5-time winner (record) of the Belgian Open? (Look at the projected screen)", nl: "Wie is deze 5-voudig winnaar (record) van de Belgian Open? (Kijk naar het projectiescherm)", fr: "Qui est ce quintuple vainqueur (record) du Belgian Open ? (Regardez l'écran de projection)" } },
      { id: "s4q4", label: "Q4", type: "multiple-choice", options: ["Naxhelet Golf Club", "Ravenstein", "Hulencourt Golf Club", "Rinkven International"], answer: "Hulencourt Golf Club",
        text: { en: "At which golf club was the Belgian Ladies Open played in 2025?", nl: "Op welke golfclub werd de Belgian Ladies Open gespeeld in 2025?", fr: "Dans quel club de golf le Belgian Ladies Open a-t-il été joué en 2025 ?" } },
      { id: "s4q5", label: "Q5", type: "multiple-choice", options: ["Farmers Insurance Open", "AT&T Pebble Beach", "WM Phoenix Open", "Masters"], answer: "WM Phoenix Open",
        text: { en: "Which PGA Tour event did Thomas Detry win in 2025?", nl: "Welk PGA Tour-toernooi heeft Thomas Detry gewonnen in 2025?", fr: "Quel tournoi du PGA Tour Thomas Detry a-t-il remporté en 2025 ?" } },
      { id: "s4q6", label: "Q6", type: "open", options: null, answer: "Pieters & Colsaerts",
        text: { en: "Which 2 Belgian golfers have participated in the Ryder Cup?", nl: "Welke 2 Belgische golfers hebben deelgenomen aan de Ryder Cup?", fr: "Quels sont les 2 golfeurs belges ayant participé à la Ryder Cup ?" } },
    ],
  },
  {
    id: "series5", name: "Series 5", subtitle: "Old Superstars", type: "series", maxPts: 6, sortOrder: 5,
    questions: [
      { id: "s5q1", label: "Q1", type: "multiple-choice", options: ["10", "12", "14", "16"], answer: "16",
        text: { en: "How many Opens have the first Big 3 (Vardon, Braid, Taylor) won together?", nl: "Hoeveel Opens hebben de eerste Big 3 (Vardon, Braid, Taylor) samen gewonnen?", fr: "Combien d'Opens les premiers Big 3 (Vardon, Braid, Taylor) ont-ils remportés ensemble ?" } },
      { id: "s5q2", label: "Q2", type: "multiple-choice",
        options: ["Walter Hagen", "Gene Sarazen", "Bobby Jones", { en: "Somebody else", nl: "Iemand anders", fr: "Quelqu'un d'autre" }],
        answer: "Gene Sarazen",
        text: { en: "Who has invented the modern sandwedge?", nl: "Wie heeft de moderne sandwedge uitgevonden?", fr: "Qui a inventé le sandwedge moderne ?" } },
      { id: "s5q3", label: "Q3", type: "image", options: null, answer: "Sarazen (Bridge)",
        text: { en: "What is the name of this bridge at Hole 15 in Augusta? (Look at the projected screen)", nl: "Wat is de naam van deze brug bij Hole 15 in Augusta? (Kijk naar het projectiescherm)", fr: "Quel est le nom de ce pont au trou 15 à Augusta ? (Regardez l'écran de projection)" } },
      { id: "s5q4", label: "Q4", type: "multiple-choice", options: ["Sam Snead", "Ben Hogan", "Jack Nicklaus", "Byron Nelson"], answer: "Sam Snead",
        text: { en: "With whom does Tiger share the record of 82 victories on the PGA Tour?", nl: "Met wie deelt Tiger het record van 82 overwinningen op de PGA Tour?", fr: "Avec qui Tiger partage-t-il le record de 82 victoires sur le PGA Tour ?" } },
      { id: "s5q5", label: "Q5", type: "multiple-choice", options: ["7", "10", "12", "19"], answer: "19",
        text: { en: "How many times was Jack Nicklaus 2nd in a major?", nl: "Hoe vaak werd Jack Nicklaus 2e in een major?", fr: "Combien de fois Jack Nicklaus a-t-il terminé 2e dans un majeur ?" } },
      { id: "s5q6", label: "Q6", type: "open", options: null, answer: "Seve Ballesteros",
        text: { en: "Who was the first European in 1980 to win The Masters?", nl: "Wie was de eerste Europeaan die in 1980 The Masters won?", fr: "Qui fut le premier Européen à remporter le Masters en 1980 ?" } },
    ],
  },
  {
    id: "series6", name: "Series 6", subtitle: "The Open", type: "series", maxPts: 6, sortOrder: 6,
    questions: [
      { id: "s6q1", label: "Q1", type: "multiple-choice", options: ["Royal Cinque Ports", "Royal Birkdale", "Musselburgh", "Prestwick"], answer: "Prestwick",
        text: { en: "Where was the first Open played in 1860?", nl: "Waar werd de eerste Open gespeeld in 1860?", fr: "Où le premier Open a-t-il été joué en 1860 ?" } },
      { id: "s6q2", label: "Q2", type: "multiple-choice", options: ["Grannie Clark's Bridge", "Swilcan Bridge", "Byron Nelson Bridge", "Golden Bear Bridge"], answer: "Swilcan Bridge",
        text: { en: "What is the name of this bridge at St. Andrews? (Look at the projected screen)", nl: "Wat is de naam van deze brug op St. Andrews? (Kijk naar het projectiescherm)", fr: "Quel est le nom de ce pont à St. Andrews ? (Regardez l'écran de projection)" } },
      { id: "s6q3", label: "Q3", type: "image", options: null, answer: "Gary Player",
        text: { en: "Who is this winner of the Open in 1959, 1968 and 1974? (Look at the projected screen)", nl: "Wie is deze winnaar van de Open in 1959, 1968 en 1974? (Kijk naar het projectiescherm)", fr: "Qui est ce vainqueur de l'Open en 1959, 1968 et 1974 ? (Regardez l'écran de projection)" } },
      { id: "s6q4", label: "Q4", type: "multiple-choice", options: ["Royal Liverpool", "Royal Birkdale", "Muirfield", "Royal St. Georges"], answer: "Royal Birkdale",
        text: { en: "Where will The Open be played in 2026?", nl: "Waar wordt The Open gespeeld in 2026?", fr: "Où se jouera l'Open en 2026 ?" } },
      { id: "s6q5", label: "Q5", type: "multiple-choice", options: ["Rory McIlroy", "Francesco Molinari", "Shane Lowry", "Jon Rahm"], answer: "Shane Lowry",
        text: { en: "Who is the last European that has won the Open?", nl: "Wie is de laatste Europeaan die de Open heeft gewonnen?", fr: "Qui est le dernier Européen à avoir remporté l'Open ?" } },
      { id: "s6q6", label: "Q6", type: "multiple-choice", options: ["Muirfield", "St. Andrews", "St. Georges", "Carnoustie"], answer: "Muirfield",
        text: { en: "Which clubhouse is this? (Look at the projected screen)", nl: "Welk clubhuis is dit? (Kijk naar het projectiescherm)", fr: "Quel est ce clubhouse ? (Regardez l'écran de projection)" } },
    ],
  },
  {
    id: "series7", name: "Series 7", subtitle: "The Majors", type: "series", maxPts: 6, sortOrder: 7,
    questions: [
      { id: "s7q1", label: "Q1", type: "multiple-choice", options: ["Phil Mickelson", "Jack Nicklaus", "Sam Snead", "Vijay Singh"], answer: "Phil Mickelson",
        text: { en: "Who is the oldest player that has won a major?", nl: "Wie is de oudste speler die een major heeft gewonnen?", fr: "Qui est le joueur le plus âgé à avoir remporté un majeur ?" } },
      { id: "s7q2", label: "Q2", type: "multiple-choice", options: ["Rickie Fowler", "Jack Nicklaus", "Phil Mickelson", "Greg Norman"], answer: "Greg Norman",
        text: { en: "Which player has lost in a playoff in all 4 majors?", nl: "Welke speler heeft een playoff verloren in alle 4 de majors?", fr: "Quel joueur a perdu en playoff dans les 4 majeurs ?" } },
      { id: "s7q3", label: "Q3", type: "open", options: null, answer: "Bobby Jones",
        text: { en: "Who is the only golfer that has achieved the Grand Slam, winning all 4 majors in 1 year?", nl: "Wie is de enige golfer die de Grand Slam heeft bereikt door alle 4 de majors in 1 jaar te winnen?", fr: "Qui est le seul golfeur à avoir réalisé le Grand Chelem, remportant les 4 majeurs en une seule année ?" } },
      { id: "s7q4", label: "Q4", type: "multiple-choice", options: ["98", "109", "132", "164"], answer: "164",
        text: { en: "Jack Nicklaus holds the record of most major appearances. How many?", nl: "Jack Nicklaus heeft het record van de meeste deelnames aan majors. Hoeveel?", fr: "Jack Nicklaus détient le record du plus grand nombre de participations aux majeurs. Combien ?" } },
      { id: "s7q5", label: "Q5", type: "multiple-choice", options: ["Justin Thomas", "Jordan Spieth", "Rory McIlroy", "Rickie Fowler"], answer: "Rickie Fowler",
        text: { en: "Who are we looking for? (Look at the projected screen)", nl: "Wie zoeken we? (Kijk naar het projectiescherm)", fr: "Qui cherchons-nous ? (Regardez l'écran de projection)" } },
      { id: "s7q6", label: "Q6", type: "open", options: null, answer: "Rory McIlroy",
        text: { en: "Who is missing from the Career Grand Slam winners: Jack Nicklaus, Tiger Woods, Ben Hogan, Gary Player, Gene Sarazen?", nl: "Wie ontbreekt bij de Career Grand Slam-winnaars: Jack Nicklaus, Tiger Woods, Ben Hogan, Gary Player, Gene Sarazen?", fr: "Qui manque parmi les vainqueurs du Grand Chelem en carrière : Jack Nicklaus, Tiger Woods, Ben Hogan, Gary Player, Gene Sarazen ?" } },
    ],
  },
  {
    id: "varia", name: "Varia Round", subtitle: "During Series 2-3-4", type: "varia", maxPts: 15, sortOrder: 8,
    questions: [
      // Q1-5: Identify golfers from projected photos — pick from list of 10 names
      { id: "vq1", label: "1", type: "pick-from-list", options: VARIA_GOLFER_NAMES, answer: "Brooks Koepka",
        text: { en: "Identify the golfer in photo 1 (Look at the projected screen)", nl: "Identificeer de golfer op foto 1 (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo 1 (Regardez l'écran de projection)" } },
      { id: "vq2", label: "2", type: "pick-from-list", options: VARIA_GOLFER_NAMES, answer: "Dustin Johnson",
        text: { en: "Identify the golfer in photo 2 (Look at the projected screen)", nl: "Identificeer de golfer op foto 2 (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo 2 (Regardez l'écran de projection)" } },
      { id: "vq3", label: "3", type: "pick-from-list", options: VARIA_GOLFER_NAMES, answer: "Cameron Smith",
        text: { en: "Identify the golfer in photo 3 (Look at the projected screen)", nl: "Identificeer de golfer op foto 3 (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo 3 (Regardez l'écran de projection)" } },
      { id: "vq4", label: "4", type: "pick-from-list", options: VARIA_GOLFER_NAMES, answer: "Jon Rahm",
        text: { en: "Identify the golfer in photo 4 (Look at the projected screen)", nl: "Identificeer de golfer op foto 4 (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo 4 (Regardez l'écran de projection)" } },
      { id: "vq5", label: "5", type: "pick-from-list", options: VARIA_GOLFER_NAMES, answer: "Xander Schauffele",
        text: { en: "Identify the golfer in photo 5 (Look at the projected screen)", nl: "Identificeer de golfer op foto 5 (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo 5 (Regardez l'écran de projection)" } },
      // Q6-7: Identify Open Championship venues from projected photos
      { id: "vq6", label: "6", type: "image", options: null, answer: "Royal St George's",
        text: { en: "Which Open Championship venue is shown? (Look at the projected screen)", nl: "Welke Open Championship-baan wordt getoond? (Kijk naar het projectiescherm)", fr: "Quel parcours de l'Open Championship est montré ? (Regardez l'écran de projection)" } },
      { id: "vq7", label: "7", type: "image", options: null, answer: "Royal Portrush",
        text: { en: "Which Open Championship venue is shown? (Look at the projected screen)", nl: "Welke Open Championship-baan wordt getoond? (Kijk naar het projectiescherm)", fr: "Quel parcours de l'Open Championship est montré ? (Regardez l'écran de projection)" } },
      // Q8-11: Identify tournaments from projected images
      { id: "vq8", label: "8", type: "image", options: null, answer: "The Players",
        text: { en: "Which tournament is shown? (Look at the projected screen)", nl: "Welk toernooi wordt getoond? (Kijk naar het projectiescherm)", fr: "Quel tournoi est montré ? (Regardez l'écran de projection)" } },
      { id: "vq9", label: "9", type: "image", options: null, answer: "Phoenix Open",
        text: { en: "Which tournament is shown? (Look at the projected screen)", nl: "Welk toernooi wordt getoond? (Kijk naar het projectiescherm)", fr: "Quel tournoi est montré ? (Regardez l'écran de projection)" } },
      { id: "vq10", label: "10", type: "image", options: null, answer: "Open de France",
        text: { en: "Which tournament is shown? (Look at the projected screen)", nl: "Welk toernooi wordt getoond? (Kijk naar het projectiescherm)", fr: "Quel tournoi est montré ? (Regardez l'écran de projection)" } },
      { id: "vq11", label: "11", type: "image", options: null, answer: "BMW PGA Championship",
        text: { en: "Which tournament is shown? (Look at the projected screen)", nl: "Welk toernooi wordt getoond? (Kijk naar het projectiescherm)", fr: "Quel tournoi est montré ? (Regardez l'écran de projection)" } },
      // Q12-15: Identify top 4 courses from a list of top 10 — pick from list
      { id: "vq12", label: "12", type: "pick-from-list", options: VARIA_COURSE_LIST, answer: "Pine Valley Golf Club",
        text: { en: "Which of the world's top courses is shown? (Look at the projected screen)", nl: "Welke van 's werelds topbanen wordt getoond? (Kijk naar het projectiescherm)", fr: "Quel parcours parmi les meilleurs au monde est montré ? (Regardez l'écran de projection)" } },
      { id: "vq13", label: "13", type: "pick-from-list", options: VARIA_COURSE_LIST, answer: "Cypress Point Club",
        text: { en: "Which of the world's top courses is shown? (Look at the projected screen)", nl: "Welke van 's werelds topbanen wordt getoond? (Kijk naar het projectiescherm)", fr: "Quel parcours parmi les meilleurs au monde est montré ? (Regardez l'écran de projection)" } },
      { id: "vq14", label: "14", type: "pick-from-list", options: VARIA_COURSE_LIST, answer: "Shinnecock Hills Golf Club",
        text: { en: "Which of the world's top courses is shown? (Look at the projected screen)", nl: "Welke van 's werelds topbanen wordt getoond? (Kijk naar het projectiescherm)", fr: "Quel parcours parmi les meilleurs au monde est montré ? (Regardez l'écran de projection)" } },
      { id: "vq15", label: "15", type: "pick-from-list", options: VARIA_COURSE_LIST, answer: "Royal County Down",
        text: { en: "Which of the world's top courses is shown? (Look at the projected screen)", nl: "Welke van 's werelds topbanen wordt getoond? (Kijk naar het projectiescherm)", fr: "Quel parcours parmi les meilleurs au monde est montré ? (Regardez l'écran de projection)" } },
    ],
  },
  {
    id: "photo", name: "Photo Round", subtitle: "During Series 5-6", type: "photo", maxPts: 10, sortOrder: 9,
    questions: [
      { id: "pq1", label: "A", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Gene Sarazen",
        text: { en: "Identify the golfer in photo A (Look at the projected screen)", nl: "Identificeer de golfer op foto A (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo A (Regardez l'écran de projection)" } },
      { id: "pq2", label: "B", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Johnny Miller",
        text: { en: "Identify the golfer in photo B (Look at the projected screen)", nl: "Identificeer de golfer op foto B (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo B (Regardez l'écran de projection)" } },
      { id: "pq3", label: "C", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Arnold Palmer",
        text: { en: "Identify the golfer in photo C (Look at the projected screen)", nl: "Identificeer de golfer op foto C (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo C (Regardez l'écran de projection)" } },
      { id: "pq4", label: "D", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Seve Ballesteros",
        text: { en: "Identify the golfer in photo D (Look at the projected screen)", nl: "Identificeer de golfer op foto D (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo D (Regardez l'écran de projection)" } },
      { id: "pq5", label: "E", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Nick Faldo",
        text: { en: "Identify the golfer in photo E (Look at the projected screen)", nl: "Identificeer de golfer op foto E (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo E (Regardez l'écran de projection)" } },
      { id: "pq6", label: "F", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Tom Watson",
        text: { en: "Identify the golfer in photo F (Look at the projected screen)", nl: "Identificeer de golfer op foto F (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo F (Regardez l'écran de projection)" } },
      { id: "pq7", label: "G", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Fred Couples",
        text: { en: "Identify the golfer in photo G (Look at the projected screen)", nl: "Identificeer de golfer op foto G (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo G (Regardez l'écran de projection)" } },
      { id: "pq8", label: "H", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Payne Stewart",
        text: { en: "Identify the golfer in photo H (Look at the projected screen)", nl: "Identificeer de golfer op foto H (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo H (Regardez l'écran de projection)" } },
      { id: "pq9", label: "I", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Sam Snead",
        text: { en: "Identify the golfer in photo I (Look at the projected screen)", nl: "Identificeer de golfer op foto I (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo I (Regardez l'écran de projection)" } },
      { id: "pq10", label: "J", type: "pick-from-list", options: PHOTO_GOLFER_NAMES, answer: "Ben Hogan",
        text: { en: "Identify the golfer in photo J (Look at the projected screen)", nl: "Identificeer de golfer op foto J (Kijk naar het projectiescherm)", fr: "Identifiez le golfeur sur la photo J (Regardez l'écran de projection)" } },
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
    console.log(`  \u2713 ${round.id} (${round.name}) — ${round.questions.length} questions`);
  }

  console.log("Done!");
}

seed().catch(err => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
