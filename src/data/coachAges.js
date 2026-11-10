// Real coaches' birth years, from ESPN. Built by scripts/build-coach-ages.py.
export const COACH_BORN = {
"Aaron Glenn": 1972,
"Andy Reid": 1958,
"Dan Campbell": 1976,
"DeMeco Ryans": 1984,
"Jim Harbaugh": 1963,
"John Harbaugh": 1962,
"Kellen Moore": 1988,
"Mike Macdonald": 1987,
"Mike McCarthy": 1963,
"Mike Vrabel": 1975,
"Sean Payton": 1963,
"Todd Bowles": 1963,
"Zac Taylor": 1983
};

// Approximate birth years for well-known coaches ESPN doesn't date (public record, give or take a year;
// close enough for when a coach retires).
const APPROX_BORN = {
  "Sean Payton": 1963, "Kyle Shanahan": 1979, "Sean McVay": 1986, "Vic Fangio": 1958, "Steve Spagnuolo": 1959, "Nick Sirianni": 1981,
  "Matt LaFleur": 1979, "Kevin O'Connell": 1985, "Mike McDaniel": 1983, "Dan Quinn": 1970, "Kevin Stefanski": 1982, "Zac Taylor": 1983,
  "Todd Bowles": 1963, "Robert Saleh": 1979, "Brian Flores": 1981, "Josh McDaniels": 1976, "Frank Reich": 1961, "Gus Bradley": 1966,
  "Eric Bieniemy": 1969, "Joe Brady": 1989, "Liam Coen": 1985, "Ben Johnson": 1986, "Mike Vrabel": 1975, "Mike McCarthy": 1963,
  "Brian Daboll": 1975, "Jonathan Gannon": 1983, "Shane Steichen": 1985, "Dave Canales": 1981, "Brian Schottenheimer": 1973,
  "Klint Kubiak": 1987, "Mike Macdonald": 1987, "Jeff Hafley": 1979, "Vance Joseph": 1972, "Matt Nagy": 1978, "Dennis Allen": 1972,
  "Lou Anarumo": 1966, "Todd Monken": 1966, "Pete Carmichael Jr.": 1971, "Nathaniel Hackett": 1979, "Brandon Staley": 1982,
  "Jim Leonhard": 1982, "Al Golden": 1969, "Kellen Moore": 1988, "Wes Phillips": 1979, "Ejiro Evero": 1981, "Mike LaFleur": 1987,
  "Patrick Graham": 1979, "Jeff Ulbrich": 1977, "Joe DeCamillis": 1965, "Dave Toub": 1962, "Chris Tabor": 1971, "Danny Smith": 1953,
  "John Fassel": 1974, "Raheem Morris": 1976, "Doug Nussmeier": 1970, "Press Taylor": 1988, "Zac Robinson": 1986, "Jim Bob Cooter": 1984,
  "Drew Petzing": 1987, "Bobby Slowik": 1987, "Nick Caley": 1983, "Klay Kubiak": 1991, "Grant Udinski": 1995, "Tommy Rees": 1992,
  "Declan Doyle": 1996, "Sean Mannion": 1992, "David Blough": 1995, "Davis Webb": 1995, "Jesse Minter": 1983, "Anthony Weaver": 1980,
  "Christian Parker": 1991, "Kelvin Sheppard": 1987, "Matt Burke": 1976, "Dave Fipp": 1975, "Darren Rizzi": 1970,
};
// every real coach with a known (or approximate) birth year
export const BORN = { ...APPROX_BORN, ...COACH_BORN };
