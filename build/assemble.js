// Собирает данные сайта из: старого артефакта, новых карточек, разобранных сборников, тезисов, скачанных текстов.
const fs=require('fs'),path=require('path');
// Запуск из корня репозитория: node build/assemble.js [папка_со_скачанными_текстами]
const OUT=path.join(__dirname,'..');const SRC=path.join(__dirname,'src');const RAWDIR=process.argv[2]||null;
const old=require(SRC+'/old.json');
const extra=[...require('./works_extra1.js'),...require('./works_extra2.js')];
const sources=require(SRC+'/sources.json');
const theses=require(SRC+'/theses.json');
const ok=require(SRC+'/oklist.json');
const KLP=require('./kl_parts.js');

const EMO=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F000}-\u{1F2FF}\u{200D}]/gu;
const deemo=o=>JSON.parse(JSON.stringify(o).replace(EMO,'').replace(/"\s+/g,'"'));
const norm=t=>String(t).replace(/\(.*?\)/g,'').toLowerCase().replace(/ё/g,'е').replace(/[^а-яa-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const TR={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
const slug=t=>norm(t).split('').map(c=>TR[c]!==undefined?TR[c]:c).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);

// ---------- WORKS
let WORKS=deemo(old.WORKS);
const byId={};WORKS.forEach(w=>byId[w.id]=w);
extra.forEach(w=>{if(byId[w.id])Object.assign(byId[w.id],w);else{WORKS.push(w);byId[w.id]=w}});
const ALIAS={'кукла акимыч':'kukla','левша':'levsha','старуха изергиль':'izergil','песня про купца калашникова':'kalash','легенда о данко':'izergil','олеся':'olesya','рассказ олеся':'olesya','новеллапоследний лист':'list','мертвые души':null};
const byTitle={};WORKS.forEach(w=>byTitle[norm(w.t)]=w.id);
Object.entries(ALIAS).forEach(([k,v])=>{if(v)byTitle[k]=v});

// авторы из сборников -> именительный падеж
const AFIX={'М.А. Булгакова':'М.А. Булгаков','Ф.М. Достоевского':'Ф.М. Достоевский','И. А. Гончарова':'И.А. Гончаров','А.С. Пушкина':'А.С. Пушкин','Л.Н. Толстого':'Л.Н. Толстой','А.П. Платонова':'А.П. Платонов','Ю. Я. Яковлева':'Ю.Я. Яковлев','М.Ю. Лермонтова':'М.Ю. Лермонтов','М. Ю. Лермонтова':'М.Ю. Лермонтов','И.А. Солженицына':'А.И. Солженицын','Т. Капоте':'Т. Капоте','Л. Е. Улицкой':'Л.Е. Улицкая','В.Ф. Одоевского':'В.Ф. Одоевский','В.Г. Распутина':'В.Г. Распутин','Ж. Б. Мольера':'Ж.-Б. Мольер','О. Раина':'О. Раин','В. Быкова':'В.В. Быков','А. де Сент-Экзюпери':'А. де Сент-Экзюпери','И. Замятин':'Е.И. Замятин','М. Карамзин':'Н.М. Карамзин','Ф. Энсти':'Ф. Энсти'};
const fixA=a=>{a=(a||'').replace(/\s+/g,' ').trim().replace(/^Аргумент по \S+\s+/,'');if(AFIX[a])return AFIX[a];
 if(/Стругацки/.test(a))return 'А. и Б. Стругацкие'; if(a==='Д. Лондон')return 'Дж. Лондон';
 a=a.replace(/([А-ЯЁ][а-яё]+?)(ов|ев|ин)а$/,'$1$2').replace(/([А-ЯЁ][а-яё]+?)(ов|ев)ой$/,'$1$2а').replace(/(Сервант)еса$/,'$1ес').replace(/(Мольер)а$/,'$1').replace(/^Ж\.\s?Б\./,'Ж.-Б.');
 const m=a.match(/^(?:(?:[А-ЯЁA-Z]\.\s?){1,2})?\s*([А-ЯЁ][а-яё-]+)$/);return a.replace(/\.\s(?=[А-ЯЁ]\.)/g,'.')};
// полные имена из b135 «(автор: Имя Отчество Фамилия)» -> «И.О. Фамилия»
const short=full=>{const p=full.split(/\s+/);if(p.length===3)return p[0][0]+'.'+p[1][0]+'. '+p[2];if(p.length===2)return p[0][0]+'. '+p[1];return full};
const GENRES={'рассказ':'рассказ','повесть':'повесть','роман':'роман','новелла':'новелла','драма':'драма','роман-антиутопия':'роман-антиутопия','роман/повесть':'роман (повесть)'};

const DIRSUB={'Человек путешествующий: дорога в жизни человека':'1.3','Цивилизация и технологии — спасение, вызов или трагедия?':'3.2','Преступление и наказание — вечная тема':'1.2','Книга (музыка, спектакль, фильм) — про меня':'3.3','«Кому на Руси жить хорошо?» — вопрос гражданина':'2.3'};
// для ВОШ: подраздел угадываем по ключевым словам заметки/текста внутри раздела
const KEYS={'1.1':/качеств|характер|внутренн|сила духа|чест|достоинств|совест|мужеств|доброт/i,'1.2':/добр|зл|выбор|милосерд|сострада|преступлен|предател|любов|дружб|жестокост|равнодуш/i,'1.3':/смысл жизни|самопознан|понять себя|познани|цель|путь|ошибк|самоанализ|внутренний разлад/i,'1.4':/свобод|ограничен|ответственност|воля/i,
 '2.1':/семь|отц|дет|родител|мать|матер|поколен|род |традиц/i,'2.2':/обществ|коллектив|сред|толп|социум|лидер|учител|воспитан/i,'2.3':/родин|отечеств|патриот|войн|подвиг|гражданин|государств|истори|памят/i,
 '3.1':/природ|эколог|земл|лес|животн/i,'3.2':/наук|прогресс|технолог|открыти|учён|эксперимент/i,'3.3':/искусств|музык|книг|живопис|художник|творчеств|театр|литератур/i,'3.4':/язык|речь|слов/i};
const guessSub=(sec,text)=>{const subs=Object.keys(KEYS).filter(k=>k[0]==String(sec));let best=subs[0],bs=-1;
 subs.forEach(k=>{const m=(text.match(new RegExp(KEYS[k].source,'gi'))||[]).length;if(m>bs){bs=m;best=k}});return best};

const BANK=[];let stubs=0;
sources.forEach(x=>{
 let t=x.title.trim();
 const k=norm(t);if(!k)return;
 let id=byTitle[k];
 let author=x.src==='b135'?short(x.author.replace(/\s+/g,' ')):fixA(x.author);if(/Стругацки/.test(author))author='А. и Б. Стругацкие';if(author==='Д. Лондон')author='Дж. Лондон';
 if(!id){id=slug(t);if(byId[id])id+='-2';const g=(x.title.match(/^(Роман\/повесть|Роман-антиутопия|Рассказ|Повесть|Роман|Новелла|Драма)/)||[])[1];
  const w={id,a:author,t,g:g?GENRES[g.toLowerCase()]:'',stub:true,subs:[],r:[]};WORKS.push(w);byId[id]=w;byTitle[k]=id;stubs++}
 const w=byId[id];
 if(w.stub&&x.src==='b135'&&w.a.length<author.length)w.a=author;
 const text=x.p.join('\n');
 const sub=x.sub||(x.dir?DIRSUB[x.dir]:guessSub(x.sec,(x.note||'')+' '+text));
 const src={b135:'Сборник «Все аргументы по разделу „Духовно-нравственные ориентиры“»',vosh:'Аргументы VOSH.NETWORK',s2122:'Сборник аргументов «Итоговое сочинение 2021–2022»'}[x.src];
 BANK.push({w:id,s:sub,note:x.note||(x.dir?'направление 2021/22: '+x.dir:''),src,p:x.p});
 if(!w.subs.includes(sub))w.subs.push(sub);
 const r=+sub[0];if(!(w.r||[]).includes(r))(w.r=w.r||[]).push(r);
});
// ---------- тексты
const TEXTMAP={mezonin:'дом с мезонином',dushechka:'душечка',o_lyubvi:'о любви',mest:'месть',nevesta:'невеста',vishnevy:'вишневый сад',chisty:'чистый понедельник',antonovskie:'антоновские яблоки',cvetok:'неизвестный цветок',mcyri:'мцыри',geroy:'герой нашего времени',onegin:'евгений онегин',smotritel:'станционный смотритель',mumu:'муму',asya:'ася',durnoe:'в дурном обществе',chelkash:'челкаш',nadne:'на дне',nevsky:'невский проспект',portret:'портрет',taras:'тарас бульба',mertvye:'мертвые души',revizor:'ревизор',oblomov:'обломов',gore:'горе от ума',bednye:'бедные люди',posle_bala:'после бала',groza:'гроза',my:'мы',kakoy_radishchev:'путешествие из петербурга в москву',komu:'кому на руси жить хорошо'};
const TEXTINFO={mest:['А.П. Чехов','Месть','рассказ, 1886',['1.2']],nevesta:['А.П. Чехов','Невеста','рассказ, 1903',['1.3','1.4']],posle_bala:['Л.Н. Толстой','После бала','рассказ, 1903',['1.2','1.3','2.2']],mezonin:['А.П. Чехов','Дом с мезонином','рассказ, 1896'],dushechka:['А.П. Чехов','Душечка','рассказ, 1899'],o_lyubvi:['А.П. Чехов','О любви','рассказ, 1898']};
let ntext=0;fs.mkdirSync(OUT+'/texts',{recursive:true});
const TXTMETA=fs.existsSync(SRC+'/texts-meta.json')?JSON.parse(fs.readFileSync(SRC+'/texts-meta.json')):{};
(RAWDIR?fs.readdirSync(RAWDIR):[]).forEach(f=>{const key=f.replace('.json','');const d=JSON.parse(fs.readFileSync(path.join(RAWDIR,f)));
 let id=byId[key]?key:byTitle[TEXTMAP[key]||''];
 if(!id){const info=TEXTINFO[key]||['', TEXTMAP[key]||key,''];id=key.replace(/_/g,'-');const w={id,a:info[0],t:info[1][0].toUpperCase()+info[1].slice(1),g:info[2],stub:true,subs:info[3]||[],r:(info[3]||[]).map(s=>+s[0])};WORKS.push(w);byId[id]=w}
 const w=byId[id];const chars=d.b.reduce((a,x)=>a+x[1].length,0);
 TXTMETA[id]={key,src:d.src,chars,a:w.a,t:w.t,g:w.g,subs:w.subs};
 fs.writeFileSync(`${OUT}/texts/${id}.json`,JSON.stringify({id,b:d.b}))});
fs.writeFileSync(SRC+'/texts-meta.json',JSON.stringify(TXTMETA,null,1));
Object.entries(TXTMETA).forEach(([id,m])=>{if(!fs.existsSync(`${OUT}/texts/${id}.json`))return;let w=byId[id];
 if(!w){w={id,a:m.a,t:m.t,g:m.g,stub:true,subs:m.subs||[],r:(m.subs||[]).map(s=>+s[0])};WORKS.push(w);byId[id]=w}
 w.full={src:m.src,chars:m.chars,min:Math.max(1,Math.round(m.chars/1500))};if(!w.link)w.link=m.src;ntext++});
// ---------- темы и тезисы
const findWorks=s=>{const ids=[];(s.match(/«([^»]+)»/g)||[]).forEach(q=>{const k=norm(q);if(byTitle[k])ids.push(byTitle[k])});return ids};
theses.forEach(t=>{t.q=t.q.replace(/\s+/g,' ').trim();t.pts=t.pts.map(p=>p.trim()).filter(Boolean);
 t.read=t.read.map(r=>r.replace(/\s+/g,' ').trim()).filter(Boolean);t.wids=[...new Set(t.read.flatMap(findWorks))]});
// тема 54 склеилась с тезисом
const t54=theses.find(t=>t.n===54);if(t54&&/потому что$/.test(t54.q)){const i=t54.q.indexOf(')')+1;t54.intro=t54.q.slice(i).trim();t54.q=t54.q.slice(0,i).trim()}
theses.forEach(t=>{t.read=t.read.reduce((a,r)=>{const l=a[a.length-1];if(l&&l.split('«').length>l.split('»').length)a[a.length-1]=l+' '+r;else a.push(r);return a},[])});
const plans=ok.plans.map(p=>({n:p.n,q:p.q,intro:p.intro,pts:p.pts,read:p.read,wids:[...new Set(p.read.flatMap(findWorks))]}));
const READLIST=ok.LIST.map(r=>({t:r,wid:findWorks(r)[0]||null}));
// ---------- клише по типам темы (из старого артефакта)
const toGap=s=>String(s).replace(/<span class="gap">(.*?)<\/span>/g,'[$1]');
const KLTYPES=deemo(old.KL).filter(k=>!['parts','builder'].includes(k.id)).map(k=>({id:k.id,name:k.tab.trim(),title:k.title,intro:k.intro,examples:k.examples,tpl:k.tpl.map(([h,t])=>[h,toGap(t)]),sample:k.sample,trap:k.trap}));
const KLOLD=deemo(old.KL).find(k=>k.id==='parts');
// ---------- запись
WORKS.forEach(w=>{w.nb=BANK.filter(b=>b.w===w.id).length;w.subs=[...new Set(w.subs||[])].sort();w.r=[...new Set(w.r||[])].sort()});
WORKS.sort((a,b)=>(a.stub?1:0)-(b.stub?1:0)||a.t.localeCompare(b.t,'ru'));
const DATA={SECTIONS:deemo(old.SECTIONS),WORKS,THESES:theses,PLANS:plans,READLIST,IDEAL:deemo(old.IDEAL),KLP,KLTYPES,KLOLD,CHECK:deemo(old.CHECK)};
fs.mkdirSync(OUT+'/data',{recursive:true});
fs.writeFileSync(OUT+'/data/data.js','/* Сгенерировано build/assemble.js — правь исходники в build/ */\nwindow.DATA='+JSON.stringify(DATA)+';\n');
fs.writeFileSync(OUT+'/data/bank.json',JSON.stringify(BANK));
console.log('works',WORKS.length,'(stubs',WORKS.filter(w=>w.stub).length+')','bank',BANK.length,'texts',ntext,'theses',theses.length,'plans',plans.length);
console.log('data.js',(fs.statSync(OUT+'/data/data.js').size/1024|0)+'KB','bank',(fs.statSync(OUT+'/data/bank.json').size/1024|0)+'KB');
const nos=WORKS.filter(w=>!w.subs.length).map(w=>w.t);console.log('no subs:',nos.join(', '));
