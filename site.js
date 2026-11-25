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

// Scroll: rail, back to top, article contents. The stage follows the talk by itself in stage.js.
const rail = $$('.rail a'), railTo = rail.map(a => $(a.hash)), toTop = $('.to-top');
const toc = $$('.toc a'), tocTo = toc.map(a => document.getElementById(a.hash.slice(1)));
function mark(links, targets, line) {
  let index = 0;
  targets.forEach((el, i) => { if (el.getBoundingClientRect().top <= line) index = i; });
  links.forEach((a, i) => i === index ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
}
function update() {
  if (rail.length) mark(rail, railTo, innerHeight * .42);
  if (toc.length) mark(toc, tocTo, 140);
  toTop.hidden = scrollY < innerHeight * 1.6;
}
addEventListener('scroll', update, {passive: true});
addEventListener('resize', update);
update();
toTop.addEventListener('click', () => scrollTo({top: 0, behavior: reduced.matches ? 'auto' : 'smooth'}));

// At the end the logo folds once, then the confirmed drawing is put back untouched.
const mark9 = $('svg.closing-logo'), box = window.zikruBox;
if (mark9 && box && !reduced.matches) {
  const finished = mark9.innerHTML;
  const watch = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    watch.disconnect();
    let began = 0;
    const turn = now => {
      began ||= now;
      const t = .9 + (now - began) / 1000 * 1.3;
      mark9.innerHTML = t < box.HOLD ? box.frame(t, 'closing') : finished;
      if (t < box.HOLD) requestAnimationFrame(turn);
    };
    requestAnimationFrame(turn);
  }, {threshold: .6});
  watch.observe(mark9);
}

// Questions type themselves the first time they are seen. The words stay in the DOM for readers and crawlers.
if (!reduced.matches) {
  const seen = new IntersectionObserver(entries => entries.forEach(({target, isIntersecting}) => {
    if (!isIntersecting) return;
    seen.unobserve(target);
    target.classList.add('is-typed');
  }), {rootMargin: '0px 0px -8% 0px'});
  $$('[data-type]').forEach(el => {
    const text = el.textContent.trim(), copy = document.createElement('span'), show = document.createElement('span');
    copy.className = 'sr';
    copy.textContent = text;
    show.setAttribute('aria-hidden', 'true');
    let n = 0;
    text.split(' ').forEach((word, i) => {
      if (i) { show.append(' '); n++; }
      const box = document.createElement('span');
      box.className = 'word';
      for (const ch of word) {
        const letter = document.createElement('span');
        letter.className = 'ch';
        letter.textContent = ch;
        letter.style.animationDelay = n++ * 32 + 'ms';
        box.append(letter);
      }
      show.append(box);
    });
    el.replaceChildren(copy, show);
    seen.observe(el);
  });
}

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
  // A pill in the talk opens the finder on that kind of shop.
  $$('[data-find]').forEach(a => a.addEventListener('click', () => {
    search.value = a.dataset.find;
    groups.forEach((x, i) => x.setAttribute('aria-pressed', String(i === 0)));
    $$('[data-find]').forEach(x => x === a ? x.setAttribute('aria-current', 'true') : x.removeAttribute('aria-current'));
    filter();
  }));
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

// Diagnosis request: the box in the talk hands the shop over, the last form takes the e-mail
let wanted = '';
const picks = $$('[data-question]'), picked = $('.picked span'), intake = $('[data-intake]');
picks.forEach(a => a.addEventListener('click', () => {
  wanted = a.dataset.question;
  picks.forEach(x => x.classList.toggle('is-picked', x === a));
  picked.textContent = `담은 질문: ${wanted}`;
}));
if (intake) {
  const {shop, email, website, consent} = intake.elements, send = $('button', intake), message = $('.diag-msg', intake.parentElement);
  const fail = (input, text) => { input.setAttribute('aria-invalid', 'true'); message.textContent = text; input.focus(); };
  $$('[data-start]').forEach(form => {
    const input = $('input', form), note = $('.diag-msg', form.parentElement);
    $('button', form).disabled = false;
    input.addEventListener('input', () => { note.textContent = ''; input.removeAttribute('aria-invalid'); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!input.value.trim()) {
        note.textContent = '가게 이름이나 주소를 입력해 주세요.';
        input.setAttribute('aria-invalid', 'true');
        return input.focus();
      }
      shop.value = input.value.trim();
      $('#closing').scrollIntoView({behavior: reduced.matches ? 'auto' : 'smooth'});
      email.focus({preventScroll: true});
    });
  });
  send.disabled = false;
  [shop, email, consent].forEach(el => el.addEventListener('input', () => { el.removeAttribute('aria-invalid'); message.textContent = ''; }));
  intake.addEventListener('submit', async e => {
    e.preventDefault();
    if (send.disabled) return;
    if (!shop.value.trim()) return fail(shop, '가게 이름이나 주소를 입력해 주세요.');
    if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email.value.trim())) return fail(email, 'PDF 받을 이메일을 확인해 주세요.');
    if (!consent.checked) return fail(consent, '개인정보 수집·이용에 동의해 주세요.');
    if (!intake.dataset.intake) { message.textContent = '이메일 접수가 아직 연결되지 않아 전송하지 않았습니다.'; return; }
    const token = $('[name="cf-turnstile-response"]', intake)?.value;
    if (!token) { message.textContent = '자동 입력 방지 확인을 마친 뒤 다시 눌러 주세요.'; return; }
    send.disabled = true;
    message.textContent = '보내는 중입니다.';
    try {
      const body = new URLSearchParams({shop: shop.value.trim(), email: email.value.trim(), question: wanted, website: website.value, consent: consent.value, 'cf-turnstile-response': token});
      const answer = await (await fetch(intake.dataset.intake, {method: 'POST', body})).json();
      if (!answer.ok) throw new Error(answer.error);
      intake.reset();
      if (window.gtag) gtag('event', 'generate_lead');
      message.textContent = '신청을 받았습니다. 분석이 끝나면 PDF를 이메일로 보내드립니다.';
    } catch (error) {
      message.textContent = error.message === 'bot' ? '자동 입력 방지 확인에 실패했습니다. 확인을 다시 하고 눌러 주세요.' : '접수 여부를 확인하지 못했습니다. 다시 신청하기 전에 이메일로 문의해 주세요.';
    } finally {
      send.disabled = false;
      window.turnstile?.reset();
    }
  });
}

// Visit stats: GA4 loads only after the visitor agrees. ?ga=off on any page keeps this browser out (owner visits).
const GA = 'G-LZLZZ95P14';
const gaChoice = {
  get() { try { return localStorage.getItem('zikru-ga'); } catch { return null; } },
  set(v) { try { localStorage.setItem('zikru-ga', v); } catch { /* private window: ask again next time */ } },
  clear() { try { localStorage.removeItem('zikru-ga'); } catch { /* nothing stored */ } }
};
if (new URLSearchParams(location.search).get('ga') === 'off') gaChoice.set('no');
function startGA() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA);
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
  document.head.append(s);
}
if (gaChoice.get() === 'yes') startGA();
else if (!gaChoice.get()) {
  const root = $('link[rel=icon]').getAttribute('href').replace('favicon.svg', '');
  const bar = document.createElement('div');
  bar.className = 'ga-bar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', '방문 통계 동의');
  bar.innerHTML = `<p>사이트 개선을 위해 방문 통계(Google Analytics)를 써도 될까요? 거부해도 모든 기능을 똑같이 쓸 수 있습니다. <a class="link" href="${root}privacy/#part-2">자세히</a></p><div><button class="outline" type="button" data-ga="no">거부</button><button class="btn" type="button" data-ga="yes">동의</button></div>`;
  bar.addEventListener('click', e => {
    const pick = e.target.closest('[data-ga]');
    if (!pick) return;
    gaChoice.set(pick.dataset.ga);
    bar.remove();
    if (pick.dataset.ga === 'yes') startGA();
  });
  document.body.append(bar);
}
$$('[data-ga-reset]').forEach(b => b.addEventListener('click', () => { gaChoice.clear(); location.reload(); }));
})();
