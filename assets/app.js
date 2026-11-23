/* ===== Путеводитель по итоговому сочинению — логика ===== */
(function(){
'use strict';
const D=window.DATA, CFG=window.APP_CONFIG||{};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const plain=h=>{const d=document.createElement('div');d.innerHTML=h;return d.textContent.replace(/\s+/g,' ').trim()};
const SYNCK=/^(mywords|klcheck|daycheck|rfs|kltype|klpart|builder|hideinstall|rp:.+)$/,TM='ис:_t';
const tmap=()=>{try{return JSON.parse(localStorage.getItem(TM)||'{}')}catch(e){return {}}};
const store={get(k,d){try{const v=localStorage.getItem('ис:'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('ис:'+k,JSON.stringify(v))}catch(e){}
 if(SYNCK.test(k)){try{const t=tmap();t[k]=Date.now();localStorage.setItem(TM,JSON.stringify(t))}catch(e){}schedulePush()}}};
let pushT=null;function schedulePush(){if(!USER)return;clearTimeout(pushT);pushT=setTimeout(()=>pushSync().catch(()=>{}),4000)}
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),1800)};
async function copy(txt,msg){try{await navigator.clipboard.writeText(txt)}catch(e){const a=document.createElement('textarea');a.value=txt;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}toast(msg||'Скопировано')}
const norm=s=>String(s).toLowerCase().replace(/ё/g,'е');
const plural=(n,a,b,c)=>{n=Math.abs(n)%100;const n1=n%10;if(n>10&&n<20)return c;if(n1>1&&n1<5)return b;if(n1===1)return a;return c};
const ICON={arrow:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 chev:'<svg class="chev" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',
 search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M8 7h8"/></svg>',
 copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>'};

/* ===== разделы сайта ===== */
const PAGES=[
 {id:'kriterii',cls:'s-krit',n:'01',t:'Критерии и правила',d:'Сколько слов, как считают, пять критериев и формула зачёта'},
 {id:'razdely',cls:'s-razd',n:'02',t:'Разделы и подразделы',d:'Из чего состоит банк тем и о чём каждый подраздел'},
 {id:'start',cls:'s-start',n:'03',t:'С чего начать',d:'Алгоритм: как выбрать тему и написать тезис под аргументы'},
 {id:'klishe',cls:'s-kl',n:'04',t:'Клише-шаблоны',d:'Фразы для каждой части и для каждого типа темы — с автоподстановкой'},
 {id:'ideal',cls:'s-ideal',n:'05',t:'Идеальные сочинения',d:'Работы, получившие «зачёт» по всем критериям, с разбором'},
 {id:'temy',cls:'s-tez',n:'06',t:'Темы и тезисы',d:'57 реальных тем с готовыми тезисами и списком, что читать'},
 {id:'argumenty',cls:'s-args',n:'07',t:'Аргументы',d:'Готовые аргументы по всем 11 подразделам — из всех сборников'},
 {id:'biblioteka',cls:'s-lib',n:'08',t:'Произведения',d:'Герои, пересказ по главам и полные тексты классики'},
 {id:'konstruktor',cls:'s-build',n:'09',t:'Конструктор сочинения',d:'Тема → тезис → аргументы → готовый черновик с проверкой'},
 {id:'den',cls:'s-day',n:'10',t:'В день сочинения',d:'План на 3 часа 55 минут, чек-лист и счётчик слов'}];
const PG={};PAGES.forEach(p=>PG[p.id]=p);
const SUBNAME={};const SUBSEC={};D.SECTIONS.forEach(S=>S.subs.forEach(x=>{SUBNAME[x.id]=x.name;SUBSEC[x.id]=S.n}));
const W={};D.WORKS.forEach(w=>W[w.id]=w);

/* ===== даты экзамена: считаются от сегодняшнего дня ===== */
function nthWeekday(y,m,wd,n){const d=new Date(y,m,1);const shift=(wd-d.getDay()+7)%7;return new Date(y,m,1+shift+7*(n-1))}
function firstWorkingWed(y,m){let d=nthWeekday(y,m,3,1);while(m===4&&(d.getDate()===1||d.getDate()===9))d=new Date(y,m,d.getDate()+7);return d}
function examDates(now){const y=now.getFullYear();const list=[];
 for(const yy of [y-1,y,y+1]){list.push({d:nthWeekday(yy,11,3,1),k:'main',t:'основной срок — первая среда декабря'});list.push({d:nthWeekday(yy,1,3,1),k:'extra',t:'дополнительный срок — первая среда февраля'});list.push({d:firstWorkingWed(yy,4),k:'extra',t:'дополнительный срок — первая рабочая среда мая'})}
 return list.sort((a,b)=>a.d-b.d)}
/* Отсчёт всегда идёт до ближайшего ОСНОВНОГО срока: после первой среды декабря он сам переключается на декабрь следующего года.
   Ближайшая пересдача (февраль, май) показывается отдельной строкой. */
function countdown(){const now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const L=examDates(now);const nextMain=L.find(x=>x.k==='main'&&x.d>=today);const days=Math.round((nextMain.d-today)/864e5);
 const extra=L.find(x=>x.k==='extra'&&x.d>=today&&x.d<nextMain.d);
 const prevMain=L.filter(x=>x.k==='main'&&x.d<today).pop();
 const total=(nextMain.d-(prevMain?prevMain.d:new Date(nextMain.d-365*864e5)))/864e5;const done=Math.max(0,Math.min(1,1-((nextMain.d-today)/864e5)/total));
 const fmt=d=>d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric',weekday:'long'});
 const fmtS=d=>d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',weekday:'long'});
 return {days,next:nextMain,fmt,fmtS,done,nextMain,extra,extraDays:extra?Math.round((extra.d-today)/864e5):null}}

/* ===== счётчик слов по правилам итогового ===== */
function countWords(t){if(!t)return 0;t=t.replace(/<[^>]+>/g,' ');
 t=t.replace(/(?:[А-ЯЁA-Z]\.\s?){1,2}\s?(?=[А-ЯЁA-Z][а-яёa-z])/g,''); // инициалы не считаются
 t=t.replace(/\b\d+([.,]\d+)?\b/g,' ');
 const m=t.match(/[А-Яа-яЁёA-Za-z]+(?:-[А-Яа-яЁёA-Za-z]+)*/g);return m?m.length:0}

/* ===== родительный падеж автора и предложный жанра (для конструктора) ===== */
function genAuthor(a){if(!a)return '';const parts=a.split(' ');let s=parts.pop();
 if(/(Брэдбери|Генри|Экзюпери|Гюго|Дюма|Капоте|Эко|Камю|Твен|Киз|Ли|Эко)$/.test(s))return a;
 const rules=[[/(ая)$/,'ой'],[/(ов|ев|ёв|ин|ын)а$/,'$1ой'],[/(ский|цкий)$/,s=>s.slice(0,-2)+'ого'],[/(ий|ый|ой)$/,s=>s.slice(0,-2)+'ого'],[/ь$/,'я'],[/й$/,'я'],[/[бвгджзклмнпрстфхцчшщ]$/,s=>s+'а']];
 for(const [re,rep] of rules){if(re.test(s)){s=typeof rep==='function'?rep(s):s.replace(re,rep);break}}
 return [...parts,s].join(' ')}
// формы жанра: [им./вин. для «вспомнил(а) …», дат. для «обратимся к …», предл. для «в …»]
const GF={'рассказ':['рассказ','рассказу','рассказе'],'повесть':['повесть','повести','повести'],'роман':['роман','роману','романе'],'роман-эпопея':['роман-эпопею','роману-эпопее','романе-эпопее'],'роман-антиутопия':['роман-антиутопию','роману-антиутопии','романе-антиутопии'],'пьеса':['пьесу','пьесе','пьесе'],'комедия':['комедию','комедии','комедии'],'драма':['драму','драме','драме'],'сказка':['сказку','сказке','сказке'],'сказ':['сказ','сказу','сказе'],'поэма':['поэму','поэме','поэме'],'новелла':['новеллу','новелле','новелле'],'стихотворение':['стихотворение','стихотворению','стихотворении'],'повесть-феерия':['повесть-феерию','повести-феерии','повести-феерии'],'сборник':['книгу','книге','книге'],'исторический':['роман','роману','романе'],'очерк':['очерк','очерку','очерке'],'притча':['притчу','притче','притче']};
function genreForms(g){const f=norm(g||'').split(/[ ,(]/)[0];return GF[f]||['произведение','произведению','произведении']}
function genreIn(g){return genreForms(g)[2]}

/* ===== меню, тема ===== */
function buildMenu(cur){$('#menuList').innerHTML=`<li><a href="#/" class="${!cur?'cur':''}" style="--acc-t:var(--line-2)"><span class="menu-num">⌂</span><span>Главная<small>Отсчёт и содержание</small></span></a></li>`+
 PAGES.map(p=>`<li class="${p.cls}"><a href="#/${p.id}" class="${cur===p.id?'cur':''}"><span class="menu-num">${p.n}</span><span>${p.t}<small>${p.d}</small></span></a></li>`).join('')+
 `<li><a href="#/profil" class="${cur==='profil'?'cur':''}" style="--acc-t:var(--line-2)"><span class="menu-num">◦</span><span>Профиль и черновики<small>${CFG.supabaseUrl?'Вход и сохранение прогресса':'Сохранённые черновики'}</small></span></a></li>`}
const drawer=$('#drawer');
$('#menuBtn').onclick=()=>{drawer.classList.add('on');$('#menuList a.cur')?.focus()};
drawer.addEventListener('click',e=>{if(e.target.closest('[data-close]')||e.target.closest('a'))drawer.classList.remove('on')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')drawer.classList.remove('on')});
$('#themeBtn').onclick=()=>{const r=document.documentElement;const n=r.dataset.theme==='night'?'':'night';if(n)r.dataset.theme=n;else delete r.dataset.theme;try{localStorage.setItem('theme',n)}catch(e){}};

/* ===== роутер ===== */
const ROUTES={'':home,ustanovka,kriterii,razdely,start,klishe,ideal,temy,argumenty,biblioteka,konstruktor,den,profil,w:workPage,read:reader};
function route(){const h=decodeURIComponent(location.hash.replace(/^#\/?/,''));const [name,...rest]=h.split('/');
 const fn=ROUTES[name]||home;const app=$('#app');app.className='';
 const pg=PG[name]||(name==='w'||name==='read'?PG.biblioteka:null);
 document.body.className=pg?pg.cls:'';buildMenu(name||'');
 window.onscroll=null;$('#progress').style.width='0';
 app.innerHTML='';fn(app,rest.join('/'));
 document.title=(app.dataset.title?app.dataset.title+' — ':'')+'Итоговое сочинение';
 if(!route.keepScroll)window.scrollTo(0,0);route.keepScroll=false;
 if(CFG.supabaseUrl)track(name||'home')}
window.addEventListener('hashchange',route);

function head(p,extra){return `<section class="page-head" data-num="${p.n}"><div class="eyebrow">Раздел ${p.n}</div><h1>${p.t}</h1><p>${p.lede||p.d}</p>${extra||''}</section>`}
function pager(id){const i=PAGES.findIndex(p=>p.id===id);const a=PAGES[i-1],b=PAGES[i+1];
 return `<nav class="pager" aria-label="Соседние разделы">${a?`<a href="#/${a.id}" class="${a.cls}"><small>← ${a.n}</small>${a.t}</a>`:'<span></span>'}${b?`<a href="#/${b.id}" class="next ${b.cls}"><small>${b.n} →</small>${b.t}</a>`:`<a href="#/" class="next"><small>→</small>На главную</a>`}</nav>`}

/* ===== установка как приложения ===== */
let deferredInstall=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$$('[data-install]').forEach(b=>b.hidden=false)});
window.addEventListener('appinstalled',()=>{deferredInstall=null;toast('Готово — ищи иконку на экране');$$('.install').forEach(x=>x.hidden=true)});
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isAndroid=()=>/android/i.test(navigator.userAgent);
function installSteps(all){const ios=['Открой сайт в <b>Safari</b>.','Нажми кнопку <b>«Поделиться»</b> — квадрат со стрелкой вверх (внизу экрана или в меню «···»).','Пролистай список вниз и нажми <b>«На экран „Домой“»</b>.','Нажми <b>«Добавить»</b> (если есть переключатель «Открывать как веб-приложение» — оставь включённым).'];
 const an=['Открой сайт в <b>Chrome</b>.','Нажми <b>⋮</b> в правом верхнем углу.','Выбери <b>«Установить приложение»</b> или <b>«Добавить на главный экран»</b>.','Подтверди — иконка появится на рабочем столе.'];
 const pc=['Открой сайт в Chrome или Edge.','Справа в адресной строке нажми значок установки (монитор со стрелкой) или меню ⋮ → «Сохранить и поделиться» → «Установить».'];
 const ol=a=>`<ol class="clean">${a.map(x=>`<li>${x}</li>`).join('')}</ol>`;
 if(all)return `<div class="grid g3"><div class="item"><h3>iPhone и iPad</h3>${ol(ios)}</div><div class="item"><h3>Android</h3>${ol(an)}</div><div class="item"><h3>Компьютер</h3>${ol(pc)}</div></div>`;
 return ol(isIOS()?ios:isAndroid()?an:pc)}
function installCard(force){if(!force&&(isStandalone()||store.get('hideinstall',false)))return '';
 return `<section class="card tint install s-start" style="margin:14px 0 6px"><div style="display:flex;flex-wrap:wrap;gap:10px 16px;align-items:flex-start;justify-content:space-between"><div style="flex:1 1 320px"><h2 style="margin:0 0 6px;font-size:1.25rem">Не потеряй путеводитель</h2>
 <p style="margin:0 0 8px">Добавь сайт на экран «Домой»: он будет открываться как приложение, без адресной строки, и всегда окажется под рукой в день сочинения. Прочитанные страницы открываются даже без интернета.</p>
 ${force?installSteps(true):`<details><summary style="cursor:pointer;font-weight:700">Как это сделать</summary><div style="margin-top:8px">${installSteps(false)}</div></details>`}</div>
 <div style="display:flex;gap:8px;flex-wrap:wrap">${force?'':'<button class="btn sm ghost" data-hide-install>Скрыть</button>'}<button class="btn primary sm" data-install ${deferredInstall?'':'hidden'}>Установить</button></div></div></section>`}
document.addEventListener('click',async e=>{if(e.target.closest('[data-install]')&&deferredInstall){deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null}
 if(e.target.closest('[data-hide-install]')){store.set('hideinstall',true);e.target.closest('.install').hidden=true}});
function ustanovka(app){app.dataset.title='Установка на экран «Домой»';app.innerHTML=`<section class="page-head s-start" data-num=""><div class="eyebrow">Приложение</div><h1>Добавить на экран «Домой»</h1><p>Сайт можно установить как приложение: иконка на рабочем столе, запуск в один тап, без адресной строки.</p></section>${installCard(true)}<p class="muted small">Если установить сайт на iPhone, он получит собственное хранилище: черновики, сохранённые в Safari, там не появятся. Войди в аккаунт и в приложении, и черновики подтянутся.</p>`}

/* ===== ГЛАВНАЯ ===== */
function home(app){const c=countdown();app.dataset.title='Путеводитель';
 const w=D.WORKS.filter(x=>x.full).length, nb=D.WORKS.reduce((a,x)=>a+(x.nb||0)+(x.arg?x.arg.length:0),0);
 const word=plural(c.days,'день','дня','дней');
 app.innerHTML=`<section class="hero">
 <div class="hero-main"><h1>Путеводитель по <em>итоговому</em> сочинению</h1>
  <p>Всё в одном месте: критерии, клише, идеальные сочинения, темы с тезисами, аргументы по подразделам, тексты произведений и конструктор, который соберёт черновик под твою тему.</p>
  <div class="hero-actions"><a class="btn primary s-krit" href="#/kriterii">Начать с критериев ${ICON.arrow}</a><a class="btn s-build" href="#/konstruktor">Открыть конструктор</a></div></div>
 <div class="count"><div><div class="lbl">${c.days===0?'Сегодня':c.days>200?'До следующего сочинения':'До сочинения'}</div>
  <div class="big">${c.days===0?'день X':c.days}${c.days===0?'':`<small>${word}</small>`}</div></div>
  <div><div class="date">${c.fmt(c.next.d)}</div><div class="sub">${c.next.t}.${c.extra?` Ближайшая пересдача — ${c.fmtS(c.extra.d)}${c.extraDays===0?' (сегодня)':`, через ${c.extraDays} ${plural(c.extraDays,'день','дня','дней')}`}.`:''} Даты считаются по правилу — точную дату уточняй в школе.</div></div>
  <div class="bar" aria-hidden="true"><i style="width:${Math.round(c.done*100)}%"></i></div></div>
 </section>
 ${installCard()}
 <div class="facts"><div class="fact"><b>3:55</b><span>часа на работу</span></div><div class="fact"><b>250+</b><span>слов минимум, лучше 350</span></div><div class="fact"><b>${D.WORKS.length}</b><span>произведений, из них ${w} с полным текстом</span></div><div class="fact"><b>${nb}</b><span>готовых аргументов</span></div></div>
 <div class="toc-title"><h2>Содержание</h2><span class="muted small">Иди по порядку или сразу в нужный раздел</span></div>
 <nav class="toc">${PAGES.map(p=>`<a href="#/${p.id}" class="${p.cls}"><span class="n">${p.n}</span><b>${p.t}</b><span>${p.d}</span><span class="go">${ICON.arrow}</span></a>`).join('')}</nav>`}

/* ===== 01 КРИТЕРИИ ===== */
function kriterii(app){const p=PG.kriterii;app.dataset.title=p.t;
 const crit=[['К1','Соответствие теме',true,'Нужно ответить именно на вопрос темы, не уходя в сторону. Самый надёжный путь — сформулировать чёткий тезис (свой ответ на вопрос) и доказывать его.','сочинение не соответствует теме или в нём не видно цели высказывания.','вставь ключевые слова темы во вступление, тезис, микровыводы и заключение — проверяющий сразу видит, что ты «в теме».'],
 ['К2','Аргументация. Привлечение литературного материала',true,'Позицию нужно доказать примером хотя бы из одного опубликованного произведения отечественной или мировой литературы. Можно: художественная литература, фольклор (кроме малых жанров — пословиц, загадок), документальная, мемуарная, публицистическая, научная и научно-популярная литература, дневники, очерки, литературная критика. Нельзя: фильмы, сериалы, игры, песни, «случай из жизни» вместо литературы.','нет литературного аргумента; произведение только упомянуто без анализа; грубые фактические ошибки (перепутаны герои, сюжет).','безопаснее всего 2 аргумента из двух разных произведений. Не пересказывай весь сюжет — бери эпизод, который доказывает тезис, и объясняй, что он показывает.'],
 ['К3','Композиция и логика рассуждения',false,'Проверяют, логично ли построено сочинение и соответствуют ли доказательства тезису. Правильно дели на абзацы, не противоречь себе, не повторяй одну и ту же мысль («не лей воду»).','грубые логические нарушения мешают понять смысл или нет тезисно-доказательной части.','держи схему: вступление + тезис → аргумент 1 + микровывод → аргумент 2 + микровывод → заключение.'],
 ['К4','Качество письменной речи',false,'Мысли выражены точно, лексика разнообразная, конструкции разные, термины к месту.','низкое качество речи (повторы, неточные слова, однотипные конструкции) серьёзно мешает понять смысл.','вместо «автор говорит» чередуй: показывает, подчёркивает, убеждает, обращает внимание, приходит к выводу.'],
 ['К5','Грамотность',false,'Учитываются орфографические, пунктуационные и грамматические ошибки вместе.','на 100 слов в среднем больше 5 ошибок.','сомневаешься в слове — замени синонимом или загляни в словарь. Длинное предложение со сложной пунктуацией лучше разбить на два.']];
 app.innerHTML=head(p,'')+`<div class="wrap-narrow stack">
 <div class="card"><h2>Что это и зачем</h2>
  <p>Итоговое сочинение — <b>допуск к ЕГЭ</b>. Оценка: «зачёт» или «незачёт». Проводится в <b>первую среду декабря</b>, на работу дают <b>3 часа 55 минут</b>.</p>
  <p>Темы берутся из закрытого банка (около 2000 тем). В комплекте 6 тем: темы 1–2 — раздел 1, темы 3–4 — раздел 2, темы 5–6 — раздел 3. Выбираешь одну.</p>
  <p class="muted">Можно пользоваться орфографическим словарём, который выдают в аудитории. Если «незачёт» или не пришёл по уважительной причине — можно пересдать в дополнительные сроки: первая среда февраля и первая рабочая среда мая. Точные даты каждый год объявляют официально — уточняй у учителя или на сайте ФИПИ.</p></div>
 <h2>Два требования — без них сочинение даже не проверят</h2>
 <div class="grid g2">
  <div class="card tint"><h3>Требование 1. Объём</h3><p>Меньше <b>250 слов</b> — сразу «незачёт» по всей работе. Верхней границы нет, рекомендуют <b>от 350 слов</b>.</p></div>
  <div class="card tint"><h3>Требование 2. Самостоятельность</h3><p>Если работа целиком или частично списана — «незачёт» за всю работу. Заученный аргумент пересказывай своими словами и подстраивай под тему.</p></div></div>
 <div class="card"><h3>Как считают слова</h3><p class="muted small">Считаются все слова, включая предлоги, союзы и частицы.</p>
  <div class="wc-table"><div>ВСЁ-ТАКИ (через дефис)</div><div>1 слово</div><div>ВСЁ ЖЕ</div><div>2 слова</div><div>М.Ю. Лермонтов (инициалы не считаются)</div><div>1 слово</div><div>Михаил Юрьевич Лермонтов</div><div>3 слова</div><div>5 лет (цифры не считаются)</div><div>1 слово</div><div>Пять лет</div><div>2 слова</div></div>
  <div class="note"><b>Лайфхак</b>Пиши имена авторов полностью и числа словами — это честно добавляет слова. Посчитать слова в черновике можно в разделе <a href="#/den">«В день сочинения»</a>.</div></div>
 <h2>Пять критериев</h2>
 <div class="card"><div class="formula"><span>«+» по К1</span><span class="plus">+</span><span>«+» по К2</span><span class="plus">+</span><span>«+» хотя бы по одному из К3, К4, К5</span><span class="plus">=</span><span class="res">зачёт</span></div></div>
 ${crit.map(c=>`<div class="card"><div class="crit"><div class="k">${c[0]}</div><div><h3 style="margin-bottom:.4em">${c[1]}${c[2]?'<span class="badge-req">обязательный</span>':''}</h3><p>${c[3]}</p><p class="small"><b>Незачёт, если:</b> ${c[4]}</p><div class="note"><b>Совет</b>${c[5]}</div></div></div></div>`).join('')}
 <h2>Структура сочинения</h2>
 <ol class="steps"><li><b>Вступление + тезис</b> — подводим к вопросу и даём свой ответ. <span class="muted">50–70 слов</span></li><li><b>Аргумент 1 + микровывод</b> — пример из произведения и как он доказывает тезис. <span class="muted">100–130 слов</span></li><li><b>Аргумент 2 + микровывод</b> — второе произведение: похожий или противоположный пример. <span class="muted">100–130 слов</span></li><li><b>Заключение</b> — вывод, возвращаемся к тезису другими словами. <span class="muted">40–60 слов</span></li></ol>
 <p class="muted small" style="margin-top:10px">Итого около 350–400 слов. Источник: «Всё об итоговом сочинении» (Вера Флекс), официальные критерии ФИПИ.</p>
 ${pager('kriterii')}</div>`}

/* ===== 02 РАЗДЕЛЫ ===== */
function razdely(app){const p=PG.razdely;app.dataset.title=p.t;
 app.innerHTML=head(p)+`<div class="stack">
 <div class="card"><p style="margin:0">Комплекты тем формируются из <b>закрытого банка</b> (около 2000 тем). В каждом комплекте по <b>две темы из каждого раздела</b>: 1–2 — «Духовно-нравственные ориентиры», 3–4 — «Семья, общество, Отечество», 5–6 — «Природа и культура». Нажми на подраздел, чтобы открыть готовые аргументы к нему.</p></div>
 ${D.SECTIONS.map(S=>`<div class="card"><div class="eyebrow tag">Раздел ${S.n}</div><h2 style="margin-top:10px">${esc(S.name)}</h2>
  <p class="muted small" style="margin-bottom:6px">Темы этого раздела:</p><ul class="clean small">${S.about.map(a=>`<li>${esc(a)}</li>`).join('')}</ul>
  <div class="grid g2" style="margin-top:14px">${S.subs.map(x=>{const n=D.WORKS.filter(w=>(w.subs||[]).includes(x.id)).length;return `<div class="item"><div class="hd"><span class="no">${x.id}</span><p class="q">${esc(x.name)}</p></div>
   <div class="body small"><span class="muted">Примеры тем:</span><ul>${x.ex.slice(0,4).map(e=>`<li>${esc(e)}</li>`).join('')}</ul>
   <a class="btn sm" href="#/argumenty/${x.id}">Аргументы · ${n} ${plural(n,'произведение','произведения','произведений')}</a></div></div>`}).join('')}</div></div>`).join('')}
 ${pager('razdely')}</div>`}

/* ===== 03 С ЧЕГО НАЧАТЬ ===== */
function start(app){const p=PG.start;app.dataset.title=p.t;
 app.innerHTML=head(Object.assign({},p,{lede:'Получил(а) темы — что делать в первые 30 минут. Главное правило: тезис пишется под аргументы, а не наоборот.'}))+`<div class="wrap-narrow stack">
 <div class="note"><b>Главное правило</b>Сначала вспоминаешь произведения и понимаешь, что в них происходит, — и только потом формулируешь тезис так, чтобы эти примеры его точно доказали.</div>
 <h2>Алгоритм</h2>
 <ol class="steps">
  <li>Прочитай все 6 тем и выбери ту, к которой сразу вспоминаются <b>2 произведения</b>. Красивая тема без книг — ловушка.</li>
  <li>Определи <b>тип темы</b>: вопрос, «согласны ли вы», «разделяете ли убеждение автора», цитата, тема без вопроса. От этого зависит клише — см. <a href="#/klishe/types">клише по типам тем</a>.</li>
  <li>Выпиши <b>ключевое понятие</b> (совесть, равнодушие, искусство…) и дай ему простое определение в одну фразу.</li>
  <li>Выпиши 2 произведения и для каждого — <b>1 эпизод</b>: кто герой, что сделал, что из этого вышло.</li>
  <li>Сделай <b>вывод</b> из каждого эпизода одной фразой («Тихон хотел порадовать старушку» → «добрый человек дарит радость»).</li>
  <li>Сложи выводы — это и есть <b>тезис</b>.</li>
  <li>Напиши черновик по шаблону, посчитай слова, перепиши на чистовик.</li></ol>
 <h2>Пример: как тезис «ведёт» к аргументу</h2>
 <div class="card"><p class="tag">Тема: «Зачем анализировать поступки, которые уже нельзя исправить?»</p>
  <p style="margin-top:12px"><b>Шаг 1. Произведение.</b> В.И. Дёгтев «Крест» — капитан по приказу затапливает баржу с монахами; через много лет, мучаясь, кается.</p>
  <p><b>Шаг 2. Что из этого следует.</b> Поступок непоправим — жизнь не вернёшь, — но анализ нужен, чтобы осознать вину и не повторить.</p>
  <p><b>Шаг 3. Вступление, которое подводит к аргументу:</b></p>
  <p class="para txt" style="display:block;border:0;padding:0">«Чтобы ответить на вопрос, зачем анализировать поступки, которые уже нельзя исправить, нужно понять, что такое непоправимый поступок. Это действие, последствия которого невозможно отменить: <span class="tz">нельзя вернуть человеку жизнь</span> или забрать назад грубое слово. Я считаю, что такие поступки нужно анализировать, чтобы осознать свою вину и не совершить подобного снова».</p>
  <div class="note"><b>Почему это работает</b>Фраза «нельзя вернуть человеку жизнь» во вступлении заранее прокладывает дорогу к «Кресту», где капитан отнимает жизни. Проверяющий видит, что тезис и аргумент связаны.</div></div>
 <div class="card"><p class="tag">Пример Веры Флекс. Тема: «Какого человека можно назвать добрым?»</p>
  <ol class="clean" style="margin-top:12px"><li>Произведения: Л.Н. Толстой «Война и мир», К.Г. Паустовский «Телеграмма».</li><li>Наташа Ростова ухаживает за раненым Андреем Болконским → помогает в беде.</li><li>Старик Тихон жалеет одинокую Катерину Петровну, навещает её и приносит выдуманную телеграмму от дочери → хочет, чтобы человек улыбнулся.</li></ol>
  <p><b>Тезис:</b> <span class="tz">Добрым можно назвать человека, который помогает другим в беде. Такие люди готовы искренне поддержать ближнего, чтобы на его лице появилась улыбка.</span></p></div>
 <h2>Формулы тезиса</h2>
 <div class="grid g2">
  <div class="item"><b>Определение</b><p class="small muted" style="margin:4px 0 0">«[Понятие] — это…, поэтому…»</p></div>
  <div class="item"><b>Две причины</b><p class="small muted" style="margin:4px 0 0">«Это происходит, во-первых, когда…, во-вторых, когда…» — каждой причине свой аргумент.</p></div>
  <div class="item"><b>Да, но</b><p class="small muted" style="margin:4px 0 0">«Я считаю, что чаще всего…, однако бывает и так, что…» — для тем «всегда ли…», «можно ли…».</p></div>
  <div class="item"><b>Сравнение</b><p class="small muted" style="margin:4px 0 0">«Если X — это…, то Y — это…» — для тем «в чём разница…».</p></div></div>
 <div class="note"><b>Проверь себя</b>Тезис — это ответ на вопрос темы? В нём есть ключевое слово темы? Каждый аргумент доказывает какую-то часть тезиса?</div>
 <h2>Частые ошибки</h2>
 <ul class="clean"><li>Пересказ всего сюжета вместо одного нужного эпизода.</li><li>Аргумент «про другое»: книга хорошая, но тезис не доказывает.</li><li>Нет микровывода — пример «висит» без объяснения.</li><li>Заключение спорит с тезисом или вводит новые примеры.</li><li>Ошибки в именах героев и сюжете — это минус по К2.</li></ul>
 ${pager('start')}</div>`}

/* ===== 04 КЛИШЕ ===== */
const KLP=D.KLP;const GAPLAB={kw_im:'что?',kw_rod:'чего?',kw_pr:'о чём?',q:'вопрос темы',author_rod:'автора',author_im:'автор',title:'название',hero:'герой',lit:'какой'};
function myWords(){return store.get('mywords',{})}
function fillTpl(s,vals,interactive){
 return esc(s).replace(/\{(\w+)\}/g,(m,k)=>{const cap=/^[A-Z]/.test(k);const key=k.toLowerCase();const f=KLP.FIELDS.find(x=>x.k===key);let v=vals[key];
   if(v){v=esc(v);if(cap)v=v[0].toUpperCase()+v.slice(1);return interactive?`<span class="fill">${v}</span>`:v}
   const lab=GAPLAB[key]||k;return interactive?`<span class="gap">${esc(lab)}</span>`:'___'})
  .replace(/\[([^\]]+)\]/g,(m,h)=>interactive?`<span class="gap">${h}</span>`:'___')}
function phrase(s,i,vals){return `<button class="phr" data-copy="${esc(fillTpl(s,vals,false).replace(/<[^>]+>/g,''))}"><span class="i">${i}</span><span>${fillTpl(s,vals,true)}</span><span class="cp">копировать</span></button>`}
function klishe(app,sub){const p=PG.klishe;app.dataset.title=p.t;const mode=sub==='types'?'types':(sub==='all'?'all':'parts');
 app.innerHTML=head(Object.assign({},p,{lede:'Выбери одну фразу и вставь в «окошко» слово или вопрос из своей темы. Нужно 1–2 фразы на раздел — не все сразу. Нажми на фразу, чтобы скопировать.'}))+
 `<div class="seg" role="group" aria-label="Вид"><button data-m="parts" aria-pressed="${mode==='parts'}">По частям сочинения</button><button data-m="types" aria-pressed="${mode==='types'}">По типу темы</button><button data-m="all" aria-pressed="${mode==='all'}">Всё вместе</button></div><div id="klBody"></div>${pager('klishe')}`;
 $$('.seg button',app).forEach(b=>b.onclick=()=>{location.hash='#/klishe/'+b.dataset.m});
 const body=$('#klBody');
 if(mode==='parts')klParts(body);else if(mode==='types')klTypes(body);else klAll(body);
 app.addEventListener('click',e=>{const b=e.target.closest('.phr');if(b)copy(b.dataset.copy,'Фраза скопирована')})}
function myWordsBox(onChange){const vals=myWords();
 const el=document.createElement('div');el.className='card tint';el.style.marginBottom='16px';
 el.innerHTML=`<details class="mywords" ${store.get('mwopen',true)?'open':''}><summary><span>Мои слова — подставятся во все шаблоны</span><span class="small muted">${Object.values(vals).filter(Boolean).length?'заполнено':'заполни поля'}</span></summary>
 <div class="myw">${KLP.FIELDS.map(f=>`<div class="field"><label for="mw-${f.k}">${f.l}</label><input id="mw-${f.k}" data-k="${f.k}" value="${esc(vals[f.k]||'')}" placeholder="${esc(f.ph)}" autocomplete="off"></div>`).join('')}</div>
 <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="ex">Пример: дружба</button><button class="btn sm ghost" data-act="clr">Очистить</button></div></details>`;
 $('details',el).addEventListener('toggle',e=>store.set('mwopen',e.target.open));
 el.addEventListener('input',e=>{const i=e.target.closest('input');if(!i)return;const v=myWords();v[i.dataset.k]=i.value;store.set('mywords',v);onChange()});
 el.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a)return;const v={};if(a.dataset.act==='ex')KLP.FIELDS.forEach(f=>v[f.k]=f.ph);store.set('mywords',v);$$('input',el).forEach(i=>i.value=v[i.dataset.k]||'');onChange()});
 return el}
function klParts(body){let cur=store.get('klpart','intro');
 const nav=document.createElement('div');nav.className='parts-nav';nav.setAttribute('role','group');
 nav.innerHTML=KLP.PARTS.map(x=>`<button data-id="${x.id}" aria-pressed="${x.id===cur}"><span class="n">${x.n}</span><b>${x.name.replace('Аргумент: обращение к произведению','Обращение')}</b><small>${x.sub}</small></button>`).join('');
 const out=document.createElement('div');
 body.append(myWordsBox(draw),nav,out);
 nav.onclick=e=>{const b=e.target.closest('button');if(!b)return;cur=b.dataset.id;store.set('klpart',cur);$$('button',nav).forEach(x=>x.setAttribute('aria-pressed',x.dataset.id===cur));draw()};
 function draw(){const P=KLP.PARTS.find(x=>x.id===cur)||KLP.PARTS[0];const v=myWords();let n=0;
  out.innerHTML=`<div class="card" style="margin-bottom:14px"><h2 style="margin:0 0 6px">${P.name}</h2><p style="margin:0"><b style="color:var(--acc-d)">Зачем:</b> ${P.why}</p></div>
  ${P.scheme?`<div class="note"><b>Схема</b>${fillTpl(P.scheme,v,true)}</div>`:''}
  ${P.builder?`<div class="card" style="margin-bottom:14px"><h3>Собери фразу из трёх частей</h3><div class="builder-row" id="anb"><div class="col"><small class="muted">КТО?</small>${P.builder.who.map((w,i)=>`<button class="pill" data-g="who" aria-pressed="${i===0}">${w}</button>`).join('')}</div><span class="plus">+</span><div class="col" style="flex-direction:row;flex-wrap:wrap;max-width:440px"><small class="muted" style="width:100%">ЧТО ДЕЛАЕТ?</small>${P.builder.what.map((w,i)=>`<button class="pill" data-g="what" aria-pressed="${i===4}">${w}</button>`).join('')}</div><span class="plus">+</span><div class="col"><small class="muted">О ЧЁМ?</small><span class="gap">что доказывает тезис</span></div></div><p style="margin:12px 0 0" id="anbOut"></p></div>`:''}
  <div class="grid g2">${P.groups.map(g=>`<div class="kl-group"><h3><span class="tag">${g.h}</span><small>${g.d}</small></h3>${g.items.map(s=>phrase(s,++n,v)).join('')}</div>`).join('')}</div>
  ${P.formula?`<div class="card" style="margin-top:14px"><div class="formula"><span>${P.formula[0]}</span><span class="plus">+</span><span>${P.formula[1]}</span><span class="plus">=</span><span class="res">${P.formula[2]}</span></div></div>`:''}
  ${P.tip?`<div class="note"><b>Важно</b>${P.tip}</div>`:''}${P.warn?`<div class="note warn"><b>Внимание</b>${P.warn}</div>`:''}
  ${P.ex?`<div class="example"><div class="l">Пример<small>как это звучит</small></div><div class="r"><div class="t">Тема: «${esc(P.ex.topic)}»</div>${P.ex.text}</div></div>`:''}`;
  const anb=$('#anb',out);if(anb){const upd=()=>{const w=$('[data-g=who][aria-pressed=true]',anb).textContent,x=$('[data-g=what][aria-pressed=true]',anb).textContent;$('#anbOut',out).innerHTML=`<b>${w} ${x}</b> <span class="gap">о чём — то, что доказывает тезис</span>.`};
   anb.onclick=e=>{const b=e.target.closest('.pill');if(!b)return;$$(`[data-g=${b.dataset.g}]`,anb).forEach(x=>x.setAttribute('aria-pressed',x===b));upd()};upd()}}
 draw()}
function klTypes(body){let cur=store.get('kltype',D.KLTYPES[0].id);
 const chips=document.createElement('div');chips.className='chips';chips.innerHTML=D.KLTYPES.map(t=>`<button data-id="${t.id}" aria-pressed="${t.id===cur}">${esc(t.name)}</button>`).join('');
 const out=document.createElement('div');
 const det=document.createElement('div');det.className='card';det.style.marginBottom='14px';
 det.innerHTML=`<div class="field" style="margin:0"><label for="tdet">Не знаешь тип темы? Вставь её сюда</label><input id="tdet" placeholder="Например: Согласны ли вы, что повзрослеть — значит научиться нести ответственность за других?"></div><p class="small" id="tdetOut" style="margin:8px 0 0"></p>`;
 body.append(det,chips,out);
 $('#tdet',det).oninput=e=>{const t=detectType(e.target.value);if(!e.target.value.trim()){$('#tdetOut',det).textContent='';return}
  const T=D.KLTYPES.find(x=>x.id===t);$('#tdetOut',det).innerHTML=`Похоже, это тип <b>«${esc(T.name)}»</b>. <button class="btn sm" id="tgo">Показать шаблон</button>`;$('#tgo',det).onclick=()=>{cur=t;sel()}};
 chips.onclick=e=>{const b=e.target.closest('button');if(b){cur=b.dataset.id;sel()}};
 function sel(){store.set('kltype',cur);$$('button',chips).forEach(x=>x.setAttribute('aria-pressed',x.dataset.id===cur));draw()}
 function draw(){const T=D.KLTYPES.find(x=>x.id===cur)||D.KLTYPES[0];const v=myWords();
  out.innerHTML=`<div class="card"><h2 style="margin-top:0">${esc(T.title)}</h2><p>${esc(T.intro)}</p><p class="small muted" style="margin-bottom:4px">Примеры тем:</p><ul class="clean small">${T.examples.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>
  <div class="card"><h3>Шаблон по частям</h3>${T.tpl.map(([h,t],i)=>`<div class="para"><div class="lab">${esc(h)}</div><div class="txt" style="font-family:var(--sans);font-size:1rem">${phrase(t,i+1,v)}</div></div>`).join('')}</div>
  <div class="example"><div class="l">Пример<small>как это звучит</small></div><div class="r">${esc(T.sample)}</div></div>
  <div class="note warn"><b>Ловушка</b>${esc(T.trap)}</div>`}
 draw()}
function klAll(body){body.innerHTML=`<div class="card"><h2 style="margin-top:0">Всё вместе</h2><p><b style="color:var(--acc-d)">Как собрать:</b> бери по одному клише из каждого раздела и ставь части строго по порядку.</p>
 <div class="together">${KLP.TOGETHER.map(r=>`<div><span class="n">${r[0]}</span><b>${r[1]}</b><span>${esc(r[2])}</span></div>`).join('')}</div>
 <div class="checkgrid">${KLP.CHECK.map((c,i)=>`<label class="check"><input type="checkbox" data-i="${i}" ${store.get('klcheck',[])[i]?'checked':''}> ${esc(c)}</label>`).join('')}</div></div>
 <div class="card"><h3>Ещё универсальные «детали»</h3>${D.KLOLD.blocks.map(b=>`<div class="para"><div class="lab">${esc(b.h)}</div><div class="txt" style="font-family:var(--sans);font-size:1rem">${b.items.map((s,i)=>phrase(s.replace(/<span class="gap">(.*?)<\/span>/g,'[$1]'),i+1,{})).join('')}</div></div>`).join('')}
 ${D.KLOLD.tip?`<div class="note"><b>Совет</b>${esc(plain(D.KLOLD.tip))}</div>`:''}</div>
 <p class="muted small">Клише по частям — по схеме «Итоговое сочинение 2027. Клише» (@asyarusichka_el); дополнено фразами из идеальных сочинений.</p>`;
 body.addEventListener('change',e=>{const c=e.target.closest('input[data-i]');if(!c)return;const a=store.get('klcheck',[]);a[c.dataset.i]=c.checked;store.set('klcheck',a)})}
function detectType(t){const s=norm(t).trim();if(!s)return 'q';
 if(/разделяет[её] ли вы|разделяете ли|убеждени[ея] автора/.test(s))return 'author';
 if(/согласны ли вы|согласен ли|согласна ли/.test(s))return 'agree';
 if(/как вы понимаете|иллюстрацией к (мысли|словам)|«[^»]{8,}»\s*\(|\)\s*$|жизненный опыт кого/.test(s))return 'quote';
 if(/(в ч[её]м|чем) (разница|различие|отличается|отличие)|чем .* отличается/.test(s))return 'diff';
 if(/(^|\s)(вы|вас|вам|вами|ваш|ваша|ваше|ваши|для вас)(\s|[?,.]|$)/.test(s))return 'me';
 if(/^(можно ли|всегда ли|возможн[ао]? ли|может ли|могут ли|нужно ли|стоит ли|должен ли|должны ли|бывает ли|способн[аоы]? ли|обязательно ли)/.test(s))return 'can';
 if(/\?\s*$/.test(s))return 'q';
 return 'nom'}

/* ===== 05 ИДЕАЛЬНЫЕ СОЧИНЕНИЯ ===== */
function ideal(app){const p=PG.ideal;app.dataset.title=p.t;
 app.innerHTML=head(Object.assign({},p,{lede:'Прочитай эти работы, оценённые на зачёт по всем пяти критериям, чтобы почувствовать, как вообще пишется итоговое. Тезис выделен — посмотри, как к нему возвращаются микровыводы и заключение.'}))+
 `<div class="list">${D.IDEAL.map((e,i)=>{const words=countWords(e.p.map(x=>plain(x[1])).join(' '));return `<details class="essay" ${i===0?'open':''}><summary><span class="no">${String(i+1).padStart(2,'0')}</span><span><span class="tt">${esc(e.t)}</span><br><span class="src">${esc(e.works)} · ${words} ${plural(words,'слово','слова','слов')}</span></span>${ICON.chev}</summary>
 <div class="essay-body">${e.p.map(([l,t])=>`<div class="para"><div class="lab">${esc(l)}</div><div class="txt">${t}</div></div>`).join('')}
 <p class="src" style="margin-top:10px">Источник: ${esc(e.src)}</p><button class="btn sm" data-copy="${i}">${ICON.copy} Скопировать текст</button></div></details>`}).join('')}</div>
 <div class="note" style="margin-top:16px"><b>Что общего у всех</b>Короткое вступление с ключевым словом темы → чёткий тезис → два произведения, в каждом один эпизод → «Таким образом, автор показывает…» → заключение повторяет тезис другими словами.</div>${pager('ideal')}`;
 app.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(b){e.preventDefault();copy(D.IDEAL[b.dataset.copy].p.map(x=>plain(x[1])).join('\n\n'))}})}

/* ===== 06 ТЕМЫ И ТЕЗИСЫ ===== */
function wlink(r,wid){return wid&&W[wid]?`<a href="#/w/${wid}">${esc(r)}</a>`:`<span>${esc(r)}</span>`}
function readItems(t){return t.read.map(r=>{const m=r.match(/«([^»]+)»/);const id=m&&t.wids.find(id=>norm(W[id].t).startsWith(norm(m[1]).slice(0,12)));return wlink(r,id)}).join('')}
function temy(app,sub){const p=PG.temy;app.dataset.title=p.t;const mode=sub==='plany'?'plany':(sub==='spisok'?'spisok':'temy');
 app.innerHTML=head(Object.assign({},p,{lede:'Реальные темы итогового сочинения 2022/23 и примерные тезисы к ним из сборника ОК ЕГЭ (Кафтаева, Беляева). Названия произведений кликабельны — откроется пересказ и аргументы.'}))+
 `<div class="seg"><button data-m="temy" aria-pressed="${mode==='temy'}">57 тем с тезисами</button><button data-m="plany" aria-pressed="${mode==='plany'}">10 подробных планов</button><button data-m="spisok" aria-pressed="${mode==='spisok'}">Что прочитать</button></div><div id="tb"></div>${pager('temy')}`;
 $$('.seg button',app).forEach(b=>b.onclick=()=>location.hash='#/temy/'+b.dataset.m);const tb=$('#tb');
 const card=(t,label)=>`<article class="item" data-s="${esc(norm(t.q+' '+t.read.join(' ')+' '+t.pts.join(' ')))}"><div class="hd"><span class="no">${t.n}</span><h3 class="q">${esc(t.q)}</h3></div>
  <div class="body">${t.intro?`<p>${esc(t.intro)}</p>`:''}${t.pts.length?`<ul>${t.pts.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
  <div class="small muted">${label}</div><div class="readlist">${readItems(t)}</div>
  <div class="actions" style="margin-top:10px"><a class="btn sm" href="#/konstruktor?t=${encodeURIComponent(t.q)}">Собрать сочинение по теме</a> <span class="tag out">${esc(D.KLTYPES.find(x=>x.id===detectType(t.q)).name)}</span></div></div></article>`;
 if(mode==='spisok'){tb.innerHTML=`<div class="card"><h2 style="margin-top:0">Список литературы из сборника</h2><p class="muted">Эти произведения закрывают почти все темы сборника.</p><div class="readlist">${D.READLIST.map(r=>wlink(r.t,r.wid)).join('')}</div></div>`;return}
 const L=mode==='plany'?D.PLANS:D.THESES;
 tb.innerHTML=`<div class="search">${ICON.search}<input id="ts" type="search" placeholder="Поиск по темам: любовь, равнодушие, Куприн…" aria-label="Поиск по темам"></div><div class="list" id="tl">${L.map(t=>card(t,mode==='plany'?'Читаем:':'Читаем:')).join('')}</div><p class="empty" id="tn" hidden>Ничего не найдено</p>`;
 $('#ts').oninput=e=>{const q=norm(e.target.value).trim().split(/\s+/);let n=0;$$('#tl article').forEach(a=>{const ok=q.every(w=>a.dataset.s.includes(w));a.hidden=!ok;if(ok)n++});$('#tn').hidden=n>0}}

/* ===== 07 АРГУМЕНТЫ ===== */
let BANK=null;async function loadBank(){if(BANK)return BANK;const r=await fetch('data/bank.json');BANK=await r.json();return BANK}
function argCard(w,a){return `<article class="arg"><div class="meta"><span class="tag">${a.s} · ${esc(SUBNAME[a.s]||'')}</span><a href="#/w/${w.id}"><b>${esc(w.a)} «${esc(w.t)}»</b></a></div><h3 class="q">${esc(a.q)}</h3><div class="t">${a.t}</div>
 <div class="actions"><button class="btn sm" data-cp="${esc(plain(a.t))}">${ICON.copy} Копировать</button><a class="btn sm ghost" href="#/w/${w.id}">Пересказ${w.full?' и текст':''}</a></div></article>`}
function bankCard(b,showWork){const w=W[b.w];return `<article class="arg"><div class="meta"><span class="tag">${b.s} · ${esc(SUBNAME[b.s]||'')}</span>${showWork?`<a href="#/w/${w.id}"><b>${esc(w.a)} «${esc(w.t)}»</b></a>`:''}${b.note?`<span class="muted">${esc(b.note)}</span>`:''}</div>
 <div class="t ${b.p.join(' ').length>600?'clamp':''}">${b.p.map(x=>`<p class="bank-p">${esc(x)}</p>`).join('')}</div>
 <div class="actions">${b.p.join(' ').length>600?'<button class="btn sm" data-open>Читать полностью</button>':''}<button class="btn sm ghost" data-cp="${esc(b.p.join('\n'))}">${ICON.copy} Копировать</button></div><p class="small muted" style="margin:8px 0 0">${esc(b.src)}</p></article>`}
function argClicks(root){root.addEventListener('click',e=>{const c=e.target.closest('[data-cp]');if(c){copy(c.dataset.cp,'Аргумент скопирован — перескажи своими словами');return}
 const o=e.target.closest('[data-open]');if(o){const t=o.closest('.arg').querySelector('.t');t.classList.toggle('clamp');o.textContent=t.classList.contains('clamp')?'Читать полностью':'Свернуть'}})}
function argumenty(app,sub){const p=PG.argumenty;app.dataset.title=p.t;let cur=SUBNAME[sub]?sub:'all';
 app.innerHTML=head(Object.assign({},p,{lede:'Сначала — разобранные аргументы с микровыводом, ниже — все аргументы из сборников (ВОШ, «Все аргументы по разделу», сборник 2021/22). Помни: на экзамене пересказывай своими словами.'}))+
 `<div class="chips" id="sc"><button data-s="all" aria-pressed="${cur==='all'}">Все</button>${Object.keys(SUBNAME).map(s=>`<button data-s="${s}" aria-pressed="${cur===s}">${s} ${esc(SUBNAME[s].split(/[,(]/)[0].replace('Отношение человека к другому человеку','Отношение к другому'))}</button>`).join('')}</div>
 <div class="search">${ICON.search}<input id="as" type="search" placeholder="Поиск: дружба, совесть, Чехов, «Капитанская дочка»…" aria-label="Поиск по аргументам"></div>
 <div id="ah"></div><div class="list" id="al"></div><div class="more"><button class="btn" id="am" hidden>Показать ещё</button></div><h2 id="bh">Из сборников</h2><div class="list" id="bl"><p class="muted">Загрузка…</p></div><div class="more"><button class="btn" id="bm" hidden>Показать ещё</button></div>${pager('argumenty')}`;
 argClicks(app);let q='';let lim=20,blim=15;
 const curated=[];D.WORKS.forEach(w=>(w.arg||[]).forEach(a=>curated.push({w,a})));
 function draw(){const words=norm(q).trim().split(/\s+/).filter(Boolean);
  const match=s=>words.every(x=>s.includes(x));
  const C=curated.filter(({w,a})=>(cur==='all'||a.s===cur)&&match(norm(w.a+' '+w.t+' '+a.q+' '+plain(a.t)+' '+(w.th||''))));
  $('#ah').innerHTML=cur!=='all'?`<div class="card tint" style="margin-bottom:12px"><b>${cur}. ${esc(SUBNAME[cur])}</b></div>`:'';
  $('#al').innerHTML=C.slice(0,lim).map(x=>argCard(x.w,x.a)).join('')||'<p class="empty">Нет разобранных аргументов по запросу — смотри сборники ниже.</p>';$('#am').hidden=C.length<=lim;
  if(BANK){const B=BANK.filter(b=>(cur==='all'||b.s===cur)&&match(norm(W[b.w].a+' '+W[b.w].t+' '+b.note+' '+b.p.join(' '))));
   $('#bh').textContent=`Из сборников · ${B.length}`;$('#bl').innerHTML=B.slice(0,blim).map(b=>bankCard(b,true)).join('')||'<p class="empty">Ничего не найдено</p>';$('#bm').hidden=B.length<=blim}}
 $('#sc').onclick=e=>{const b=e.target.closest('button');if(!b)return;cur=b.dataset.s;lim=20;blim=15;$$('#sc button').forEach(x=>x.setAttribute('aria-pressed',x===b));history.replaceState(null,'','#/argumenty'+(cur==='all'?'':'/'+cur));draw()};
 let tm;$('#as').oninput=e=>{clearTimeout(tm);tm=setTimeout(()=>{q=e.target.value;lim=20;blim=15;draw()},150)};
 $('#am').onclick=()=>{lim+=20;draw()};$('#bm').onclick=()=>{blim+=15;draw()};
 draw();loadBank().then(draw).catch(()=>$('#bl').innerHTML='<p class="empty">Не удалось загрузить сборники</p>')}

/* ===== 08 ПРОИЗВЕДЕНИЯ ===== */
function biblioteka(app){const p=PG.biblioteka;app.dataset.title=p.t;let f=store.get('libf','all'),q='',sec='all';
 const nf=D.WORKS.filter(w=>w.full).length;
 app.innerHTML=head(Object.assign({},p,{lede:`${D.WORKS.length} произведений из всех файлов. У ${nf} классических произведений есть полный текст прямо на сайте (они в общественном достоянии). Для остальных — подробный пересказ и ссылка, где прочитать.`}))+
 `<div class="search">${ICON.search}<input id="ws" type="search" placeholder="Автор, название или тема: Куприн, любовь, война…" aria-label="Поиск произведений"></div>
 <div class="seg" id="wf"><button data-f="all">Все</button><button data-f="full">С полным текстом</button><button data-f="card">С пересказом</button><button data-f="short">Короткие (до 30 мин)</button></div>
 <div class="chips" id="wsec"><button data-s="all" aria-pressed="true">Все разделы</button>${D.SECTIONS.map(S=>`<button data-s="${S.n}">${S.n}. ${esc(S.name)}</button>`).join('')}</div>
 <p class="small muted" id="wn"></p><div class="wcards" id="wl"></div>${pager('biblioteka')}`;
 const mins=w=>{if(w.full)return w.full.min;const m=String(w.time||'').match(/(\d+)\s*мин/);const h=String(w.time||'').match(/(\d+)[,–-]?\d*\s*час/);return m?+m[1]:(h?+h[1]*60:999)};
 function draw(){$$('#wf button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===f));const words=norm(q).trim().split(/\s+/).filter(Boolean);
  const L=D.WORKS.filter(w=>(f==='all'||(f==='full'&&w.full)||(f==='card'&&!w.stub)||(f==='short'&&mins(w)<=30))&&(sec==='all'||(w.r||[]).includes(+sec))&&words.every(x=>norm(w.a+' '+w.t+' '+(w.th||'')+' '+(w.g||'')).includes(x)));
  $('#wn').textContent=`Найдено: ${L.length}`;
  $('#wl').innerHTML=L.map(w=>`<a class="wcard" href="#/w/${w.id}"><span class="a">${esc(w.a)}</span><span class="t">${esc(w.t)}</span>${w.g?`<span class="g">${esc(w.g)}</span>`:''}<span class="tags">${w.full?'<span class="tag">полный текст</span>':''}${!w.stub?'<span class="tag out">пересказ</span>':''}${(w.arg||[]).length+(w.nb||0)?`<span class="tag out">${(w.arg||[]).length+(w.nb||0)} арг.</span>`:''}${w.full?`<span class="tag out">~${w.full.min<60?w.full.min+' мин':Math.round(w.full.min/60)+' ч'}</span>`:(w.time?`<span class="tag out">${esc(w.time.split('(')[0].trim())}</span>`:'')}</span></a>`).join('')||'<p class="empty">Ничего не найдено</p>'}
 $('#wf').onclick=e=>{const b=e.target.closest('button');if(b){f=b.dataset.f;store.set('libf',f);draw()}};
 $('#wsec').onclick=e=>{const b=e.target.closest('button');if(b){sec=b.dataset.s;$$('#wsec button').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()}};
 let tm;$('#ws').oninput=e=>{clearTimeout(tm);tm=setTimeout(()=>{q=e.target.value;draw()},120)};draw()}
function workPage(app,id){const w=W[id];if(!w){app.innerHTML='<p class="empty" style="margin-top:30px">Произведение не найдено. <a href="#/biblioteka">К списку</a></p>';return}
 app.dataset.title=w.t;const prog=store.get('rp:'+w.id,null);
 app.innerHTML=`<section class="page-head" data-num="08"><div class="eyebrow"><a href="#/biblioteka" style="color:inherit">Произведения</a> · ${esc(w.a)}</div><h1>${esc(w.t)}</h1><p>${esc(w.g||'')}${w.time?` · читать: ${esc(w.time)}`:''}</p>
 <div class="head-actions">${w.full?`<a class="btn primary" href="#/read/${w.id}">${ICON.book} ${prog?'Продолжить чтение':'Читать полностью'}</a>`:''}${w.link&&!w.full?`<a class="btn" href="${esc(w.link)}" target="_blank" rel="noopener">Где прочитать ↗</a>`:''}<a class="btn ghost" href="#/konstruktor?w=${w.id}">Использовать в конструкторе</a></div></section>
 <div class="wrap-narrow stack">
 ${w.th?`<div class="card"><h3>Темы и проблемы</h3><div class="tags">${w.th.split(/,\s*/).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>${(w.subs||[]).length?`<p class="small muted" style="margin:10px 0 0">Подходит к подразделам: ${w.subs.map(s=>`<a href="#/argumenty/${s}">${s}</a>`).join(', ')}</p>`:''}</div>`:((w.subs||[]).length?`<div class="card"><p class="small" style="margin:0">Подходит к подразделам: ${w.subs.map(s=>`<a href="#/argumenty/${s}">${s} ${esc(SUBNAME[s])}</a>`).join('; ')}</p></div>`:'')}
 ${w.h&&w.h.length?`<h2>Герои</h2><div class="heroes">${w.h.map(([n,d])=>`<div><b>${esc(n)}</b><span>${esc(d)}</span></div>`).join('')}</div>`:''}
 ${w.p&&w.p.length?`<h2>Пересказ${w.p.length>3?' по главам':''}</h2><div class="card retell">${w.p.map(x=>`<p>${x}</p>`).join('')}</div>`:(w.stub?`<div class="note"><b>Пересказа пока нет</b>Ниже — аргументы из сборников: в них кратко описаны герои и ключевые эпизоды.${w.full?' А полный текст можно прочитать прямо здесь.':''}</div>`:'')}
 ${(w.arg||[]).length?`<h2>Готовые аргументы</h2><div class="list">${w.arg.map(a=>argCard(w,a)).join('')}</div>`:''}
 <div id="wb"></div>
 ${w.full?`<p class="small muted">Полный текст: <a href="${esc(w.full.src)}" target="_blank" rel="noopener">ilibrary.ru</a> — произведение находится в общественном достоянии.</p>`:''}
 </div>`;
 argClicks(app);
 if(w.nb)loadBank().then(B=>{const L=B.filter(b=>b.w===w.id);$('#wb').innerHTML=`<h2>Аргументы из сборников · ${L.length}</h2><div class="list">${L.map(b=>bankCard(b,false)).join('')}</div>`})}

/* ===== ЧИТАЛКА ===== */
function reader(app,id){const w=W[id];if(!w||!w.full){location.hash='#/w/'+id;return}
 app.dataset.title=w.t+' — читать';let fs=store.get('rfs',19);
 app.innerHTML=`<div class="reader-bar"><a class="btn sm ghost" href="#/w/${w.id}">← К карточке</a><span class="rt">${esc(w.a)} «${esc(w.t)}»</span><button class="btn sm" id="rtoc">Оглавление</button><button class="btn sm icon" id="rm" aria-label="Мельче">A−</button><button class="btn sm icon" id="rp" aria-label="Крупнее">A+</button></div>
 <div class="reader" id="rd" style="--rs:${fs}px"><p class="muted" style="text-indent:0;text-align:center">Загрузка текста…</p></div>`;
 const rd=$('#rd');
 $('#rm').onclick=()=>{fs=Math.max(15,fs-1);rd.style.setProperty('--rs',fs+'px');store.set('rfs',fs)};
 $('#rp').onclick=()=>{fs=Math.min(26,fs+1);rd.style.setProperty('--rs',fs+'px');store.set('rfs',fs)};
 fetch('texts/'+id+'.json').then(r=>r.json()).then(d=>{let hi=0;const heads=[];
  rd.innerHTML=`<h1 style="text-align:center;font-size:1.8em;margin-bottom:.2em">${esc(w.t)}</h1><p style="text-align:center;text-indent:0" class="muted">${esc(w.a)}</p><div id="rtocBox" hidden class="card" style="font-family:var(--sans);font-size:15px;margin:20px 0"></div>`+
   d.b.map(([t,x])=>t==='h'?(heads.push(x),`<h2 id="ch${hi++}">${x}</h2>`):`<p>${x}</p>`).join('')+`<p class="src">Текст: <a href="${esc(w.full.src)}" target="_blank" rel="noopener">ilibrary.ru</a>. Произведение в общественном достоянии.</p>`;
  const tb=$('#rtocBox');tb.innerHTML=heads.length?`<b>Оглавление</b><ul class="toc-list">${heads.map((h,i)=>`<li><a href="#ch${i}" data-ch="${i}">${esc(plain(h).replace(/\n+/g,'. '))}</a></li>`).join('')}</ul>`:'<p class="muted" style="margin:0">У этого текста нет глав.</p>';
  $('#rtoc').onclick=()=>{tb.hidden=!tb.hidden;if(!tb.hidden)tb.scrollIntoView({behavior:'smooth',block:'center'})};
  tb.onclick=e=>{const a=e.target.closest('[data-ch]');if(!a)return;e.preventDefault();tb.hidden=true;document.getElementById('ch'+a.dataset.ch).scrollIntoView({behavior:'smooth'})};
  const saved=store.get('rp:'+id,null);if(saved){requestAnimationFrame(()=>{window.scrollTo(0,saved*(document.documentElement.scrollHeight-innerHeight));toast('Продолжаем с того же места')})}
  let t;window.onscroll=()=>{const h=document.documentElement.scrollHeight-innerHeight;const r=h>0?scrollY/h:0;$('#progress').style.width=(r*100)+'%';clearTimeout(t);t=setTimeout(()=>store.set('rp:'+id,r),300)}})
 .catch(()=>rd.innerHTML='<p class="empty">Не удалось загрузить текст. Проверь подключение к интернету.</p>')}

/* ===== 09 КОНСТРУКТОР ===== */
const STEMS=s=>[...new Set(norm(s).replace(/[^а-яa-z ]/g,' ').split(/\s+/).filter(x=>x.length>3&&!STOP.has(x)).map(x=>x.slice(0,Math.max(4,Math.min(6,x.length-2)))))];
const STOP=new Set('может можно ли какие какой какая каково каков почему зачем всегда нужно должен должны человек человека человеку людей люди жизни жизнь согласны утверждением словами мысль мысли разделяете убеждение автора романа понимаете слова своей свою свои этой этого чтобы когда тогда только также более менее очень между перед после будет быть было были есть если чем что как это все всё весь вашей ваше ваши вашего'.split(' '));
const SYN={дружб:['друз','друг','товарищ'],друз:['дружб'],любов:['любв','люб'],любв:['любов'],родин:['отечеств','патриот','родн'],отечеств:['родин','патриот'],природ:['эколог','лес','животн'],искусств:['музык','книг','литератур','живопис','художник','творчеств'],книг:['чтени','литератур','искусств'],войн:['подвиг','фронт','воен'],равнодуш:['безразлич','жестокост','черств'],жестокост:['равнодуш','злоб'],добр:['милосерд','сострада','отзывчив'],милосерд:['добр','сострада'],совест:['раская','чест'],чест:['совест','долг','достоинств'],семь:['родител','отц','дет','мать'],родител:['семь','отц','мать'],дет:['родител','семь','детств'],наук:['прогресс','технолог','открыт'],прогресс:['наук','технолог'],язык:['речь','слов'],речь:['язык','слов'],свобод:['ограничен','воля'],выбор:['решени','путь'],ошибк:['преступлен','раская'],одиночеств:['одинок','тоск'],мечт:['цель','надежд']};
function expand(stems){const out=new Set(stems);stems.forEach(s=>Object.entries(SYN).forEach(([k,v])=>{if(s.startsWith(k)||k.startsWith(s))v.forEach(x=>out.add(x))}));return [...out]}
function suggest(topic){const st=expand(STEMS(topic));if(!st.length)return [];
 const sc={};const why={};const add=(id,v,r)=>{if(!W[id])return;sc[id]=(sc[id]||0)+v;if(r)(why[id]=why[id]||new Set()).add(r)};
 const hits=s=>{s=norm(s);return st.filter(x=>s.includes(x)).length};
 D.WORKS.forEach(w=>{const h=hits((w.th||'')+' '+w.t);if(h)add(w.id,h*3,'темы произведения');(w.arg||[]).forEach(a=>{const k=hits(a.q);if(k)add(w.id,k*4,'похожий вопрос: «'+a.q+'»')})});
 D.THESES.concat(D.PLANS).forEach(t=>{const k=hits(t.q);if(k>=1)t.wids.forEach(id=>add(id,k*3,'есть в сборнике к теме «'+t.q.slice(0,60)+(t.q.length>60?'…':'')+'»'))});
 if(BANK)BANK.forEach(b=>{const k=hits(b.note||'');if(k)add(b.w,k*2,'аргумент в сборнике')});
 Object.keys(sc).forEach(id=>{const w=W[id];if(!w.stub)sc[id]+=2;if(w.full)sc[id]+=1});
 return Object.entries(sc).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id])=>({w:W[id],why:[...(why[id]||[])].slice(0,2)}))}
const TH_START={q:['Я считаю, что','По моему мнению,','На мой взгляд,'],agree:['Я согласен(на) с этим утверждением, потому что','Я полностью согласен(на) с этой мыслью:','Я не могу не согласиться с этим утверждением:'],author:['Я разделяю убеждение автора, потому что','Я полностью разделяю мысль автора:','Позиция автора мне близка:'],quote:['Я понимаю эти слова так:','По моему мнению, автор высказывания хотел сказать, что','Я согласен(на) с этой мыслью:'],nom:['Я считаю, что','Мне кажется, что','По моему мнению,'],me:['Для меня','Я считаю, что','Мне кажется, что'],diff:['На мой взгляд, разница в том, что','Я считаю, что','По моему мнению, главное различие в том, что'],can:['Я считаю, что','На мой взгляд, чаще всего','По моему мнению,']};
const INTROS=['Люди во все времена задумывались {kw_pr}.','Несмотря на то что мир постоянно меняется, до сих пор актуальным остаётся вопрос {kw_pr}.','Никто не станет отрицать важности {kw_rod} в жизни людей.','Каждый из нас хоть раз в жизни размышлял {kw_pr}.','С давних времён люди задумывались над вопросом {kw_pr}.'];
const A1=['Правильность своей точки зрения могу доказать, обратившись к {gd} {a} «{t}».','Обратимся к {gd} {a} «{t}».','Размышляя {kw_pr}, я не могу не обратиться к {gd} {a} «{t}».','Тема {kw_rod} затрагивается в {gp} {a} «{t}».'];
const A2=['Продолжая рассуждение, я вспомнил(а) {ga} {a} «{t}».','Обратимся к другому произведению, в котором также поднят вопрос {kw_pr}, — к {gd} {a} «{t}».','Посмотрим на ещё один пример — {ga} {a} «{t}».','Вопрос {kw_rod} затрагивается и в {gp} {a} «{t}».'];
const MV=['Таким образом, автор хочет донести до читателя мысль о том, что','Тем самым писатель убеждает читателя, что','Так, этот пример даёт читателю возможность убедиться в том, что','Внимательно проанализировав произведение, читатель может прийти к выводу, что'];
const CON=['Подводя итоги рассуждениям {kw_pr}, можно сделать вывод:','Итак, размышляя {kw_pr}, можно прийти к выводу, что','Обобщая сказанное {kw_pr}, хочется подчеркнуть, что'];
const HOPE=['Хочется верить, что','В заключение хочется выразить надежду на то, что','Заканчивая рассуждение на тему {kw_rod}, нельзя не сказать, что люди должны'];
const BEMPTY={topic:'',type:'',kw_im:'',kw_rod:'',kw_pr:'',def:'',answer:'',works:[null,null],args:['',''],mvs:['',''],concl:'',v:{intro:0,th:0,a1:0,a2:0,mv1:0,mv2:1,con:0,hope:0},text:'',edited:false,step:0,id:null};
function konstruktor(app,qs){const p=PG.konstruktor;app.dataset.title=p.t;
 const params=new URLSearchParams((location.hash.split('?')[1])||'');
 let B=Object.assign({},BEMPTY,store.get('builder',{}));B.v=Object.assign({},BEMPTY.v,B.v);
 if(params.get('t')){B=Object.assign({},BEMPTY,{v:Object.assign({},BEMPTY.v),topic:params.get('t'),works:[null,null],args:['',''],mvs:['','']});history.replaceState(null,'','#/konstruktor')}
 if(params.get('w')&&W[params.get('w')]){const id=params.get('w');if(!B.works.includes(id)){const i=B.works[0]?1:0;B.works[i]=id}B.step=Math.max(B.step,0);history.replaceState(null,'','#/konstruktor')}
 const save=()=>store.set('builder',B);save();
 const STEPS=[['Тема','тип и слово'],['Тезис','твой ответ'],['Аргументы','2 произведения'],['Черновик','сборка и проверка']];
 app.innerHTML=head(Object.assign({},p,{lede:'Вставь тему — конструктор определит её тип, подскажет подходящие произведения из базы, подставит клише и соберёт черновик, а потом проверит его по критериям. Это помощник, а не готовое сочинение: всё можно и нужно переписать своими словами.'}))+
 `<nav class="bsteps" id="bs">${STEPS.map((s,i)=>`<button data-i="${i}">${i+1}. ${s[0]}<span>${s[1]}</span></button>`).join('')}</nav><div id="bb"></div>`;
 const bb=$('#bb');
 $('#bs').onclick=e=>{const b=e.target.closest('button');if(b){B.step=+b.dataset.i;save();draw()}};
 function vals(){return {kw_im:B.kw_im,kw_rod:B.kw_rod,kw_pr:B.kw_pr,q:B.topic}}
 function fill(s,extra){const v=Object.assign(vals(),extra||{});return s.replace(/\{(\w+)\}/g,(m,k)=>v[k]||('['+(k==='kw_pr'?'о чём':k==='kw_rod'?'чего':k==='kw_im'?'что':k)+']'))}
 function draw(){$$('#bs button').forEach((b,i)=>{b.toggleAttribute('aria-current',i===B.step);if(i===B.step)b.setAttribute('aria-current','step');b.classList.toggle('done',i<B.step)});
  [s0,s1,s2,s3][B.step]()}
 function nav(prev,next,nextLabel){return `<div style="display:flex;justify-content:space-between;gap:8px;margin-top:16px">${prev!=null?`<button class="btn" data-go="${prev}">← Назад</button>`:'<span></span>'}${next!=null?`<button class="btn primary" data-go="${next}">${nextLabel||'Дальше'} →</button>`:''}</div>`}
 bb.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){B.step=+g.dataset.go;save();draw();window.scrollTo({top:$('#bs').offsetTop-80,behavior:'smooth'})}});
 // шаг 1
 function s0(){const t=B.topic?detectType(B.topic):null;const T=t&&D.KLTYPES.find(x=>x.id===t);
  bb.innerHTML=`<div class="card"><div class="field"><label for="bt">Тема сочинения</label><textarea id="bt" rows="2" placeholder="Например: Можно ли прожить без друзей?">${esc(B.topic)}</textarea><span class="hint">Скопируй тему целиком. Можно взять из раздела <a href="#/temy">«Темы и тезисы»</a>.</span></div>
  <div id="ttype">${T?`<div class="type-box"><span>Тип темы: <b>${esc(T.name)}</b></span><a class="btn sm" href="#/klishe/types" onclick="localStorage.setItem('ис:kltype','&quot;${t}&quot;')">Клише для этого типа</a></div><p class="small" style="margin:8px 0 0">${esc(T.trap)}</p>`:''}</div></div>
  <div class="card"><h3>Ключевое слово темы</h3><p class="small muted">Главное понятие (дружба, совесть, равнодушие). Напиши его в трёх формах — так клише встанут без ошибок.</p>
  <div class="grid g3"><div class="field"><label for="k1">Что? (им. п.)</label><input id="k1" data-k="kw_im" value="${esc(B.kw_im)}" placeholder="дружба"></div><div class="field"><label for="k2">Чего? (род. п.)</label><input id="k2" data-k="kw_rod" value="${esc(B.kw_rod)}" placeholder="дружбы"></div><div class="field"><label for="k3">О чём? (с предлогом)</label><input id="k3" data-k="kw_pr" value="${esc(B.kw_pr)}" placeholder="о дружбе"></div></div>
  <div class="field"><label for="kd">Определение — одной фразой (по желанию)</label><input id="kd" data-k="def" value="${esc(B.def)}" placeholder="это близкие отношения, основанные на доверии и взаимной поддержке"></div></div>${nav(null,1)}`;
  $('#bt').oninput=e=>{B.topic=e.target.value;save();const t=detectType(B.topic);const T=D.KLTYPES.find(x=>x.id===t);$('#ttype').innerHTML=B.topic.trim()?`<div class="type-box"><span>Тип темы: <b>${esc(T.name)}</b></span></div><p class="small" style="margin:8px 0 0">${esc(T.trap)}</p>`:''};
  bb.querySelectorAll('[data-k]').forEach(i=>i.oninput=()=>{B[i.dataset.k]=i.value;B.edited=false;save()});
  $('#k1').addEventListener('change',()=>{const v=B.kw_im.trim();if(v&&!B.kw_rod){B.kw_rod=guessRod(v);$('#k2').value=B.kw_rod}if(v&&!B.kw_pr){B.kw_pr=guessPr(v);$('#k3').value=B.kw_pr}save()})}
 // шаг 2
 function s1(){const t=detectType(B.topic);const starts=TH_START[t]||TH_START.q;
  const similar=B.topic?D.THESES.map(x=>({x,k:STEMS(x.q).filter(s=>STEMS(B.topic).includes(s)).length})).filter(o=>o.k>0).sort((a,b)=>b.k-a.k).slice(0,3):[];
  bb.innerHTML=`<div class="card"><p class="tag">${esc(B.topic||'Тема не указана — вернись на шаг 1')}</p>
  <div class="note"><b>Как писать тезис</b>Тезис — прямой ответ на вопрос темы. Пиши его под аргументы: сначала подумай, какие 2 произведения ты знаешь и что они доказывают (шаг 3), потом вернись сюда и уточни ответ.</div>
  <div class="field"><label>Начало тезиса</label><div class="seg" id="ths" style="margin:0">${starts.map((s,i)=>`<button data-i="${i}" aria-pressed="${B.v.th%starts.length===i}">${esc(s)}</button>`).join('')}</div></div>
  <div class="field"><label for="ba">Твой ответ на вопрос (продолжение фразы)</label><textarea id="ba" rows="3" placeholder="без друзей жизнь становится пустой и одинокой, ведь именно друзья поддерживают нас в трудную минуту">${esc(B.answer)}</textarea><span class="hint">Хорошо, если ответ из двух частей — по одной на каждый аргумент.</span></div>
  <p class="small"><b>Получится:</b> <span id="thp" style="font-family:var(--serif)"></span></p></div>
  ${similar.length?`<div class="card"><h3>Похожие темы из сборника — подсмотри тезисы</h3>${similar.map(({x})=>`<div class="para"><div class="lab">${x.n}</div><div><b>${esc(x.q)}</b>${x.pts.length?`<ul class="clean small">${x.pts.slice(0,4).map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:''}<div class="readlist">${readItems(x)}</div></div></div>`).join('')}</div>`:''}
  ${nav(0,2)}`;
  const upd=()=>$('#thp').textContent=starts[B.v.th%starts.length]+' '+(B.answer||'…');upd();
  $('#ths').onclick=e=>{const b=e.target.closest('button');if(!b)return;B.v.th=+b.dataset.i;B.edited=false;save();$$('#ths button').forEach(x=>x.setAttribute('aria-pressed',x===b));upd()};
  $('#ba').oninput=e=>{B.answer=e.target.value;B.edited=false;save();upd()}}
 // шаг 3
 function s2(){bb.innerHTML=`<div class="card"><h3>Подходящие произведения</h3><p class="small muted">Подобраны по словам темы — из тем произведений, разобранных аргументов и сборников. Выбери два (или найди своё в поиске ниже).</p><div class="sugg" id="sg"><p class="muted">Подбираю…</p></div>
  <div class="field" style="margin-top:14px"><label for="bw">Найти другое произведение</label><input id="bw" list="wlist" placeholder="Начни вводить название или автора"><datalist id="wlist">${D.WORKS.map(w=>`<option value="${esc(w.a)} «${esc(w.t)}»">`).join('')}</datalist></div></div>
  <div class="grid g2" id="bargs"></div>${nav(1,3,'Собрать черновик')}`;
  const sg=$('#sg');
  function list(){const S=suggest(B.topic+' '+B.kw_im+' '+B.answer);B.works.filter(Boolean).forEach(id=>{if(!S.find(s=>s.w.id===id))S.unshift({w:W[id],why:['выбрано вручную']})});
   sg.innerHTML=S.length?S.map(({w,why})=>`<label><input type="checkbox" value="${w.id}" ${B.works.includes(w.id)?'checked':''}><span><b>${esc(w.a)} «${esc(w.t)}»</b>${w.full?' <span class="tag out">полный текст</span>':''}<br><span class="why">${why.map(esc).join(' · ')}</span></span></label>`).join(''):'<p class="muted">Вставь тему на шаге 1 — и здесь появятся подсказки. Или выбери произведение через поиск.</p>'}
  list();if(!BANK)loadBank().then(list).catch(()=>{});
  sg.onchange=e=>{const c=e.target;if(c.checked){if(B.works.filter(Boolean).length>=2){c.checked=false;toast('Можно выбрать два произведения');return}B.works[B.works[0]?1:0]=c.value}else{B.works=B.works.map(x=>x===c.value?null:x)}B.edited=false;save();argsBox()};
  $('#bw').onchange=e=>{const v=e.target.value;const w=D.WORKS.find(w=>`${w.a} «${w.t}»`===v);if(!w)return;if(B.works.filter(Boolean).length>=2)B.works[1]=w.id;else B.works[B.works[0]?1:0]=w.id;e.target.value='';B.edited=false;save();list();argsBox()};
  argsBox()}
 function argsBox(){const box=$('#bargs');if(!box)return;
  box.innerHTML=[0,1].map(i=>{const w=W[B.works[i]];if(!w)return `<div class="card"><h3>Аргумент ${i+1}</h3><p class="muted">Выбери произведение выше.</p></div>`;
   const opts=(w.arg||[]).map((a,j)=>`<button class="btn sm" data-use="${i}:c:${j}">${esc(a.q)}</button>`).join(' ');
   return `<div class="card"><h3>Аргумент ${i+1}: ${esc(w.a)} «${esc(w.t)}»</h3>
   ${opts?`<p class="small muted" style="margin-bottom:6px">Вставить готовый пример (потом перескажи своими словами):</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${opts}</div>`:''}
   ${w.nb?`<button class="btn sm ghost" data-bank="${i}" style="margin-bottom:10px">Аргументы из сборников (${w.nb})</button><div data-bl="${i}"></div>`:''}
   <div class="field"><label for="ar${i}">Что происходит в произведении (2–4 предложения, только нужный эпизод)</label><textarea id="ar${i}" data-ar="${i}" rows="6" placeholder="Герой… Он… В итоге…">${esc(B.args[i])}</textarea></div>
   <div class="field"><label for="mv${i}">Что доказывает этот пример (микровывод)</label><input id="mv${i}" data-mv="${i}" value="${esc((B.mvs||[])[i]||'')}" placeholder="${i===0?'настоящий друг готов помочь в беде':'одиночество делает человека несчастным'}"><span class="hint">Одна часть тезиса другими словами — так микровывод не будет дословно повторять тезис.</span></div>
   <a class="small" href="#/w/${w.id}" target="_blank">Открыть пересказ${w.full?' и полный текст':''} ↗</a></div>`}).join('');
  box.oninput=e=>{const t=e.target.closest('[data-ar]');if(t){B.args[t.dataset.ar]=t.value;B.edited=false;save()}const m=e.target.closest('[data-mv]');if(m){B.mvs=B.mvs||['',''];B.mvs[m.dataset.mv]=m.value;B.edited=false;save()}};
  box.onclick=e=>{const u=e.target.closest('[data-use]');if(u){const [i,kind,j]=u.dataset.use.split(':');const w=W[B.works[i]];let t=kind==='c'?plain(w.arg[j].t):BANK.filter(b=>b.w===w.id)[j].p.join(' ');
    t=t.replace(/\s*Микровывод:.*$/,'').trim().replace(/^В [^«]{0,80}«[^»]+»,?\s*/,'');t=t.charAt(0).toUpperCase()+t.slice(1);
    const mvm=kind==='c'&&plain(w.arg[j].t).match(/Микровывод:\s*(?:[^,]+?(?:показывает|убеждает|подчёркивает|хочет сказать)[^,]*?,?\s*что\s+)?(.+)$/);if(mvm&&!(B.mvs||[])[i]){B.mvs=B.mvs||['',''];B.mvs[i]=mvm[1].replace(/[.]$/,'');const mi=$(`#mv${i}`);if(mi)mi.value=B.mvs[i]}
    B.args[i]=t;B.edited=false;save();$(`#ar${i}`).value=t;toast('Вставлено — перескажи своими словами');return}
   const bk=e.target.closest('[data-bank]');if(bk){const i=bk.dataset.bank;loadBank().then(BK=>{const L=BK.filter(b=>b.w===B.works[i]);$(`[data-bl="${i}"]`).innerHTML=L.map((b,j)=>`<div class="item" style="margin-bottom:8px"><p class="small clamp" style="margin:0 0 6px">${esc(b.p.join(' '))}</p><button class="btn sm" data-use="${i}:b:${j}">Вставить</button></div>`).join('')})}}}
 // шаг 4
 function compose(){const t=detectType(B.topic);const starts=TH_START[t]||TH_START.q;const v=B.v;
  const ws=B.works.map(id=>W[id]);
  const wv=w=>{if(!w)return {ga:'произведение',gd:'произведению',gp:'произведении',a:'[автор]',t:'[название]'};const f=genreForms(w.g);return {ga:f[0],gd:f[1],gp:f[2],a:genAuthor(w.a),t:w.t}};
  const thesis=`${starts[v.th%starts.length]} ${B.answer||'[твой ответ на вопрос]'}`.replace(/\s+/g,' ').trim().replace(/([^.!?])$/,'$1.');
  let intro=fill(INTROS[v.intro%INTROS.length]);
  if(B.def&&B.kw_im)intro+=` ${B.kw_im[0].toUpperCase()+B.kw_im.slice(1)} — ${B.def.replace(/^это\s+/,'это ')}`.replace(/([^.!?])$/,'$1.');
  if(B.topic&&/\?\s*$/.test(B.topic))intro+=' '+B.topic.trim();
  const ansShort=(B.answer||'[тезис другими словами]').replace(/[.!]$/,'');
  const p=[intro+' '+thesis];
  [0,1].forEach(i=>{const tpl=(i===0?A1:A2)[(i===0?v.a1:v.a2)%(i===0?A1:A2).length];
   const mvText=(B.mvs&&B.mvs[i]||'').trim().replace(/[.!]$/,'')||'[что доказывает этот пример — часть тезиса другими словами]';
   p.push(`${fill(tpl,wv(ws[i]))} ${B.args[i]||'[что происходит в произведении: герой, поступок, итог]'} ${MV[(i===0?v.mv1:v.mv2)%MV.length]} ${mvText}.`.replace(/\s+/g,' ').replace(/\.\./g,'.'))});
  p.push(`${fill(CON[v.con%CON.length])} ${ansShort}. ${fill(HOPE[v.hope%HOPE.length])} [пожелание / надежда].`);
  return p.join('\n\n')}
 function s3(){if(!B.edited||!B.text)B.text=compose();save();
  bb.innerHTML=`<div class="bgrid"><div class="card"><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px"><button class="btn sm" data-sw="intro">Другое вступление</button><button class="btn sm" data-sw="a1">Другой переход 1</button><button class="btn sm" data-sw="a2">Другой переход 2</button><button class="btn sm" data-sw="mv">Другие микровыводы</button><button class="btn sm" data-sw="con">Другое заключение</button></div>
  <div class="field" style="margin:0"><label for="bo">Черновик — редактируй прямо здесь. Квадратные скобки [ ] — то, что нужно дописать самому.</label><textarea id="bo" class="essay-out">${esc(B.text)}</textarea></div>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"><button class="btn primary" id="bcp">${ICON.copy} Скопировать</button><button class="btn" id="bsv">Сохранить черновик</button><button class="btn ghost" id="brs">Пересобрать из шагов</button><button class="btn ghost" id="bnew">Новое сочинение</button></div></div>
  <div class="sticky-side"><div class="card"><div class="wcount" id="wc">0 <small>слов</small></div><div class="meter"><i id="wm"></i></div><p class="small muted" style="margin:0">Минимум 250, лучше 350+. Считаю по правилам экзамена.</p></div><div class="card"><h3>Проверка по критериям</h3><div class="checks" id="ck"></div></div></div></div>${nav(2,null)}`;
  const ta=$('#bo');const run=()=>{const r=checkEssay(ta.value,B);$('#wc').innerHTML=`${r.words} <small>${plural(r.words,'слово','слова','слов')}</small>`;$('#wm').style.width=Math.min(100,r.words/350*100)+'%';
   $('#ck').innerHTML=r.list.map(c=>`<div class="${c[0]}"><span class="ic">${c[0]==='ok'?'✓':c[0]==='bad'?'!':'~'}</span><span>${c[1]}</span></div>`).join('')};
  const grow=()=>{ta.style.height='auto';ta.style.height=Math.max(560,ta.scrollHeight+4)+'px'};ta.oninput=()=>{B.text=ta.value;B.edited=true;save();run();grow()};run();requestAnimationFrame(grow);
  bb.querySelector('.card').addEventListener('click',e=>{const s=e.target.closest('[data-sw]');if(!s)return;if(B.edited&&!confirm('Черновик изменён вручную. Пересобрать с другой фразой? Правки пропадут.'))return;
   const k=s.dataset.sw;if(k==='mv'){B.v.mv1++;B.v.mv2++}else if(k==='con'){B.v.con++;B.v.hope++}else B.v[k]++;B.edited=false;B.text=compose();ta.value=B.text;save();run();grow()});
  $('#bcp').onclick=()=>copy(ta.value,'Черновик скопирован');
  $('#brs').onclick=()=>{if(B.edited&&!confirm('Пересобрать черновик из шагов? Ручные правки пропадут.'))return;B.edited=false;B.text=compose();ta.value=B.text;save();run()};
  $('#bnew').onclick=()=>{if(!confirm('Начать новое сочинение? Текущий черновик лучше сначала сохранить.'))return;B=Object.assign({},BEMPTY,{v:Object.assign({},BEMPTY.v),works:[null,null],args:['',''],mvs:['','']});save();draw()};
  $('#bsv').onclick=()=>saveDraft(B).then(()=>toast(USER?'Сохранено в аккаунте':'Сохранено в этом браузере'))}
 draw()}
function guessRod(w){w=w.trim();if(/ость$/.test(w))return w.slice(0,-1)+'и';if(/[^и]е$/.test(w))return w.slice(0,-1)+'я';if(/ие$/.test(w))return w.slice(0,-1)+'я';if(/[жшчщкгх]а$/.test(w))return w.slice(0,-1)+'и';if(/а$/.test(w))return w.slice(0,-1)+'ы';if(/я$/.test(w))return w.slice(0,-1)+'и';if(/ь$/.test(w))return w.slice(0,-1)+'и';if(/о$/.test(w))return w.slice(0,-1)+'а';if(/[бвгджзклмнпрстфхцчшщ]$/.test(w))return w+'а';return w}
function guessPr(w){w=w.trim();let r=w;if(/ость$/.test(w))r=w.slice(0,-1)+'и';else if(/ие$/.test(w))r=w.slice(0,-1)+'и';else if(/[ая]$/.test(w))r=w.slice(0,-1)+'е';else if(/ь$/.test(w))r=w.slice(0,-1)+'и';else if(/о$/.test(w))r=w.slice(0,-1)+'е';else if(/[бвгджзклмнпрстфхцчшщ]$/.test(w))r=w+'е';return (/^[аоуэиыАОУЭИЫ]/.test(r)?'об ':'о ')+r}
function checkEssay(txt,B){const words=countWords(txt);const L=[];const t=norm(txt);
 L.push(words>=350?['ok',`Объём ${words} слов — отлично`]:words>=250?['mid',`${words} слов — допуск есть, но лучше добрать до 350`]:['bad',`Только ${words} слов — меньше 250 означает незачёт`]);
 const paras=txt.split(/\n\s*\n/).filter(s=>s.trim()).length;L.push(paras>=4?['ok',`Абзацев: ${paras} (вступление, 2 аргумента, заключение)`]:['bad',`Абзацев: ${paras}. Нужно минимум 4 — раздели текст пустыми строками (К3)`]);
 const gaps=(txt.match(/\[[^\]]*\]/g)||[]).length;L.push(gaps?['bad',`Осталось незаполненных мест [ ]: ${gaps}`]:['ok','Все пропуски заполнены']);
 const kw=B.kw_im?norm(B.kw_im).slice(0,Math.max(4,B.kw_im.length-2)):'';
 if(kw){const parts=txt.split(/\n\s*\n/);const first=norm(parts[0]||''),last=norm(parts[parts.length-1]||'');
  L.push(first.includes(kw)&&last.includes(kw)?['ok',`Ключевое слово «${esc(B.kw_im)}» есть во вступлении и заключении (К1)`]:['mid',`Повтори ключевое слово «${esc(B.kw_im)}» во вступлении и в заключении — так видно, что ты в теме (К1)`])}
 const thesis=/(я считаю|по моему мнению|на мой взгляд|я уверен|мне кажется|я убежд|я согласен|я согласна|я разделяю|я понимаю эти слова|для меня)/.test(t);L.push(thesis?['ok','Есть тезис с личной позицией (К1)']:['bad','Не видно тезиса: добавь «Я считаю, что…» с ответом на вопрос (К1)']);
 const known=new Set(D.WORKS.map(w=>norm(w.t)));const uniq=[...new Set([...txt.matchAll(/(\S+\s+\S+\s*)«([^»]{2,})»/g)].filter(m=>known.has(norm(m[2]))||/[А-ЯЁ]\.\s?(?:[А-ЯЁ]\.)?\s?[А-ЯЁ][а-яё-]+\s*$/.test(m[1])).map(m=>norm(m[2])))];
 L.push(uniq.length>=2?['ok',`Названо произведений: ${uniq.length} (К2)`]:uniq.length===1?['mid','Одно произведение — для зачёта достаточно, но надёжнее два (К2)']:['bad','Не названо ни одного произведения в «кавычках» (К2)']);
 const mv=(t.match(/таким образом|тем самым|можно прийти к выводу|автор (хочет|показывает|убеждает|подч[её]ркивает)|писатель (показывает|убеждает)|этот пример/g)||[]).length;L.push(mv>=2?['ok','Есть микровыводы после аргументов (К2, К3)']:['mid','Добавь микровывод после каждого аргумента: «Таким образом, автор показывает…»']);
 const freq={};(t.match(/[а-яё]{5,}/g)||[]).forEach(w=>{const s=w.slice(0,6);if(!STOP.has(w))freq[s]=(freq[s]||0)+1});const rep=Object.entries(freq).filter(([s,n])=>n>=6&&(!kw||!kw.startsWith(s.slice(0,4)))).map(([s])=>s+'…');
 L.push(rep.length?['mid',`Часто повторяется: ${rep.slice(0,4).join(', ')} — замени синонимами (К4)`]:['ok','Сильных повторов не видно (К4)']);
 const said=(t.match(/автор говорит|писатель говорит/g)||[]).length;if(said)L.push(['mid','Вместо «автор говорит» лучше: показывает, подчёркивает, убеждает (К4)']);
 const long=txt.split(/[.!?]+/).filter(s=>countWords(s)>40).length;if(long)L.push(['mid',`Очень длинных предложений: ${long}. Раздели их — меньше риск пунктуационных ошибок (К5)`]);
 return {words,list:L}}

/* ===== 10 В ДЕНЬ СОЧИНЕНИЯ ===== */
function den(app){const p=PG.den;app.dataset.title=p.t;const items=['Тезис прямо отвечает на вопрос темы','Ключевое слово темы есть во вступлении, тезисе и заключении','Минимум 1 литературный аргумент, лучше 2','В каждом аргументе: автор, название, герой, эпизод','После каждого аргумента — микровывод, связанный с тезисом','Заключение повторяет тезис другими словами и не спорит с ним','Имена героев и авторов написаны правильно','Не меньше 250 слов (лучше 350+)','4–5 абзацев','Нет «воды» и повторов одной мысли','Проверены запятые при причастных и деепричастных оборотах, «не» с глаголами, -тся/-ться'];
 const st=store.get('daycheck',[]);
 app.innerHTML=head(p)+`<div class="grid g2" style="align-items:start"><div class="stack">
 <div class="card"><h2 style="margin-top:0">План на 3 часа 55 минут</h2><div class="timeline">
  <div><b>0:00–0:15</b><br>Читаешь 6 тем, выбираешь одну, к которой есть 2 произведения.</div>
  <div><b>0:15–0:35</b><br>На черновике: ключевое понятие + определение, 2 произведения, эпизоды, выводы → тезис.</div>
  <div><b>0:35–1:50</b><br>Пишешь черновик по шаблону: вступление → аргумент 1 → аргумент 2 → заключение.</div>
  <div><b>1:50–2:10</b><br>Считаешь слова, проверяешь логику: каждый микровывод «смотрит» на тезис?</div>
  <div><b>2:10–3:20</b><br>Аккуратно переписываешь на бланк, сверяясь со словарём.</div>
  <div><b>3:20–3:55</b><br>Проверка грамотности: запятые, «не» с глаголами, -тся/-ться, имена героев.</div></div></div>
 <div class="card"><h2 style="margin-top:0">Что взять с собой</h2><ul class="clean"><li>Паспорт.</li><li>Чёрная гелевая ручка, лучше две.</li><li>Лекарства, питание и вода — если это разрешено в твоём пункте.</li><li>Телефон и шпаргалки пользоваться нельзя — всё нужное держи в голове.</li></ul></div></div>
 <div class="stack"><div class="card"><h2 style="margin-top:0">Чек-лист перед сдачей</h2><div class="checks" id="dc">${items.map((x,i)=>`<label class="check" style="background:var(--surface);color:var(--ink);border:1px solid var(--line)"><input type="checkbox" data-i="${i}" ${st[i]?'checked':''}> ${esc(x)}</label>`).join('')}</div><button class="btn sm ghost" id="dcr" style="margin-top:10px">Сбросить</button></div>
 <div class="card"><h2 style="margin-top:0">Счётчик слов</h2><p class="small muted">Вставь черновик — посчитаю так, как считают на экзамене: инициалы и цифры не отдельные слова, слова через дефис — одно.</p><textarea id="wcT" class="field" style="width:100%;min-height:180px;padding:12px;border-radius:12px;border:1px solid var(--line);background:var(--surface);font:inherit"></textarea><div class="wcount" id="wcN">0 <small>слов</small></div><div class="meter"><i id="wcM"></i></div></div></div></div>${pager('den')}`;
 $('#dc').onchange=e=>{const a=store.get('daycheck',[]);a[e.target.dataset.i]=e.target.checked;store.set('daycheck',a)};
 $('#dcr').onclick=()=>{store.set('daycheck',[]);$$('#dc input').forEach(i=>i.checked=false)};
 $('#wcT').oninput=e=>{const n=countWords(e.target.value);$('#wcN').innerHTML=`${n} <small>${plural(n,'слово','слова','слов')}${n<250?' — нужно ещё '+(250-n):''}</small>`;$('#wcM').style.width=Math.min(100,n/350*100)+'%'}}

/* ===== ПРОФИЛЬ, РЕГИСТРАЦИЯ (Supabase) ===== */
let SB=null,USER=null,SBP=null;
function loadLib(){return window.supabase&&window.supabase.createClient?Promise.resolve():new Promise((res,rej)=>{const s=document.createElement('script');s.src='assets/supabase.js';s.onload=res;s.onerror=()=>rej(new Error('lib'));document.head.appendChild(s)})}
function sb(){if(!CFG.supabaseUrl||!CFG.supabaseAnonKey)return Promise.resolve(null);if(SBP)return SBP;
 SBP=(async()=>{await loadLib();
  SB=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true}});
  const {data}=await SB.auth.getSession();USER=data.session?.user||null;
  SB.auth.onAuthStateChange((ev,s)=>{USER=s?.user||null;updUser();if(ev==='SIGNED_IN'&&/[?&]code=/.test(location.search)){history.replaceState(null,'',location.pathname+'#/profil');route()}});
  updUser();if(USER)syncNow().then(afterSync).catch(()=>{});return SB})();
 SBP.catch(()=>{SBP=null});return SBP}
async function pushSync(){const c=await sb().catch(()=>null);if(!c||!USER)return;const t=tmap();const data={};
 for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||!k.startsWith('ис:'))continue;const kk=k.slice(3);if(SYNCK.test(kk))data[kk]={v:localStorage.getItem(k),t:t[kk]||0}}
 await c.from('progress').upsert({user_id:USER.id,data,updated_at:new Date().toISOString()})}
async function syncNow(){const c=await sb().catch(()=>null);if(!c||!USER)return false;
 const {data:rows,error}=await c.from('progress').select('data');if(error)return false;
 const remote=(rows&&rows[0]&&rows[0].data)||{};const t=tmap();let changed=false,push=false;
 for(const [k,o] of Object.entries(remote)){if(!SYNCK.test(k)||!o)continue;const lt=t[k]||0;if(o.t>lt){try{localStorage.setItem('ис:'+k,o.v)}catch(e){}t[k]=o.t;changed=true}else if(o.t<lt)push=true}
 for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('ис:')&&SYNCK.test(k.slice(3))&&!remote[k.slice(3)])push=true}
 try{localStorage.setItem(TM,JSON.stringify(t))}catch(e){}
 if(push)await pushSync();return changed}
function afterSync(changed){if(!changed)return;toast('Прогресс подтянут из аккаунта');const a=document.activeElement;
 if(!/^(INPUT|TEXTAREA)$/.test((a&&a.tagName)||'')&&!/^#\/(read|konstruktor)/.test(location.hash)){route.keepScroll=true;route()}}
function updUser(){const b=$('#userBtn');b.title=USER?'Профиль: '+USER.email:'Профиль';b.style.background=USER?'var(--args-t)':''}
let tracked=new Set();async function track(page){try{const c=await sb();if(!c||tracked.has(page))return;tracked.add(page);await c.rpc('track_visit',{p_page:page})}catch(e){}}
async function saveDraft(B){const d={id:B.id||('d'+Date.now()),topic:B.topic||'Без темы',text:B.text,state:B,updated:new Date().toISOString()};B.id=d.id;
 const L=store.get('drafts',[]).filter(x=>x.id!==d.id);L.unshift(d);store.set('drafts',L.slice(0,30));store.set('builder',B);
 const c=await sb().catch(()=>null);if(c&&USER){await c.from('drafts').upsert({id:d.id,user_id:USER.id,topic:d.topic,body:d.text,state:B,updated_at:d.updated})}}
async function listDrafts(){let L=store.get('drafts',[]);const c=await sb().catch(()=>null);
 if(c&&USER){const {data}=await c.from('drafts').select('id,topic,body,state,updated_at').order('updated_at',{ascending:false});if(data){const ids=new Set(data.map(x=>x.id));L=data.map(x=>({id:x.id,topic:x.topic,text:x.body,state:x.state,updated:x.updated_at,cloud:true})).concat(L.filter(x=>!ids.has(x.id)))}}
 return L}
function profil(app){app.dataset.title='Профиль';
 app.innerHTML=`<section class="page-head" style="--acc-t:var(--line-2);--acc-x:var(--ink);--acc-d:var(--muted)" data-num=""><div class="eyebrow">Профиль</div><h1>Черновики и вход</h1><p>${CFG.supabaseUrl?'Создай аккаунт, чтобы прогресс (место в читалке, галочки, клише, черновики) сохранялся и открывался с любого устройства. Регистрация не обязательна.':'Черновики из конструктора хранятся в этом браузере.'}</p></section><div class="grid g2" style="align-items:start"><div id="pa"></div><div class="card"><h2 style="margin-top:0">Мои черновики</h2><div id="pd"><p class="muted">Загрузка…</p></div></div></div>`;
 const pa=$('#pa');
 const drawDrafts=()=>listDrafts().then(L=>{$('#pd').innerHTML=L.length?L.map(d=>`<div class="item" style="margin-bottom:8px"><b>${esc(d.topic)}</b><p class="small muted" style="margin:2px 0 8px">${new Date(d.updated).toLocaleString('ru-RU')} · ${countWords(d.text||'')} слов${d.cloud?' · в аккаунте':''}</p><button class="btn sm" data-open="${d.id}">Открыть в конструкторе</button> <button class="btn sm ghost" data-del="${d.id}">Удалить</button></div>`).join(''):'<p class="muted">Пока пусто. Собери сочинение в <a href="#/konstruktor">конструкторе</a> и нажми «Сохранить черновик».</p>';
  $('#pd').onclick=async e=>{const o=e.target.closest('[data-open]'),dl=e.target.closest('[data-del]');const L2=await listDrafts();
   if(o){const d=L2.find(x=>x.id===o.dataset.open);if(d&&d.state){store.set('builder',Object.assign({},d.state,{step:3,text:d.text,edited:true,id:d.id}));location.hash='#/konstruktor'}}
   if(dl&&confirm('Удалить черновик?')){store.set('drafts',store.get('drafts',[]).filter(x=>x.id!==dl.dataset.del));const c=await sb().catch(()=>null);if(c&&USER)await c.from('drafts').delete().eq('id',dl.dataset.del);drawDrafts()}}});
 drawDrafts();
 if(!CFG.supabaseUrl){pa.innerHTML=`<div class="card"><h2 style="margin-top:0">Регистрация</h2><p>Вход пока не подключён. Сайт полностью работает и без него.</p><p class="small muted">Для владельца сайта: инструкция по подключению — в файле SETUP.md в репозитории.</p></div>`;return}
 pa.innerHTML='<div class="card"><p class="muted">Подключаюсь…</p></div>';
 sb().then(async c=>{let count='';try{const {data}=await c.rpc('users_count');if(data!=null)count=`<p class="small muted">С путеводителем уже ${data} ${plural(data,'человек','человека','человек')}.</p>`}catch(e){}
  const spin='<span class="spin"></span> ';
  if(USER){pa.innerHTML=`<div class="card login-box"><h2 style="margin-top:0">Вход выполнен</h2><p><b>${esc(USER.email)}</b></p>${count}<p class="small muted">Место в читалке, галочки в чек-листах, клише, черновик конструктора и сохранённые черновики теперь хранятся в аккаунте и открываются на любом устройстве.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="sn">Синхронизировать сейчас</button><button class="btn ghost" id="lo">Выйти</button></div><p class="small" id="sm"></p></div>`;
   $('#lo').onclick=async()=>{await c.auth.signOut();USER=null;updUser();profil(app)};
   $('#sn').onclick=async()=>{$('#sm').innerHTML=spin+'Синхронизирую…';try{await pushSync();const ch=await syncNow();$('#sm').textContent=ch?'Подтянули данные с другого устройства.':'Всё сохранено.'}catch(e){$('#sm').textContent='Не получилось: '+e.message}};return}
  const errRu=er=>{const m=(er.message||'')+' '+(er.code||'');
   if(/Invalid login/i.test(m))return 'Неверная почта или пароль.';
   if(/already registered|already been registered|user_already_exists/i.test(m))return 'Эта почта уже зарегистрирована. Войди с паролем'+(CFG.emailsWork?' или восстанови его.':'.');
   if(/rate limit|too many|429|after \d+ seconds/i.test(m))return 'Слишком много попыток. Подожди минуту и попробуй снова.';
   if(/weak|least \d+ char|password should/i.test(m))return 'Пароль слишком простой: нужно не меньше 8 символов.';
   if(/valid email|invalid.*email|email_address_invalid/i.test(m))return 'Проверь адрес почты.';
   if(/expired|otp|token/i.test(m))return 'Код не подошёл или устарел. Проверь цифры или запроси новый.';
   return 'Ошибка: '+er.message};
  const done=async msg=>{const r=await c.auth.getUser();USER=r.data.user;updUser();try{await syncNow()}catch(e){}toast(msg);profil(app)};
  const card=h=>{pa.innerHTML=`<div class="card login-box">${h}</div>`};
  const timer=(btn)=>{let left=60;const tick=()=>{if(!btn.isConnected)return;btn.textContent=left>0?`Отправить ещё раз (${left})`:'Отправить ещё раз';btn.disabled=left>0;if(left-->0)setTimeout(tick,1000)};tick();return ()=>{left=60;tick()}};
  function codeStep(em,type){const rec=type==='recovery';
   card(`<h2 style="margin-top:0">Введи код из письма</h2><p class="small">Мы отправили письмо на <b>${esc(em)}</b>. Введи код из него${rec?' и придумай новый пароль':''}. Письмо может идти пару минут; загляни в «Спам» и «Промоакции».</p>
   <form id="cf"><div class="field"><label for="cc">Код из письма</label><input id="cc" inputmode="numeric" autocomplete="one-time-code" maxlength="10" required placeholder="123456" style="letter-spacing:.2em;font-size:20px"></div>
   ${rec?'<div class="field"><label for="np">Новый пароль</label><input id="np" type="password" minlength="8" required autocomplete="new-password" placeholder="не меньше 8 символов"></div>':''}
   <button class="btn primary" type="submit">${rec?'Сохранить пароль и войти':'Подтвердить'}</button></form><p class="small" id="cm" style="margin-top:10px"></p>
   <p class="small"><button class="btn sm ghost" id="cr" disabled>Отправить ещё раз</button> <button class="btn sm ghost" id="cb">Назад</button></p>`);
   const again=timer($('#cr'));$('#cb').onclick=()=>form('login',em);
   $('#cr').onclick=async()=>{again();$('#cm').innerHTML=spin+'Отправляю…';const {error}=rec?await c.auth.resetPasswordForEmail(em):await c.auth.resend({type:'signup',email:em});$('#cm').textContent=error?errRu(error):'Отправили ещё раз.'};
   $('#cf').onsubmit=async e=>{e.preventDefault();$('#cm').innerHTML=spin+'Проверяю…';
    const {error}=await c.auth.verifyOtp({email:em,token:$('#cc').value.replace(/\s/g,''),type});
    if(error){$('#cm').textContent=errRu(error);return}
    if(rec){const r=await c.auth.updateUser({password:$('#np').value});if(r.error){$('#cm').textContent=errRu(r.error);return}}
    done(rec?'Пароль изменён':'Почта подтверждена')}}
  function forgot(em0=''){card(`<h2 style="margin-top:0">Восстановление пароля</h2><p class="small">Введи почту — пришлём код, по которому можно придумать новый пароль.</p>
   <form id="ff"><div class="field"><label for="fe">Почта</label><input id="fe" type="email" required autocomplete="email" value="${esc(em0)}"></div><button class="btn primary" type="submit">Прислать код</button> <button class="btn ghost" type="button" id="fb">Назад</button></form><p class="small" id="fm" style="margin-top:10px"></p>`);
   $('#fb').onclick=()=>form('login',$('#fe').value);
   $('#ff').onsubmit=async e=>{e.preventDefault();const em=$('#fe').value.trim();$('#fm').innerHTML=spin+'Отправляю…';const {error}=await c.auth.resetPasswordForEmail(em);if(error){$('#fm').textContent=errRu(error);return}codeStep(em,'recovery')}}
  function form(m,em0=''){const reg=m==='reg';
   card(`<div class="seg" style="margin-bottom:14px"><button data-t="login" aria-pressed="${!reg}">Войти</button><button data-t="reg" aria-pressed="${reg}">Регистрация</button></div>
   <p class="small">Мы не видим, что ты делаешь на сайте, — только сам факт регистрации. Аккаунт нужен, чтобы прогресс (место в читалке, галочки, клише, черновики) сохранялся и открывался с любого устройства.</p>${count}
   <form id="af"><div class="field"><label for="ae">Почта</label><input id="ae" type="email" required autocomplete="email" value="${esc(em0)}" placeholder="name@gmail.com"></div>
   <div class="field"><label for="ap">Пароль</label><input id="ap" type="password" required minlength="8" autocomplete="${reg?'new-password':'current-password'}" placeholder="не меньше 8 символов"></div>
   <button class="btn primary" type="submit">${reg?'Создать аккаунт':'Войти'}</button></form><p class="small" id="am" style="margin-top:10px"></p>
   ${!reg&&CFG.emailsWork?'<p class="small"><button class="btn sm ghost" id="fg">Забыли пароль?</button></p>':''}`);
   pa.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>form(b.dataset.t,$('#ae').value));
   const fg=$('#fg');if(fg)fg.onclick=()=>forgot($('#ae').value);
   $('#af').onsubmit=async e=>{e.preventDefault();const em=$('#ae').value.trim(),pw=$('#ap').value;$('#am').innerHTML=spin+(reg?'Создаю аккаунт…':'Проверяю…');
    if(reg){const {data,error}=await c.auth.signUp({email:em,password:pw,options:{emailRedirectTo:location.origin+location.pathname}});
     if(error){$('#am').textContent=errRu(error);return}
     if(data.session)return done('Аккаунт создан');
     if(data.user&&data.user.identities&&!data.user.identities.length){$('#am').textContent=errRu({message:'already registered'});return}
     return codeStep(em,'signup')}
    const {error}=await c.auth.signInWithPassword({email:em,password:pw});
    if(error){if(/not confirmed/i.test(error.message)){await c.auth.resend({type:'signup',email:em});return codeStep(em,'signup')}$('#am').textContent=errRu(error);return}
    done('Вход выполнен')}}
  form('login')})
 .catch(()=>pa.innerHTML='<div class="card"><p>Не удалось подключиться к серверу входа. Черновики всё равно сохраняются в браузере.</p></div>')}

/* ===== подвал и запуск ===== */
$('#footer').innerHTML=`<p style="margin:0 0 6px"><b>Путеводитель по итоговому сочинению</b> — бесплатный проект для подготовки.</p><p style="margin:0">Материалы: «Всё об итоговом сочинении» и идеальные сочинения (Вера Флекс, ЕГЭFLEX), «Темы и тезисы» (ОК ЕГЭ: К. Кафтаева, О. Беляева), клише (@asyarusichka_el), аргументы VOSH.NETWORK, сборник «Все аргументы по разделу „Духовно-нравственные ориентиры“», сборник аргументов 2021/22. Тексты классики — ilibrary.ru (общественное достояние).</p><p style="margin:8px 0 0"><a href="#/ustanovka">Как добавить сайт на экран «Домой»</a></p>`;
if(CFG.supabaseUrl)sb().catch(()=>{});
if('serviceWorker' in navigator&&window.isSecureContext)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
route();
})();
