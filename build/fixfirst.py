import sys,json,os,re
sys.argv=[sys.argv[0],sys.argv[1]]
exec(open(os.path.join(os.path.dirname(__file__),'fetch.py')).read().split('for line in sys.stdin')[0])
RAW=sys.argv[1]
for line in open(os.path.join(RAW,'..','list.txt')):
    parts=line.split()
    if not parts: continue
    key,tid=parts[0],parts[1]; first=int(parts[2].split('-')[0]) if len(parts)>2 else None
    fn=f'{RAW}/{key}.json'
    if not os.path.exists(fn): continue
    d=json.load(open(fn))
    if d.get('fixed'): continue
    if first is None:
        T=toc(tid); first=min(T) if T else 1
    b,_=page(tid,first)
    if b and b[0][0]=='p' and len(b[0][1])<40 and (not d['b'] or d['b'][0][1]!=b[0][1]):
        x=b[0][1]
        # имя автора (два слова с заглавной) — выбрасываем, эпиграфы и посвящения — возвращаем
        if not re.fullmatch(r'[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+(-[А-ЯЁ][а-яё]+)?',x.strip()):
            d['b'].insert(0,['p',x]); print('restored',key,repr(x))
    d['fixed']=1; json.dump(d,open(fn,'w'),ensure_ascii=False)
