const fs=require('fs');const S=process.argv[2];
let L=fs.readFileSync(S+'/src/ok.txt','utf8').split('\n').filter(l=>!/ОК ЕГЭ \(https/.test(l)).map(l=>l.replace(/\s+/g,' ').trim()).filter(l=>l&&!/^\d+$/.test(l));
const start=L.findIndex(l=>l==='ТЕЗИСЫ ПО ТЕМАМ');
const plansStart=L.findIndex(l=>/10 ПОДРОБНЫХ ПЛАНОВ/.test(l));
function parse(lines){const out=[];let cur=null,mode='q';
 for(let l of lines){const m=l.match(/^(\d{1,2})\. (.*)$/);
  if(m&&(!cur||+m[1]===cur.n+1)){cur={n:+m[1],q:m[2],intro:[],pts:[],read:[]};out.push(cur);mode='q';continue}
  if(!cur)continue;
  if(/^Читаем:?/.test(l)){mode='r';l=l.replace(/^Читаем:?\s*/,'');if(!l)continue}
  if(mode==='q'){ if(/^[▪•]/.test(l)||/[.:!»]$/.test(cur.q)&&/[?»]$/.test(cur.q)) mode='b'; else if(/\?$|»\?$/.test(cur.q)===false){cur.q+=' '+l;continue} else mode='b'}
  if(mode==='b'){ const last=cur.pts[cur.pts.length-1];const unb=s=>s&&((s.split('«').length!==s.split('»').length)||(s.split('(').length!==s.split(')').length));
    if(l==='▪'){cur.lone=(cur.lone||0)+1;continue}
    if(cur.lone){cur.pts.push(l);cur.lone--;continue}
    if(/^▪/.test(l)) cur.pts.push(l.replace(/^▪\s*/,'')); else if(cur.pts.length&&(/^[a-zа-яё(«,]/.test(l)||unb(last))) cur.pts[cur.pts.length-1]+=' '+l; else cur.intro.push(l)}
  if(mode==='r'){ if(l==='▪')continue; l=l.replace(/^▪\s*/,''); if(cur.read.length&&/^[a-zа-яё(«]/.test(l)&&!/[,.)]$/.test(cur.read[cur.read.length-1])) cur.read[cur.read.length-1]+=' '+l; else if(cur.read.length&&/^[a-zа-яё(]/.test(l)) cur.read[cur.read.length-1]+=' '+l; else cur.read.push(l)}
 }
 out.forEach(o=>{o.read=o.read.flatMap(r=>r.split(/,\s*(?=[А-ЯЁA-Z][.А-Яа-яё’' ]{0,25}[«])/)).map(r=>r.replace(/[,.]$/,'').replace(/ -/g,'-').trim()).filter(Boolean);
   o.intro=o.intro.join(' ').replace(/(\S)- (\S)/g,'$1$2');o.pts=o.pts.map(p=>p.replace(/(\S)- (\S)/g,'$1$2'))});
 return out}
const th=parse(L.slice(start+1));const last=th[th.length-1];const si=last.read.indexOf('СПИСОК ЛИТЕРАТУРЫ');const LIST=last.read.slice(si+1).map(s=>s.trim());last.read=last.read.slice(0,si);
th.forEach(t=>{delete t.lone;t.read=t.read.reduce((a,r)=>{if(a.length&&(a[a.length-1].split('(').length>a[a.length-1].split(')').length))a[a.length-1]+=' '+r;else a.push(r);return a},[])});
const plans=parse(L.slice(plansStart+1,start));plans.forEach(t=>delete t.lone);
fs.writeFileSync(S+'/build/oklist.json',JSON.stringify({LIST,plans},null,1));console.log('plans',plans.length,JSON.stringify(plans[1]).slice(0,800));
fs.writeFileSync(S+'/build/theses.json',JSON.stringify(th,null,1));
console.log(th.length);th.slice(0,3).concat(th.slice(-3)).forEach(t=>console.log(JSON.stringify(t)));
console.log(th.filter(t=>!t.read.length||!(t.pts.length||t.intro)).map(t=>t.n));
