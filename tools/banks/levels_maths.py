# Computed Maths for Pre-KG..Class 4. Every answer is calculated. verified=False (topics from school syllabi, not an official list).
import random
LEVELS = ['pre', 'c1', 'c2', 'c3', 'c4']

def opts(rng, ans, near):
    out = []
    for v in near:
        if v != ans and v >= 0 and v not in out: out.append(v)
    k = 1
    while len(out) < 3:
        for v in (ans + k, ans - k):
            if v != ans and v >= 0 and v not in out and len(out) < 3: out.append(v)
        k += 1
    return [str(v) for v in out[:3]]

def gen(level, seed=7):
    rng = random.Random(hash(level) % 1000 + seed)
    rng = random.Random(seed * 31 + LEVELS.index(level))
    Q = []
    def add(topic, diff, q, ans, near, hint, expl, pre=None):
        Q.append(dict(subject='maths', level=level, topic=topic, difficulty=diff, question=q, answer=str(ans),
                      wrong=opts(rng, ans, near), hint=hint, explanation=expl, requires=pre or []))
    if level == 'pre':
        for n in (3, 5, 7, 9, 4, 6, 8, 10, 12, 15):
            e = rng.choice(['🍎', '⭐', '🎈', '🐟', '🧸'])
            add('counting', 1, e * n + ' How many?', n, [n + 1, n - 1, n + 2], 'Touch each one and count.', 'There are %d.' % n)
        for n in (2, 4, 6, 8, 11, 13, 17, 19):
            add('after-before', 2, 'What comes after %d?' % n, n + 1, [n - 1, n + 2], 'Count: %d, then…' % n, '%d, %d. After %d comes %d.' % (n, n + 1, n, n + 1), ['counting'])
        for n in (3, 5, 7, 9, 12, 15):
            add('after-before', 2, 'What comes before %d?' % n, n - 1, [n + 1, n - 2], 'Count up to %d. Stop one step before.' % n, 'Before %d comes %d.' % (n, n - 1), ['counting'])
        for a, b in ((3, 5), (7, 4), (2, 6), (8, 5), (9, 6), (4, 10)):
            add('more-less', 1, 'Which is MORE: %d or %d?' % (a, b), max(a, b), [min(a, b)], 'Count up: the bigger number comes later.', '%d is more than %d.' % (max(a, b), min(a, b)), ['counting'])
        for a, b in ((1, 2), (2, 1), (2, 3), (3, 1), (1, 4), (3, 2), (4, 1), (2, 2)):
            add('join', 2, '%s + %s : how many in all?' % ('🍬' * a, '🍬' * b), a + b, [a, b, a + b + 1], 'Count all the sweets together.', '%d and %d make %d.' % (a, b, a + b), ['counting'])
    elif level == 'c1':
        for _ in range(8):
            a = rng.randint(2, 9); b = rng.randint(2, 10 - 0) if False else rng.randint(1, 10 - a if a < 10 else 1)
            add('add-10', 1, '%d + %d = ?' % (a, b), a + b, [a, b, a + b + 1, a + b - 1], 'Count on from %d.' % a, '%d + %d = %d' % (a, b, a + b), ['counting'])
        for _ in range(8):
            a = rng.randint(11, 20); b = rng.randint(2, 9)
            add('sub-20', 2, '%d − %d = ?' % (a, b), a - b, [a - b + 1, a - b - 1, a + b], 'Count back %d steps.' % b, '%d − %d = %d' % (a, b, a - b), ['add-10'])
        for _ in range(8):
            t = rng.randint(1, 9); o = rng.randint(0, 9); n = t * 10 + o
            add('place-value', 2, 'In %d, how many TENS?' % n, t, [o, t + 1, t - 1 if t > 1 else 2], 'The left digit is tens.', 'In %d the tens digit is %d.' % (n, t), ['add-10'])
        for t in (2, 3, 4, 5):
            for m in (2, 3, 4, 5, 6, 7, 8, 9, 10)[: 4]:
                add('tables', 2, '%d × %d = ?' % (t, m), t * m, [t + m, t * m + t, t * m - t], 'Skip count by %d, %d times.' % (t, m), '%d × %d = %d' % (t, m, t * m), ['add-10'])
        for _ in range(5):
            a = rng.randint(10, 60); b = rng.randint(10, 30)
            add('add-100', 3, '%d + %d = ?' % (a, b), a + b, [a + b + 10, a + b - 10, a + b + 1], 'Add the tens, then the ones.', '%d + %d = %d' % (a, b, a + b), ['place-value'])
        for n, d in ((4, 2), (6, 2), (8, 4), (10, 2)):
            add('half', 3, 'Half of %d = ?' % n, n // 2, [n, n // 2 + 1, n - 1], 'Share equally between 2.', 'Half of %d is %d.' % (n, n // 2), ['tables'])
    elif level == 'c2':
        for _ in range(7):
            h = rng.randint(1, 9); t = rng.randint(0, 9); o = rng.randint(0, 9); n = h * 100 + t * 10 + o
            add('place-value', 2, 'In %d, the digit in the TENS place is?' % n, t, [h, o, t + 1], 'Read from the right: ones, tens, hundreds.', 'In %d the tens digit is %d.' % (n, t), [])
        for _ in range(7):
            a = rng.randint(100, 600); b = rng.randint(100, 350)
            while (a % 10 + b % 10 >= 10) or ((a // 10) % 10 + (b // 10) % 10 >= 10): a = rng.randint(100, 600); b = rng.randint(100, 350)
            add('add-999', 2, '%d + %d = ?' % (a, b), a + b, [a + b + 10, a + b - 10, a + b + 100], 'Add ones, then tens, then hundreds.', '%d + %d = %d' % (a, b, a + b), ['place-value'])
        for _ in range(7):
            a = rng.randint(300, 900); b = rng.randint(100, 250)
            while (a % 10 < b % 10) or ((a // 10) % 10 < (b // 10) % 10): a = rng.randint(300, 900); b = rng.randint(100, 250)
            add('sub-999', 2, '%d − %d = ?' % (a, b), a - b, [a - b + 10, a - b - 10, a - b + 100], 'Subtract ones, tens, then hundreds.', '%d − %d = %d' % (a, b, a - b), ['place-value'])
        for t in (6, 7, 8, 9, 11, 12):
            for m in (rng.randint(2, 12), rng.randint(2, 12)):
                add('tables', 2, '%d × %d = ?' % (t, m), t * m, [t * m + t, t * m - t, t + m], 'Skip count by %d.' % t, '%d × %d = %d' % (t, m, t * m), [])
        for _ in range(6):
            d = rng.randint(2, 6); q = rng.randint(2, 10)
            add('division', 3, '%d ÷ %d = ?' % (d * q, d), q, [q + 1, q - 1 if q > 1 else 2, d], 'Think: %d × ? = %d.' % (d, d * q), '%d × %d = %d, so %d ÷ %d = %d' % (d, q, d * q, d * q, d, q), ['tables'])
        for _ in range(4):
            r = rng.choice([5, 10, 20, 50]); k = rng.randint(2, 6)
            add('money', 3, '₹%d + ₹%d + ₹%d = ?' % (r, r, r * (k - 1)), r * (k + 1), [r * k, r * (k + 2)], 'Add the rupees.', 'Total ₹%d.' % (r * (k + 1)), ['add-999'])
    elif level == 'c3':
        for _ in range(7):
            a = rng.randint(250, 800); b = rng.randint(150, 700)
            add('add-regroup', 2, '%d + %d = ?' % (a, b), a + b, [a + b + 10, a + b - 10, a + b + 100], 'Carry when ones add to 10 or more.', '%d + %d = %d' % (a, b, a + b), [])
        for _ in range(7):
            a = rng.randint(500, 990); b = rng.randint(101, a - 100)
            add('sub-regroup', 2, '%d − %d = ?' % (a, b), a - b, [a - b + 10, a - b - 10, a - b + 100], 'Borrow when the top digit is smaller.', '%d − %d = %d' % (a, b, a - b), [])
        for _ in range(8):
            a = rng.randint(11, 60); b = rng.randint(2, 9)
            add('multiply', 3, '%d × %d = ?' % (a, b), a * b, [a * b + a, a * b - b, a + b], 'Split %d into tens and ones.' % a, '%d × %d = %d' % (a, b, a * b), [])
        for _ in range(6):
            d = rng.randint(3, 9); q = rng.randint(5, 15)
            add('division', 3, '%d ÷ %d = ?' % (d * q, d), q, [q + 1, q - 1, q + 2], 'Think of the %d table.' % d, '%d × %d = %d' % (d, q, d * q), [])
        for n, a in ((8, 1), (8, 3), (12, 1), (12, 3), (9, 1), (6, 1)):
            add('fraction-of-set', 3, '1/%d of %d = ?' % (a + 1 if False else (2 if a == 1 and n in (8, 12, 6) and False else 4 if n == 8 or n == 12 else 3), n, ) if False else '1/%d of %d = ?' % (4 if n in (8, 12) else 3, n), n // (4 if n in (8, 12) else 3), [n // 2, n - 1, 2], 'Share into equal groups.', 'Split %d equally.' % n, [])
        for h in (1, 2, 3, 4):
            for m in (15, 30, 45):
                add('time', 3, '%d hour and %d minutes = ? minutes' % (h, m), h * 60 + m, [h * 100 + m, h * 60, h * 60 + m + 10], '1 hour = 60 minutes.', '%d × 60 + %d = %d' % (h, m, h * 60 + m), [])
    else:  # c4
        for _ in range(6):
            n = rng.randint(100000, 999999)
            d = rng.randint(0, 5)
            names = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'lakhs']
            add('place-value', 2, 'In %d, which digit is in the %s place?' % (n, names[d]), (n // 10 ** d) % 10, [(n // 10 ** ((d + 1) % 6)) % 10, (n // 10 ** ((d + 2) % 6)) % 10, (n // 10 ** ((d + 3) % 6)) % 10], 'Count places from the right.', 'The digit is %d.' % ((n // 10 ** d) % 10), [])
        roman = [(1, 'I'), (4, 'IV'), (5, 'V'), (9, 'IX'), (10, 'X'), (12, 'XII'), (14, 'XIV'), (15, 'XV'), (19, 'XIX'), (20, 'XX')]
        for n, r in roman:
            wrong = [x[1] for x in roman if x[1] != r][:3]
            Q.append(dict(subject='maths', level=level, topic='roman', difficulty=2, question='Roman numeral for %d?' % n, answer=r, wrong=[w for w in wrong if w != r][:3], hint='I=1, V=5, X=10. Smaller before bigger means subtract.', explanation='%d is %s.' % (n, r), requires=[]))
        for _ in range(6):
            a = rng.randint(12000, 60000); b = rng.randint(1200, 30000)
            add('add-big', 2, '%d + %d = ?' % (a, b), a + b, [a + b + 100, a + b - 100, a + b + 1000], 'Line up the digits. Add from the right.', '%d + %d = %d' % (a, b, a + b), [])
        for _ in range(6):
            a = rng.randint(30000, 90000); b = rng.randint(1200, 29000)
            add('sub-big', 2, '%d − %d = ?' % (a, b), a - b, [a - b + 100, a - b - 100, a - b + 1000], 'Line up the digits. Borrow when needed.', '%d − %d = %d' % (a, b, a - b), [])
        for _ in range(8):
            a = rng.randint(12, 49); b = rng.randint(11, 29)
            add('multiply', 3, '%d × %d = ?' % (a, b), a * b, [a * b + a, a * b - b, a * b + 10], 'Do %d × %d, then %d × %d tens.' % (a, b % 10, a, b // 10), '%d × %d = %d' % (a, b, a * b), [])
        for _ in range(6):
            d = rng.randint(3, 9); q = rng.randint(12, 40)
            add('division', 3, '%d ÷ %d = ?' % (d * q, d), q, [q + 1, q - 1, q + 10], 'Think of the %d table.' % d, '%d × %d = %d' % (d, q, d * q), [])
        for l, w in ((12, 8), (15, 10), (9, 6), (20, 5), (14, 9), (11, 7)):
            add('perimeter', 3, 'A rectangle is %d cm long and %d cm wide. Perimeter = ? cm' % (l, w), 2 * (l + w), [l * w, l + w, 2 * l + w], 'Add all four sides.', '%d + %d + %d + %d = %d' % (l, w, l, w, 2 * (l + w)), [])
    return Q
