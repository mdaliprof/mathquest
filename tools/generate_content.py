#!/usr/bin/env python3
"""Math Quest content generator.

Run:  python3 tools/generate_content.py
Writes content/index.json, content/week-01.json ... week-18.json, and keeps content/facts.json.

Every answer is COMPUTED here, never typed by hand. Then run tools/check_content.py,
which re-checks everything with separate code.

Change MAX_MULT to 20 if tables should go up to x20 (default is x10).
Bump CONTENT_VERSION after any change so devices pick up the new questions.
"""
import copy
import json
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))
OUT = os.path.join(ROOT, 'content')

MAX_MULT = 10
CONTENT_VERSION = 1
ITEMS = ['🍬', '🧸', '🏏', '🍎', '🍪', '🎈', '🪁', '⭐']
DIFF = {1: 1, 2: 1, 3: 2, 4: 2, 5: 3}

PHASES = {
    'words': ('🔤', 'Number words'),
    'add': ('➕', 'Addition'),
    'sub': ('➖', 'Subtraction'),
    'tables': ('✖️', 'Tables'),
    'div': ('➗', 'Division'),
}

# week, phase, region icon, title (title is for parents only)
WEEKS = [
    (1, 'words', '🏖️', 'Numbers 0 to 10'),
    (2, 'words', '🌴', 'Numbers 11 to 20'),
    (3, 'words', '🏞️', 'Tens up to 100'),
    (4, 'add', '🚂', 'Add within 10'),
    (5, 'add', '🚀', 'Add within 20'),
    (6, 'sub', '🌙', 'Subtract within 10'),
    (7, 'sub', '🪐', 'Subtract within 20'),
    (8, 'tables', '🏰', 'Tables 2, 5, 10'),
    (9, 'tables', '🌋', 'Tables 3, 4'),
    (10, 'tables', '🏜️', 'Tables 6, 7'),
    (11, 'tables', '⛵', 'Tables 8, 9'),
    (12, 'tables', '🗻', 'Tables 11, 12'),
    (13, 'tables', '🌆', 'Tables 13, 14, 15'),
    (14, 'tables', '🎪', 'Tables 16, 17, 18'),
    (15, 'tables', '🏝️', 'Tables 19, 20'),
    (16, 'tables', '🐉', 'Mixed tables (boss week)'),
    (17, 'div', '🍰', 'Sharing equally'),
    (18, 'div', '🏆', 'Division with tables'),
]


def R(a, b):
    return list(range(a, b + 1))


# ---------------------------------------------------------------- helpers
def mk_id(level, short, w, d, n):
    return f"L{level}-{short}-w{w:02d}d{d}-{n:02d}"


def Q(id_, level, topic, type_, question, answer, hint, explanation, skills, diff,
      choices=None, **extra):
    q = {"id": id_, "level": level, "topic": topic, "type": type_, "question": question}
    if choices is not None:
        q["choices"] = choices
    q["answer"] = answer
    q["hint"] = hint
    q["explanation"] = explanation
    q["skills"] = skills
    q["difficulty"] = min(3, max(1, diff))
    for k, v in extra.items():
        if v is not None:
            q[k] = v
    return q


def distract(ans, cands, rng, n=3, lo=0, hi=None):
    """Pick n wrong numbers, preferring the 'common mistake' candidates in order."""
    out = []
    for c in cands:
        if c is None or c == ans or c in out:
            continue
        if c < lo or (hi is not None and c > hi):
            continue
        out.append(c)
    if len(out) > n:
        out = rng.sample(out[:n + 2], n)
    j = 1
    while len(out) < n and j < 300:
        for c in (ans + j, ans - j):
            if len(out) >= n:
                break
            if c != ans and c not in out and c >= lo and (hi is None or c <= hi):
                out.append(c)
        j += 1
    return out


def mcq(ans, cands, rng, **kw):
    ch = [ans] + distract(ans, cands, rng, **kw)
    rng.shuffle(ch)
    return [str(c) for c in ch]


def icon_for(w, d):
    return ITEMS[(w * 3 + d) % len(ITEMS)]


# ---------------------------------------------------------------- number words
ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
        'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
        'eighteen', 'nineteen']
TENS = {20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy',
        80: 'eighty', 90: 'ninety'}
SUPPORTED = R(0, 20) + list(range(30, 101, 10))


def words(n):
    if n < 20:
        return ONES[n]
    if n == 100:
        return 'one hundred'
    return TENS[n]


WORD_PLAN = {
    (1, 1): R(0, 3), (1, 2): R(4, 6), (1, 3): R(7, 10), (1, 4): R(0, 10), (1, 5): R(0, 10),
    (2, 1): R(11, 13), (2, 2): R(14, 16), (2, 3): R(17, 20), (2, 4): R(11, 20), (2, 5): R(0, 20),
    (3, 1): [20, 30, 40], (3, 2): [50, 60], (3, 3): [70, 80, 90],
    (3, 4): list(range(20, 101, 10)), (3, 5): list(range(20, 101, 10)) + R(13, 19),
}


def conf_nums(n):
    """Numbers kids mix up with n (13 and 30, 17 and 71)."""
    c = []
    if 13 <= n <= 19:
        c.append((n - 10) * 10)
    if n in range(30, 100, 10):
        c.append(n // 10 + 10)
    if 10 <= n <= 99 and n % 10:
        c.append(int(str(n)[::-1]))
    return c


def count_hint(n):
    if n == 0:
        return '0'
    if n <= 20:
        return ' '.join(str(i) for i in range(1, n + 1))
    return ' '.join(str(i) for i in range(10, n + 1, 10))


def cpic(n, icon):
    if n == 0:
        return None
    if n <= 20:
        return {"icon": icon, "count": n}
    return {"icon": "🔟", "count": n // 10}


def word_wrongs(n, rng, k=3):
    i = SUPPORTED.index(n)
    cands = [c for c in conf_nums(n) if c in SUPPORTED]
    for step in (1, -1, 2, -2, 3, -3):
        if 0 <= i + step < len(SUPPORTED):
            cands.append(SUPPORTED[i + step])
    return distract(n, cands, rng, n=k, lo=0, hi=100)


def q_n2w(qid, n, rng, diff, icon):
    ans = words(n)
    ch = [words(c) for c in word_wrongs(n, rng)] + [ans]
    rng.shuffle(ch)
    return Q(qid, 1, 'number-words', 'multiple-choice', str(n), ans, count_hint(n),
             f"{n} = {ans}", ['number-to-word'], diff, choices=ch, say=ans,
             hintPic=cpic(n, icon))


def q_w2n(qid, n, rng, diff, icon):
    cands = conf_nums(n) + [n + 1, n - 1, n + 10, n - 10, n + 2, n - 2]
    ch = mcq(n, cands, rng, lo=0, hi=100)
    return Q(qid, 1, 'number-words', 'multiple-choice', words(n), str(n), count_hint(n),
             f"{words(n)} = {n}", ['word-to-number'], diff, choices=ch, say=words(n),
             hintPic=cpic(n, icon))


def q_wpad(qid, n, rng, diff, icon):
    return Q(qid, 1, 'number-words', 'pad', words(n), str(n), count_hint(n),
             f"{words(n)} = {n}", ['word-to-number'], diff, say=words(n),
             hintPic=cpic(n, icon))


def q_wtf(qid, n, rng, diff, icon):
    true = rng.random() < 0.5
    shown = n
    if not true:
        shown = word_wrongs(n, rng, k=1)[0]
    stmt = f"{n} = {words(shown)}"
    return Q(qid, 1, 'number-words', 'true-false', stmt, 'True' if true else 'False',
             count_hint(n), f"{n} = {words(n)}", ['number-to-word'], diff,
             choices=['True', 'False'], say=words(shown), hintPic=cpic(n, icon))


def q_wmatch(qid, F, rng, diff):
    pool = F[:]
    if len(pool) < 3:
        extra = [x for x in SUPPORTED if x not in pool and any(abs(SUPPORTED.index(x) - SUPPORTED.index(p)) <= 2 for p in pool)]
        rng.shuffle(extra)
        pool += extra[:3 - len(pool)]
    nums = sorted(rng.sample(pool, 3))
    pairs = [[str(n), words(n)] for n in nums]
    return Q(qid, 1, 'number-words', 'match', '', ';'.join(f"{a}={b}" for a, b in pairs),
             'Tap 🔊', ', '.join(f"{a} = {b}" for a, b in pairs), ['number-word-match'],
             diff, pairs=pairs)


def q_wcount(qid, n, rng, diff, icon):
    ch = mcq(n, [n + 1, n - 1, n + 2, n - 2], rng, lo=0, hi=20)
    return Q(qid, 1, 'counting', 'multiple-choice', '?', str(n), count_hint(n), f"{n} {icon}",
             ['counting'], diff, choices=ch, pic={"icon": icon, "count": n})


def learn_words(F, rng, icon):
    nums = sorted(rng.sample(F, 4)) if len(F) > 4 else list(F)
    steps = []
    for n in nums:
        st = {"big": str(n), "word": words(n), "say": words(n)}
        p = cpic(n, icon)
        if p:
            st["pic"] = p
        steps.append(st)
    return steps


def build_words(w, d, rng):
    F = WORD_PLAN[(w, d)]
    icon = icon_for(w, d)
    diff = DIFF[d]
    if (w, d) == (1, 1):
        types = ['count', 'n2w', 'w2n', 'tf', 'match']
    else:
        types = {1: ['n2w', 'w2n', 'tf', 'n2w', 'match'],
                 2: ['n2w', 'w2n', 'tf', 'pad', 'match'],
                 3: ['w2n', 'n2w', 'pad', 'tf', 'match'],
                 4: ['n2w', 'w2n', 'pad', 'tf', 'match'],
                 5: ['w2n', 'n2w', 'pad', 'tf', 'match']}[d]
    order = F[:]
    rng.shuffle(order)
    k = 0
    used = set()
    qs = []
    for i, t in enumerate(types):
        qid = mk_id(1, 'words', w, d, i + 1)
        if t == 'match':
            qs.append(q_wmatch(qid, F, rng, diff + 1))
            continue
        pool = [x for x in order if x > 0] if t == 'count' else order
        # prefer a number not yet used for this question type, so no question repeats
        fresh = [x for x in pool if (t, x) not in used]
        n = fresh[k % len(fresh)] if fresh else pool[k % len(pool)]
        used.add((t, n))
        k += 1
        fn = {'count': q_wcount, 'n2w': q_n2w, 'w2n': q_w2n, 'pad': q_wpad, 'tf': q_wtf}[t]
        qs.append(fn(qid, n, rng, diff, icon))
    return {"boss": d == 5, "learn": learn_words(F, rng, icon), "practice": qs}


# ---------------------------------------------------------------- generic arithmetic families
def pick_facts(facts, k_single, rng, res):
    c = facts[:]
    rng.shuffle(c)
    singles = c[:k_single]
    match, seen = [], set()
    for f in c[k_single:]:
        r = res(f)
        if r not in seen:
            match.append(f)
            seen.add(r)
        if len(match) == 3:
            break
    if len(match) < 3:
        raise RuntimeError('not enough distinct facts for a match question')
    return singles, match


def build_family(fam, w, d, rng, facts, types, level, topic, short, diff, show_pic=False):
    n_single = sum(1 for t in types if t != 'match')
    singles, match = pick_facts(facts, n_single, rng, fam['res'])
    qs, si = [], 0
    for i, t in enumerate(types):
        qid = mk_id(level, short, w, d, i + 1)
        if t == 'match':
            pairs = [[fam['expr'](f), str(fam['res'](f))] for f in sorted(match, key=fam['res'])]
            qs.append(Q(qid, level, topic, 'match', '', ';'.join(f"{a}={b}" for a, b in pairs),
                        fam['match_hint'], ', '.join(f"{a} = {b}" for a, b in pairs),
                        [fam['skill']], diff + 1, pairs=pairs))
            continue
        f = singles[si]
        si += 1
        res = fam['res'](f)
        expl = fam['expl'](f)
        hint = fam['hint'](f)
        hpic = fam['hintpic'](f)
        if t == 'mc':
            pic = fam['pic'](f) if (show_pic and i == 0) else None
            ch = mcq(res, fam['cands'](f), rng, lo=fam.get('lo', 0), hi=fam.get('hi'))
            qs.append(Q(qid, level, topic, 'multiple-choice', f"{fam['expr'](f)} = ?", str(res),
                        hint, expl, [fam['skill']], diff, choices=ch, pic=pic, hintPic=hpic))
        elif t == 'pad':
            qs.append(Q(qid, level, topic, 'pad', f"{fam['expr'](f)} = ?", str(res), hint, expl,
                        [fam['skill']], diff, hintPic=hpic))
        elif t == 'tf':
            true = rng.random() < 0.5
            shown = res if true else distract(res, fam['cands'](f), rng, n=1,
                                              lo=fam.get('lo', 0), hi=fam.get('hi'))[0]
            qs.append(Q(qid, level, topic, 'true-false', f"{fam['expr'](f)} = {shown}",
                        'True' if true else 'False', hint, expl, [fam['skill']], diff,
                        choices=['True', 'False'], hintPic=hpic))
        elif t == 'missing':
            text, ans, mhint, mc = fam['missing'](f, rng)
            ch = mcq(ans, mc, rng, lo=fam.get('mlo', 0), hi=fam.get('mhi'))
            qs.append(Q(qid, level, topic, 'multiple-choice', text, str(ans), mhint, expl,
                        [fam['skill'] + '-missing'], diff + 1, choices=ch))
        elif t == 'seq':
            text, ans, shint, sc, sexpl = fam['seq'](f, rng)
            ch = mcq(ans, sc, rng, lo=1)
            qs.append(Q(qid, level, topic, 'multiple-choice', text, str(ans), shint, sexpl,
                        ['skip-counting'], diff, choices=ch))
    return qs


# ---------------------------------------------------------------- addition
def fam_add(icon):
    return {
        'res': lambda f: f[0] + f[1],
        'expr': lambda f: f"{f[0]} + {f[1]}",
        'expl': lambda f: f"{f[0]} + {f[1]} = {f[0] + f[1]}",
        'hint': lambda f: ' '.join(str(x) for x in range(f[0], f[0] + f[1] + 1)),
        'hintpic': lambda f: {"icon": icon, "groups": [f[0], f[1]], "op": "+"},
        'pic': lambda f: {"icon": icon, "groups": [f[0], f[1]], "op": "+"},
        'cands': lambda f: [f[0] + f[1] + 1, f[0] + f[1] - 1, f[0], f[1], f[0] + f[1] + 2,
                            f[0] + f[1] - 2, f[0] + f[1] + 10],
        'missing': lambda f, rng: (f"{f[0]} + ? = {f[0] + f[1]}", f[1],
                                   ' '.join(str(x) for x in range(f[0], f[0] + f[1] + 1)),
                                   [f[0], f[0] + f[1], f[1] + 1, f[1] - 1, f[1] + 2, f[1] + 10]),
        'skill': 'addition',
        'match_hint': 'Add each one',
        'hi': 20, 'mhi': 20,
    }


def add_rule5(d, a, b):
    s = a + b
    if s > 20:
        return False
    if d == 1:
        return 11 <= a <= 17 and b <= 9 and a % 10 + b <= 9
    if d == 2:
        return 3 <= a <= 10 and 3 <= b <= 10 and abs(a - b) <= 1
    if d == 3:
        return 6 <= a <= 9 and 4 <= b <= 9 and 11 <= s <= 18
    if d == 4:
        return any(add_rule5(k, a, b) for k in (1, 2, 3))
    return 12 <= s <= 20 and a >= 2 and b >= 2


def add_facts(w, d):
    out = []
    for a in range(1, 20):
        for b in range(1, 20):
            s = a + b
            if w == 4:
                lim = {1: 5, 2: 7, 3: 9, 4: 10, 5: 10}[d]
                if s <= lim and not (d == 5 and s < 6):
                    out.append((a, b))
            elif add_rule5(d, a, b):
                out.append((a, b))
    return out


def addsub_types(d, rng):
    base = {1: ['mc', 'pad', 'tf', 'mc'], 2: ['mc', 'pad', 'tf', 'mc'],
            3: ['mc', 'pad', 'tf', 'missing'], 4: ['mc', 'pad', 'tf', 'missing'],
            5: ['mc', 'pad', 'tf', 'missing']}[d]
    rest = base[1:]
    rng.shuffle(rest)
    return [base[0]] + rest + ['match']


def build_add(w, d, rng):
    icon = icon_for(w, d)
    fam = fam_add(icon)
    facts = add_facts(w, d)
    qs = build_family(fam, w, d, rng, facts, addsub_types(d, rng), 2, 'addition', 'add',
                      DIFF[d], show_pic=(d <= 2))
    ex = rng.sample(facts, 2)
    learn = []
    for a, b in ex:
        pic = {"icon": icon, "groups": [a, b], "op": "+"}
        learn.append({"pic": pic, "big": f"{a} + {b} = ?", "say": f"{a} plus {b}"})
        learn.append({"pic": pic, "big": f"{a} + {b} = {a + b}", "say": f"{a} plus {b} is {a + b}"})
    return {"boss": d == 5, "learn": learn, "practice": qs}


# ---------------------------------------------------------------- subtraction
def fam_sub(icon):
    return {
        'res': lambda f: f[0] - f[1],
        'expr': lambda f: f"{f[0]} − {f[1]}",
        'expl': lambda f: f"{f[0]} − {f[1]} = {f[0] - f[1]}",
        'hint': lambda f: ' '.join(str(x) for x in range(f[0], f[0] - f[1] - 1, -1)),
        'hintpic': lambda f: {"icon": icon, "count": f[0], "cross": f[1]},
        'pic': lambda f: {"icon": icon, "count": f[0], "cross": f[1]},
        'cands': lambda f: [f[0] + f[1] if f[0] + f[1] <= 20 else None, f[0] - f[1] + 1,
                            f[0] - f[1] - 1, f[1], f[0] - f[1] + 2, f[0] - f[1] - 2, f[0]],
        'missing': lambda f, rng: (f"{f[0]} − ? = {f[0] - f[1]}", f[1],
                                   ' '.join(str(x) for x in range(f[0], f[0] - f[1] - 1, -1)),
                                   [f[0] - f[1], f[1] + 1, f[1] - 1, f[0], f[1] + 2, f[1] + 10]),
        'skill': 'subtraction',
        'match_hint': 'Take away',
        'hi': 20, 'mhi': 20,
    }


def sub_rule7(d, a, b):
    if d == 1:
        return 11 <= a <= 19 and a % 10 >= 1 and 1 <= b <= a % 10
    if d == 2:
        return (a % 2 == 0 and 12 <= a <= 20 and b == a // 2) or (a == 20 and 1 <= b <= 9)
    if d == 3:
        return 11 <= a <= 18 and a % 10 < b <= 9
    if d == 4:
        return any(sub_rule7(k, a, b) for k in (1, 2, 3))
    return 12 <= a <= 20 and 2 <= b <= 9


def sub_facts(w, d):
    out = []
    for a in range(2, 21):
        for b in range(1, a):
            if w == 6:
                lim = {1: 5, 2: 7, 3: 9, 4: 10, 5: 10}[d]
                if a <= lim and not (d == 5 and a < 6):
                    out.append((a, b))
            elif sub_rule7(d, a, b):
                out.append((a, b))
    return out


def build_sub(w, d, rng):
    icon = icon_for(w, d)
    fam = fam_sub(icon)
    facts = sub_facts(w, d)
    qs = build_family(fam, w, d, rng, facts, addsub_types(d, rng), 3, 'subtraction', 'sub',
                      DIFF[d], show_pic=(d <= 2))
    ex = rng.sample(facts, 2)
    learn = []
    for a, b in ex:
        pic = {"icon": icon, "count": a, "cross": b}
        learn.append({"pic": pic, "big": f"{a} − {b} = ?", "say": f"{a} minus {b}"})
        learn.append({"pic": pic, "big": f"{a} − {b} = {a - b}", "say": f"{a} minus {b} is {a - b}"})
    return {"boss": d == 5, "learn": learn, "practice": qs}


# ---------------------------------------------------------------- tables (multiplication)
TABLE_GROUPS = {8: [2, 5, 10], 9: [3, 4], 10: [6, 7], 11: [8, 9], 12: [11, 12],
                13: [13, 14, 15], 14: [16, 17, 18], 15: [19, 20]}


def tables_for(w, d):
    if w == 16:
        return {1: [2, 3, 4, 5, 10], 2: [6, 7, 8, 9], 3: R(11, 15), 4: R(16, 20), 5: R(2, 20)}[d]
    G = TABLE_GROUPS[w]
    if d >= 4:
        return G
    if len(G) == 3:
        return [G[d - 1]]
    return [G[0]] if d == 1 else [G[1]] if d == 2 else G


def skip_list(k, steps):
    return ', '.join(str(k * i) for i in range(1, steps + 1))


def fam_mult(icon, single_table):
    def expr(f):
        t, b, swap = f
        return f"{b} × {t}" if swap else f"{t} × {b}"

    def hpic(f):
        t, b, _ = f
        if t * b <= 20 and b <= 10 and t <= 10:
            return {"icon": icon, "groups": [t] * b}
        return None

    def missing(f, rng):
        t, b, _ = f
        p = t * b
        if t <= 10 and rng.random() < 0.5:
            return (f"? × {b} = {p}", t, skip_list(b, t),
                    [b, t + 1, t - 1, p - b, t + 2, p // 2 if p % 2 == 0 else None, b + t])
        return (f"{t} × ? = {p}", b, skip_list(t, b),
                [t, b + 1, b - 1, p - t, b + 2, p // 2 if p % 2 == 0 else None, b + t])

    def seq(f, rng):
        t, b, _ = f
        m = rng.choice([3, 4])
        shown = ', '.join(str(t * i) for i in range(1, m + 1))
        ans = t * (m + 1)
        return (f"{shown}, ?", ans, f"+{t}",
                [ans - t, ans + t, ans + 1, ans - 1, ans + 2, ans - 2, ans + 10],
                ', '.join(str(t * i) for i in range(1, m + 2)))

    return {
        'res': lambda f: f[0] * f[1],
        'expr': expr,
        'expl': lambda f: f"{f[0]} × {f[1]} = {f[0] * f[1]}",
        'hint': lambda f: skip_list(f[0], f[1]),
        'hintpic': hpic,
        'pic': hpic,
        'cands': lambda f: [f[0] * f[1] + f[0], f[0] * f[1] - f[0], f[0] + f[1],
                            f[0] * f[1] + f[1], f[0] * f[1] - f[1], f[0] * f[1] + 10,
                            f[0] * f[1] - 10, int(str(f[0] * f[1])[::-1]) if f[0] * f[1] >= 10 else None],
        'missing': missing,
        'seq': seq,
        'skill': 'tables',
        'match_hint': 'Skip count',
        'lo': 1, 'mlo': 1,
    }


def learn_table(t, icon, full=True):
    steps = []
    if t <= 10:
        b = min(3, 20 // t)
        if b >= 2:
            pic = {"icon": icon, "groups": [t] * b}
            steps.append({"pic": pic, "big": f"{t} × {b} = ?", "say": f"{t} times {b}"})
            steps.append({"pic": pic, "big": f"{t} × {b} = {t * b}", "say": f"{t} times {b} is {t * b}"})
    else:
        b = 4
        steps.append({"big": f"{t} × {b} = ?", "say": f"{t} times {b}"})
        steps.append({"lines": [f"10 × {b} = {10 * b}", f"{t - 10} × {b} = {(t - 10) * b}"]})
        steps.append({"big": f"{10 * b} + {(t - 10) * b} = {t * b}", "say": f"{t * b}"})
    if full:
        top = min(MAX_MULT, 10)
        steps.append({"lines": [f"{t} × {i} = {t * i}" for i in range(1, min(5, top) + 1)]})
        if top > 5:
            steps.append({"lines": [f"{t} × {i} = {t * i}" for i in range(6, top + 1)]})
    return steps


def build_tables(w, d, rng):
    T = tables_for(w, d)
    icon = icon_for(w, d)
    single = len(T) == 1
    fam = fam_mult(icon, single)
    lo_b = 2 if d == 5 else 1
    facts = []
    for t in T:
        for b in range(lo_b, MAX_MULT + 1):
            swap = (not single) and rng.random() < 0.4
            facts.append((t, b, swap))
    types = {1: ['mc', 'seq', 'tf', 'pad'], 2: ['mc', 'tf', 'pad', 'seq'],
             3: ['mc', 'missing', 'tf', 'pad'], 4: ['mc', 'pad', 'missing', 'tf'],
             5: ['mc', 'missing', 'pad', 'tf']}[d] + ['match']
    qs = build_family(fam, w, d, rng, facts, types, 4, 'multiplication', 'mult', DIFF[d],
                      show_pic=(d <= 2))
    if single:
        learn = learn_table(T[0], icon, full=True)
    else:
        picks = sorted(set([T[0], T[len(T) // 2], T[-1]]))
        learn = []
        for t in picks:
            learn += learn_table(t, icon, full=False)[:3]
    return {"boss": d == 5, "learn": learn, "practice": qs}


# ---------------------------------------------------------------- division
def div_facts(w, d):
    out = []
    if w == 17:
        divs = {1: [2], 2: [3, 2], 3: [4, 5], 4: [2, 3, 4, 5], 5: [2, 3, 4, 5]}[d]
        for dv in divs:
            for q in range(2 if d == 5 else 1, 11):
                if dv * q <= 20:
                    out.append((dv * q, dv, q))
    else:
        divs = {1: [2, 3], 2: [4, 5], 3: [6, 7], 4: [8, 9, 10], 5: R(2, 10)}[d]
        for dv in divs:
            for q in range(2 if d == 5 else 1, MAX_MULT + 1):
                out.append((dv * q, dv, q))
    return out


def fam_div(icon, w):
    def hpic(f):
        n, dv, q = f
        if w == 17 and n <= 20:
            return {"icon": icon, "friends": dv, "each": q}
        return None

    def qpic(f):
        n, dv, q = f
        if w == 17 and n <= 20:
            return {"icon": icon, "count": n, "friends": dv}
        return None

    return {
        'res': lambda f: f[2],
        'expr': lambda f: f"{f[0]} ÷ {f[1]}",
        'expl': lambda f: f"{f[1]} × {f[2]} = {f[0]}, so {f[0]} ÷ {f[1]} = {f[2]}" if w == 18
        else f"{f[0]} ÷ {f[1]} = {f[2]}",
        'hint': lambda f: skip_list(f[1], f[2]),
        'hintpic': hpic,
        'pic': qpic,
        'cands': lambda f: [f[0] - f[1], f[2] + 1, f[2] - 1, f[1], f[2] + 2, f[2] - 2,
                            f[0] // 2 if f[0] % 2 == 0 and f[0] // 2 != f[2] else None],
        'missing': lambda f, rng: (f"{f[0]} ÷ ? = {f[2]}", f[1], skip_list(f[1], f[2]),
                                   [f[2], f[1] + 1, f[1] - 1, f[0] - f[2], f[1] + 2, f[1] - 2]),
        'skill': 'division',
        'match_hint': 'Share equally' if w == 17 else 'Use tables',
        'lo': 1, 'mlo': 1,
    }


def build_div(w, d, rng):
    icon = icon_for(w, d)
    fam = fam_div(icon, w)
    facts = div_facts(w, d)
    if w == 17:
        types = {1: ['mc', 'tf', 'pad', 'mc'], 2: ['mc', 'tf', 'pad', 'mc'], 3: ['mc', 'tf', 'pad', 'mc'],
                 4: ['mc', 'pad', 'tf', 'missing'], 5: ['mc', 'pad', 'missing', 'tf']}[d] + ['match']
    else:
        types = {1: ['mc', 'pad', 'tf', 'missing'], 2: ['mc', 'tf', 'pad', 'missing'],
                 3: ['mc', 'pad', 'missing', 'tf'], 4: ['mc', 'missing', 'pad', 'tf'],
                 5: ['mc', 'missing', 'pad', 'tf']}[d] + ['match']
    qs = build_family(fam, w, d, rng, facts, types, 5, 'division', 'div', DIFF[d],
                      show_pic=(w == 17))
    ex = rng.sample(facts, 2)
    learn = []
    for n, dv, q in ex:
        if w == 17:
            learn.append({"pic": {"icon": icon, "count": n, "friends": dv},
                          "big": f"{n} ÷ {dv} = ?", "say": f"{n} shared by {dv}"})
            learn.append({"pic": {"icon": icon, "friends": dv, "each": q},
                          "big": f"{n} ÷ {dv} = {q}", "say": f"{n} shared by {dv} is {q} each"})
        else:
            learn.append({"big": f"{dv} × {q} = {n}", "say": f"{dv} times {q} is {n}"})
            learn.append({"lines": [f"{dv} × {q} = {n}", f"{n} ÷ {dv} = {q}"]})
            learn.append({"big": skip_list(dv, q)})
    return {"boss": d == 5, "learn": learn, "practice": qs}


BUILD = {'words': build_words, 'add': build_add, 'sub': build_sub,
         'tables': build_tables, 'div': build_div}


# ---------------------------------------------------------------- warm-up and review
def special_first_day(first):
    """Week 1 day 1 has nothing earlier, so use easy counting."""
    rng = random.Random('mq-first')
    icon = '🍬'
    warm = [q_wcount(f"L1-count-w01d1-w{i + 1}", n, rng, 1, icon) for i, n in enumerate([2, 3, 5])]
    rev = [q_wcount(f"L1-count-w01d1-r{i + 1}", n, rng, 1, '🧸') for i, n in enumerate([1, 4])]
    return warm, rev


def add_warm_review(all_days):
    for i, day in enumerate(all_days):
        if i == 0:
            day['warmup'], day['review'] = special_first_day(day)
            continue
        rng = random.Random(f"wr-{i}")
        prev = [q for q in all_days[i - 1]['practice'] if q['type'] != 'match']
        day['warmup'] = copy.deepcopy(rng.sample(prev, 3))
        if i >= 2:
            idxs = rng.sample(range(0, i - 1), 2) if i - 1 >= 2 else [0, 0]
            rev = []
            for j in idxs:
                pool = [q for q in all_days[j]['practice'] if q['id'] not in [r['id'] for r in rev]]
                rev.append(copy.deepcopy(rng.choice(pool)))
            day['review'] = rev
        else:
            left = [q for q in all_days[0]['practice'] if q['id'] not in [x['id'] for x in day['warmup']]]
            day['review'] = copy.deepcopy(rng.sample(left, 2))


def main():
    os.makedirs(OUT, exist_ok=True)
    all_days = []
    for (w, phase, icon, title) in WEEKS:
        for d in range(1, 6):
            rng = random.Random(f"mq-{w}-{d}")
            day = BUILD[phase](w, d, rng)
            day['day'] = d
            day['key'] = f"W{w:02d}D{d}"
            all_days.append(day)
    add_warm_review(all_days)

    index = {"app": "mathquest", "contentVersion": CONTENT_VERSION, "weeks": []}
    for (w, phase, icon, title) in WEEKS:
        days = [x for x in all_days if x['key'].startswith(f"W{w:02d}")]
        ordered = []
        for x in days:
            ordered.append({"day": x['day'], "key": x['key'], "boss": x['boss'],
                            "learn": x['learn'], "warmup": x['warmup'],
                            "practice": x['practice'], "review": x['review']})
        fname = f"week-{w:02d}.json"
        with open(os.path.join(OUT, fname), 'w', encoding='utf-8') as fh:
            json.dump({"week": w, "phase": phase, "icon": icon, "title": title, "days": ordered},
                      fh, ensure_ascii=False, indent=1)
        index["weeks"].append({"week": w, "file": fname, "v": CONTENT_VERSION, "phase": phase,
                               "phaseIcon": PHASES[phase][0], "icon": icon, "title": title,
                               "days": 5})
    index["phases"] = [{"id": k, "icon": v[0], "title": v[1]} for k, v in PHASES.items()]
    with open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8') as fh:
        json.dump(index, fh, ensure_ascii=False, indent=1)
    # One-file copy of all content, so the app also opens by double-clicking index.html
    # (browsers block reading JSON files from file:// but allow script files).
    bundle = {"index.json": index}
    with open(os.path.join(OUT, 'facts.json'), encoding='utf-8') as fh:
        bundle["facts.json"] = json.load(fh)
    for (w, _p, _i, _t) in WEEKS:
        name = f"week-{w:02d}.json"
        with open(os.path.join(OUT, name), encoding='utf-8') as fh:
            bundle[name] = json.load(fh)
    with open(os.path.join(OUT, 'bundle.js'), 'w', encoding='utf-8') as fh:
        fh.write("/* made by tools/generate_content.py - do not edit */\nwindow.MQ_CONTENT = ")
        json.dump(bundle, fh, ensure_ascii=False, separators=(',', ':'))
        fh.write(";\n")
    print(f"Wrote {len(WEEKS)} week files, index.json and bundle.js (content version {CONTENT_VERSION}).")


if __name__ == '__main__':
    main()
