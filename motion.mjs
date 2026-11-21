const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const line = (points, opacity = 1, extra = '') => `<polyline points="${points.map(p => p.join(',')).join(' ')}" fill="none" stroke="#FFFFFF" stroke-opacity="${opacity}" ${extra}/>`;
const text = (x, y, value, size = 16, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="#FFFFFF" ${extra}>${value}</text>`;
const service = (x, y, id, name, size = 16) => `<svg x="${x}" y="${y - size + 2}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="#ai-${id}"/></svg>${text(x + size + 7, y, name, size)}`;
const dot = (x, y, r = 3, filled = true) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${filled ? '#FFFFFF' : '#000000'}" stroke="#FFFFFF"/>`;
const rect = (x, y, w, h, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000000" stroke="#FFFFFF" ${extra}/>`;
function wirebox(x, y, w, h, d) {
  return line([[x, y], [x + d, y - d / 2], [x + w + d, y - d / 2], [x + w, y], [x, y], [x, y + h], [x + w, y + h], [x + w + d, y + h - d / 2], [x + w + d, y - d / 2]], .8)
    + line([[x + w, y], [x + w, y + h]], .8)
    + line([[x + d, y - d / 2], [x + d, y + h - d / 2], [x, y + h]], .24)
    + line([[x + d, y + h - d / 2], [x + w + d, y + h - d / 2]], .24);
}
function travel(points, progress) {
  const distance = clamp(progress) * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(distance));
  return dot(mix(points[index][0], points[index + 1][0], distance - index), mix(points[index][1], points[index + 1][1], distance - index));
}

export const descriptions = [
  'AI와 검색 서비스가 가게 정보를 찾는 과정입니다.',
  '답변이 홈페이지, 플레이스, 블로그 중 어디를 인용했는지 확인합니다.',
  '영업시간과 위치, 가격을 항목별로 적습니다.',
  '매주 같은 질문을 묻고 가게를 언급했는지 기록합니다.'
];

export function scene(index, progress = .78) {
  const p = clamp(progress);
  let art = '';
  const grid = (u, v) => [280 + (u - v) * 28, 218 + (u + v) * 14];
  for (let u = -4; u <= 4; u++) {
    art += line([grid(u, -4), grid(u, 4)], .1) + line([grid(-4, u), grid(4, u)], .1);
    for (let v = -4; v <= 4; v++) {
      const [x, y] = grid(u, v);
      art += `<circle cx="${x}" cy="${y}" r="1" fill="#FFFFFF" opacity=".35"/>`;
    }
  }
  if (index === 0) {
    art += rect(72, 16, 416, 48) + text(280, 46, '우리 동네에서 예약되는 가게는?', 17, 'text-anchor="middle"');
    const fragments = [[24, 116, 'openai', 'ChatGPT', '영업시간'], [386, 116, 'googlegemini', 'Gemini', '예약'], [24, 282, 'perplexity', 'Perplexity', '메뉴'], [386, 282, 'claude', 'Claude', '위치'], [205, 96, 'naver', '네이버', '가격'], [205, 326, 'google', '구글', '연락처']];
    const found = ease((p - .43) / .28);
    fragments.forEach(([x, y, id, name, label], i) => {
      const target = [x + 75, y + 26];
      const points = [[280, 64], [280, 82], target, [280, 246]];
      art += line(points, .18 + found * .16);
      art += travel(points, (p * 1.7 + i / 6) % 1);
      art += rect(x, y, 150, 52, 'stroke-opacity=".5"') + service(x + 12, y + 21, id, name, 14) + text(x + 12, y + 42, label, 13);
    });
    const scan = 40 + ((p * 1.4) % 1) * 480;
    art += line([[scan, 96], [scan, 340]], .48) + line([[scan - 5, 96], [scan + 5, 96]], .8) + line([[scan - 5, 340], [scan + 5, 340]], .8);
    art += rect(218, 211, 124, 72) + wirebox(218, 211, 124, 72, 26);
    art += text(280, 253, found > .5 ? '가게' : '?', 25, 'font-weight="650" text-anchor="middle"');
    art += dot(355, 207, 4, found > .5);
  } else if (index === 1) {
    art += wirebox(106, 40, 328, 64, 24) + text(270, 79, '예시가게를 확인해 보세요. [1]', 18, 'text-anchor="middle"');
    const sources = [[96, '홈페이지', '영업시간 · 메뉴'], [280, '플레이스', '위치 · 예약'], [464, '블로그', '방문 정보']];
    sources.forEach(([x, label, detail], i) => {
      const points = [[270, 104], [270, 164], [x, 164], [x, 246]];
      const length = 142 + Math.abs(x - 270);
      art += line(points, .3);
      art += line(points, 1, `stroke-dasharray="${length}" stroke-dashoffset="${length * (1 - ease((p - i * .13) / .42))}"`);
      if (p > i * .13) art += travel(points, clamp((p - i * .13) / .6));
      art += rect(x - 66, 246, 132, 72) + wirebox(x - 66, 246, 132, 72, 14);
      art += text(x, 273, `[${i + 1}]`, 13, 'text-anchor="middle"') + text(x, 298, label, 18, 'text-anchor="middle"');
      art += text(x, 349, detail, 13, 'text-anchor="middle"');
    });
  } else if (index === 2) {
    art += wirebox(144, 104, 250, 200, 58);
    art += text(288, 70, '가게 정보', 18, 'text-anchor="middle"');
    const t = ease((p - .12) / .6);
    const rows = [['영업시간', '10:00–19:00', 24, 122], ['위치', '예시로 12', 322, 196], ['가격', '메뉴 5,000원', 44, 296]];
    rows.forEach(([label, value, fromX, fromY], i) => {
      const x = mix(fromX, 164, t), y = mix(fromY, 128 + i * 56, t);
      art += line([[fromX, fromY + 22], [164, 150 + i * 56]], .25, 'stroke-dasharray="3 5"');
      art += rect(x, y, 210, 44) + text(x + 12, y + 28, label, 14) + text(x + 198, y + 28, value, 14, 'text-anchor="end"');
    });
  } else {
    art += text(32, 42, '같은 질문을 매주 묻습니다', 21, 'font-weight="550"');
    art += text(528, 41, '언급 여부', 13, 'text-anchor="end"');
    const mentions = [[1, 1, 0, 1], [0, 1, 1, 1], [0, 0, 1, 1], [0, 0, 0, 0]];
    [['openai', 'ChatGPT'], ['googlegemini', 'Gemini'], ['perplexity', 'Perplexity'], ['claude', 'Claude']].forEach(([id, name], row) => {
      const y = 94 + row * 42;
      art += service(32, y + 5, id, name) + line([[32, y + 19], [528, y + 19]], .2);
      for (let week = 0; week < 4; week++) {
        const ready = p >= .08 + week * .2;
        art += dot(230 + week * 88, y, ready && mentions[row][week] ? 5 : 3, ready && Boolean(mentions[row][week]));
      }
    });
    art += text(32, 291, '언급한 AI', 13) + text(32, 315, '/ 4곳', 13);
    for (let week = 0; week < 4; week++) {
      const count = mentions.reduce((sum, row) => sum + row[week], 0);
      const t = ease((p - .08 - week * .2) / .15), x = 212 + week * 88, h = count * 18 * t;
      art += line([[x - 14, 324], [x + 50, 324]], .5);
      if (h > 0) art += `<rect x="${x}" y="${324 - h}" width="36" height="${h}" fill="#FFFFFF"/>`;
      art += text(x + 18, 352, `${week + 1}주`, 14, 'text-anchor="middle"');
      if (t === 1) art += text(x + 18, 314 - h, `${count}`, 14, 'text-anchor="middle"');
    }
    art += text(280, 389, '예시 수치 · 실제 측정 결과가 아닙니다.', 14, 'text-anchor="middle"');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="416" viewBox="0 0 560 416" color="#FFFFFF" fill="none" stroke-width="1" font-family="Pretendard Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif" aria-hidden="true"><rect width="560" height="416" fill="#000000"/>${art}</svg>`;
}

export function mountPanel(panel) {
  const art = panel.querySelector('.motion-art'), tabs = [...panel.querySelectorAll('[role="tab"]')];
  const caption = panel.querySelector('.motion-caption'), toggle = panel.querySelector('.motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, elapsed = 0, last = null, frame = 0, visible = false, paused = false;
  const duration = 6200;
  function paint() {
    art.innerHTML = scene(index, reduced.matches ? .94 : elapsed / duration);
    tabs.forEach((tab, i) => tab.style.setProperty('--progress', i === index ? (reduced.matches ? 1 : elapsed / duration) : 0));
  }
  function select(next) {
    index = next; elapsed = 0;
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    art.setAttribute('aria-labelledby', tabs[index].id);
    caption.textContent = descriptions[index];
    paint();
  }
  function tick(now) {
    if (last !== null) elapsed += Math.min(now - last, 100);
    last = now;
    if (elapsed >= duration) select((index + 1) % 4);
    paint();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = null;
    toggle.disabled = reduced.matches;
    toggle.textContent = reduced.matches ? '정지 화면' : paused ? '재생' : '일시정지';
    toggle.setAttribute('aria-pressed', String(paused));
    if (reduced.matches) paint();
    else if (visible && !document.hidden && !paused) frame = requestAnimationFrame(tick);
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => { select(i); sync(); });
    tab.addEventListener('keydown', event => {
      const next = {ArrowRight: (i + 1) % 4, ArrowLeft: (i + 3) % 4, Home: 0, End: 3}[event.key];
      if (next !== undefined) { event.preventDefault(); tabs[next].focus(); select(next); sync(); }
    });
  });
  toggle.addEventListener('click', () => {
    paused = !paused;
    document.dispatchEvent(new CustomEvent('zikru-motion-pause', {detail: paused}));
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  if ('IntersectionObserver' in globalThis) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; sync();
  }).observe(panel);
  else visible = true;
  select(0); sync();
}

export function mountHeader(video) {
  const still = video.previousElementSibling, reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let loaded = false, failed = false, paused = false;
  const fallback = () => { video.pause(); video.hidden = true; still.hidden = false; };
  function sync() {
    if (reduced.matches || document.hidden || failed) { fallback(); return; }
    if (paused) { video.pause(); return; }
    if (!loaded) {
      loaded = true;
      video.querySelectorAll('source').forEach(source => source.src = source.dataset.src);
      video.load();
    }
    video.muted = true;
    video.play().catch(() => { failed = true; fallback(); });
  }
  video.addEventListener('playing', () => {
    if (reduced.matches || document.hidden || failed) { fallback(); return; }
    video.hidden = false; still.hidden = true;
  });
  video.addEventListener('error', () => { failed = true; fallback(); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('zikru-motion-pause', event => { paused = event.detail; sync(); });
  sync();
}

if (typeof document !== 'undefined') {
  mountHeader(document.querySelector('.header-video'));
  document.querySelectorAll('.motion-panel').forEach(mountPanel);
}
