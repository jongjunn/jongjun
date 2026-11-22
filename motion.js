(() => {
'use strict';

const hold = 5;
const duration = hold * 4;
const keyTimes = [2.4, 2.8, 2.1, 2.6];
const descriptions = [
  '여섯 AI 타일이 흩어진 점들을 차례로 훑으며 가게를 찾습니다.',
  '각 타일에서 뻗은 선이 가운데 가게 상자에 닿습니다.',
  '흩어져 있던 조각들이 상자 안으로 모여 층층이 맞물립니다.',
  '가게에서 신호가 두 번 퍼지고, 신호가 닿은 타일들이 차례로 응답합니다.'
];
const services = ['openai','googlegemini','perplexity','claude','naver','google'];
const center = [224,148];
const ports = [[74,68],[209,40],[365,70],[380,219],[246,255],[63,219]];
const scattered = [[46,88],[163,43],[327,47],[402,170],[286,249],[92,254]];
const offset = [[42,-13],[38,15],[53,22],[-34,25],[-57,8],[-41,-28]];
const fragments = [[40,149],[122,112],[337,29],[364,147],[328,246],[119,189]];
const origin = {x:0,y:0,sx:1,sy:1,opacity:1};
// power3.inOut, expo.inOut and back.out(.65), shared by live and offline frames.
const power = t => t < .5 ? 8*t**4 : 1-8*(1-t)**4;
const expo = t => t===0 || t===1 ? t : t<.5 ? 2**(20*t-10)/2 : (2-2**(-20*t+10))/2;
const back = t => 1+1.65*(t-1)**3+.65*(t-1)**2;
const linear = t => t;
const xy = ([x,y]) => ({x,y});
const scale = s => ({sx:s,sy:s});
const defs = `<defs>
  <pattern id="map-grid" width="64" height="32" patternUnits="userSpaceOnUse">
    <path d="M-32 0L32 32M32 0l64 32M0 32L64 0" fill="none" stroke="#E5E5E5" opacity=".19"/>
    <circle cx="32" cy="16" r="1" fill="#E5E5E5" opacity=".45"/>
  </pattern>
  <linearGradient id="grid-depth" x2="0" y2="1" gradientUnits="objectBoundingBox">
    <stop stop-color="black" stop-opacity=".82"/><stop offset=".55" stop-color="black" stop-opacity=".48"/><stop offset="1" stop-color="black" stop-opacity=".08"/>
  </linearGradient>
</defs>`;

// All poses, including the static image and URL inspection, sample the same score.
const actors = [];
function actor(id, body, initial={}, frame='') {
  const track = {id,body,frame,initial:{...origin,...initial},moves:[]};
  actors.push(track);
  return track;
}
function move(track, at, length, target, ease=power) {
  const previous = track.moves.at(-1)?.to ?? track.initial;
  track.moves.push({at,length,from:previous,to:{...previous,...target},ease});
}
const ground = actor('ground','<rect x="-64" y="-32" width="576" height="360" stroke="none" fill="url(#map-grid)"/>');
move(ground,0,duration,{x:64},linear);

let field='<rect width="448" height="296" stroke="none" fill="url(#grid-depth)"/>';
for (let i=0;i<54;i++) {
  const x=10+(i*73)%428, y=9+(i*83)%278;
  field += i%6===0
    ? `<path d="M${x-3} ${y}h6m-3-3v6" fill="none" stroke="#E5E5E5" opacity=".5"/>`
    : `<circle cx="${x}" cy="${y}" r="${i%4===0?1.7:1}" opacity=".65"/>`;
}
actor('field',field);
const diamond = 'M-55-25l35 13 75-15-35-13z';
const shell = '<path d="M-55-25l35 13 75-15v54l-75 15-35-13z" fill="black" fill-opacity=".78"/>' +
  '<path d="M20-40v54l-75 15m75-15 35 13" fill="none" stroke-dasharray="3 4" opacity=".45"/>';
const anchors=[[-55,-25],[-20,-12],[55,-27],[55,27],[-20,42],[-55,29]];

ports.forEach(([x,y],i)=>{
  const dx=center[0]+anchors[i][0]-x, dy=center[1]+anchors[i][1]-y;
  const angle=Math.atan2(dy,dx)*180/Math.PI;
  const length=Math.hypot(dx,dy);
  const axis=`translate(${x} ${y}) rotate(${angle})`;
  const beam=actor('link'+i,`<path d="M0 0H${length}" fill="none"/><circle cx="${length}" r="2.4" stroke="none" fill="#E5E5E5"/>`,
    {sx:0,opacity:0},axis);
  move(beam,5.7+i*.12,1.05,{sx:1,opacity:.8},expo);
  move(beam,9.65,.85,{sx:0,opacity:0});
  const reply=actor('reply'+i,'<path d="M-9 0H0"/><circle r="2" stroke="none"/>',{opacity:0},axis);
  for(const pulse of [15.65,17.5]){
    const at=pulse+i*.065;
    move(reply,at,.18,{x:22,opacity:1});
    move(reply,at+.18,.68,{x:length,opacity:.85},expo);
    move(reply,at+.86,.2,{opacity:0});
    move(reply,at+1.06,.01,reply.initial);
  }
});

actor('shell',shell,xy(center));
fragments.forEach((where,i)=>{
  const slice=actor('fragment'+i,'<path d="M-36 0l18 7 54-11-18-7z" fill="#E5E5E5" fill-opacity=".24"/>',
    {...xy(where),...scale(.17),opacity:.65});
  move(slice,9.95+i*.34,1.65,{x:224,y:132+i*6,...scale(1),opacity:.95},expo);
  move(slice,15.1,.8,{opacity:.32});
  move(slice,18.55+i*.06,.96,slice.initial);
});
actor('wire',`<path d="${diamond} M-55-25v54l35 13 75-15v-54M-20-12v54" fill="none"/>
  <g fill="#E5E5E5" stroke="none"><rect x="-57" y="-27" width="4" height="4"/><rect x="53" y="-29" width="4" height="4"/><rect x="-22" y="40" width="4" height="4"/></g>`,xy(center));

for(let i=0;i<2;i++){
  const ring=actor('wave'+i,'<ellipse rx="56" ry="38" fill="none"/>',{...xy(center),...scale(.6),opacity:0});
  for (const start of [15,16.85]) {
    const at=start+i*.32;
    move(ring,at,.22,{...scale(.95),opacity:.85});
    move(ring,at+.22,1.32,{...scale(3.5),opacity:0},t=>1-(1-t)**3);
    move(ring,at+1.54,.01,ring.initial);
  }
}
services.forEach((id,i)=>{
  const [x,y]=scattered[i], [dx,dy]=offset[i];
  const tile=actor('tile'+i,`<use href="#ai-${id}" x="-18" y="-18" width="36" height="36" stroke="none"/>`,{x,y});
  const start=i*.105;
  move(tile,start,1.7,{x:x+dx,y:y+dy},power);
  move(tile,1.9+start,1.95,{x:x+dx*.32,y:y+dy*1.45},power);
  move(tile,4.5+start,1.15,xy(ports[i]),expo);
  for(const at of [15.65,17.5]){
    move(tile,at+i*.065,.32,scale(1.18),back);
    move(tile,at+i*.065+.32,.54,scale(1));
  }
  move(tile,18.85+i*.045,.9,tile.initial);

  const scan=actor('scan'+i,'<path d="M0-4v18" fill="none" opacity=".6"/><path d="M-21 16l20-8 24 8-20 9z" fill="#E5E5E5" fill-opacity=".08"/><circle cx="1" cy="16" r="2" fill="#E5E5E5"/>',
    {x,y:y+17,opacity:0});
  move(scan,start,1.7,{x:x+dx,y:y+dy+17,opacity:.85});
  move(scan,1.9+start,1.95,{x:x+dx*.32,y:y+dy*1.45+17,opacity:.48});
  move(scan,4.35,.45,{opacity:0});
  move(scan,19,.5,scan.initial);
});

function interpolate(from,to,p){
  const state={};
  for(const k of Object.keys(origin)) state[k]=from[k]+(to[k]-from[k])*p;
  return state;
}
function pose(track,time){
  const m=track.moves.findLast(step=>step.at<=time);
  if(!m) return track.initial;
  if(time>=m.at+m.length) return m.to;
  return interpolate(m.from,m.to,m.ease((time-m.at)/m.length));
}
const transform = p => `translate(${p.x} ${p.y}) scale(${p.sx} ${p.sy})`;
function scene(index,seconds=keyTimes[index]){
  const time=index*hold+seconds;
  const drawing=actors.map(track=>{
    const p=pose(track,time);
    const body=track.body.replaceAll('<path ', '<path vector-effect="non-scaling-stroke" ').replaceAll('<ellipse ', '<ellipse vector-effect="non-scaling-stroke" ');
    const g=`<g data-actor="${track.id}" transform="${transform(p)}" opacity="${p.opacity}">${body}</g>`;
    return track.frame ? `<g transform="${track.frame}">${g}</g>` : g;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="448" height="296" viewBox="0 0 448 296" aria-hidden="true">${defs}<rect width="448" height="296" fill="black"/><g fill="#E5E5E5" stroke="#E5E5E5">${drawing}</g></svg>`;
}

function inspection(search) {
  const params=new URLSearchParams(search);
  if(!/^[1-4]$/.test(params.get('scene'))) return null;
  const index=Number(params.get('scene'))-1, raw=params.get('t'), seconds=Number(raw);
  return {index,time:raw && Number.isFinite(seconds)?Math.max(0,Math.min(hold-.001,seconds)):keyTimes[index]};
}
function mountPanel(panel){
  const art=panel.querySelector('.motion-art'), caption=panel.querySelector('.motion-caption');
  const tabs=[...panel.querySelectorAll('[role="tab"]')], toggle=panel.querySelector('.motion-toggle');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), frame=inspection(location.search);
  let current=-1, paused=Boolean(frame), visible=false, request=0, previousTime=null;
  const clock={seconds:(frame?.index??0)*hold+(frame?.time??(reduced.matches?keyTimes[0]:0))};
  art.innerHTML=scene(0,0);
  const nodes=[...art.querySelectorAll('[data-actor]')];
  const last=[];
  let transition;
  function render(){
    const t=clock.seconds%duration;
    const elapsed=transition ? (t-transition.start+duration)%duration : 0;
    if(elapsed>=.6) transition=null;
    const mix=transition ? power(elapsed/.6) : 1;
    actors.forEach((track,i)=>{
      const target=pose(track,t), old=last[i];
      const p=transition ? interpolate(transition.from[i],target,mix) : target;
      if(!old || p.x!==old.x || p.y!==old.y || p.sx!==old.sx || p.sy!==old.sy)
        nodes[i].setAttribute('transform',transform(p));
      if(!old || p.opacity!==old.opacity) nodes[i].setAttribute('opacity',p.opacity);
      last[i]=p;
    });
    const index=Math.floor(t/hold);
    if(index===current) return;
    current=index;
    tabs.forEach((tab,i)=>{
      tab.tabIndex=i===index?0:-1;
      tab.setAttribute('aria-selected',String(i===index));
    });
    art.setAttribute('aria-labelledby',tabs[index].id);
    caption.textContent=descriptions[index];
  }
  // GSAP owns the clock. Offline playback advances the identical score from rAF timestamps.
  const timeline=window.gsap?.timeline({paused:true,repeat:-1,onUpdate:render});
  if(timeline){
    ['scan','connect','assemble','measure'].forEach((name,i)=>timeline.addLabel(name,i*hold));
    timeline.fromTo(clock,{seconds:0},{seconds:duration,duration,ease:'none',immediateRender:false},0);
  }
  function tick(now){
    if(previousTime!==null) clock.seconds=(clock.seconds+(now-previousTime)/1000)%duration;
    previousTime=now;
    render();
    request=requestAnimationFrame(tick);
  }
  function seek(index,seconds=keyTimes[index],manual=false){
    const t=index*hold+seconds;
    transition=manual && visible && !document.hidden && !paused && !reduced.matches
      ? {start:t,from:last.slice()} : null;
    timeline?.time(t,true);
    clock.seconds=t;
    previousTime=null;
    render();
  }
  function sync(){
    const playing=visible && !document.hidden && !paused && !reduced.matches;
    toggle.disabled=reduced.matches;
    toggle.textContent=reduced.matches?'정지 화면':paused?'재생':'일시정지';
    toggle.setAttribute('aria-pressed',String(paused || reduced.matches));
    if(timeline) timeline.paused(!playing);
    else if(playing && !request) request=requestAnimationFrame(tick);
    else if(!playing && request){ cancelAnimationFrame(request); request=0; previousTime=null; }
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>seek(i,keyTimes[i],true));
    tab.addEventListener('keydown',event=>{
      const next={ArrowRight:(i+1)%4,ArrowLeft:(i+3)%4,Home:0,End:3}[event.key];
      if(next!==undefined){event.preventDefault();tabs[next].focus();seek(next,keyTimes[next],true);}
    });
  });
  toggle.addEventListener('click',()=>{
    paused=!paused;
    document.dispatchEvent(new CustomEvent('zikru-motion-pause',{detail:paused}));
    sync();
  });
  reduced.addEventListener('change',()=>{if(reduced.matches) seek(current);sync();});
  document.addEventListener('visibilitychange',sync);
  if('IntersectionObserver' in window) new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(panel);
  else visible=true;
  seek(frame?.index??0,frame?.time??(reduced.matches?keyTimes[0]:0));
  sync();
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
