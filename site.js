(() => {
'use strict';
const $ = (s, root = document) => root.querySelector(s), $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)'), wide = matchMedia('(min-width:1024px)');

// Header: theme, menu, looping logo
const header = $('.site-header'), theme = $('.theme-toggle'), menu = $('.menu-toggle'), page = document.documentElement;
function setTheme(dark) {
  page.dataset.theme = dark ? 'dark' : 'light';
  theme.setAttribute('aria-pressed', String(dark));
}
setTheme(page.dataset.theme === 'dark');
theme.addEventListener('click', () => {
  const dark = page.dataset.theme !== 'dark';
  setTheme(dark);
  try { localStorage.setItem('zikru-theme', dark ? 'dark' : 'light'); } catch { /* private window */ }
});
function setMenu(open) {
  header.classList.toggle('menu-open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  document.body.style.overflow = open ? 'hidden' : '';
}
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
$$('a', header).forEach(a => a.addEventListener('click', () => setMenu(false)));
header.addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); menu.focus(); } });
wide.addEventListener('change', e => { if (e.matches) setMenu(false); });

const video = $('.header-video');
if (video) {
  const still = video.previousElementSibling;
  const fallback = () => { video.pause(); video.hidden = true; still.hidden = false; };
  video.addEventListener('playing', () => { video.hidden = false; still.hidden = true; });
  video.addEventListener('error', fallback);
  const sync = () => {
    if (reduced.matches || document.hidden) return fallback();
    $$('source', video).forEach(s => { if (!s.src) { s.src = s.dataset.src; video.load(); } });
    video.muted = true;
    video.play().catch(fallback);
  };
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}

// Scroll: stage progress, rail, back to top, article contents
const turns = $$('.turn'), fills = $$('.stage-nav i b'), chapters = $$('.stage-nav a'), stage = $('[data-stage]');
const rail = $$('.rail a'), railTo = rail.map(a => $(a.hash)), toTop = $('.to-top');
const toc = $$('.toc a'), tocTo = toc.map(a => document.getElementById(decodeURIComponent(a.hash.slice(1))));
let queued = false, sent = -1;
function current(targets, line) {
  let index = 0;
  targets.forEach((el, i) => { if (el.getBoundingClientRect().top <= line) index = i; });
  return index;
}
function mark(links, index) {
  links.forEach((a, i) => i === index ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
}
function update() {
  queued = false;
  if (turns.length) {
    const tops = turns.map(el => el.getBoundingClientRect().top);
    let p = 0;
    tops.forEach((top, i) => {
      const next = i + 1 < tops.length ? tops[i + 1] : top + 100;
      const part = Math.max(0, Math.min(1, (102 - top) / (next - top)));
      fills[i].style.width = part * 100 + '%';
      p += part;
    });
    mark(chapters, Math.min(4, Math.floor(p + .001)));
    // On a phone the stage is the first screen, so leaving it plays the first chapters.
    if (!wide.matches) p = Math.max(0, Math.min(1, scrollY / stage.offsetHeight)) * 3.6;
    if (Math.abs(p - sent) > .0005) { sent = p; document.dispatchEvent(new CustomEvent('zikru-stage', {detail: p})); }
  }
  if (rail.length) mark(rail, current(railTo, innerHeight * .42));
  if (toc.length) mark(toc, current(tocTo, 140));
  toTop.hidden = scrollY < innerHeight * 1.6;
}
const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
addEventListener('scroll', queue, {passive: true});
addEventListener('resize', queue);
document.fonts.ready.then(queue);
update();
toTop.addEventListener('click', () => scrollTo({top: 0, behavior: reduced.matches ? 'auto' : 'smooth'}));

// Questions type themselves the first time they are seen. The words stay in the DOM for readers and crawlers.
if (!reduced.matches) {
  const seen = new IntersectionObserver(entries => entries.forEach(({target, isIntersecting}) => {
    if (!isIntersecting) return;
    seen.unobserve(target);
    target.classList.add('is-typed');
  }), {rootMargin: '0px 0px -8% 0px'});
  $$('[data-type]').forEach(el => {
    const text = el.textContent.trim(), copy = document.createElement('span'), show = document.createElement('span');
    copy.className = 'sr'; copy.textContent = text; show.setAttribute('aria-hidden', 'true');
    let n = 0;
    text.split(' ').forEach((word, i) => {
      if (i) { show.append(' '); n++; }
      const box = document.createElement('span');
      box.className = 'word';
      for (const ch of word) {
        const s = document.createElement('span');
        s.className = 'ch'; s.textContent = ch; s.style.animationDelay = n++ * 32 + 'ms';
        box.append(s);
      }
      show.append(box);
    });
    el.replaceChildren(copy, show);
    seen.observe(el);
  });
}

// Data embedded by the page
const dataTag = $('#page-data'), data = dataTag ? JSON.parse(dataTag.textContent) : null;
if (data) {
  const chips = $$('[data-industry]');
  const pick = chip => {
    const item = data.previews[chip.dataset.industry];
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    const question = $('.answers-question');
    question.textContent = item.question;
    $$('.answer').forEach((card, i) => {
      const status = $('.mention', card), rank = item.ranks[i];
      status.textContent = rank ? `${rank}번째로 언급` : '언급 없음';
      status.classList.toggle('yes', rank > 0);
      $('p', card).innerHTML = item.answers[i];   // fixed copy from this page
    });
  };
  chips.forEach(chip => chip.addEventListener('click', () => pick(chip)));

  const dialog = $('.report'), body = $('tbody', dialog);
  $$('[data-report]').forEach(button => button.addEventListener('click', () => {
    const item = data.reports[Number(button.dataset.report)];
    $('h2', dialog).textContent = item.name + ' 형식 예시';
    body.replaceChildren(...item.questions.map((q, row) => {
      const tr = document.createElement('tr'), th = document.createElement('th');
      th.textContent = q; th.scope = 'row'; tr.append(th);
      for (let col = 0; col < 4; col++) {
        const td = document.createElement('td');
        td.textContent = item.hits[row * 4 + col] === '1' ? '언급' : '없음';
        td.className = item.hits[row * 4 + col] === '1' ? 'yes' : '';
        tr.append(td);
      }
      return tr;
    }));
    dialog.showModal();
  }));
  if (dialog) dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
}

// Research chart and its rows highlight together; the rows can be re-ordered.
const linked = $$('[data-series]');
linked.forEach(el => {
  const set = on => {
    $('.chart').classList.toggle('has-focus', on);
    linked.forEach(x => x.classList.toggle('hot', on && x.dataset.series === el.dataset.series));
  };
  el.addEventListener('pointerenter', () => set(true));
  el.addEventListener('pointerleave', () => set(false));
});
$$('[data-sort]').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.sort, list = $('.study-rows');
  $$('[data-sort]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  $$('li', list).sort((a, b) => b.dataset[key] - a.dataset[key]).forEach(li => list.append(li));
}));

// Question finder
const search = $('#question-search'), groups = $$('[data-group]');
if (search) {
  const filter = () => {
    const group = groups.find(b => b.getAttribute('aria-pressed') === 'true').dataset.group, word = search.value.trim();
    let shown = 0;
    $$('.question-card').forEach(card => {
      card.hidden = !((group === '전체' || card.dataset.in === group) && card.textContent.includes(word));
      if (!card.hidden) shown++;
    });
    $('.no-result').hidden = shown > 0;
  };
  groups.forEach(b => b.addEventListener('click', () => {
    groups.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    filter();
  }));
  search.addEventListener('input', filter);
}

// Long lists start short when scripts run; without scripts everything is open.
$$('[data-more]').forEach(button => {
  const list = document.getElementById(button.getAttribute('aria-controls')), keep = Number(button.dataset.more);
  const label = button.textContent;
  const set = open => {
    [...list.children].forEach((el, i) => { el.hidden = !open && i >= keep; });
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? '접기' : label;
  };
  button.hidden = false;
  set(false);
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
});

// Diagnosis request: copy the text, open Instagram
let wanted = '';
$$('[data-question]').forEach(a => a.addEventListener('click', () => { wanted = a.dataset.question; }));
$$('[data-diag]').forEach(form => {
  const input = $('input', form), message = form.parentElement.querySelector('.diag-msg');
  form.noValidate = true;
  input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); message.textContent = ''; });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) {
      input.setAttribute('aria-invalid', 'true');
      message.textContent = '가게 이름이나 주소를 입력해 주세요.';
      input.focus();
      return;
    }
    const text = `무료 진단 신청합니다.\n가게 이름 또는 주소: ${value}` + (wanted ? `\n궁금한 질문: ${wanted}` : '');
    const done = ok => { message.textContent = ok ? '신청 문구를 복사했습니다. 인스타그램 DM에 붙여넣어 보내주세요.' : '복사되지 않았습니다. 이 문구를 DM으로 보내주세요: ' + text.replaceAll('\n', ' '); };
    (navigator.clipboard ? navigator.clipboard.writeText(text).then(() => done(true), () => done(false)) : Promise.resolve(done(false)));
    window.open('https://www.instagram.com/jongjunn/', '_blank', 'noopener');
  });
});
})();
