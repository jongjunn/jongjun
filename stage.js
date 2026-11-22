// The pinned stage beside the talk: the ZIKRU box cut into storeys of type.
// They twist, get read, get corrected, agree, and close into the confirmed logo.
// One number drives it: p (0-4), from where the talk is. Spec: research/site_spec_v15_motion.md
(() => {
'use strict';
const clamp = x => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a + (b - a) * t;
const span = (x, a, b) => { const t = clamp((x - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
const rad = n => n * Math.PI / 180;
const SCENE_AT = [0, 1.38, 2.12, 2.95, 4];        // where the box is when each question reaches the reading line

// The box's band, left to right: left 216, front 466, right 216, back 466.
const SIZE = [216, 466, 216, 466], START = [0, 216, 682, 898], H = 280, ROUND = 1364;
const CORNER = [[-233, -108], [-233, 108], [233, 108], [233, -108]];
const NORMAL = [[-1, 0, 0], [0, 0, 1], [1, 0, 0], [0, 0, -1]];
const EDGE = [[0, 1], [1, 2], [2, 3], [3, 0]];
const LIGHT = [.25, .7, .67];                      // a fixed key light, up and to the right of the camera
const ORBIT = 296, INTRO = 2.9;

const NAME = 'name', SAME = ['예시카페', '10:00–19:00'];
const CORRECT = ['플레이스', '10:00–19:00'];
const SAID = [                                    // top to bottom: where it is written, and what it says
  ['블로그', '건물 뒤 주차 2대'], ['메뉴판', '아메리카노 4,500원'], ['인스타그램', '예시카페'],
  ['홈페이지', '10:00–19:00'], ['플레이스', '11:00–19:00'], ['지도', '10:00–19:00'],
  ['주소', '예시로 12'], ['예약', '전화·온라인 예약'], ['안내', '주차 가능'], ['소개', '예시동 동네 카페']
];
const SHORT = [SAID[0], SAID[3], SAID[4], SAID[5], SAID[6], SAID[1]];

// Orthographic, the same projection as the logo, so a transform per face is exact.
function camera([yaw, pitch, roll]) {
  const cy = Math.cos(rad(yaw)), sy = Math.sin(rad(yaw)), cp = Math.cos(rad(pitch)), sp = Math.sin(rad(pitch)), cr = Math.cos(rad(roll)), sr = Math.sin(rad(roll));
  return ([x, y, z]) => {
    const a = x * cy + z * sy, c = -x * sy + z * cy, b = y * cp + c * sp;
    return [a * cr - b * sr, a * sr + b * cr, -y * sp + c * cp];
  };
}

// Everything on screen is a number here, so any frame can be drawn, blended and checked by itself.
function state(p, time, width, height, END) {
  const short = height < 400, said = short ? SHORT : SAID, n = said.length, odd = short ? 2 : 4;
  const air = short ? 9 : 8, room = (height * 648 / width - 146) / .964;
  // An upright stage gets taller storeys instead of empty black.
  const tallH = short ? 66 : Math.max(58, Math.min(80, (room + air) / n - air)), pitch0 = tallH + air, total = n * pitch0 - air;

  const reading = span(p, .3, 1.2), engage = span(p, .08, .4), descent = span(p, .4, 1.36);
  const focus = span(p, 1.36, 1.64) * (1 - span(p, 2.04, 2.32)), fixed = span(p, 1.76, 1.98);
  const close = span(p, 2.78, 3.82), seal = span(p, 2.36, 3.2), wire = span(p, 3.74, 3.98);

  const sweep = Math.cos(time * .62) * (total / 2 - 36);
  const scanned = mix(total / 2 - 36, -total / 2 + (short ? 18 : 4), descent);
  const scanY = mix(sweep, scanned, engage);

  const rows = said.map((own, i) => {
    const order = i * 9 / (n - 1), near = Math.abs(i - odd) <= 1, y0 = total / 2 - tallH / 2 - i * pitch0;
    const agree = span(p, 2.14 + order * .03, 2.56 + order * .03);
    const named = span(p, 2.94 + order * .018, 3.6 + order * .018);
    const passed = engage * span((y0 + tallH / 2 - scanned) / pitch0, .1, short ? .62 : .8);
    const glance = (1 - engage) * span(1.45 - Math.abs(y0 - sweep) / pitch0, 0, 1);

    const loose = 23 * Math.sin(order * .9 + .4 + time * .28) * (1 - .45 * reading) * (1 - .6 * span(p, 1.8, 2.2));
    const held = i === odd ? 15 * (1 - fixed) : 0;
    const lit = mix(Math.max(passed, glance), near ? (i === odd ? fixed : 1) : 0, focus) * (1 - span(p, 2.82 + order * .025, 3.06 + order * .025));
    return {
      seq: i === odd ? [own, CORRECT, SAME, NAME] : [own, SAME, NAME],
      band: (i === odd ? fixed : 0) + agree + named,
      h: mix(mix(tallH, near ? 108 : 34, focus), H / n, span(p, 2.96, 3.8)),
      gap: mix(mix(air, near ? 34 : 64, focus), 0, seal),
      turn: mix(mix(loose, held, focus), 0, agree),
      slide: (20 * Math.sin(time * .36 + i * 1.7) + (i % 3 - 1) * 14) * (1 - span(p, .3, .9)),
      light: lit,
      dim: near ? 1 : mix(1, .32, focus),
      swing: Math.sin(order * .8 + .5) * (1 - close) * (1 - focus)
    };
  });

  const fitTower = Math.min(width / 648, height / (total * .964 + 146));
  const fitFocus = Math.min(width / 530, height / 540);
  const fitLogo = Math.min(width * .86 / 524, height * .8 / 390);
  const column = rows.reduce((sum, row, i) => sum + row.h + (i ? Math.max(rows[i - 1].gap, row.gap) : 0), 0);
  let scale = mix(mix(fitTower, fitFocus * mix(.95, 1, span(p, 1.4, 2.12)), focus), fitLogo, close);
  if (p > 2.32) scale = Math.min(scale, height / (column * .964 + 146));       // closing, it never outgrows the stage
  return {
    yaw: mix(mix(mix(mix(34 + 4 * Math.sin(time * .17), 40, reading), 27, span(p, 2.2, 2.9)), mix(20, 28, span(p, 1.4, 2.12)), focus), END[0], close),
    pitch: mix(mix(-17, -11, focus), END[1], close),
    roll: END[2] * close,
    scale,
    focus, wire, odd, rows,
    scanY, orbit: time * .32 + p * 2.2, ring: 1 - span(p, 1.3, 1.54)
  };
}

// On arrival the logo is whole. Its storeys turn away one after another and the name leaves round the corner.
function arrive(to, from, t) {
  if (t >= INTRO) return to;
  const move = span(t, .7, 2.2), out = {...to};
  for (const key of ['yaw', 'pitch', 'roll', 'scale', 'focus']) out[key] = mix(from[key], to[key], move);
  out.wire = mix(1, to.wire, span(t, .66, 1.06));
  out.ring = to.ring * span(t, 1.8, INTRO);
  out.rows = to.rows.map((row, i) => {
    const order = i * 9 / (to.rows.length - 1), e = span(t, .82 + order * .045, 2.02 + order * .045), next = {...row};
    for (const key of ['h', 'gap', 'turn', 'slide', 'light', 'dim', 'swing']) next[key] = mix(from.rows[i][key], row[key], e);
    if (e < 1) { next.seq = [NAME, row.seq[Math.round(row.band)]]; next.band = e; }
    return next;
  });
  return out;
}

// Storeys stack from the sum of their heights, so they can never run through each other.
function stack(scene) {
  const {rows, focus, odd} = scene;
  let y = 0;
  const middle = rows.map((row, i) => {
    if (i) y -= rows[i - 1].h / 2 + row.h / 2 + Math.max(rows[i - 1].gap, row.gap);
    return y;
  });
  const whole = (middle[0] + rows[0].h / 2 + middle[middle.length - 1] - rows[rows.length - 1].h / 2) / 2;
  const centre = mix(whole, middle[odd], focus);
  return middle.map(m => m - centre);
}

if (typeof document === 'undefined') {
  if (typeof module !== 'undefined') module.exports = {state, arrive, stack, camera, H, INTRO};
  return;
}
const root = document.querySelector('[data-stage]');
if (!root || !window.zikruBox) return;

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pin = root.parentElement, column = pin.parentElement, grid = column.parentElement;
const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d'), toggle = root.querySelector('.stage-toggle');
const turns = [...document.querySelectorAll('.turn')];
const chapters = [...pin.querySelectorAll('.stage-nav a')], fills = chapters.map(a => a.querySelector('b'));
const {GLYPHS, END} = window.zikruBox;
const glyphs = GLYPHS.map(([d, x]) => [new Path2D(d), x]);
const FONT = '"Wanted Sans Variable","Apple SD Gothic Neo","Malgun Gothic",sans-serif';

const READER = ['openai', 'googlegemini', 'perplexity', 'claude'];
const images = [], defs = document.querySelector('.logo-symbols defs').innerHTML;
READER.forEach((key, i) => {
  const image = new Image();
  image.onload = () => {                          // rasterised once, not once a frame
    const tile = document.createElement('canvas');
    tile.width = tile.height = 192;
    tile.getContext('2d').drawImage(image, 0, 0, 192, 192);
    images[i] = tile; wake();
  };
  // Safari rasterises an SVG at its own size, so each logo is given a large one.
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 48 48"><defs>${defs}</defs><use href="#ai-${key}" width="48" height="48"/></svg>`);
});

const widths = new Map();
function widthAt100(value, weight) {
  const key = weight + value;
  if (!widths.has(key)) { ctx.font = `${weight} 100px ${FONT}`; widths.set(key, ctx.measureText(value).width); }
  return widths.get(key);
}

const grey = v => { const n = Math.round(255 * clamp(v)); return `rgb(${n},${n},${n})`; };
const facing = n => Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);

// What is written on one storey, seen through one face. x is how far the writing sits from that face's left edge.
function print(content, x, w, row, i, count, lit) {
  if (content === NAME) {
    const slice = H / count, k = row.h / slice;
    ctx.fillStyle = lit ? '#000' : '#fff';
    for (const [path, x0] of glyphs) {
      const at = x + 22.5 + x0 * 2.25;
      if (at >= w || at + 122 <= 0) continue;
      ctx.save(); ctx.translate(at, (12 - i * slice) * k); ctx.scale(2.25, 4 * k); ctx.fill(path, 'evenodd'); ctx.restore();
    }
    return;
  }
  for (const turn of [-ROUND, 0, ROUND]) for (let j = 0; j < 4; j++) {
    const at = x + row.slide + START[j] + turn;
    if (at >= w || at + SIZE[j] <= 0) continue;
    const label = j % 2 === 0, quiet = label && content !== SAME, value = content[label ? 0 : 1], weight = quiet ? 600 : 700;
    const size = Math.min(row.h * (label ? .48 : .62), (SIZE[j] - 40) * 100 / widthAt100(value, weight));
    ctx.fillStyle = lit ? (quiet ? '#2b2b2b' : '#000') : (quiet ? '#bdbdbd' : '#fff');
    ctx.save(); ctx.translate(at + 22, row.h * .53); ctx.scale(size / 100, size / 100);
    ctx.font = `${weight} 100px ${FONT}`;          // one size, scaled: a new font size every frame is slow
    ctx.fillText(value, 0, 0); ctx.restore();
  }
}

function face(row, i, k, count, matrix, shade, body) {
  const w = SIZE[k], start = START[k], lit = row.light < .01 ? 0 : Math.max(0, Math.min(w, row.light * ROUND - start));
  const at = Math.min(row.seq.length - 1, Math.floor(row.band)), moved = row.band - at, seam = (1 - moved) * ROUND;
  ctx.save();
  ctx.transform(...matrix);
  for (const [from, till, white] of [[lit, w, false], [0, lit, true]]) {       // light goes round the box; it never cross-fades
    if (till - from < .01) continue;
    ctx.save();
    ctx.beginPath(); ctx.rect(from, 0, till - from, row.h); ctx.clip();
    if (body) {
      const v = white ? .64 + .72 * shade : (.025 + .17 * shade) * row.dim, fall = ctx.createLinearGradient(0, 0, w, row.h);
      fall.addColorStop(0, grey(v)); fall.addColorStop(1, grey(v * .86));
      ctx.globalAlpha = body; ctx.fillStyle = fall; ctx.fillRect(from, 0, till - from, row.h);
    }
    ctx.globalAlpha = white ? 1 : row.dim;
    ctx.textBaseline = 'middle';
    // Old words leave and new ones follow along the band, the way the name travels in the logo.
    const parts = [[0, seam, at, -moved * ROUND]];
    if (moved > 0) parts.push([seam, ROUND, at + 1, seam]);
    for (const [a, b, n, offset] of parts) {
      const left = Math.max(0, a - start), right = Math.min(w, b - start);
      if (right - left < .01 || !row.seq[n]) continue;
      ctx.save();
      if (moved > 0) { ctx.beginPath(); ctx.rect(left, 0, right - left, row.h); ctx.clip(); }
      print(row.seq[n], offset - start, w, row, i, count, white);
      ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();
}

let W = 0, VH = 0, dpr = 1, area = [0, 0, 1, 1], marks = [], end = 1, active = -1;
let p = 0, speed = 0, swing = 0, target = 0, time = 0, intro = 0, last = 0, raf = 0, paused = still, seen = true;

function draw() {
  if (!W) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, VH);
  const [left, top, width, height] = area, logo = state(4, 0, width, height, END);
  const scene = still ? logo : arrive(state(p, time, width, height, END), logo, intro);
  const {scale, wire} = scene, view = camera([scene.yaw, scene.pitch, scene.roll]);
  const cx = left + width / 2, cy = top + height / 2;
  const screen = point => { const [x, y, z] = view(point); return [cx + x * scale, cy - y * scale, z]; };

  let rows = scene.rows, middle = stack(scene);
  const roof = middle[0] + rows[0].h / 2, floor = middle[rows.length - 1] - rows[rows.length - 1].h / 2;
  if (wire === 1) { rows = [{...rows[0], h: H}]; middle = [0]; }           // whole again, so no seams in the name
  const path = points => {
    ctx.beginPath();
    points.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  };

  if (wire) {
    const upper = CORNER.map(([x, z]) => screen([x, roof, z])), lower = CORNER.map(([x, z]) => screen([x, floor, z]));
    ctx.globalAlpha = wire; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.lineJoin = ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [a, b] of EDGE) {
      ctx.moveTo(upper[a][0], upper[a][1]); ctx.lineTo(upper[b][0], upper[b][1]);
      ctx.moveTo(lower[a][0], lower[a][1]); ctx.lineTo(lower[b][0], lower[b][1]);
      ctx.moveTo(upper[a][0], upper[a][1]); ctx.lineTo(lower[a][0], lower[a][1]);
    }
    ctx.stroke();
  }

  // The readers' orbit: half of it passes behind the storeys, half in front.
  const radius = ORBIT + 70 * (1 - scene.ring), round = a => [Math.sin(a) * radius, scene.scanY, Math.cos(a) * radius];
  function orbit(front) {
    if (scene.ring <= .001) return;
    const alpha = scene.ring;
    ctx.lineWidth = 1.2; ctx.lineCap = 'butt'; ctx.strokeStyle = '#fff';
    const line = (from, till, steps, strength) => {
      let was = screen(round(from));
      for (let j = 1; j <= steps; j++) {
        const now = screen(round(mix(from, till, j / steps)));
        if ((was[2] + now[2] >= 0) === front) {
          ctx.globalAlpha = alpha * strength(j / steps);
          ctx.beginPath(); ctx.moveTo(was[0], was[1]); ctx.lineTo(now[0], now[1]); ctx.stroke();
        }
        was = now;
      }
    };
    line(0, Math.PI * 2, 72, () => .2);
    READER.forEach((_, j) => line(scene.orbit + j * Math.PI / 2 - .85, scene.orbit + j * Math.PI / 2, 14, t => .8 * t * t));
    READER.forEach((_, j) => {
      const [x, y, z] = screen(round(scene.orbit + j * Math.PI / 2));
      if ((z >= 0) !== front || !images[j]) return;
      const size = 46 * scale * (1 + .12 * z / radius);
      ctx.globalAlpha = alpha; ctx.drawImage(images[j], x - size / 2, y - size / 2, size, size);
    });
  }

  const body = 1 - wire;
  let behind = false;
  for (let i = rows.length - 1; i >= 0; i--) {                              // the camera looks down, so upper storeys cover lower ones
    const row = rows[i], high = middle[i] + row.h / 2, low = middle[i] - row.h / 2;
    if (!behind && high >= scene.scanY) { orbit(false); behind = true; }
    const angle = rad(row.turn + swing * row.swing), c = Math.cos(angle), s = Math.sin(angle);
    const rotate = ([x, y, z]) => [x * c + z * s, y, -x * s + z * c];
    const upper = CORNER.map(([x, z]) => screen(rotate([x, high, z]))), lower = CORNER.map(([x, z]) => screen(rotate([x, low, z])));
    const ys = [...upper, ...lower].map(q => q[1]);
    if (Math.max(...ys) < 0 || Math.min(...ys) > VH) continue;

    if (body) {
      const n = view([0, 1, 0]);
      path(upper);
      ctx.globalAlpha = body;
      ctx.fillStyle = grey(mix((.03 + .13 * facing(n)) * row.dim, .5 + .5 * facing(n), row.light));
      ctx.fill();
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = .8; ctx.lineJoin = 'round'; ctx.stroke();   // closes the hairline crack to the faces
      if (i && row.gap > .1 && scene.focus < 1) {                     // the storey above throws a matte shadow on this roof
        ctx.save(); ctx.clip();
        const over = rows[i - 1], a = rad(over.turn + swing * over.swing), drop = middle[i - 1] - over.h / 2 - high + 4;
        path(CORNER.map(([x, z]) => screen([x * Math.cos(a) + z * Math.sin(a) - drop * .36, high, -x * Math.sin(a) + z * Math.cos(a) + drop * .5])));
        ctx.fillStyle = '#000'; ctx.globalAlpha = .36 * body * (1 - scene.focus); ctx.fill();
        ctx.restore();
      }
    }
    for (let k = 0; k < 4; k++) {
      const normal = view(rotate(NORMAL[k]));
      if (normal[2] <= .0001) continue;
      const [a, b] = EDGE[k], o = upper[a], u = upper[b], v = lower[a], w = SIZE[k];
      face(row, i, k, rows.length, [(u[0] - o[0]) / w, (u[1] - o[1]) / w, (v[0] - o[0]) / row.h, (v[1] - o[1]) / row.h, o[0], o[1]], facing(normal), body);
      if (body && row.light < 1) {                 // a hairline keeps an unlit storey off the black
        path([o, u, lower[b], v]);
        ctx.globalAlpha = .3 * body * row.dim * (1 - row.light); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }
  }
  if (!behind) orbit(false);
  orbit(true);
  if (scene.focus) {                               // storeys that step aside leave into the black, clear of the note
    const foot = VH - top - height, soft = span(scene.focus, .4, .95);
    const fade = (from, till, alpha) => {
      if (alpha <= 0) return;
      const g = ctx.createLinearGradient(0, from, 0, till);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000');
      ctx.globalAlpha = alpha; ctx.fillStyle = g;
      if (till < from) ctx.fillRect(0, 0, W, from); else ctx.fillRect(0, from, W, VH - from);
    };
    ctx.globalCompositeOperation = 'destination-out';
    fade(top + 22, 0, soft);
    fade(VH - foot - 24, VH - foot + 10, soft);
    fade(VH - foot - 4, VH - foot + 8, clamp(scene.focus * 30));
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;
}

function tick(now) {
  raf = 0;
  const gap = last ? Math.min(.1, (now - last) / 1000) : 1 / 60;
  last = now;
  if (paused) {
    p = target; speed = swing = 0; intro = INTRO;
  } else {
    time += gap;
    if (intro < INTRO) intro = Math.min(INTRO, intro + gap * (target > .05 ? 3 : 1));
    // Critically damped: weight and follow-through, no bounce, whatever the frame rate.
    const away = p - target, pull = (speed + 11 * away) * gap, decay = Math.exp(-11 * gap);
    p = target + (away + pull) * decay;
    speed = (speed - 11 * pull) * decay;
    if (Math.abs(p - target) < .0004 && Math.abs(speed) < .004) { p = target; speed = 0; }
    swing += (Math.max(-9, Math.min(9, speed * 7)) - swing) * (1 - Math.exp(-gap * 5));
    if (Math.abs(swing) < .01) swing = 0;
  }
  draw();
  const alive = !paused && (intro < INTRO || p !== target || swing || p < 3.98);
  if (seen && alive) raf = requestAnimationFrame(tick);
  else last = 0;                                   // nothing runs off screen, when paused, or once the logo has landed
}
function wake() { if (!raf && W && !still && seen) raf = requestAnimationFrame(tick); }

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
  const first = !W;
  dpr = Math.min(2, devicePixelRatio || 1);
  W = root.clientWidth; VH = root.clientHeight;
  if (!W || !VH) return;
  canvas.width = W * dpr; canvas.height = VH * dpr;
  const foot = VH < 400 ? 28 : 44;
  area = [10, 14, W - 20, VH - 14 - foot];
  place(); follow();
  if (first && target > .05) { p = target; intro = INTRO; }                // arriving part way down the page
  draw(); wake();
}

// A chapter's link lands where that chapter is on screen, not where its words happen to start.
chapters.forEach((link, i) => link.addEventListener('click', event => {
  if (!marks.length) return;
  event.preventDefault();
  scrollTo({top: i === 4 ? (marks[4] + end) / 2 : i ? marks[i] + 4 : 0, behavior: still ? 'auto' : 'smooth'});
}));
if (toggle && !still) {
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.classList.toggle('is-paused', paused);
    toggle.setAttribute('aria-label', paused ? '움직임 재생' : '움직임 멈춤');
    last = 0; wake();
  });
}
new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; last = 0; wake(); }).observe(root);
document.addEventListener('visibilitychange', () => { last = 0; });
new ResizeObserver(measure).observe(root);
new ResizeObserver(() => { place(); follow(); }).observe(grid);
addEventListener('scroll', follow, {passive: true});
addEventListener('resize', () => { place(); follow(); });
const relettered = () => { widths.clear(); draw(); };
const letters = [...SAID, SAME, CORRECT].flat().join(' ');
if (document.fonts) {
  Promise.all([600, 700].map(weight => document.fonts.load(`${weight} 20px ${FONT}`, letters))).then(relettered, () => {});
  document.fonts.addEventListener('loadingdone', relettered);
}
})();
