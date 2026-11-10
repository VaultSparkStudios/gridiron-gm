// Head coach traits: each head coach is known for one thing, and it shows up in the game.
export const HC_TRAITS = {
  "Player Developer": { icon: "", desc: "Young players (under 27) grow faster: an extra point of OVR in many off-seasons." },
  "QB Whisperer": { icon: "", desc: "Quarterbacks develop faster and hold off decline longer." },
  "Talent Evaluator": { icon: "", desc: "+3 scouting points every season for your draft room." },
  "Offensive Guru": { icon: "", desc: "Game plans add about half a point a game on offense." },
  "Defensive Mastermind": { icon: "", desc: "Game plans take about half a point a game off the opponent." },
  "Culture Builder": { icon: "", desc: "Players want to play for him: free agents and re-signs ask for less." },
  "Veteran Manager": { icon: "", desc: "Veterans past their prime decline more slowly." },
};
export const HC_TRAIT_NAMES = Object.keys(HC_TRAITS);

// Off-season growth after the head coach's trait. g: the growth already rolled for this player.
export function hcGrowth(hc, p, g, end, rand = Math.random) {
  const tr = hc?.trait;
  if (!tr) return g;
  if (tr === "Player Developer" && p.age < 27 && g >= 0 && (p.ovr < (p.truePot ?? p.pot ?? p.ovr) || g > 0) && rand() < 0.4) return g + 1;
  if (tr === "QB Whisperer" && p.pos === "QB") {
    if (g < 0) return rand() < 0.5 ? g + 1 : g;
    if (p.age < 30 && rand() < 0.45) return g + 1;
  }
  if (tr === "Veteran Manager" && g < 0 && p.age > end && rand() < 0.5) return g + 1;
  return g;
}

// Extra scouting points per season.
export const hcScoutBonus = (hc) => (hc?.trait === "Talent Evaluator" ? 3 : 0);

// Game-day edge: { off, def } points added to his offense / taken off the opponent.
export const hcGameEdge = (hc) => ({ off: hc?.trait === "Offensive Guru" ? 0.5 : 0, def: hc?.trait === "Defensive Mastermind" ? 0.5 : 0 });

// Free agents' and re-signs' floor drops a little for a Culture Builder.
export const hcCulture = (hc) => (hc?.trait === "Culture Builder" ? 0.04 : 0);
