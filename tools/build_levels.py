#!/usr/bin/env python3
"""Builds content/levels/{pre,c1,c2,c3,c4}.json + index + bundle. All items verified=false (owner must check vs school books)."""
import json, os, random, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, 'banks'))
import levels_maths as LM, levels_text_a as TA, levels_text_b as TB, class1 as C1
ROOT = os.path.join(HERE, '..'); OUT = os.path.join(ROOT, 'content', 'levels')
VERSION = 3
LEVELS = [('pre', 'Pre-School', '🧸', 'Pre-KG, LKG, UKG'), ('c1', 'Class 1', '1️⃣', ''), ('c2', 'Class 2', '2️⃣', ''), ('c3', 'Class 3', '3️⃣', ''), ('c4', 'Class 4', '4️⃣', '')]
SUBJ = {'maths': ('Maths', '🧮'), 'english': ('English', '🔤'), 'evs': ('Our World', '🌳'), 'science': ('Science', '🔬'),
        'gk': ('General Knowledge', '🌍'), 'computer': ('Computer', '💻'), 'social': ('Social Studies', '🏘️'), 'olympiad': ('Olympiad Challenge', '🏆')}
def build():
    os.makedirs(OUT, exist_ok=True)
    rng = random.Random(2027)
    bundle = {}; index = []
    for lid, title, icon, sub in LEVELS:
        skills = []
        if lid == 'c1':   # NCERT/ICSE-based skill tree, fun activities
            rows = [dict(x) for x in C1.maths()] + [dict(x) for x in C1.olympiad()]
            for t in C1.TEXT:
                subject, topic, d, q, a, w, hint, expl = t
                rows.append(dict(subject=subject, topic=topic, difficulty=d, question=q, answer=a, wrong=w, hint=hint, explanation=expl, type='multiple-choice'))
            skills = [dict(id=s[0], subject=s[1], title=s[2], icon=s[3], requires=s[4], source=s[5]) for s in C1.SKILLS]
        else:
            rows = [dict(x) for x in LM.gen(lid)]
            for t in TA.T + TB.T:
                if t[0] != lid: continue
                _, subject, topic, d, q, a, w, hint, expl = t
                rows.append(dict(subject=subject, level=lid, topic=topic, difficulty=d, question=q, answer=a, wrong=w, hint=hint, explanation=expl, requires=[]))
        seenq = set(); uniq = []
        for r in rows:
            k = (r.get('type', 'multiple-choice'), r['question'], r['answer'])
            if k in seenq: continue
            seenq.add(k); uniq.append(r)
        rows = uniq
        qs = []; per = {}
        for r in rows:
            per[r['subject']] = per.get(r['subject'], 0) + 1
            typ = r.get('type', 'multiple-choice')
            o = dict(id='L-%s-%s-%03d' % (lid, r['subject'], per[r['subject']]), level=LEVELS.index((lid, title, icon, sub)) + 1,
                     topic=r['topic'], type=typ, question=r['question'], answer=r['answer'], hint=r['hint'],
                     explanation=r['explanation'], skills=[r['subject'], r['topic']], difficulty=r['difficulty'],
                     subject=r['subject'], requires=r.get('requires', []), verified=False)
            if typ == 'multiple-choice':
                ch = [r['answer']] + list(r['wrong']); rng.shuffle(ch); o['choices'] = ch
            else:
                for k in ('items', 'icon', 'target', 'total'):
                    if k in r: o[k] = r[k]
            qs.append(o)
        subs = [dict(id=s, title=SUBJ[s][0], icon=SUBJ[s][1], count=per[s]) for s in SUBJ if s in per]
        data = dict(id=lid, title=title, icon=icon, version=VERSION, subjects=subs, skills=skills, questions=qs)
        json.dump(data, open(os.path.join(OUT, lid + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        index.append(dict(id=lid, title=title, icon=icon, file='levels/%s.json' % lid, count=len(qs), subjects=[s['id'] for s in subs]))
        bundle[lid] = data
        print(lid, len(qs), {s['id']: s['count'] for s in subs})
    idx = dict(version=VERSION, levels=index); bundle['_index'] = idx
    json.dump(idx, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(os.path.join(ROOT, 'content', 'levels-bundle.js'), 'w', encoding='utf-8').write('window.MQ_LEVELS=' + json.dumps(bundle, ensure_ascii=False) + ';\n')
if __name__ == '__main__': build()
