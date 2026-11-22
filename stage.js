// The pinned stage. Reads one number, p (0–5, set by the talk's scroll position in site.js), and draws that moment.
// Chapters: cloud, floor, citations, gather, logo. Measured timing: research/site_spec_v12_gpto.md.
(() => {
'use strict';
const root = document.querySelector('[data-stage]');
if (!root) return;
const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d'), mark = root.querySelector('.stage-mark');
const toggle = root.querySelector('.stage-pause'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a, b, t) => a + (b - a) * t;
const span = (x, a, b) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const out = t => 1 - (1 - t) ** 4;
const noise = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Six services we check, and the places their answers come from. [key or label, x, y, depth]
const TILES = [
  ['google', .36, .15, .9], ['홈페이지', .64, .14, .8], ['claude', .5, .215, 1.06], ['리뷰', .24, .25, .8],
  ['openai', .41, .30, 1.2], ['googlegemini', .60, .295, 1.12], ['블로그', .77, .255, .86], ['지도', .15, .35, .76],
  ['naver', .29, .385, 1], ['perplexity', .72, .375, 1.05], ['가격', .86, .34, .76], ['영업시간', .50, .40, .92],
  ['플레이스', .40, .48, .88], ['예약', .62, .48, .84]
];
const images = {};
const symbols = document.querySelector('.logo-symbols defs');
TILES.forEach(([key]) => {
  if (!symbols.querySelector('#ai-' + key)) return;
  // Safari rasterises an SVG at its own size, so each tile is given a large one.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 48 48"><defs>${symbols.innerHTML}</defs><use href="#ai-${key}" width="48" height="48"/></svg>`;
  const image = new Image();
  image.onload = () => { images[key] = image; wake(); };
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
});

let W = 0, H = 0, p = 0, target = 0, clock = 0, last = 0, raf = 0, visible = true, paused = reduced.matches, lastFrame = '';
let intro = reduced.matches ? 3 : 0;
const floorY = () => H * .58;
// Floor coordinates: u across, d distance from the viewer.
const ground = (u, d) => [W / 2 + u * W * .3 / d, floorY() + H * .23 / d];

function floor(alpha, travel) {
  if (alpha < .01) return;
  const top = floorY();
  ctx.save();
  ctx.globalAlpha = alpha;
  const shade = ctx.createLinearGradient(0, top, 0, H);
  shade.addColorStop(0, '#000'); shade.addColorStop(.3, '#2b2b2b'); shade.addColorStop(.8, '#525252'); shade.addColorStop(1, '#0c0c0c');
  ctx.fillStyle = shade; ctx.fillRect(0, top, W, H - top);
  const line = ctx.createLinearGradient(0, top, 0, H);
  line.addColorStop(0, 'rgba(0,0,0,0)'); line.addColorStop(.3, 'rgba(0,0,0,.7)'); line.addColorStop(1, 'rgba(0,0,0,.85)');
  ctx.strokeStyle = line; ctx.lineWidth = 1.5;      // dark grout between tiles
  ctx.beginPath();
  for (let u = -8; u <= 8; u += .25) { ctx.moveTo(...ground(u, 5)); ctx.lineTo(...ground(u, .52)); }
  for (let i = 0; i < 44; i++) {
    const d = .52 + ((i * .11 - travel) % 4.84 + 4.84) % 4.84, y = ground(0, d)[1];
    ctx.moveTo(0, y); ctx.lineTo(W, y);
  }
  ctx.stroke();
  for (let i = 0; i < 70; i++) {                    // dust lifting off the floor
    const rise = (clock * .035 + noise(i)) % 1;
    ctx.globalAlpha = alpha * (1 - rise) * .55;
    ctx.fillStyle = '#fff';
    ctx.fillRect(noise(i + 90) * W, mix(H * .98, top - H * .08, rise * noise(i + 190)), 1, 1);
  }
  ctx.restore();
}

function cell(u, d, alpha) {
  const pts = [ground(u - .105, d + .045), ground(u + .105, d + .045), ground(u + .105, d - .045), ground(u - .105, d - .045)];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
  ctx.beginPath();
  pts.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q));
  ctx.fill();
  ctx.restore();
}

function tile(key, x, y, size, alpha) {
  if (size < 2 || alpha < .01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (images[key]) ctx.drawImage(images[key], x - size / 2, y - size / 2, size, size);
  else if (!symbols.querySelector('#ai-' + key)) {
    const r = size * .22, l = x - size / 2, t = y - size / 2;
    ctx.beginPath();
    ctx.moveTo(l + r, t); ctx.arcTo(l + size, t, l + size, t + size, r); ctx.arcTo(l + size, t + size, l, t + size, r);
    ctx.arcTo(l, t + size, l, t, r); ctx.arcTo(l, t, l + size, t, r); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${size * ([.3, .3, .32, .27, .225][key.length] || .18)}px "Pretendard Variable",sans-serif`;
    ctx.fillText(key, x, y + size * .02);
  }
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

  const burst = out(clamp((intro - .9) / 1.3));
  const gather = span(p, 1.92, 2.38), beamsOut = 1 - span(p, 1.86, 2.06);
  const size = clamp(Math.min(W * .112, H * .085), 34, 64);
  floor(mix(.12, 1, span(p, .15, .85)) * burst * (1 - span(p, 2.0, 2.34)), p * .5 + clock * .012);

  const at = TILES.map(([, x, y, depth], i) => {
    const bob = Math.sin(clock * .8 + i * 1.7) * 3 * depth * (1 - gather);
    let px = mix(W / 2, x * W + (x - .5) * span(p, .9, 1.9) * W * .06, burst);
    let py = mix(H * .46, y * H + H * .05 * (1 - span(p, .2, .9)) + bob, burst);
    const angle = i * 2.4 + gather * 2.2, radius = (1 - span(p, 2.26, 2.5)) * size * (.5 + (i % 3) * .45);
    px = mix(px, W / 2 + Math.cos(angle) * radius, gather);
    py = mix(py, H * .46 + Math.sin(angle) * radius, gather);
    return [px, py, depth];
  });

  // Every tile reaches for the cell its answer is cited from.
  TILES.forEach((_, i) => {
    for (let k = 0; k < 2; k++) {
      const grown = span(p, .84 + i * .022 + k * .16, 1.1 + i * .022 + k * .16);
      if (!grown || !beamsOut) continue;
      const u = (noise(i * 3 + k * 17) - .5) * 2.1, d = .8 + noise(i + k * 31 + 5) * 1.2;
      const [ex, ey] = ground(Math.round(u * 4) / 4 + .125, d), [sx, sy] = at[i];
      const bend = span(p, 1.35, 1.85), cx = mix((sx + ex) / 2, sx + (sx - W / 2) * .28, bend), cy = mix((sy + ey) / 2, sy + (ey - sy) * .18, bend);
      ctx.beginPath(); ctx.moveTo(sx, sy);
      for (let s = 1; s <= 24; s++) {
        const t = s / 24 * grown, r = 1 - t;
        ctx.lineTo(r * r * sx + 2 * r * t * cx + t * t * ex, r * r * sy + 2 * r * t * cy + t * t * ey);
      }
      ctx.strokeStyle = `rgba(255,255,255,${(k ? .3 : .62) * beamsOut})`; ctx.lineWidth = 1; ctx.stroke();
      if (grown > .9) {
        const lit = k === 0 && i % 3 !== 1 ? mix(.22, .72, span(p, 1.36 + i * .02, 1.6 + i * .02)) : .18;
        cell(Math.round(u * 4) / 4 + .125, d, lit * (innerWidth < 1024 ? .38 : 1) * beamsOut * (grown - .9) * 10);
      }
    }
  });

  if (gather > .05) {                              // sparks while the tiles pack together
    const a = Math.sin(clamp((p - 1.92) / .62) * Math.PI);
    for (let i = 0; i < 64; i++) {
      const angle = noise(i) * Math.PI * 2, r0 = size * (1 + noise(i + 7) * 2.4) * gather;
      ctx.beginPath();
      ctx.moveTo(W / 2 + Math.cos(angle) * r0, H * .46 + Math.sin(angle) * r0);
      ctx.lineTo(W / 2 + Math.cos(angle) * (r0 + 14 * noise(i + 3)), H * .46 + Math.sin(angle) * (r0 + 14 * noise(i + 3)));
      ctx.strokeStyle = `rgba(255,255,255,${a * .6 * noise(i + 11)})`; ctx.stroke();
    }
  }

  const gone = 1 - span(p, 2.3, 2.5), breathe = mix(1, .86, gather);
  TILES.forEach(([key], i) => tile(key, at[i][0], at[i][1], size * at[i][2] * burst * breathe * gone, burst * gone));

  // The mark opens the scene, then comes back as the box that folds ZIKRU around its corner.
  const opening = 1 - span(intro, .75, 1.35), closing = span(p, 2.32, 2.45);
  const show = closing || opening * (1 - span(p, .2, .6));
  mark.style.opacity = show;
  mark.style.transform = `translate(-50%,-50%) scale(${closing ? mix(.9, 1.18, span(p, 2.7, 3.1)) : mix(.2, .58, opening)})`;
  mark.style.filter = `drop-shadow(0 0 ${closing ? 6 + 12 * span(p, 2.8, 3.2) : 16}px rgba(255,255,255,.4))`;
  const t = closing ? Math.round(clamp((p - 2.32) / .56) * 4.5 * 120) / 120 : 4.5, stamp = String(t);
  if (show && stamp !== lastFrame) { mark.innerHTML = window.zikruBox.frame(t, 'stage'); lastFrame = stamp; }
}

const born = performance.now();
function tick(now) {
  raf = 0;
  const raw = last ? (now - last) / 1000 : .016, dt = Math.min(.05, raw);
  last = now;
  if (reduced.matches) { p = target; intro = 3; }
  else {
    p += (target - p) * (1 - Math.exp(-Math.min(.3, raw) * 7));
    if (Math.abs(target - p) < .0008) p = target;
    intro = target > .3 ? 3 : Math.max(intro, Math.min(3, (now - born) / 1000));   // wall clock, so a throttled tab still gets to the cloud
    if (!paused) clock += dt;
  }
  draw();
  if (visible && !document.hidden && !reduced.matches && (!paused || p !== target || intro < 3)) raf = requestAnimationFrame(tick);
  else last = 0;
}
function wake() { if (!raf && W && visible && !document.hidden) raf = requestAnimationFrame(tick); }
function size() {
  const box = root.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  W = box.width; H = box.height;
  if (!W || !H) return;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw(); wake();
}

toggle.addEventListener('click', () => {
  paused = !paused;
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.setAttribute('aria-label', paused ? '움직임 재생' : '움직임 일시정지');
  wake();
});
new ResizeObserver(size).observe(root);
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); }).observe(root);
document.addEventListener('visibilitychange', wake);
reduced.addEventListener('change', wake);
document.fonts.ready.then(wake);
document.addEventListener('zikru-stage', event => { target = event.detail; wake(); });
})();
