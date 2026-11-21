import subprocess,re,json,sys,os,html,time
OUT=sys.argv[1]
def get(url):
    for k in range(4):
        r=subprocess.run(['curl','-s','--max-time','40',url],capture_output=True)
        if r.returncode==0 and r.stdout: return r.stdout.decode('cp1251',errors='replace')
        time.sleep(2*(k+1))
    raise Exception('fail '+url)
def clean(s):
    s=re.sub(r'<(/?)(i|em)>',lambda m:'<'+m.group(1)+'i>',s)
    s=re.sub(r'<(/?)(b|strong)>',lambda m:'<'+m.group(1)+'b>',s)
    s=re.sub(r'<br\s*/?>','\n',s)
    s=re.sub(r'<(?!/?[ib]>)[^>]+>','',s)
    return html.unescape(s).replace('\xa0',' ').strip()
def page(tid,n):
    h=get(f'https://ilibrary.ru/text/{tid}/p.{n}/index.html')
    m=re.search(r'<div id="text"[^>]*>(.*?)<div class="(?:btm|bnav)',h,re.S) or re.search(r'<div id="text"[^>]*>(.*)',h,re.S)
    body=m.group(1)
    pages=[int(x) for x in re.findall(rf'/text/{tid}/p\.(\d+)/',h)]
    blocks=[]
    for t in re.finditer(r'<h[2-4][^>]*>(.*?)</h[2-4]>|<z>(.*?)</z>|<span class="(?:p|vl|v)">(.*?)</span>',body,re.S):
        if t.group(1) is not None: blocks.append(['h',clean(t.group(1))])
        else:
            x=clean(t.group(2) if t.group(2) is not None else t.group(3))
            if x: blocks.append(['p',x])
    return blocks,max(pages+[1])
def toc(tid):
    h=get(f'https://ilibrary.ru/text/{tid}/index.html')
    t={}
    for n,name in re.findall(r'p\.(\d+)/index.html" target="_top">([^<]+)',h):
        n=int(n); name=html.unescape(name).strip()
        if name in ('»','&raquo;'): continue
        t.setdefault(n,[]).append(name)
    return t
def work(key,tid,rng=None):
    fn=f'{OUT}/{key}.json'
    if os.path.exists(fn): return
    T=toc(tid); pages=sorted(T) or [1]
    if rng: a,b_=map(int,rng.split('-')); pages=[n for n in range(a,b_+1)]
    allb=[]
    for n in pages:
        bb,_=page(tid,n)
        if bb and bb[0][0]=='p' and len(bb[0][1])<40 and n==pages[0]: bb=bb[1:]
        if len(pages)>1 and not any(x[0]=='h' for x in bb[:2]) and T.get(n): bb=[['h',T[n][-1]]]+bb
        allb+=bb; time.sleep(0.3)
    np=len(pages)
    json.dump({'id':key,'src':f'https://ilibrary.ru/text/{tid}/p.1/index.html','pages':np,'b':allb},open(fn,'w'),ensure_ascii=False)
    print(key,tid,np,'pages',len(allb),'blocks',sum(len(x[1]) for x in allb),'chars',flush=True)
for line in sys.stdin:
    parts=line.split()
    if not parts: continue
    try: work(*parts)
    except Exception as e: print('ERR',k,e,flush=True)
