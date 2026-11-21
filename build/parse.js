const fs=require('fs');const S=process.argv[2];
const SUBS={'1.1':'Внутренний мир','1.2':'Отношение человека к другому','1.3':'Познание человеком','1.4':'Свобода человека','2.1':'Семья, род','2.2':'Человек и общество','2.3':'Родина, государство','3.1':'Природа и человек','3.2':'Наука и человек','3.3':'Искусство и человек','3.4':'Язык и языковая'};
function para(lines){ // join pdf lines into paragraphs
  const out=[];let cur='';
  const L=lines.map(l=>l.replace(/\s+$/,'')).filter(l=>!/^\s*\d+\s*$/.test(l)&&!/^ИТОГОВОЕ СОЧИНЕНИЕ 20/.test(l)&&!/VOSH\.NETWORK/.test(l));
  const W=Math.max(...L.map(l=>l.length),60);
  for(let i=0;i<L.length;i++){const l=L[i].trim();if(!l){if(cur){out.push(cur);cur=''}continue}
    if(cur){ if(/-$/.test(cur)&&!/ -$/.test(cur)) cur=cur.slice(0,-1)+l; else cur+=' '+l;} else cur=l;
    if(L[i].trim().length<W*0.6&&/[.!?»…:)]$/.test(l)){out.push(cur);cur=''}}
  if(cur)out.push(cur);return out.map(s=>s.replace(/\s+/g,' ').replace(/ ([,.;:!?])/g,'$1').trim()).filter(s=>s.length>2);
}
const res=[];
// --- b135
{const L=fs.readFileSync(S+'/src/b135.txt','utf8').split('\n');const idx=[];
 L.forEach((l,i)=>{if(/^\(авторы?:/.test(l.trim()))idx.push(i)});
 idx.forEach((i,k)=>{let j=i-1;while(j>0&&!/«/.test(L[j]))j--;const title=(L[j].match(/«([^»]+)»/)||[,''])[1];const author=L[i].trim().replace(/^\(авторы?:\s*/,'').replace(/\)$/,'');
  const end=k+1<idx.length?idx[k+1]-1:L.length;const body=L.slice(i+1,end);
  let sub=null,buf=[];const flush=()=>{if(sub&&buf.length){const p=para(buf);if(p.length)res.push({src:'b135',title,author,sub,p})}buf=[]};
  for(const l of body){const m=l.trim().match(/^([1-3]\.[1-4])\.\s/);if(m){flush();sub=m[1];continue}
    if(/^№\d/.test(l.trim()))continue; if(sub&&Object.values(SUBS).some(n=>l.includes(n))&&l.trim().length<70&&buf.length==0)continue; buf.push(l)}
  flush();});}
// --- VOSH
{const L=fs.readFileSync(S+'/src/slivuis_raw.txt','utf8').split('\n');let sec=1;let cur=null;const items=[];
 L.forEach((l,i)=>{if(/Аргументы к разделу «Семья/.test(l))sec=2;if(/Аргументы к разделу «Природа/.test(l))sec=3;
  const m=l.trim().match(/^(\d+)\.\s+(.+?)[,]?\s*«([^»]+)»[.,]?\s*(\(([^)]*)\)?)?\s*(.*)$/);
  if(m && i>64 && !(i>974&&i<1000&&!/[а-я]/.test(m[6]||'x')&&false)){
    // skip table-of-contents lines: next line also a numbered header
    cur={src:'vosh',sec,author:m[2].trim(),title:m[3],note:(m[5]||'').trim(),lines:[m[6]||'']};items.push(cur);return}
  if(cur)cur.lines.push(l)});
 items.forEach(it=>{const p=para(it.lines);const txt=p.join(' ');if(txt.length>150)res.push({src:'vosh',sec:it.sec,title:it.title,author:it.author,note:it.note,p})});}
// --- 508 (2021-22)
{const L=fs.readFileSync(S+'/src/r508.txt','utf8').split('\n');let dir='';let cur=null;const items=[];
 L.forEach((l,i)=>{const t=l.trim();
  const DIRS={8:'Человек путешествующий: дорога в жизни человека',825:'Цивилизация и технологии — спасение, вызов или трагедия?',1323:'Преступление и наказание — вечная тема',1912:'Книга (музыка, спектакль, фильм) — про меня',2500:'«Кому на Руси жить хорошо?» — вопрос гражданина'};
  if(DIRS[i]){dir=DIRS[i];cur=null;return}
  const m=t.match(/^«([^»]+)»\s+([А-ЯЁA-Z][А-ЯЁа-яё. A-Za-z-]{2,40})$/);
  if(m&&/[А-ЯЁ]\./.test(m[2])){cur={src:'s2122',dir,title:m[1],author:m[2].trim(),head:(L[i+1]||'').trim(),lines:[]};items.push(cur);return}
  if(cur)cur.lines.push(l)});
 items.forEach(it=>{const p=para(it.lines);if(p.join(' ').length>150)res.push({src:'s2122',dir:it.dir,title:it.title,author:it.author,note:it.head,p:p})});}
fs.writeFileSync(S+'/build/sources.json',JSON.stringify(res,null,1));
const c={};res.forEach(r=>c[r.src]=(c[r.src]||0)+1);console.log(c);
const dirs=[...new Set(res.filter(r=>r.dir).map(r=>r.dir))];console.log(dirs);
const titles=[...new Set(res.map(r=>r.title))];console.log(titles.length,'titles');console.log(titles.join(' | '));
