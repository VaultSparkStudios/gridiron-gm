// Paths are relative to Vite's deployment base, including GitHub Pages/mobile.
const aliases = { GNB: 'GB', KCC: 'KC', LVR: 'LV', NEP: 'NE', NOS: 'NO', SFO: 'SF', TBB: 'TB', WSH: 'WAS', JAC: 'JAX' };
export function spriteTeam(ab) {
  const key = String(ab || '').toUpperCase();
  return aliases[key] || key;
}
export function spriteGroup(pos) {
  if (['LT', 'LG', 'C', 'RG', 'RT', 'OL'].includes(pos)) return 'OL';
  if (['DE', 'DT', 'NT', 'DL', 'EDGE'].includes(pos)) return 'DL';
  if (['FS', 'SS', 'S', 'DB', 'CB'].includes(pos)) return 'CB';
  if (['MLB', 'ILB', 'OLB', 'LB'].includes(pos)) return 'LB';
  if (['RB', 'FB'].includes(pos)) return 'RB';
  if (['TE', 'WR'].includes(pos)) return 'WR';
  return pos === 'QB' ? 'QB' : null;
}
