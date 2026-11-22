(() => {
'use strict';

const services = [
  ['openai', 'ChatGPT'], ['googlegemini', 'Gemini'], ['perplexity', 'Perplexity'],
  ['claude', 'Claude'], ['naver', '네이버'], ['google', '구글']
];
const sources = [
  ['홈페이지', '영업시간', '10:00–19:00'],
  ['플레이스', '위치', '예시로 12'],
  ['블로그', '가격', '메뉴 5,000원']
];
const weeks = [[1,0,0,0], [1,1,0,0], [0,1,1,0], [1,1,1,0]];
const titles = ['우리 동네에서 예약되는 가게는?', '이 답은 어디에서 왔을까요?', '가게 정보', '같은 질문을 매주 묻습니다'];
const descriptions = [
  'AI와 검색 서비스가 가게 정보를 찾는 과정입니다.',
  '답변이 홈페이지, 플레이스, 블로그 중 어디를 인용했는지 확인합니다.',
  '영업시간과 위치, 가격을 항목별로 적습니다.',
  '매주 같은 질문을 묻고 가게를 언급했는지 기록합니다.'
];
const starts = ['answer', 'sources', 'details', 'weeks'];
const hold = 5;
const keyTimes = [2, 1.8, 1.8, 2.2];
const tiles = [
  [[56,112],[152,80],[296,80],[392,112],[88,216],[360,216]],
  [[48,96],[104,96],[160,96],[216,96],[224,208],[368,208]],
  [[232,80],[288,80],[344,80],[400,80],[224,208],[368,208]],
  [[48,120],[48,168],[48,216],[48,264],[48,216],[48,264]]
];
const shop = [[224,256],[344,96],[80,80],[80,72]];
const label = (x,y,content,extra='') => `<text x="${x}" y="${y}" ${extra}>${content}</text>`;
const path = (d,extra='') => `<path d="${d}" fill="none" stroke="currentColor" ${extra}/>`;
const pose = (x=0,y=0,opacity=1,scaleX=1,scaleY=scaleX) => ({x,y,opacity,scaleX,scaleY});

// The same drawing supplies the live DOM, reduced-motion views and printable stills.
function drawing(index, record = () => {}) {
  function actor(id, body, state) {
    record(id, state);
    const {x,y,opacity,scaleX,scaleY} = state;
    return `<g data-actor="${id}" transform="translate(${x} ${y}) scale(${scaleX} ${scaleY})" opacity="${opacity}">${body}</g>`;
  }
  const active = n => Number(index === n);
  const grid = '<pattern id="map-grid" width="64" height="32" patternUnits="userSpaceOnUse">' +
    path('M0 0L64 32M0 32L64 0','stroke-opacity=".25" stroke-width=".8"') +
    '<circle cx="32" cy="16" r="1.3" fill="currentColor" opacity=".5"/></pattern>';
  let art = `<defs>${grid}<clipPath id="map-cut"><rect x="0" y="48" width="448" height="240"/></clipPath></defs>`;
  art += '<g clip-path="url(#map-cut)">' + actor('ground', '<g data-drift=""><rect x="-64" y="16" width="576" height="320" fill="url(#map-grid)"/></g>', pose(0,0,[.9,.43,.18,.12][index])) + '</g>';

  // Each route starts at a tile edge and ends under the shop footprint.
  const routes = [
    'M56 136v16l112 56 56-28', 'M152 104v32l48 24', 'M296 104v32l-48 24',
    'M392 136v16l-112 56-56-28', 'M88 240v8l48 24 88-44', 'M360 240v8l-48 24-88-44'
  ];
  const ink = d => path(d,'class="ink"');
  art += actor('routes',routes.map(ink).join(''),pose(0,0,active(0)*.72));
  const building = '<g stroke="currentColor" stroke-linejoin="round" fill="#000000">' +
    '<path d="M-72 21l56-28 92 46-56 28z"/><path d="M-64-24l48-24 80 40v48L16 64l-80-40z"/>' +
    '<path d="M16 16l48-24M16 16v48M-64-24l80 40"/>' +
    '<path d="M-68-28l52-26 88 44-52 26zM-68-28v6l88 44 52-26v-6M20 16v6"/>' +
    '<path d="M-56-28l40-20 64 32-40 20z" fill="none" opacity=".5"/>' +
    '<g transform="matrix(1 .5 0 1 -64 -24)"><path d="M8 41V17h34v24zM49 47V16h21v31M55 29v5"/>' +
    '<path d="M-2 3h82l-6 9H-8zM-8 12v5h82v-5"/>' +
    [8,22,36,50,64].map(x=>`<path d="M${x} 3l-6 9v5"/>`).join('') + '</g>' +
    '<path d="M27 19l24-12v16L27 35zM39 13v16"/></g>';
  const footprint = path('M-20 0l16-8 24 12-16 8zM-20 0v8l24 12 16-8V4M4 12v8');
  art += actor('nearby',`<g transform="translate(40 232)">${footprint}</g><g transform="translate(400 208)">${footprint}</g>`,pose(0,0,active(0)*.4));
  art += actor('storefront',building,pose(index===0?224:344,index===0?168:96,active(0),index===0?1:.28));

  const linkPaths = ['M240 96H288','M344 112v32H80v48','M344 112v32H224v48','M344 112v32h24v48'];
  art += actor('citations',linkPaths.map(ink).join(''),pose(0,0,active(1)));
  sources.forEach(([source,field,value],i) => {
    const row = index >= 2;
    const face = '<rect width="112" height="64" fill="#000000" stroke="currentColor" stroke-opacity=".68" vector-effect="non-scaling-stroke"/>';
    const paper = actor('face'+i,face,pose(0,0,1,row?400/112:1,row?.75:1));
    const ref = actor('ref'+i,label(0,0,`[${i+1}]`,'fill="#CCCCCC"'),pose(12,row?30:24));
    const original = actor('source'+i,label(12,51,source,'font-weight="650"') + path('M84 12h11l5 5v10H84zM94 12v6h6','stroke-opacity=".7"'),pose(0,0,active(1)));
    const fieldName = actor('field'+i,label(0,0,field,'fill="#CCCCCC"'),pose(row?64:12,row?30:88,active(1)+active(2)));
    const detail = actor('detail'+i,label(384,30,value,'text-anchor="end" font-weight="650"'),pose(0,0,active(2)));
    art += actor('paper'+i,paper+ref+original+fieldName+detail,pose(row?24:24+i*144,row?112+i*56:192,active(1)+active(2)));
  });

  let matrix = label(424,32,'✓ 언급','text-anchor="end"');
  services.slice(0,4).forEach(([,name],i) => {
    matrix += label(80,126+48*i,name) + path(`M24 ${144+48*i}H424`,'stroke-opacity=".3"');
  });
  art += actor('matrix',matrix,pose(0,0,active(3)));
  weeks.forEach((mentions,i) => {
    const x = 200+i*64;
    let column = label(x,80,`${i+1}주`,'text-anchor="middle"');
    mentions.forEach((yes,j)=>{
      const y=120+j*48;
      column += yes ? `<circle cx="${x}" cy="${y}" r="11" fill="white"/>` + path(`M${x-5} ${y}l3 3 7-7`,'style="color:black" stroke-width="1.8"') : path(`M${x-4} ${y}h8`,'stroke-opacity=".6"');
    });
    art += actor('week'+i,column,pose(0,index===3?0:8,active(3)));
  });

  services.forEach(([id],i) => {
    const size = index===3?.75:1;
    art += actor('tile'+i,`<use href="#ai-${id}" x="-24" y="-24" width="48" height="48"/>`,pose(...tiles[index][i],i<4 || index===0?1:0,size));
  });
  const pin = '<path d="M-41-6a5 5 0 0 1 10 0c0 4-5 9-5 9s-5-5-5-9z" fill="none" stroke="black"/><circle cx="-36" cy="-6" r="1.6" fill="black"/>';
  art += actor('shop', '<g data-highlight=""><rect x="-56" y="-16" width="112" height="32" rx="2" fill="white"/>' + pin +
    label(6,6,'예시가게','text-anchor="middle" fill="black" font-weight="650"') + '</g>',pose(...shop[index]));
  titles.forEach((title,i)=>{ art+=actor('title'+i,label(24,32,title,'font-size="24" font-weight="650"'),pose(0,0,active(i))); });
  return art;
}

function scene(index) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="448" height="296" viewBox="0 0 448 296" color="white" fill="white" font-size="16" font-family="Pretendard Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif" aria-hidden="true"><rect width="448" height="296" fill="black"/>${drawing(index)}</svg>`;
}

function inspection(search) {
  const params = new URLSearchParams(search);
  if (!/^[1-4]$/.test(params.get('scene'))) return null;
  const index = Number(params.get('scene'))-1;
  const raw = params.get('t'), time = Number(raw);
  return {index,time:raw && Number.isFinite(time) ? Math.max(0,Math.min(hold-.001,time)) : keyTimes[index]};
}

function mountPanel(panel) {
  const art = panel.querySelector('.motion-art'), tabs = [...panel.querySelectorAll('[role="tab"]')];
  const caption = panel.querySelector('.motion-caption'), toggle = panel.querySelector('.motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const frame = inspection(location.search), gsap = window.gsap;
  let current = -1, paused = Boolean(frame), visible = false, timeline, navigation, moveTo;
  function announce(index) {
    if (current === index) return;
    current = index;
    tabs.forEach((tab,i) => {
      tab.tabIndex = i === index ? 0 : -1;
      tab.setAttribute('aria-selected',String(i === index));
    });
    art.setAttribute('aria-labelledby',tabs[index].id);
    caption.textContent = descriptions[index];
  }

  if (gsap) {
    art.innerHTML = scene(0);
    const actors = Object.fromEntries(gsap.utils.toArray('[data-actor]',art).map(el=>[el.dataset.actor,el]));
    const states = starts.map((_,i) => {
      const state = {};
      drawing(i,(id,values)=>{ state[id]=values; });
      return state;
    });
    const opening = {...states[0],shop:pose(224,256,0),storefront:pose(224,176,.32,.92),routes:pose(0,0,0)};
    services.forEach((_,i)=>{
      const [x,y]=tiles[0][i];
      opening['tile'+i]=pose(x,y+8,.8,.92);
    });
    for (const [id,state] of Object.entries(opening)) {
      gsap.set(actors[id],id.startsWith('tile') ? {...state,transformOrigin:'50% 50%',smoothOrigin:false} : state);
    }
    const tileNodes = services.map((_,i)=>actors['tile'+i]);
    const weekNodes = weeks.map((_,i)=>actors['week'+i]);
    const routes = [actors.routes,actors.citations].map(group=>[...group.querySelectorAll('.ink')]);
    // Measure once. Each stroke gets its actual length, including bends in the route.
    for (const line of routes.flat()) {
      const length=line.getTotalLength();
      line.setAttribute('stroke-dasharray',String(length));
      gsap.set(line,{strokeDashoffset:length});
    }
    timeline = gsap.timeline({paused:true,repeat:-1,defaults:{ease:'power3.inOut',duration:.75},
      onUpdate() { if (!navigation) announce(Math.min(3,Math.floor(timeline.time()/hold))); }
    });
    function arrange(track,target,previous,at,index) {
      for (const [id,state] of Object.entries(target)) {
        if (id.startsWith('tile') || id.startsWith('week')) continue;
        const changes = Object.fromEntries(Object.entries(state).filter(([key,v])=>!previous || previous[id][key]!==v));
        if (!Object.keys(changes).length) continue;
        if (index===2 && id.startsWith('paper') && 'y' in changes) {
          track.to(actors[id],{y:state.y,duration:.46},at);
          delete changes.y;
        }
        const spreading=index===2 && /^(paper|face|field|detail)/.test(id);
        const reveal=state.opacity>0 && /^(title|detail|source|matrix)/.test(id);
        const delay=spreading ? .46 : reveal ? .24 : id==='shop' && index===0 ? .5 : 0;
        const duration=state.opacity===0 ? .22 : id.startsWith('title') ? .3 : .68;
        if (Object.keys(changes).length) track.to(actors[id],{...changes,duration},at+delay);
      }
      const tileState = key => j=>target['tile'+j][key];
      track.to(tileNodes,{
        x:tileState('x'),y:tileState('y'),opacity:tileState('opacity'),scaleX:tileState('scaleX'),scaleY:tileState('scaleY'),
        stagger:.045,duration:.74,ease:'expo.inOut'
      },at);
      track.to(weekNodes,{y:target.week0.y,opacity:target.week0.opacity,stagger:index===3?.21:0,
        duration:index===3?.45:.2},at+(index===3?.6:0));
    }
    starts.forEach((name,i) => {
      const at = i*hold;
      timeline.addLabel(name,at);
      arrange(timeline,states[i],i?states[i-1]:opening,at,i);
      if (i<2) timeline.fromTo(routes[i],{strokeDashoffset:(_,line)=>Number(line.getAttribute('stroke-dasharray'))},
        {strokeDashoffset:0,immediateRender:false,stagger:.07,duration:.58,ease:'power3.out'},at+.32);
    });
    arrange(timeline,opening,states[3],hold*4-1,-1);
    // Connect manual jumps directly without racing through the intermediate chapters.
    moveTo = index => {
      timeline.pause();
      navigation=gsap.timeline({defaults:{ease:'power3.inOut'},onComplete(){
        navigation=null; timeline.pause(index*hold+keyTimes[index]); sync();
      }});
      arrange(navigation,states[index],null,0,index);
      if (index<2) navigation.fromTo(routes[index],{strokeDashoffset:(_,line)=>Number(line.getAttribute('stroke-dasharray'))},
        {strokeDashoffset:0,stagger:.07,duration:.56,ease:'power3.out'},.32);
    };
    const highlight=art.querySelector('[data-highlight]');
    timeline.fromTo(highlight,{scale:1},{scale:1.07,transformOrigin:'50% 50%',duration:.2,repeat:1,yoyo:true,ease:'back.out(1.4)',immediateRender:false},1.22);
    timeline.to(art.querySelector('[data-drift]'),{x:64,y:0,duration:hold*4,ease:'none'},0);
    timeline.progress(1,true).progress(0,true);
  }

  function sync() {
    const still = reduced.matches || !timeline;
    toggle.disabled = still;
    toggle.textContent = still ? '정지 화면' : paused ? '재생' : '일시정지';
    toggle.setAttribute('aria-pressed',String(still || paused));
    const playing = visible && !document.hidden && !paused && !still;
    if (navigation) navigation.paused(!playing);
    else timeline?.paused(!playing);
  }
  function select(index,seconds=keyTimes[index],smooth=false) {
    navigation?.kill(); navigation=null;
    const time=index*hold+seconds;
    if (timeline && smooth && !paused && !reduced.matches && visible && !document.hidden) {
      announce(index);
      moveTo(index);
    } else {
      if (timeline) timeline.pause(time);
      else art.innerHTML=scene(index);
      announce(index);
    }
    sync();
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>select(i,keyTimes[i],true));
    tab.addEventListener('keydown',event=>{
      const next={ArrowRight:(i+1)%4,ArrowLeft:(i+3)%4,Home:0,End:3}[event.key];
      if(next!==undefined){event.preventDefault();tabs[next].focus();select(next,keyTimes[next],true);}
    });
  });
  toggle.addEventListener('click',()=>{
    paused=!paused;
    document.dispatchEvent(new CustomEvent('zikru-motion-pause',{detail:paused}));
    sync();
  });
  document.addEventListener('visibilitychange',sync);
  if (gsap) gsap.matchMedia().add({reduce:'(prefers-reduced-motion: reduce)',normal:'(prefers-reduced-motion: no-preference)'},()=>{
    if (current >= 0) select(current);
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;sync();
  }).observe(panel);
  else visible=true;
  select(frame?.index ?? 0,frame?.time ?? (reduced.matches?keyTimes[0]:0));
}
function mountHeader(video) {
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

if (typeof module !== 'undefined') module.exports={scene,inspection,descriptions,mountPanel,mountHeader};
if (typeof document !== 'undefined') {
  mountHeader(document.querySelector('.header-video'));
  document.querySelectorAll('.motion-panel').forEach(mountPanel);
}
})();
