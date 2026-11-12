export const ROOM = { w: 8, d: 7 };
export const INITIAL = [
  { id: 'sofa', name: 'Lounge sofa', type: 'sofa', x: -1.55, z: 1.9, rot: 0, w: 2.55, d: 1.02, h: .88, color: '#d6a16d' },
  { id: 'coffee', name: 'Coffee table', type: 'table', x: -.7, z: .25, rot: 0, w: 1.25, d: .78, h: .42, color: '#b57d4d' },
  { id: 'chair', name: 'Lounge chair', type: 'chair', x: 1.85, z: .5, rot: -.25, w: .92, d: .9, h: .9, color: '#6e9589' },
  { id: 'shelf', name: 'Bookcase', type: 'shelf', x: 2.75, z: -2.45, rot: 0, w: 1.4, d: .42, h: 1.8, color: '#795b47' },
  { id: 'plant', name: 'Indoor plant', type: 'plant', x: -3.05, z: -2.3, rot: 0, w: .72, d: .72, h: 1.35, color: '#6d8e66' },
  { id: 'lamp', name: 'Floor lamp', type: 'lamp', x: 2.3, z: 2.5, rot: 0, w: .4, d: .4, h: 1.65, color: '#d7c08e' }
];
export const CATALOG = [
  { type: 'sofa', name: 'Lounge sofa', w: 2.55, d: 1.02, h: .88, color: '#d6a16d' },
  { type: 'chair', name: 'Lounge chair', w: .92, d: .9, h: .9, color: '#6e9589' },
  { type: 'table', name: 'Coffee table', w: 1.25, d: .78, h: .42, color: '#b57d4d' },
  { type: 'shelf', name: 'Bookcase', w: 1.4, d: .42, h: 1.8, color: '#795b47' },
  { type: 'desk', name: 'Writing desk', w: 1.5, d: .72, h: .76, color: '#9a795e' },
  { type: 'plant', name: 'Indoor plant', w: .72, d: .72, h: 1.35, color: '#6d8e66' },
  { type: 'lamp', name: 'Floor lamp', w: .4, d: .4, h: 1.65, color: '#d7c08e' }
];
export const footprint = (f) => { const a = f.rot % Math.PI; return Math.abs(Math.cos(a)) * f.w / 2 + Math.abs(Math.sin(a)) * f.d / 2; };
export const footprintZ = (f) => { const a = f.rot % Math.PI; return Math.abs(Math.sin(a)) * f.w / 2 + Math.abs(Math.cos(a)) * f.d / 2; };
export function inBounds(f) { return Math.abs(f.x) + footprint(f) <= ROOM.w / 2 && Math.abs(f.z) + footprintZ(f) <= ROOM.d / 2; }
export function collides(a, b, gap = .06) { return Math.abs(a.x - b.x) < footprint(a) + footprint(b) + gap && Math.abs(a.z - b.z) < footprintZ(a) + footprintZ(b) + gap; }
export function scoreLayout(items) {
  const area = items.reduce((sum, f) => sum + f.w * f.d, 0);
  let pairs = 0, out = 0;
  for (let i = 0; i < items.length; i++) { if (!inBounds(items[i])) out++; for (let j = i + 1; j < items.length; j++) if (collides(items[i], items[j])) pairs++; }
  const pathZ = ROOM.d / 2 - .45;
  const blockers = items.filter(f => f.z + footprintZ(f) > pathZ && f.z - footprintZ(f) < pathZ + .9 && Math.abs(f.x) < .72 + footprint(f)).length;
  const utilization = Math.min(100, Math.round(area / (ROOM.w * ROOM.d) * 100));
  const collisionFree = items.length ? Math.round((1 - Math.min(1, pairs * 2 / items.length)) * 100) : 100;
  const accessibility = Math.max(0, Math.round(100 - blockers * 25));
  const overall = Math.max(0, Math.round(utilization * .2 + collisionFree * .5 + accessibility * .3 - out * 30));
  return { overall, utilization, collisionFree, accessibility, pairs, out, blockers };
}
export function optimize(items) {
  // Greedy grid search: for each piece, choose the legal candidate with the highest whole-room score.
  const result = [];
  const sorted = [...items].sort((a, b) => b.w * b.d - a.w * a.d);
  for (const f of sorted) {
    let best = null, bestScore = -Infinity;
    for (let rot = 0; rot < 4; rot++) for (let x = -3.35; x <= 3.35; x += .25) for (let z = -2.85; z <= 2.85; z += .25) {
      const c = { ...f, x, z, rot: rot * Math.PI / 2 };
      if (!inBounds(c) || result.some(r => collides(c, r, .12))) continue;
      const trial = [...result, c]; const s = scoreLayout(trial);
      // Prefer furniture near walls and leave the door-side walkway clear.
      const wallBonus = (Math.abs(x) / 4 + Math.abs(z) / 3.5) * 1.8;
      const pathPenalty = z > 2.05 && Math.abs(x) < 1.05 ? 18 : 0;
      const value = s.overall + wallBonus - pathPenalty;
      if (value > bestScore) { best = c; bestScore = value; }
    }
    result.push(best || f);
  }
  return result;
}
export function generateLayouts(items, count = 3) {
  const best = optimize(items);
  const variants = [
    best,
    best.map(f => ({ ...f, x: -f.x, rot: -f.rot })), // mirror across the room's center line
    best.map(f => ({ ...f, x: -f.x, z: -f.z, rot: f.rot + Math.PI })) // turn the arrangement around
  ];
  return variants.slice(0, count);
}
