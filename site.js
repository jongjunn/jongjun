(() => {
'use strict';
const $ = (s, root = document) => root.querySelector(s), $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)'), wide = matchMedia('(min-width:900px)');

// Header: menu, looping logo, colour of whatever is underneath it
const header = $('.site-header'), menu = $('.menu-toggle');
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

const dark = $$('[data-dark]'), toc = $$('.toc a'), parts = toc.map(a => document.getElementById(a.hash.slice(1)));
function update() {
  const line = header.offsetHeight + 1;
  header.classList.toggle('on-dark', dark.some(el => {
    const box = el.getBoundingClientRect();
    return box.top <= line && box.bottom > line;
  }));
  if (toc.length) {
    let now = 0;
    parts.forEach((el, i) => { if (el.getBoundingClientRect().top <= 140) now = i; });
    toc.forEach((a, i) => i === now ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
  }
}
addEventListener('scroll', update, {passive: true});
addEventListener('resize', update);
update();

// Diagnosis request: copy the text, open Instagram
$$('[data-diag]').forEach(form => {
  const input = $('input', form), message = $('.diag-msg', form.parentElement);
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
    const text = `무료 진단 신청합니다.\n가게 이름 또는 주소: ${value}`;
    const done = ok => { message.textContent = ok ? '신청 문구를 복사했습니다. 인스타그램 DM에 붙여넣어 보내주세요.' : '복사되지 않았습니다. 이 문구를 DM으로 보내주세요: ' + text.replaceAll('\n', ' '); };
    (navigator.clipboard ? navigator.clipboard.writeText(text).then(() => done(true), () => done(false)) : Promise.resolve(done(false)));
    window.open(form.action, '_blank', 'noopener');
  });
});
})();
