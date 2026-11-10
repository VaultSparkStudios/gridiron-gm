// A player's number when he has none yet (a draft pick, a generated player): a steady pick from his
// position's usual range, the same every time for the same player.
const ROOKIE_NUM = { QB: [1, 19], K: [1, 19], P: [1, 19], RB: [20, 39], WR: [10, 19], TE: [80, 89], LT: [70, 79], LG: [60, 79], C: [50, 79], RG: [60, 79], RT: [70, 79], DL: [90, 99], EDGE: [90, 99], DT: [90, 99], LB: [40, 59], CB: [20, 39], S: [20, 39] };
export const rookieNum = (p) => { if (p.num) return p.num; const [a, b] = ROOKIE_NUM[p.pos] || [20, 49]; let h = 0; for (const c of String(p.id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return a + (h % (b - a + 1)); };
