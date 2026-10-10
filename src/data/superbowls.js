// Every real Super Bowl champion: [game number, season, franchise (today's abbreviation),
// the name they won under when it differs]. Super Bowl I was played after the 1966 season.
export const SUPER_BOWLS = [
  [1, 1966, "GB"], [2, 1967, "GB"], [3, 1968, "NYJ"], [4, 1969, "KC"], [5, 1970, "IND", "Baltimore Colts"],
  [6, 1971, "DAL"], [7, 1972, "MIA"], [8, 1973, "MIA"], [9, 1974, "PIT"], [10, 1975, "PIT"],
  [11, 1976, "LV", "Oakland Raiders"], [12, 1977, "DAL"], [13, 1978, "PIT"], [14, 1979, "PIT"], [15, 1980, "LV", "Oakland Raiders"],
  [16, 1981, "SF"], [17, 1982, "WAS"], [18, 1983, "LV", "Los Angeles Raiders"], [19, 1984, "SF"], [20, 1985, "CHI"],
  [21, 1986, "NYG"], [22, 1987, "WAS"], [23, 1988, "SF"], [24, 1989, "SF"], [25, 1990, "NYG"],
  [26, 1991, "WAS"], [27, 1992, "DAL"], [28, 1993, "DAL"], [29, 1994, "SF"], [30, 1995, "DAL"],
  [31, 1996, "GB"], [32, 1997, "DEN"], [33, 1998, "DEN"], [34, 1999, "LAR", "St. Louis Rams"], [35, 2000, "BAL"],
  [36, 2001, "NE"], [37, 2002, "TB"], [38, 2003, "NE"], [39, 2004, "NE"], [40, 2005, "PIT"],
  [41, 2006, "IND"], [42, 2007, "NYG"], [43, 2008, "PIT"], [44, 2009, "NO"], [45, 2010, "GB"],
  [46, 2011, "NYG"], [47, 2012, "BAL"], [48, 2013, "SEA"], [49, 2014, "NE"], [50, 2015, "DEN"],
  [51, 2016, "NE"], [52, 2017, "PHI"], [53, 2018, "NE"], [54, 2019, "KC"], [55, 2020, "TB"],
  [56, 2021, "LAR"], [57, 2022, "KC"], [58, 2023, "KC"], [59, 2024, "PHI"], [60, 2025, "SEA"],
];

// Super Bowl numbering: Roman numerals, except Super Bowl 50.
export function sbName(n) {
  if (n === 50) return "Super Bowl 50";
  const R = [[50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let s = "", x = n;
  for (const [v, r] of R) while (x >= v) { s += r; x -= v; }
  return `Super Bowl ${s}`;
}
// The Super Bowl played after a given season.
export const sbNumber = (season) => season - 1965;
