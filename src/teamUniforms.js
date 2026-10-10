// Uniforms for all 32 clubs, for the pixel-art players. Home is the color jersey; road is white
// with the number in the club's color. Keys:
//   helmet, stripe (center stripe or null), decal (helmet logo blob), mask (facemask),
//   jersey, number, numberEdge, sleeve (sleeve stripes), pants, pantsStripe, socks, sockStripe
export const UNIFORMS = {
  ARI: { helmet: "#f4f4f2", stripe: null, decal: "#97233f", mask: "#2a2a2c", jersey: "#97233f", number: "#ffffff", numberEdge: "#101820", sleeve: "#ffffff", pants: "#f4f4f2", pantsStripe: "#97233f", socks: "#97233f", sockStripe: "#ffffff" },
  ATL: { helmet: "#1b1b1d", stripe: null, decal: "#a71930", mask: "#1b1b1d", jersey: "#1b1b1d", number: "#a71930", numberEdge: "#ffffff", sleeve: "#a71930", pants: "#f4f4f2", pantsStripe: "#a71930", socks: "#1b1b1d", sockStripe: "#a71930" },
  BAL: { helmet: "#1b1b1d", stripe: null, decal: "#241773", mask: "#1b1b1d", jersey: "#241773", number: "#ffffff", numberEdge: "#9e7c0c", sleeve: "#1b1b1d", pants: "#f4f4f2", pantsStripe: "#241773", socks: "#1b1b1d", sockStripe: "#241773" },
  BUF: { helmet: "#f4f4f2", stripe: "#c60c30", decal: "#00338d", mask: "#00338d", jersey: "#00338d", number: "#ffffff", numberEdge: "#c60c30", sleeve: "#c60c30", pants: "#f4f4f2", pantsStripe: "#00338d", socks: "#00338d", sockStripe: "#c60c30" },
  CAR: { helmet: "#a5acaf", stripe: "#0085ca", decal: "#0085ca", mask: "#1b1b1d", jersey: "#1b1b1d", number: "#ffffff", numberEdge: "#0085ca", sleeve: "#0085ca", pants: "#a5acaf", pantsStripe: "#0085ca", socks: "#1b1b1d", sockStripe: "#0085ca" },
  CHI: { helmet: "#0b162a", stripe: "#c83803", decal: "#c83803", mask: "#8d9093", jersey: "#0b162a", number: "#ffffff", numberEdge: "#c83803", sleeve: "#c83803", pants: "#f4f4f2", pantsStripe: "#c83803", socks: "#0b162a", sockStripe: "#c83803" },
  CIN: { helmet: "#fb4f14", stripe: "#1b1b1d", decal: "#1b1b1d", mask: "#1b1b1d", jersey: "#1b1b1d", number: "#fb4f14", numberEdge: "#ffffff", sleeve: "#fb4f14", pants: "#f4f4f2", pantsStripe: "#fb4f14", socks: "#1b1b1d", sockStripe: "#fb4f14" },
  CLE: { helmet: "#ff3c00", stripe: "#311d00", decal: "#ff3c00", mask: "#311d00", jersey: "#311d00", number: "#ff3c00", numberEdge: "#ffffff", sleeve: "#ff3c00", pants: "#f4f4f2", pantsStripe: "#ff3c00", socks: "#311d00", sockStripe: "#ff3c00" },
  DAL: { helmet: "#a9b3bd", stripe: "#041e42", decal: "#041e42", mask: "#5d6670", jersey: "#f4f4f2", number: "#041e42", numberEdge: "#a9b3bd", sleeve: "#041e42", pants: "#a9b3bd", pantsStripe: "#041e42", socks: "#041e42", sockStripe: "#f4f4f2", whiteHome: true },
  DEN: { helmet: "#002244", stripe: "#fb4f14", decal: "#fb4f14", mask: "#002244", jersey: "#fb4f14", number: "#002244", numberEdge: "#ffffff", sleeve: "#002244", pants: "#f4f4f2", pantsStripe: "#fb4f14", socks: "#002244", sockStripe: "#fb4f14" },
  DET: { helmet: "#b0b7bc", stripe: "#0076b6", decal: "#0076b6", mask: "#0076b6", jersey: "#0076b6", number: "#ffffff", numberEdge: "#b0b7bc", sleeve: "#ffffff", pants: "#b0b7bc", pantsStripe: "#0076b6", socks: "#0076b6", sockStripe: "#ffffff" },
  GB: { helmet: "#ffb612", stripe: "#203731", decal: "#203731", mask: "#203731", jersey: "#203731", number: "#ffffff", numberEdge: "#ffb612", sleeve: "#ffb612", pants: "#ffb612", pantsStripe: "#203731", socks: "#203731", sockStripe: "#ffb612" },
  HOU: { helmet: "#03202f", stripe: null, decal: "#a71930", mask: "#03202f", jersey: "#03202f", number: "#ffffff", numberEdge: "#a71930", sleeve: "#a71930", pants: "#f4f4f2", pantsStripe: "#a71930", socks: "#03202f", sockStripe: "#a71930" },
  IND: { helmet: "#f4f4f2", stripe: "#002c5f", decal: "#002c5f", mask: "#002c5f", jersey: "#002c5f", number: "#ffffff", numberEdge: "#002c5f", sleeve: "#ffffff", pants: "#f4f4f2", pantsStripe: "#002c5f", socks: "#002c5f", sockStripe: "#ffffff" },
  JAX: { helmet: "#1b1b1d", stripe: null, decal: "#006778", mask: "#1b1b1d", jersey: "#006778", number: "#ffffff", numberEdge: "#d7a22a", sleeve: "#d7a22a", pants: "#f4f4f2", pantsStripe: "#006778", socks: "#006778", sockStripe: "#d7a22a" },
  KC: { helmet: "#e31837", stripe: null, decal: "#ffffff", mask: "#8d9093", jersey: "#e31837", number: "#ffffff", numberEdge: "#ffb81c", sleeve: "#ffb81c", pants: "#f4f4f2", pantsStripe: "#e31837", socks: "#e31837", sockStripe: "#ffffff" },
  LV: { helmet: "#a5acaf", stripe: "#1b1b1d", decal: "#1b1b1d", mask: "#5d6670", jersey: "#1b1b1d", number: "#a5acaf", numberEdge: "#ffffff", sleeve: "#a5acaf", pants: "#a5acaf", pantsStripe: "#1b1b1d", socks: "#1b1b1d", sockStripe: "#a5acaf" },
  LAC: { helmet: "#0072ce", stripe: null, decal: "#ffc20e", mask: "#002a5e", jersey: "#0080c6", number: "#ffffff", numberEdge: "#ffc20e", sleeve: "#ffc20e", pants: "#f4f4f2", pantsStripe: "#ffc20e", socks: "#0080c6", sockStripe: "#ffc20e" },
  LAR: { helmet: "#003594", stripe: "#ffa300", decal: "#ffd100", mask: "#003594", jersey: "#003594", number: "#ffd100", numberEdge: "#ffffff", sleeve: "#ffd100", pants: "#f4f4f2", pantsStripe: "#ffd100", socks: "#003594", sockStripe: "#ffd100" },
  MIA: { helmet: "#f4f4f2", stripe: "#008e97", decal: "#fc4c02", mask: "#005778", jersey: "#008e97", number: "#ffffff", numberEdge: "#fc4c02", sleeve: "#fc4c02", pants: "#f4f4f2", pantsStripe: "#008e97", socks: "#008e97", sockStripe: "#fc4c02" },
  MIN: { helmet: "#4f2683", stripe: null, decal: "#ffffff", mask: "#4f2683", jersey: "#4f2683", number: "#ffffff", numberEdge: "#ffc62f", sleeve: "#ffc62f", pants: "#f4f4f2", pantsStripe: "#4f2683", socks: "#4f2683", sockStripe: "#ffc62f" },
  NE: { helmet: "#b0b7bc", stripe: null, decal: "#002244", mask: "#002244", jersey: "#002244", number: "#ffffff", numberEdge: "#c60c30", sleeve: "#c60c30", pants: "#b0b7bc", pantsStripe: "#002244", socks: "#002244", sockStripe: "#c60c30" },
  NO: { helmet: "#d3bc8d", stripe: null, decal: "#1b1b1d", mask: "#1b1b1d", jersey: "#1b1b1d", number: "#ffffff", numberEdge: "#d3bc8d", sleeve: "#d3bc8d", pants: "#d3bc8d", pantsStripe: "#1b1b1d", socks: "#1b1b1d", sockStripe: "#d3bc8d" },
  NYG: { helmet: "#0b3d91", stripe: "#c8102e", decal: "#ffffff", mask: "#8d9093", jersey: "#0b3d91", number: "#ffffff", numberEdge: "#c8102e", sleeve: "#c8102e", pants: "#ffffff", pantsStripe: "#c8102e", socks: "#0b3d91", sockStripe: "#c8102e" },
  NYJ: { helmet: "#125740", stripe: null, decal: "#ffffff", mask: "#125740", jersey: "#125740", number: "#ffffff", numberEdge: "#1b1b1d", sleeve: "#ffffff", pants: "#f4f4f2", pantsStripe: "#125740", socks: "#125740", sockStripe: "#ffffff" },
  PHI: { helmet: "#004c54", stripe: null, decal: "#a5acaf", mask: "#1b1b1d", jersey: "#004c54", number: "#ffffff", numberEdge: "#1b1b1d", sleeve: "#a5acaf", pants: "#f4f4f2", pantsStripe: "#004c54", socks: "#004c54", sockStripe: "#1b1b1d" },
  PIT: { helmet: "#1b1b1d", stripe: "#ffb612", decal: "#ffffff", mask: "#1b1b1d", jersey: "#1b1b1d", number: "#ffb612", numberEdge: "#ffffff", sleeve: "#ffb612", pants: "#ffb612", pantsStripe: "#1b1b1d", socks: "#1b1b1d", sockStripe: "#ffb612" },
  SF: { helmet: "#b3995d", stripe: "#aa0000", decal: "#aa0000", mask: "#8d9093", jersey: "#aa0000", number: "#ffffff", numberEdge: "#1b1b1d", sleeve: "#ffffff", pants: "#b3995d", pantsStripe: "#aa0000", socks: "#aa0000", sockStripe: "#ffffff" },
  SEA: { helmet: "#002244", stripe: null, decal: "#69be28", mask: "#002244", jersey: "#002244", number: "#ffffff", numberEdge: "#69be28", sleeve: "#69be28", pants: "#f4f4f2", pantsStripe: "#69be28", socks: "#002244", sockStripe: "#69be28" },
  TB: { helmet: "#4a4542", stripe: null, decal: "#d50a0a", mask: "#1b1b1d", jersey: "#d50a0a", number: "#ffffff", numberEdge: "#4a4542", sleeve: "#4a4542", pants: "#4a4542", pantsStripe: "#d50a0a", socks: "#d50a0a", sockStripe: "#4a4542" },
  TEN: { helmet: "#0c2340", stripe: "#4b92db", decal: "#4b92db", mask: "#8d9093", jersey: "#0c2340", number: "#ffffff", numberEdge: "#4b92db", sleeve: "#4b92db", pants: "#f4f4f2", pantsStripe: "#4b92db", socks: "#0c2340", sockStripe: "#4b92db" },
  WAS: { helmet: "#5a1414", stripe: "#ffb612", decal: "#ffb612", mask: "#ffb612", jersey: "#5a1414", number: "#ffb612", numberEdge: "#ffffff", sleeve: "#ffb612", pants: "#ffb612", pantsStripe: "#5a1414", socks: "#5a1414", sockStripe: "#ffb612" },
};

const ALIASES = {
  ARZ: "ARI", JAC: "JAX", LA: "LAR", LVR: "LV", OAK: "LV", SD: "LAC", STL: "LAR", WSH: "WAS", GNB: "GB", KAN: "KC", NOR: "NO", NWE: "NE", SFO: "SF", TAM: "TB",
};
const BY_NAME = {
  cardinals: "ARI", falcons: "ATL", ravens: "BAL", bills: "BUF", panthers: "CAR", bears: "CHI", bengals: "CIN", browns: "CLE", cowboys: "DAL", broncos: "DEN", lions: "DET", packers: "GB",
  texans: "HOU", colts: "IND", jaguars: "JAX", chiefs: "KC", raiders: "LV", chargers: "LAC", rams: "LAR", dolphins: "MIA", vikings: "MIN", patriots: "NE", saints: "NO", giants: "NYG",
  jets: "NYJ", eagles: "PHI", steelers: "PIT", "49ers": "SF", niners: "SF", seahawks: "SEA", buccaneers: "TB", titans: "TEN", commanders: "WAS",
};

// A team's key from whatever the game has: a team object ({ ab, name, ... }), an abbreviation, or a name.
export function teamKey(team) {
  if (!team) return null;
  const s = typeof team === "string" ? team : team.ab || team.name || "";
  const up = s.toUpperCase().trim();
  if (UNIFORMS[up]) return up;
  if (ALIASES[up]) return ALIASES[up];
  const words = s.toLowerCase().split(/\s+/);
  for (const w of words.reverse()) if (BY_NAME[w]) return BY_NAME[w];
  if (typeof team === "object" && team.name) return BY_NAME[team.name.toLowerCase()] || null;
  return null;
}

// The uniform to draw. away: the white road jersey. Unknown teams get one built from their colors.
export function uniformFor(team, { away = false } = {}) {
  const k = teamKey(team);
  const base = UNIFORMS[k] || (() => {
    const clr = (typeof team === "object" && team?.clr) || "#475569", ac = (typeof team === "object" && team?.ac) || "#e2e8f0";
    return { helmet: clr, stripe: ac, decal: ac, mask: "#8d9093", jersey: clr, number: "#ffffff", numberEdge: ac, sleeve: ac, pants: "#f4f4f2", pantsStripe: clr, socks: clr, sockStripe: ac };
  })();
  if (!away) return base;
  // the road look: white jersey (or the club's color, for a team that wears white at home)
  if (base.whiteHome) return { ...base, jersey: base.stripe || base.helmet, number: "#ffffff", numberEdge: base.numberEdge };
  return { ...base, jersey: "#f4f4f2", number: base.jersey, numberEdge: base.numberEdge === "#ffffff" ? base.sleeve : base.numberEdge, sleeve: base.jersey };
}
