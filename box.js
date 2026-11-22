// ZIKRU box: the confirmed logo geometry and timing (brand/motion/box/render.mjs), drawn live so it stays sharp.
(() => {
'use strict';
const BW = 466, BH = 280, BD = 216, PERIMETER = 2 * (BW + BD), HOLD = 4.5;
const GLYPHS = [
  ['M0 0H52V12L17 52H52V64H0V52L35 12H0Z', 0, 52],
  ['M0 0H12V64H0Z', 66, 12],
  ['M0 0H12V25L35 0H51L26 32L52 64H36L12 39V64H0Z', 94, 52],
  ['M0 0H30C44 0 52 8 52 22C52 32 47 39 39 42L54 64H39L25 44H12V64H0Z M12 12V32H29C36 32 40 29 40 22C40 15 36 12 29 12Z', 162, 54],
  ['M0 0H12V38C12 48 16 52 26 52C36 52 40 48 40 38V0H52V39C52 55 42 64 26 64C10 64 0 55 0 39Z', 230, 52]
];
const clamp = x => Math.max(0, Math.min(1, x));
const mix = (a, b, p) => a + (b - a) * p;
const rad = n => n * Math.PI / 180;
const cubic = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3;
function bezier(x, x1, y1, x2, y2) {
  x = clamp(x);
  let lo = 0, hi = 1;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (cubic(mid, x1, x2) < x) lo = mid; else hi = mid;
  }
  return cubic((lo + hi) / 2, y1, y2);
}
const ease = x => bezier(x, .42, 0, .22, 1);
const spring = t => Math.exp(-5.8 * t) * (Math.cos(10 * t) + .58 * Math.sin(10 * t));
function pose(t) {
  if (t < 1.7) {
    const e = ease((t - .62) / 1.08);
    return [mix(-18, -64, e), mix(-12, 9, e), mix(-3.5, 3, e), mix(1.42, 1.46, e)];
  }
  if (t < 3.55) {
    const e = bezier((t - 1.7) / 1.85, .48, 0, .2, 1);
    return [mix(-64, 42, e), mix(9, -19, e), mix(3, -.9, e), mix(1.46, 1.545, e)];
  }
  const s = t >= HOLD ? 0 : spring(t - 3.55) * (1 - ease((t - 4.25) / .25));
  return [36 + 6 * s, -15.5 - 3.5 * s, -.9 * s, 1.52 + .025 * s];
}
const faces = [
  [0, BD, [-1, 0, 0], (u, v) => [-BW / 2, BH / 2 - v, -BD / 2 + u]],
  [BD, BW, [0, 0, 1], (u, v) => [-BW / 2 + u, BH / 2 - v, BD / 2]],
  [BD + BW, BD, [1, 0, 0], (u, v) => [BW / 2, BH / 2 - v, BD / 2 - u]],
  [2 * BD + BW, BW, [0, 0, -1], (u, v) => [BW / 2 - u, BH / 2 - v, -BD / 2]]
];
const vertices = [], edges = [];
for (const x of [-BW / 2, BW / 2]) for (const y of [-BH / 2, BH / 2]) for (const z of [-BD / 2, BD / 2]) vertices.push([x, y, z]);
for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) {
  if (vertices[a].filter((v, i) => v !== vertices[b][i]).length === 1) edges.push([a, b]);
}
const order = [8, 2, 0, 4, 9, 3, 6, 1, 10, 5, 11, 7];
const f = x => Number(x.toFixed(5));

function frame(t, id = 'box') {
  const [yaw, pitch, roll, scale] = pose(t);
  const cy = Math.cos(rad(yaw)), sy = Math.sin(rad(yaw)), cp = Math.cos(rad(pitch)), sp = Math.sin(rad(pitch));
  const cr = Math.cos(rad(roll)), sr = Math.sin(rad(roll));
  const rotate = ([x, y, z]) => {
    const xx = x * cy + z * sy, zz = -x * sy + z * cy, yy = y * cp + zz * sp;
    return [xx * cr - yy * sr, xx * sr + yy * cr, -y * sp + zz * cp];
  };
  const point = p => { const [x, y] = rotate(p); return [960 + x * scale, 540 - y * scale]; };
  let wire = '', body = '';
  edges.forEach(([a, b], i) => {
    const p = ease((t - .08 - order[i] * .034) / .64);
    if (p < .00001) return;
    const u = point(vertices[a]), v = point(vertices[b]);
    wire += `M${f(u[0])} ${f(u[1])}L${f(mix(u[0], v[0], p))} ${f(mix(u[1], v[1], p))}`;
  });
  faces.forEach(([start, width, normal, at], k) => {
    if (rotate(normal)[2] <= .00001) return;
    let strip = '';
    GLYPHS.forEach(([d, x0, w], i) => {
      const offset = mix(922, 22.5, bezier((t - 1.1 - i * .045) / 2.48, .45, 0, .14, 1));
      for (const cycle of [-1, 0, 1]) {
        const x = offset + x0 * 2.25 + cycle * PERIMETER - start;
        if (x + w * 2.25 < 0 || x > width) continue;
        strip += `<path d="${d}" transform="translate(${f(x)} 12) scale(2.25 4)" fill-rule="evenodd"/>`;
      }
    });
    if (!strip) return;
    const a = point(at(0, 0)), b = point(at(1, 0)), c = point(at(0, 1));
    const m = [b[0] - a[0], b[1] - a[1], c[0] - a[0], c[1] - a[1], a[0], a[1]].map(f).join(' ');
    body += `<g transform="matrix(${m})"><clipPath id="${id}-${k}"><rect width="${width}" height="${BH}"/></clipPath><g clip-path="url(#${id}-${k})">${strip}</g></g>`;
  });
  return `<path d="${wire}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${body}`;
}

if (typeof module !== 'undefined') module.exports = {frame, HOLD};
else window.zikruBox = {frame, HOLD};
})();
