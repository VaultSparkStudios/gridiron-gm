// Real 2026 NFL coaching staffs (head coach, OC, DC, special teams), from each club's official
// coaches page as of October 2026. Tampa Bay has no named DC (Todd Bowles calls the defense).
// Ratings and schemes are game judgements for the better-known names; everyone else rolls normally.
export const REAL_STAFF = {
  ARI: ["Mike LaFleur", "Nathaniel Hackett", "Nick Rallis", "Michael Ghobrial"],
  ATL: ["Kevin Stefanski", "Tommy Rees", "Jeff Ulbrich", "Craig Aukerman"],
  BAL: ["Jesse Minter", "Declan Doyle", "Anthony Weaver", "Anthony Levine Sr."],
  BUF: ["Joe Brady", "Pete Carmichael Jr.", "Jim Leonhard", "Jeff Rodgers"],
  CAR: ["Dave Canales", "Brad Idzik", "Ejiro Evero", "Tracy Smith"],
  CHI: ["Ben Johnson", "Press Taylor", "Dennis Allen", "Richard Hightower"],
  CIN: ["Zac Taylor", "Dan Pitcher", "Al Golden", "Darrin Simmons"],
  CLE: ["Todd Monken", "Travis Switzer", "Mike Rutenberg", "Byron Storer"],
  DAL: ["Brian Schottenheimer", "Klayton Adams", "Christian Parker", "Nick Sorensen"],
  DEN: ["Sean Payton", "Davis Webb", "Vance Joseph", "Darren Rizzi"],
  DET: ["Dan Campbell", "Drew Petzing", "Kelvin Sheppard", "Dave Fipp"],
  GB: ["Matt LaFleur", "Adam Stenavich", "Jonathan Gannon", "Cam Achord"],
  HOU: ["DeMeco Ryans", "Nick Caley", "Matt Burke", "Frank Ross"],
  IND: ["Shane Steichen", "Jim Bob Cooter", "Lou Anarumo", "Brian Mason"],
  JAX: ["Liam Coen", "Grant Udinski", "Anthony Campanile", "Heath Farwell"],
  KC: ["Andy Reid", "Eric Bieniemy", "Steve Spagnuolo", "Dave Toub"],
  LV: ["Klint Kubiak", "Andrew Janocko", "Rob Leonard", "Joe DeCamillis"],
  LAC: ["Jim Harbaugh", "Mike McDaniel", "Chris O'Leary", "Ryan Ficken"],
  LAR: ["Sean McVay", "Nate Scheelhaase", "Chris Shula", "Bubba Ventrone"],
  MIA: ["Jeff Hafley", "Bobby Slowik", "Sean Duggan", "Chris Tabor"],
  MIN: ["Kevin O'Connell", "Wes Phillips", "Brian Flores", "Matt Daniels"],
  NE: ["Mike Vrabel", "Josh McDaniels", "Zak Kuhr", "Jeremy Springer"],
  NO: ["Kellen Moore", "Doug Nussmeier", "Brandon Staley", "Phil Galiano"],
  NYG: ["John Harbaugh", "Matt Nagy", "Dennard Wilson", "Chris Horton"],
  NYJ: ["Aaron Glenn", "Frank Reich", "Brian Duker", "Chris Banjo"],
  PHI: ["Nick Sirianni", "Sean Mannion", "Vic Fangio", "Michael Clay"],
  PIT: ["Mike McCarthy", "Brian Angelichio", "Patrick Graham", "Danny Crossman"],
  SF: ["Kyle Shanahan", "Klay Kubiak", "Raheem Morris", "Brant Boyer"],
  SEA: ["Mike Macdonald", "Brian Fleury", "Aden Durde", "Jay Harbaugh"],
  TB: ["Todd Bowles", "Zac Robinson", "Todd Bowles", "Danny Smith"],
  TEN: ["Robert Saleh", "Brian Daboll", "Gus Bradley", "John Fassel"],
  WAS: ["Dan Quinn", "David Blough", "Daronte Jones", "Larry Izzo"],
};

// Head coach ratings (unlisted head coaches rate 74).
export const HC_RATING = {
  "Andy Reid": 94, "Sean McVay": 90, "Kyle Shanahan": 89, "John Harbaugh": 89, "Jim Harbaugh": 88,
  "Sean Payton": 87, "Dan Campbell": 86, "Mike Vrabel": 86, "Nick Sirianni": 84, "Matt LaFleur": 84,
  "Kevin O'Connell": 84, "Mike Macdonald": 84, "Ben Johnson": 83, "Mike McCarthy": 81, "Kevin Stefanski": 80,
  "DeMeco Ryans": 80, "Dan Quinn": 80, "Liam Coen": 79, "Zac Taylor": 77, "Todd Bowles": 77, "Shane Steichen": 77,
  "Robert Saleh": 77, "Todd Monken": 75, "Brian Schottenheimer": 75, "Jesse Minter": 74, "Kellen Moore": 74,
};

// Coordinator ratings and schemes for the better-known names.
export const COORD = {
  "Steve Spagnuolo": { rating: 88, scheme: "Zone Blitz" }, "Vic Fangio": { rating: 88, scheme: "Cover 2" },
  "Brian Flores": { rating: 86, scheme: "Zone Blitz" }, "Mike McDaniel": { rating: 85, scheme: "West Coast" },
  "Josh McDaniels": { rating: 82, scheme: "Spread" }, "Raheem Morris": { rating: 82, scheme: "4-3" },
  "Lou Anarumo": { rating: 81, scheme: "Zone Blitz" }, "Brian Daboll": { rating: 81, scheme: "Spread" },
  "Dennis Allen": { rating: 81, scheme: "4-3" }, "Jonathan Gannon": { rating: 79, scheme: "Cover 2" },
  "Ejiro Evero": { rating: 80, scheme: "3-4" }, "Patrick Graham": { rating: 79, scheme: "3-4" },
  "Vance Joseph": { rating: 80, scheme: "3-4" }, "Chris Shula": { rating: 79, scheme: "3-4" },
  "Eric Bieniemy": { rating: 78, scheme: "West Coast" }, "Matt Nagy": { rating: 77, scheme: "West Coast" },
  "Frank Reich": { rating: 76, scheme: "West Coast" }, "Nathaniel Hackett": { rating: 74, scheme: "West Coast" },
  "Klay Kubiak": { rating: 78, scheme: "West Coast" }, "Bobby Slowik": { rating: 76, scheme: "West Coast" },
  "Drew Petzing": { rating: 76, scheme: "Power Run" }, "Klayton Adams": { rating: 76, scheme: "Power Run" },
  "Brandon Staley": { rating: 76, scheme: "3-4" }, "Gus Bradley": { rating: 75, scheme: "Cover 2" },
  "Pete Carmichael Jr.": { rating: 76, scheme: "Spread" }, "Jim Leonhard": { rating: 77, scheme: "Cover 2" },
  "Anthony Weaver": { rating: 77, scheme: "4-3" }, "Al Golden": { rating: 76, scheme: "4-3" },
  "Todd Bowles": { rating: 80, scheme: "Zone Blitz" }, "Aden Durde": { rating: 78, scheme: "3-4" },
  "Dave Toub": { rating: 88 }, "Darrin Simmons": { rating: 85 }, "Dave Fipp": { rating: 82 },
  "John Fassel": { rating: 81 }, "Darren Rizzi": { rating: 80 }, "Danny Crossman": { rating: 77 },
};

// What each head coach is known for (see src/headCoach.js for what each trait does).
export const HC_TRAIT = {
  "Andy Reid": "QB Whisperer", "Sean McVay": "Offensive Guru", "Kyle Shanahan": "Offensive Guru",
  "John Harbaugh": "Culture Builder", "Jim Harbaugh": "Culture Builder", "Sean Payton": "QB Whisperer",
  "Dan Campbell": "Culture Builder", "Mike Vrabel": "Talent Evaluator", "Nick Sirianni": "Veteran Manager",
  "Matt LaFleur": "Player Developer", "Kevin O'Connell": "QB Whisperer", "Mike Macdonald": "Defensive Mastermind",
  "Ben Johnson": "Offensive Guru", "Mike McCarthy": "QB Whisperer", "Kevin Stefanski": "Offensive Guru",
  "DeMeco Ryans": "Defensive Mastermind", "Dan Quinn": "Defensive Mastermind", "Liam Coen": "Player Developer",
  "Zac Taylor": "Veteran Manager", "Todd Bowles": "Defensive Mastermind", "Shane Steichen": "QB Whisperer",
  "Robert Saleh": "Defensive Mastermind", "Todd Monken": "Offensive Guru", "Brian Schottenheimer": "Player Developer",
  "Jesse Minter": "Defensive Mastermind", "Kellen Moore": "Offensive Guru", "Mike LaFleur": "Player Developer",
  "Joe Brady": "QB Whisperer", "Dave Canales": "Player Developer", "Jeff Hafley": "Talent Evaluator",
  "Klint Kubiak": "Offensive Guru", "Aaron Glenn": "Talent Evaluator",
};
