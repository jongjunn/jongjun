// The pinned stage beside the talk: papers are read, corrected, lined up, and folded into the ZIKRU box.
// One number drives it: p (0-4), from where the talk is. Spec: research/site_spec_v14.md
(() => {
'use strict';
const root = document.querySelector('[data-stage]');
if (!root || !window.zikruBox) return;

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pin = root.parentElement, column = pin.parentElement, grid = column.parentElement;
const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
const turns = [...document.querySelectorAll('.turn')];
const chapters = [...pin.querySelectorAll('.stage-nav a')], fills = chapters.map(a => a.querySelector('b'));
const {GLYPHS, END} = window.zikruBox;
const clamp = x => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a + (b - a) * t;
const span = (x, a, b) => { const t = clamp((x - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
const rad = n => n * Math.PI / 180;
const FONT = '"Wanted Sans Variable","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
const SCENE_AT = [0, 1.38, 2.12, 2.95, 4];        // where the paper is when each question reaches the reading line

// The box's strip, left to right: left 216, front 466, right 216, back 466.
const SIZE = [216, 466, 216, 466], START = [0, 216, 682, 898], H = 280, ROUND = 1364;
const READ_ORDER = [1, 0, 2, 3], READER = ['claude', 'openai', 'googlegemini', 'perplexity'];
const LOOSE_WIDE = [                               // centre x, y, z, yaw, roll
  [262, 112, 70, -24, -3.5], [-92, 154, 0, 17, 2], [-226, -164, 90, 23, 4.5], [126, -172, -40, -15, -2.5]
];
const LOOSE_TALL = [                               // the column is upright, so the papers stack
  [134, -30, 60, -22, -4], [-12, 292, 0, 13, 2], [-134, -22, 80, 21, 4], [10, -330, -30, -12, -2.5]
];

const images = {}, defs = document.querySelector('.logo-symbols defs').innerHTML;
for (const key of READER) {
  const image = new Image();
  image.onload = () => { images[key] = image; wake(); };
  // Safari rasterises an SVG at its own size, so each logo is given a large one.
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 48 48"><defs>${defs}</defs><use href="#ai-${key}" width="48" height="48"/></svg>`);
}
const glyphs = GLYPHS.map(([d, x]) => [new Path2D(d), x]);

function text(value, x, y, size, weight = 500) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillText(value, x, y);
}

// A fact is printed in black, then turns white on black as far as the reader has got.
function fact(value, x, y, size, read, width) {
  text(value, x, y, size, 700);
  if (read <= x - 8) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(x - 8, y - size * 1.08, Math.min(read, x + width) - x + 8, size * 1.46); ctx.clip();
  ctx.fillRect(0, 0, 466, H);
  ctx.fillStyle = '#fff'; text(value, x, y, size, 700);
  ctx.restore();
}

const rule = (x, y, w, h = 1) => ctx.fillRect(x, y, w, h);
function greek(x, y, widths) {                     // body copy nobody needs to read
  ctx.save(); ctx.fillStyle = '#d6d6d6';
  widths.forEach((w, i) => ctx.fillRect(x, y + i * 14, w, 6));
  ctx.restore();
}

const PAPERS = [
  (read, p) => {                                   // the map listing that says something else
    text('플레이스', 20, 38, 18, 700); rule(20, 54, 176, 2);
    text('예시카페', 20, 98, 27, 700);
    text('영업시간', 20, 144, 16);
    const strike = span(p, 1.56, 1.74), swap = span(p, 1.8, 2.02);
    ctx.save(); ctx.beginPath(); ctx.rect(10, 152, 196, 48); ctx.clip();
    ctx.translate(0, -48 * swap);
    fact('11:00–19:00', 24, 185, 27, read, 168);
    ctx.fillStyle = '#fff'; ctx.fillRect(20, 173, 166 * strike, 4);
    ctx.translate(0, 48); ctx.fillStyle = '#000';
    fact('10:00–19:00', 24, 185, 27, read, 168);
    ctx.restore();
    greek(20, 224, [164, 120]);
  },
  read => {                                        // the shop's own page
    text('홈페이지', 24, 38, 18, 700);
    ctx.save(); ctx.textAlign = 'right'; text('메뉴   예약', 442, 38, 16); ctx.restore();
    rule(24, 54, 418, 2);
    text('예시카페', 24, 116, 50, 700);
    text('영업시간', 24, 173, 18); fact('10:00–19:00', 206, 175, 30, read, 188);
    rule(24, 191, 418);
    text('아메리카노', 24, 229, 18); fact('4,500원', 206, 231, 30, read, 124);
    greek(24, 254, [340]);
  },
  read => {                                        // the map
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 216, 166); ctx.clip();
    ctx.fillStyle = '#ededed'; ctx.fillRect(0, 0, 216, 166);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 13; ctx.beginPath();
    ctx.moveTo(-10, 50); ctx.lineTo(226, 18); ctx.moveTo(-10, 128); ctx.lineTo(226, 96); ctx.moveTo(50, -10); ctx.lineTo(82, 176); ctx.moveTo(150, -10); ctx.lineTo(182, 176);
    ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(118, 112); ctx.bezierCurveTo(78, 66, 100, 40, 118, 40); ctx.bezierCurveTo(136, 40, 158, 66, 118, 112); ctx.fill();
    ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(118, 66, 9, 0, 7); ctx.fill(); ctx.restore();
    text('지도', 20, 202, 18, 700);
    fact('예시로 12', 24, 246, 28, read, 136);
  },
  read => {                                        // a blog post
    text('블로그', 24, 38, 18, 700); rule(24, 54, 418, 2);
    text('주차되는 동네 카페를', 24, 98, 30, 700); text('찾는다면', 24, 136, 30, 700);
    greek(24, 160, [414, 390]);
    fact('건물 뒤에 2대 주차', 32, 232, 27, read, 244);
    greek(24, 254, [300]);
  }
];

const LINED_UP = [                                  // what is left when the papers agree
  () => { text('영업시간', 20, 112, 22); text('10:00', 20, 176, 52, 700); text('– 19:00', 20, 230, 40, 700); },
  () => { text('예시카페', 30, 160, 92, 700); text('아메리카노 4,500원', 34, 220, 30); },
  () => { text('주소', 20, 112, 22); text('예시로', 20, 176, 52, 700); text('12', 20, 230, 52, 700); },
  () => { text('주차', 30, 112, 22); text('건물 뒤 2대', 30, 190, 64, 700); }
];

let W = 0, VH = 0, dpr = 1, area = [0, 0, 1, 1], tall = false, marks = [], end = 1;
let p = 4, target = 0, unfolding = !still, last = 0, raf = 0, active = -1;
const born = performance.now();

// Orthographic, the same projection as the logo, so a transform per face is exact.
function camera([yaw, pitch, roll]) {
  const cy = Math.cos(rad(yaw)), sy = Math.sin(rad(yaw)), cp = Math.cos(rad(pitch)), sp = Math.sin(rad(pitch)), cr = Math.cos(rad(roll)), sr = Math.sin(rad(roll));
  return ([x, y, z]) => {
    const a = x * cy + z * sy, c = -x * sy + z * cy, b = y * cp + c * sp;
    return [a * cr - b * sr, a * sr + b * cr, -y * sp + c * cp];
  };
}

function folded(angle) {                           // four faces hinged in a row; 0 is flat, 90 is the box
  const c = Math.cos(rad(angle)), s = Math.sin(rad(angle)), shift = -233 * (1 - angle / 90);
  const end = [233 + c * 216, 108 - s * 216], turn = [Math.cos(rad(angle * 2)), -Math.sin(rad(angle * 2))];
  return [
    [-233 - c * 108 + shift, 0, 108 - s * 108, -angle, 0],
    [shift, 0, 108, 0, 0],
    [233 + c * 108 + shift, 0, 108 - s * 108, angle, 0],
    [end[0] + turn[0] * 233 + shift, 0, end[1] + turn[1] * 233, angle * 2, 0]
  ];
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, VH);
  const align = span(p, 2.08, 2.72), fold = span(p, 2.8, 3.42), clear = span(p, 3.02, 3.42), band = span(p, 3.4, 3.86);
  const focus = span(p, 1.38, 1.6) * (1 - span(p, 1.98, 2.16)), LOOSE = tall ? LOOSE_TALL : LOOSE_WIDE;
  const [left, top, width, height] = area, fit = tall ? Math.min(width / 548, height / 998) : Math.min(width / 780, height / 720);
  const flat = width * .98 / (ROUND * fit), boxed = Math.min(width * .86 / (524 * fit), height * .8 / (390 * fit));
  const between = (a, b, c) => mix(mix(a, b, align), c, fold);
  const view = camera([between(-6, 0, END[0]), between(7, 0, END[1]), between(0, 0, END[2])]);
  const zoom = tall ? focus : 0;                    // only the upright stage has room to push in
  const scale = fit * between(mix(1, 1.2, zoom), flat, boxed);
  const cx = left + width / 2, cy = top + height / 2 + 118 * zoom * scale;
  const rest = folded(90 * fold);

  const faces = LOOSE.map((loose, i) => {
    const [x, y, z, yaw, roll] = loose.map((v, j) => mix(v, rest[i][j], align));
    const a = Math.cos(rad(yaw)), b = Math.sin(rad(yaw)), c = Math.cos(rad(roll)), d = Math.sin(rad(roll)), w = SIZE[i];
    const U = [c * a, d, -c * b], V = [d * a, -c, -d * b];
    const u = view(U), v = view(V), o = view([x, y, z].map((n, j) => n - U[j] * w / 2 - V[j] * H / 2));
    const matrix = [u[0] * scale, -u[1] * scale, v[0] * scale, -v[1] * scale, cx + o[0] * scale, cy - o[1] * scale];
    return {i, w, matrix, z: view([x, y, z])[2], front: view([b, 0, a])[2] > .0001};
  }).sort((a, b) => a.front - b.front || a.z - b.z);

  for (const {i, w, matrix, front} of faces) {
    const [a, b, c, d, e, f] = matrix;
    const shown = 1 - (i > 1 ? .78 : 0) * focus;
    const outline = () => { ctx.beginPath(); ctx.moveTo(e, f); ctx.lineTo(e + a * w, f + b * w); ctx.lineTo(e + a * w + c * H, f + b * w + d * H); ctx.lineTo(e + c * H, f + d * H); ctx.closePath(); };
    outline();
    ctx.globalAlpha = shown * mix(.25, 1, clear); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.stroke();

    const wipe = clear * H;                        // the paper peels off downwards, so nothing turns grey
    ctx.save();
    ctx.transform(...matrix);
    ctx.globalAlpha = shown;
    if (clear < 1) { ctx.fillStyle = front ? '#fff' : '#3a3a3a'; ctx.fillRect(0, wipe, w, H - wipe); }
    if (!front) { ctx.restore(); continue; }
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, H); ctx.clip();
    const ink = shown;
    ctx.fillStyle = '#000';

    const order = READ_ORDER.indexOf(i), read = span(p, .52 + order * .17, .88 + order * .17), x = read * w;
    const document_ = 1 - span(p, 2.16, 2.44), facts = span(p, 2.38, 2.66);
    if (document_ > 0) {
      ctx.globalAlpha = ink * document_;
      PAPERS[i](x, p);
      if (read > 0 && read < 1) ctx.fillRect(x - 1.5, 0, 3, H);
    }
    if (facts > 0) {                               // one band around the box: facts leave, the name follows
      for (const [from, till, colour] of [[0, wipe, '#fff'], [wipe, H, '#000']]) {
        if (till - from < .01) continue;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, from, w, till - from); ctx.clip();
        ctx.fillStyle = colour; ctx.globalAlpha = ink * facts;
        LINED_UP.forEach((print, j) => {
          const at = START[j] - band * ROUND - START[i];
          if (at >= w || at + SIZE[j] <= 0) return;
          ctx.save(); ctx.translate(at, 0); print(); ctx.restore();
        });
        if (band) for (const [path, x0] of glyphs) {
          ctx.save(); ctx.translate(22.5 + (1 - band) * ROUND + x0 * 2.25 - START[i], 12); ctx.scale(2.25, 4);
          ctx.fill(path, 'evenodd'); ctx.restore();
        }
        ctx.restore();
      }
    }
    ctx.restore();

    const reader = shown * (1 - span(p, 1.3, 1.5)), logo = images[READER[i]];
    if (reader > 0 && logo) { ctx.globalAlpha = reader; ctx.drawImage(logo, mix(8, w - 8, read) - 24, -38, 48, 48); }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

}

// On arrival the logo is whole, then opens out into the papers it is made from.
function opening(seconds) {
  if (seconds < .7) return 4;
  if (seconds < 2.2) return mix(4, 2.08, span(seconds, .7, 2.2));
  return mix(2.08, 0, span(seconds, 2.2, 2.75));
}
function tick(now) {
  raf = 0;
  const gap = last ? Math.min(.5, (now - last) / 1000) : .1, seconds = (now - born) / 1000;
  last = now;
  if (target > .02) unfolding = false;
  if (unfolding) {
    p = opening(seconds);
    if (seconds > 2.75) unfolding = false;
  } else {
    p += (target - p) * (1 - Math.exp(-gap * 9));
    if (Math.abs(target - p) < .001) p = target;
  }
  draw();
  if (unfolding || p !== target) raf = requestAnimationFrame(tick);
  else last = 0;                                             // still until someone scrolls
}
function wake() { if (!raf && W && !still) raf = requestAnimationFrame(tick); }

// Scroll positions where each question reaches the reading line, squeezed in before the stage lets go.
function place() {
  const beside = getComputedStyle(column).display !== 'contents', held = beside ? column : grid;
  const top = parseFloat(getComputedStyle(pin).top) || 0, room = innerHeight - top - pin.offsetHeight;
  const line = beside ? innerHeight * .5 : top + pin.offsetHeight + room * .45;
  const stuck = held.getBoundingClientRect().top + scrollY - top;
  end = Math.max(stuck + 5, held.getBoundingClientRect().bottom + scrollY - pin.offsetHeight - top - 12);
  marks = [0];
  for (let i = 1; i < 4; i++) {
    const at = turns[i].getBoundingClientRect().top + scrollY - line;
    marks.push(Math.max(marks[i - 1] + 1, Math.min(at, end * (.8 - (3 - i) * .18))));
  }
  marks.push(Math.max(marks[3] + 1, end * .965), Math.max(marks[3] + 2, end));
}
function follow() {
  if (!marks.length) return;
  const at = scrollY;
  let now = 0;
  fills.forEach((fill, i) => {
    const part = clamp((at - marks[i]) / (marks[i + 1] - marks[i]));
    fill.style.width = part * 100 + '%';
    if (at >= marks[i]) now = i;
  });
  if (now !== active) {
    active = now;
    chapters.forEach((a, i) => i === now ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
  }
  const next = now >= 4 ? 4 : mix(SCENE_AT[now], SCENE_AT[now + 1], clamp((at - marks[now]) / (marks[now + 1] - marks[now])));
  if (next !== target) { target = next; wake(); }
}
function measure() {
  dpr = Math.min(2, devicePixelRatio || 1);
  W = root.clientWidth; VH = root.clientHeight;
  if (!W || !VH) return;
  canvas.width = W * dpr; canvas.height = VH * dpr;
  tall = VH > W * 1.04;
  area = tall ? [8, 20, W - 16, VH - 54] : [8, 16, W - 16, VH - 42];
  if (still) p = 4;
  place(); follow(); draw(); wake();
}

// A chapter's link lands where that chapter is on screen, not where its words happen to start.
chapters.forEach((link, i) => link.addEventListener('click', event => {
  if (!marks.length) return;
  event.preventDefault();
  scrollTo({top: i === 4 ? (marks[4] + end) / 2 : i ? marks[i] + 4 : 0, behavior: still ? 'auto' : 'smooth'});
}));
new ResizeObserver(measure).observe(root);
new ResizeObserver(() => { place(); follow(); }).observe(grid);
addEventListener('scroll', follow, {passive: true});
addEventListener('resize', () => { place(); follow(); });
document.fonts?.load(`700 20px ${FONT}`, '예시카페 영업시간 플레이스 블로그 주차 주소 10:00').then(() => { draw(); }, () => {});
document.fonts?.addEventListener('loadingdone', () => draw());
})();
