#!/usr/bin/env python3
"""Independent check of content/levels: structure, skill tree, and re-solves computed maths questions.
Hand-written maths items (shapes, measuring, some word items) are listed so a human can read them."""
import json, os, re, sys
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'content', 'levels')
W = {'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19,'twenty':20}
ROMAN = {1:'I',4:'IV',5:'V',9:'IX',10:'X',12:'XII',14:'XIV',15:'XV',19:'XIX',20:'XX'}
DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
PLACES = ['ones','tens','hundreds','thousands','ten thousands','lakhs']
errs = []; total = 0; ids = set(); hand = {}
def bad(m): errs.append(m)
def cnt(s): return sum(1 for c in s if not c.isspace() and c != '️')
def solve(t):
    """Return expected answer string, or None if this is not a computed template."""
    m = re.fullmatch(r'(\d+) ([+−×÷]) (\d+) = \?', t)
    if m:
        x, o, y = int(m[1]), m[2], int(m[3])
        if o == '÷' and x % y: return 'NA'
        return str({'+': x + y, '−': x - y, '×': x * y, '÷': x // y if y else 0}[o])
    if (m := re.fullmatch(r'(\S+) \+ (\S+) = \?', t)) and not m[1].isdigit() and not m[1].startswith('₹'): return str(cnt(m[1]) + cnt(m[2]))
    if (m := re.fullmatch(r'(\S+) \+ (\S+) : how many in all\?', t)): return str(cnt(m[1]) + cnt(m[2]))
    if (m := re.fullmatch(r'What comes after (\d+)\?', t)): return str(int(m[1]) + 1)
    if (m := re.fullmatch(r'What comes before (\d+)\?', t)): return str(int(m[1]) - 1)
    if (m := re.fullmatch(r'Which is MORE: (\d+) or (\d+)\?', t)): return str(max(int(m[1]), int(m[2])))
    if (m := re.fullmatch(r'Which has (MORE|FEWER)\?  A: (\S+)   B: (\S+)', t)):
        a, b = cnt(m[2]), cnt(m[3]); return ('A' if a > b else 'B') if m[1] == 'MORE' else ('A' if a < b else 'B')
    if (m := re.fullmatch(r'Which number is "(\w+)"\?', t)): return str(W[m[1]])
    if (m := re.fullmatch(r'(\d+) tens? and (\d+) ones = \?', t)): return str(int(m[1]) * 10 + int(m[2]))
    if (m := re.fullmatch(r'Making 10: (\d+) \+ \? = 10', t)): return str(10 - int(m[1]))
    if (m := re.fullmatch(r'(\d+) \+ \? = (\d+)', t)): return str(int(m[2]) - int(m[1]))
    if (m := re.fullmatch(r'Half of (\d+) = \?', t)): return str(int(m[1]) // 2)
    if (m := re.fullmatch(r'1/(\d) of (\d+) = \?', t)): return str(int(m[2]) // int(m[1]))
    if (m := re.fullmatch(r'In (\d+), how many TENS\?', t)) and int(m[1]) < 100: return str(int(m[1]) // 10 % 10)
    if (m := re.fullmatch(r'In (\d+), the digit in the TENS place is\?', t)): return str(int(m[1]) // 10 % 10)
    if (m := re.fullmatch(r'In (\d+), which digit is in the (.+) place\?', t)): return str(int(m[1]) // 10 ** PLACES.index(m[2]) % 10)
    if (m := re.fullmatch(r'(\d+) hour and (\d+) minutes = \? minutes', t)): return str(int(m[1]) * 60 + int(m[2]))
    if (m := re.fullmatch(r'₹(\d+) \+ ₹(\d+) \+ ₹(\d+) = \?', t)): return str(int(m[1]) + int(m[2]) + int(m[3]))
    if (m := re.fullmatch(r'₹(\d+) \+ ₹(\d+) = \?', t)): return '₹%d' % (int(m[1]) + int(m[2]))
    if (m := re.fullmatch(r'A rectangle is (\d+) cm long and (\d+) cm wide\. Perimeter = \? cm', t)): return str(2 * (int(m[1]) + int(m[2])))
    if (m := re.fullmatch(r'The day after (\w+) is…', t)) and m[1] in DAYS: return DAYS[(DAYS.index(m[1]) + 1) % 7]
    if (m := re.fullmatch(r'(-?\d+(?:, -?\d+)+), \?', t)):
        n = [int(x) for x in m[1].split(', ')]; d = [n[i + 1] - n[i] for i in range(len(n) - 1)]
        if len(set(d)) == 1: return str(n[-1] + d[0])
        dd = [d[i + 1] - d[i] for i in range(len(d) - 1)]
        if len(d) >= 3 and len(set(dd)) == 1: return str(n[-1] + d[-1] + dd[0])
        if len(n) == 5 and n[2] - n[0] == n[4] - n[2] and n[2] - n[0] == 1 and n[3] - n[1] == 1: return str(n[3] + 1 + 0 + (n[3] - n[1]) - 1 + 1) if False else str(n[3] + (n[3] - n[1]))
        return 'NA'
    if (m := re.fullmatch(r'\? \+ (\d+) = (\d+)', t)): return str(int(m[2]) - int(m[1]))
    if (m := re.fullmatch(r'(\d+) − \? = (\d+)', t)): return str(int(m[1]) - int(m[2]))
    if (m := re.fullmatch(r'\? − (\d+) = (\d+)', t)): return str(int(m[1]) + int(m[2]))
    if (m := re.fullmatch(r'I am more than (\d+) and less than (\d+)\. Who am I\?', t)) and int(m[2]) - int(m[1]) == 2: return str(int(m[1]) + 1)
    if (m := re.fullmatch(r'How many numbers are between (\d+) and (\d+)\?', t)): return str(int(m[2]) - int(m[1]) - 1)
    if (m := re.fullmatch(r'Biggest 2-digit number using the digits (\d) and (\d)\?', t)): a, b = int(m[1]), int(m[2]); return str(max(a, b) * 10 + min(a, b))
    if (m := re.fullmatch(r'Smallest 2-digit number using the digits (\d) and (\d)\?', t)): a, b = int(m[1]), int(m[2]); return str(min(a, b) * 10 + max(a, b))
    if (m := re.fullmatch(r'Ria has (\d+) sweets\. Sam has (\d+) more than Ria\. How many does Sam have\?', t)): return str(int(m[1]) + int(m[2]))
    if (m := re.fullmatch(r'(\d+) birds sit on a tree\. (\d+) fly away and (\d+) come back\. How many birds now\?', t)): return str(int(m[1]) - int(m[2]) + int(m[3]))
    if (m := re.fullmatch(r'(\d+) 🐱 cats\. Each cat has 4 legs\. How many legs in all\?', t)): return str(int(m[1]) * 4)
    if (m := re.fullmatch(r'Ria has (\d+) pencils\. Sam has (\d+) fewer\. How many do they have together\?', t)): return str(int(m[1]) + int(m[1]) - int(m[2]))
    if (m := re.fullmatch(r'How many sides do (\d+) triangles have in all\?', t)): return str(3 * int(m[1]))
    if (m := re.fullmatch(r'How many corners do (\d+) squares have in all\?', t)): return str(4 * int(m[1]))
    if (m := re.fullmatch(r'Roman numeral for (\d+)\?', t)): return ROMAN[int(m[1])]
    if t.endswith(' How many?') and not t[0].isdigit(): return str(cnt(t[:-len(' How many?')]))
    if (m := re.fullmatch(r'(\S+) How many\?', t)): return str(cnt(m[1]))
    if (m := re.fullmatch(r'🍬 Ria has (\d+) sweets\. She eats (\d+)\. How many are left\?', t)): return str(int(m[1]) - int(m[2]))
    if (m := re.fullmatch(r'🍬 Ria has (\d+) sweets\. She gets (\d+) more\. She eats (\d+)\. How many are left\?', t)): return str(int(m[1]) + int(m[2]) - int(m[3]))
    if (m := re.fullmatch(r'🥕 A farm has (\d+) carrots and (\d+) more come\. How many carrots now\?', t)): return str(int(m[1]) + int(m[2]))
    if (m := re.fullmatch(r'🧸 toys: (\S+)     🚗 toys: (\S+)     How many MORE 🧸 than 🚗\?', t)): return str(cnt(m[1]) - cnt(m[2]))
    if (m := re.fullmatch(r'🍎 (\S+)   🍌 (\S+)   How many fruits in all\?', t)): return str(cnt(m[1]) + cnt(m[2]))
    if (m := re.fullmatch(r'✏️ (\d+) boxes have (\d+) pencils each\. There are (\d+) more pencils outside\. How many pencils in all\?', t)): return str(int(m[1]) * int(m[2]) + int(m[3]))
    return None

idx = json.load(open(os.path.join(D, 'index.json'), encoding='utf-8'))
for L in idx['levels']:
    data = json.load(open(os.path.join(D, L['id'] + '.json'), encoding='utf-8')); seen = set()
    skills = {s['id']: s for s in data.get('skills', [])}
    # skill tree: known requires, no cycles
    for s in skills.values():
        for r in s['requires']:
            if r not in skills: bad('%s skill %s requires unknown %s' % (L['id'], s['id'], r))
    def cyc(sid, path):
        if sid in path: return True
        return any(cyc(r, path | {sid}) for r in skills.get(sid, {}).get('requires', []))
    for sid in skills:
        if cyc(sid, frozenset()): bad(L['id'] + ' cycle at ' + sid)
    used = set()
    for q in data['questions']:
        total += 1; i = q['id']
        if i in ids: bad('dup id ' + i)
        ids.add(i)
        typ = q['type']
        if skills and q['topic'] not in skills: bad('%s topic %s not in skill tree' % (i, q['topic']))
        used.add(q['topic'])
        if typ == 'multiple-choice':
            ch = q['choices']
            if ch.count(q['answer']) != 1: bad(i + ' answer not exactly once')
            if len(set(ch)) != len(ch) or not 3 <= len(ch) <= 4: bad(i + ' choices')
        elif typ == 'tap-count':
            if not (1 <= q['target'] < q['total'] <= 12): bad(i + ' tap-count numbers')
            if q['answer'] != str(q['target']) or q['question'] != 'Tap %d %s' % (q['target'], q['icon']): bad(i + ' tap-count text')
        elif typ == 'order':
            it = q['items']
            if len(set(it)) != len(it) or not 3 <= len(it) <= 5: bad(i + ' order items')
            if q['answer'] != ','.join(str(x) for x in sorted(int(x) for x in it)): bad(i + ' order answer ' + q['answer'])
        else: bad(i + ' unknown type ' + typ)
        if not q['hint'] or not q['explanation']: bad(i + ' empty hint/explanation')
        key = (typ, q['question'], q['answer'])
        if key in seen: bad(i + ' repeated question')
        seen.add(key)
        if re.search(r'<|>|http|www\.', json.dumps(q, ensure_ascii=False)): bad(i + ' markup/link')
        if q.get('verified') is not False: bad(i + ' must be marked unverified')
        if q['subject'] in ('maths', 'olympiad') and typ == 'multiple-choice':
            exp = solve(q['question'])
            if exp is None: hand.setdefault(L['id'], []).append(q['question'])
            elif exp != q['answer']: bad('%s answer %s but re-solved %s (%s)' % (i, q['answer'], exp, q['question']))
    for sid in skills:
        n = sum(1 for q in data['questions'] if q['topic'] == sid)
        if n < 3: bad('%s skill %s has only %d questions' % (L['id'], sid, n))
print('checked', total, 'questions;', 'hand-written maths items (read by a human):', {k: len(v) for k, v in hand.items()})
if errs: print('\n'.join(errs[:40])); sys.exit(1)
print('ALL OK')
