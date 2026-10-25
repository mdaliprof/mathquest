# Class 1 skill tree + questions. Maths follows NCERT "Joyful Mathematics 1" (13 chapters, official titles) ;
# English/EVS/GK/Computer follow common themes of NCERT Mridang + ICSE school lists. verified=False until the owner checks.
import random

# id, subject, title, icon, requires, source
SKILLS = [
 ('sort-compare','maths','Sort and compare','🧺',[],'NCERT ch1 Finding the Furry Cat!'),
 ('shapes','maths','Shapes','🔷',[],'NCERT ch2 What is Long?'),
 ('numbers-1-9','maths','Numbers 1 to 9','🔢',['sort-compare'],'NCERT ch3 Mango Treat'),
 ('numbers-10-20','maths','Numbers 10 to 20','🔟',['numbers-1-9'],'NCERT ch4 Making 10'),
 ('add-sub-10','maths','Add and take away to 10','➕',['numbers-1-9'],'NCERT ch5 How Many?'),
 ('add-sub-20','maths','Add and take away to 20','🥕',['add-sub-10','numbers-10-20'],'NCERT ch6 Vegetable Farm'),
 ('numbers-21-99','maths','Numbers 21 to 99','👨‍👩‍👧',['numbers-10-20'],'NCERT ch7 Lina\'s Family'),
 ('add-sub-99','maths','Add and take away to 99','🎯',['add-sub-20','numbers-21-99'],'NCERT ch8 Fun with Numbers'),
 ('patterns','maths','Patterns','🎨',['sort-compare'],'NCERT ch9 Utsav'),
 ('time','maths','Time','⏰',['numbers-1-9'],'NCERT ch10 How do I Spend my Day?'),
 ('measure','maths','Measuring','📏',['numbers-1-9'],'NCERT ch11 How Many Times?'),
 ('money','maths','Money','🪙',['add-sub-20'],'NCERT ch12 How Much Can We Spend?'),
 ('data','maths','Picture graphs','📊',['numbers-1-9'],'NCERT ch13 So Many Toys'),
 ('tables','maths','Tables 2 to 5','✖️',['add-sub-20'],'ICSE school lists (extra, not NCERT Class 1)'),
 ('phonics','english','Letters and sounds','🔤',[],'Common Class 1 theme'),
 ('greetings','english','Greetings and manners','👋',[],'Mridang Unit 1 theme'),
 ('opposites','english','Opposites','↔️',['phonics'],'Common Class 1 theme'),
 ('plurals','english','One and many','👥',['phonics'],'ICSE school lists'),
 ('articles','english','a and an','🅰️',['phonics'],'ICSE school lists'),
 ('punctuation','english','Capital letters and full stops','✏️',['plurals'],'ICSE school lists'),
 ('tense','english','Now and before','⏪',['plurals'],'ICSE school lists'),
 ('body','evs','My body','🧍',[],'EVS: my body'),
 ('family','evs','My family','👪',[],'Mridang Unit 1 theme'),
 ('food','evs','Food we eat','🍚',['body'],'Mridang Unit 3 theme'),
 ('animals','evs','Animals and farm','🐄',[],'Mridang Unit 2 theme'),
 ('plants','evs','Plants','🌱',[],'EVS: plants'),
 ('air-water','evs','Air and water','💧',['plants'],'EVS: air and water'),
 ('seasons','evs','Seasons and weather','🌦️',[],'Mridang Unit 4 theme'),
 ('safety','evs','Staying safe','🚦',[],'EVS: safety'),
 ('india','gk','Our India','🇮🇳',[],'Common GK'),
 ('colours','gk','Colours','🌈',[],'Mridang Unit 4 theme'),
 ('calendar','gk','Days and months','📅',[],'Common GK'),
 ('devices','computer','Computer parts','🖥️',[],'ICSE school lists'),
 ('paint','computer','Drawing on a computer','🖌️',['devices'],'ICSE school lists'),
 ('cyber-safety','computer','Staying safe online','🛡️',['devices'],'Common'),

 ('oly-patterns','olympiad','Pattern detective','🔍',['patterns'],'Olympiad-style practice (original questions)'),
 ('oly-missing','olympiad','Missing numbers','❓',['add-sub-10'],'Olympiad-style practice (original questions)'),
 ('oly-number-sense','olympiad','Number riddles','🧩',['numbers-21-99'],'Olympiad-style practice (original questions)'),
 ('oly-word','olympiad','Story sums','📖',['add-sub-20'],'Olympiad-style practice (original questions)'),
 ('oly-logic','olympiad','Think and decide','🧠',['sort-compare'],'Olympiad-style practice (original questions)'),
 ('oly-shape-count','olympiad','Count the sides','🔺',['shapes'],'Olympiad-style practice (original questions)'),
 ('oly-analogy','olympiad','Word pairs','🔗',['opposites'],'Olympiad-style practice (original questions)'),
]

EM = ['🍎','⭐','🎈','🐟','🧸','🍬','🚗','🐦']
WORDS = {1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine',10:'ten',11:'eleven',12:'twelve',13:'thirteen',14:'fourteen',15:'fifteen',16:'sixteen',17:'seventeen',18:'eighteen',19:'nineteen',20:'twenty'}

def near(ans, extra=(), lo=0):
    out = []
    for v in list(extra) + [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10]:
        if v != ans and v >= lo and v not in out: out.append(v)
    return [str(v) for v in out[:3]]

def maths(seed=11):
    rng = random.Random(seed)
    R = []
    def add(topic, d, q, ans, wrong, hint, expl, **extra):
        r = dict(subject='maths', topic=topic, difficulty=d, question=q, answer=str(ans), wrong=[str(w) for w in wrong],
                 hint=hint, explanation=expl, type='multiple-choice'); r.update(extra); R.append(r)
    # ch1 sort & compare
    for a, b in ((3, 5), (6, 2), (4, 7), (8, 3), (5, 9), (7, 4)):
        e = rng.choice(EM)
        add('sort-compare', 1, 'Which has MORE?  A: %s   B: %s' % (e * a, e * b), 'A' if a > b else 'B', ['B' if a > b else 'A', 'Same', 'None'], 'Count each group.', 'A has %d and B has %d.' % (a, b))
    for a, b in ((2, 6), (7, 3), (9, 4), (1, 5)):
        e = rng.choice(EM)
        add('sort-compare', 1, 'Which has FEWER?  A: %s   B: %s' % (e * a, e * b), 'A' if a < b else 'B', ['B' if a < b else 'A', 'Same', 'None'], 'Count each group.', 'A has %d and B has %d.' % (a, b))
    for t, ans, ws in (('Which is the tallest? 🌳 tree or 🌱 small plant', 'tree', ['small plant', 'same', 'none']), ('Which is heavier? 🐘 or 🐭', 'elephant', ['mouse', 'same', 'none']), ('Which is bigger? 🐘 or 🐜', 'elephant', ['ant', 'same', 'none']), ('Which is longer? 🐍 snake or 🐛 caterpillar', 'snake', ['caterpillar', 'same', 'none'])):
        add('sort-compare', 2, t, ans, ws, 'Picture them side by side.', 'The %s is the answer.' % ans)
    # ch2 shapes (hand)
    for q, a, w, e in (('Which one is a circle?', '⚪', ['⬜', '🔺', '⭐'], 'A circle is round with no corners.'),
                       ('How many sides does a triangle have?', '3', ['2', '4', '5'], 'A triangle has 3 sides.'),
                       ('How many sides does a square have?', '4', ['3', '5', '6'], 'A square has 4 equal sides.'),
                       ('How many corners does a rectangle have?', '4', ['2', '3', '5'], 'A rectangle has 4 corners.'),
                       ('Which solid shape rolls like a ball? ⚽', 'sphere', ['cube', 'cone', 'box'], 'A ball is a sphere.'),
                       ('A dice 🎲 is shaped like a…', 'cube', ['sphere', 'cone', 'circle'], 'A dice is a cube.'),
                       ('A party hat 🎉 is shaped like a…', 'cone', ['cube', 'sphere', 'square'], 'A party hat is a cone.'),
                       ('Which shape has NO corners?', 'circle', ['square', 'triangle', 'rectangle'], 'A circle is round.'),
                       ('The 🐦 is ABOVE the tree. Where is the bird?', 'on top', ['below', 'inside', 'behind'], 'Above means higher up.'),
                       ('The 🐟 is INSIDE the bowl. Where is the fish?', 'in the bowl', ['on the roof', 'far away', 'above'], 'Inside means in the middle of.')):
        add('shapes', 1, q, a, w, 'Think about what it looks like.', e)
    # ch3 numbers 1-9
    for n in (3, 5, 7, 4, 6, 8, 9, 2):
        e = rng.choice(EM)
        add('numbers-1-9', 1, e * n + ' How many?', n, near(n, lo=1), 'Touch each one and count.', 'There are %d.' % n)
    for n in (2, 4, 6, 8, 9, 5, 7):
        add('numbers-1-9', 2, 'Which number is "%s"?' % WORDS[n], n, near(n, lo=1), 'Say the word slowly.', '"%s" is %d.' % (WORDS[n], n))
    for n in (3, 5, 7):
        add('numbers-1-9', 1, 'What comes after %d?' % n, n + 1, near(n + 1, lo=1), 'Count on one.', 'After %d comes %d.' % (n, n + 1))
    # ch4 numbers 10-20
    for t in (1,):
        for o in (2, 4, 6, 8, 3, 5):
            add('numbers-10-20', 2, '1 ten and %d ones = ?' % o, 10 + o, near(10 + o, [o, 10 + o + 10]), 'Ten plus the ones.', '10 + %d = %d' % (o, 10 + o))
    for n in (12, 15, 17, 19, 14, 16):
        add('numbers-10-20', 2, 'What comes after %d?' % n, n + 1, near(n + 1), 'Count on one.', 'After %d comes %d.' % (n, n + 1))
    for n in (11, 13, 16, 18):
        add('numbers-10-20', 2, 'Which number is "%s"?' % WORDS[n], n, near(n), 'Say the word slowly.', '"%s" is %d.' % (WORDS[n], n))
    for n in (6, 7, 8, 9, 4):
        add('numbers-10-20', 3, 'Making 10: %d + ? = 10' % n, 10 - n, near(10 - n, lo=1), 'Count up from %d to 10.' % n, '%d + %d = 10' % (n, 10 - n))
    # ch5 add/sub to 10
    for _ in range(8):
        a = rng.randint(1, 8); b = rng.randint(1, 9 - a + 1 if a < 9 else 1); b = min(b, 10 - a)
        e = rng.choice(EM)
        add('add-sub-10', 1, '%s + %s = ?' % (e * a, e * b), a + b, near(a + b, [a, b], 1), 'Count all of them.', '%d + %d = %d' % (a, b, a + b))
    for _ in range(8):
        a = rng.randint(3, 10); b = rng.randint(1, a - 1)
        add('add-sub-10', 2, '%d − %d = ?' % (a, b), a - b, near(a - b, [a + b], 0), 'Count back %d.' % b, '%d − %d = %d' % (a, b, a - b))
    for _ in range(3):
        a = rng.randint(4, 9); b = rng.randint(1, a - 1)
        add('add-sub-10', 2, '🍬 Ria has %d sweets. She eats %d. How many are left?' % (a, b), a - b, near(a - b, [a + b]), 'Take away.', '%d − %d = %d' % (a, b, a - b))
    # ch6 to 20
    for _ in range(7):
        a = rng.randint(6, 12); b = rng.randint(3, 20 - a)
        add('add-sub-20', 2, '%d + %d = ?' % (a, b), a + b, near(a + b, [a + b + 10]), 'Count on from %d.' % a, '%d + %d = %d' % (a, b, a + b))
    for _ in range(7):
        a = rng.randint(11, 20); b = rng.randint(2, 9)
        add('add-sub-20', 2, '%d − %d = ?' % (a, b), a - b, near(a - b, [a + b]), 'Count back %d.' % b, '%d − %d = %d' % (a, b, a - b))
    for _ in range(3):
        a = rng.randint(8, 12); b = rng.randint(3, 8)
        add('add-sub-20', 3, '🥕 A farm has %d carrots and %d more come. How many carrots now?' % (a, b), a + b, near(a + b, [a, b]), 'Add them.', '%d + %d = %d' % (a, b, a + b))
    # ch7 21-99
    for _ in range(6):
        t = rng.randint(2, 9); o = rng.randint(1, 9)
        add('numbers-21-99', 2, '%d tens and %d ones = ?' % (t, o), t * 10 + o, near(t * 10 + o, [o * 10 + t]), 'Tens first, then ones.', '%d tens is %d, plus %d = %d' % (t, t * 10, o, t * 10 + o))
    for n in (29, 39, 49, 54, 67, 78):
        add('numbers-21-99', 2, 'What comes after %d?' % n, n + 1, near(n + 1), 'Count on one.', 'After %d comes %d.' % (n, n + 1))
    for a, b in ((47, 74), (36, 63), (52, 25), (81, 18), (69, 96)):
        add('numbers-21-99', 3, 'Which is MORE: %d or %d?' % (a, b), max(a, b), [min(a, b)] + near(max(a, b))[:2], 'Look at the tens first.', '%d is more than %d.' % (max(a, b), min(a, b)))
    # ch8 add/sub to 99
    for _ in range(5):
        a = rng.randint(1, 5) * 10; b = rng.randint(1, 4) * 10
        add('add-sub-99', 2, '%d + %d = ?' % (a, b), a + b, near(a + b, [a + b + 1]), 'Add the tens.', '%d + %d = %d' % (a, b, a + b))
    for _ in range(5):
        a = rng.randint(21, 54); b = rng.randint(11, 33)
        while a % 10 + b % 10 >= 10: b = rng.randint(11, 33)
        add('add-sub-99', 3, '%d + %d = ?' % (a, b), a + b, near(a + b, [a + b + 10]), 'Add ones, then tens.', '%d + %d = %d' % (a, b, a + b))
    for _ in range(5):
        a = rng.randint(55, 99); b = rng.randint(11, 44)
        while a % 10 < b % 10: b = rng.randint(11, 44)
        add('add-sub-99', 3, '%d − %d = ?' % (a, b), a - b, near(a - b, [a - b + 10]), 'Take away ones, then tens.', '%d − %d = %d' % (a, b, a - b))
    # ch9 patterns
    for st, s in ((2, 2), (1, 2), (5, 5), (3, 3), (10, 10), (1, 1)):
        seq = [st + s * i for i in range(4)]; n = st + s * 4
        add('patterns', 2, ', '.join(map(str, seq)) + ', ?', n, near(n), 'See how much it grows each step.', 'It grows by %d. Next is %d.' % (s, n))
    for pat, ans, ws in (('🔴🔵🔴🔵🔴 ?', '🔵', ['🔴', '🟢', '🟡']), ('⭐🌙⭐🌙⭐ ?', '🌙', ['⭐', '☀️', '🌟']), ('🍎🍎🍌🍎🍎 ?', '🍌', ['🍎', '🍇', '🍊']), ('🔺🔺🟦🔺🔺 ?', '🟦', ['🔺', '🟢', '⭐']), ('🐱🐶🐱🐶🐱 ?', '🐶', ['🐱', '🐭', '🐰'])):
        add('patterns', 1, pat, ans, ws, 'The same things take turns.', 'The pattern repeats.')
    # ch10 time
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    for i, d in enumerate(days):
        nx = days[(i + 1) % 7]
        add('time', 2, 'The day after %s is…' % d, nx, [x for x in days if x not in (d, nx)][:3], 'Say the days in order.', 'After %s comes %s.' % (d, nx))
    for q, a, w in (('We eat breakfast in the…', 'morning', ['night', 'midnight', 'evening']), ('We sleep at…', 'night', ['morning', 'noon', 'afternoon']), ('The Sun is highest at…', 'noon', ['night', 'dawn', 'midnight']), ('How many days in a week?', '7', ['5', '6', '10']), ('How many hours in a day?', '24', ['12', '20', '60'])):
        add('time', 1, q, a, w, 'Think about your day.', 'The answer is %s.' % a)
    # ch11 measure (non-standard units)
    for q, a, w in (('A pencil is 5 clips long. A book is 8 clips long. Which is longer?', 'book', ['pencil', 'same', 'none']), ('Which holds more water? 🪣 bucket or 🥛 glass', 'bucket', ['glass', 'same', 'none']), ('Which is lighter? 🪶 feather or 🪨 stone', 'feather', ['stone', 'same', 'none']), ('We can measure a desk with our…', 'hand spans', ['ears', 'eyes', 'nose']), ('A rope is 6 steps long. A ribbon is 3 steps long. Which is shorter?', 'ribbon', ['rope', 'same', 'none'])):
        add('measure', 2, q, a, w, 'Compare the two.', 'The answer is %s.' % a)
    # ch12 money
    for _ in range(5):
        a = rng.randint(1, 5); b = rng.randint(1, 5)
        add('money', 2, '₹%d + ₹%d = ?' % (a, b), '₹%d' % (a + b), ['₹%d' % (a + b + 1), '₹%d' % (a + b - 1 if a + b > 1 else a + b + 2), '₹%d' % (a + b + 2)], 'Add the rupees.', '₹%d and ₹%d make ₹%d.' % (a, b, a + b))
    for q, a, w in (('Which is worth more: ₹10 note or ₹5 coin?', '₹10', ['₹5', 'same', 'none']), ('A toy costs ₹8. You have ₹10. Change left?', '₹2', ['₹8', '₹18', '₹1']), ('Where do we spend money?', 'at a shop', ['in the sky', 'under the bed', 'in the sea'])):
        add('money', 3, q, a, w, 'Think of a shop.', 'The answer is %s.' % a)
    # ch13 data
    for _ in range(5):
        a = rng.randint(2, 8); b = rng.randint(1, a - 1)
        add('data', 2, '🧸 toys: %s     🚗 toys: %s     How many MORE 🧸 than 🚗?' % ('🧸' * a, '🚗' * b), a - b, near(a - b, [a, b], 0), 'Count each, then compare.', '%d − %d = %d' % (a, b, a - b))
    for _ in range(3):
        a = rng.randint(2, 6); b = rng.randint(2, 6)
        add('data', 2, '🍎 %s   🍌 %s   How many fruits in all?' % ('🍎' * a, '🍌' * b), a + b, near(a + b, [a, b], 1), 'Count both rows.', '%d + %d = %d' % (a, b, a + b))
    # tables (ICSE extra)
    for t in (2, 3, 4, 5):
        for m in (2, 3, 4, 5):
            add('tables', 3, '%d × %d = ?' % (t, m), t * m, near(t * m, [t + m, t * m + t]), 'Skip count by %d, %d times.' % (t, m), '%d × %d = %d' % (t, m, t * m))
    # --- fun activities ---
    for n in (3, 5, 6, 4, 7, 8):
        e = rng.choice(EM)
        R.append(dict(subject='maths', topic='numbers-1-9', difficulty=1, type='tap-count', question='Tap %d %s' % (n, e), icon=e, target=n, total=n + 3,
                      answer=str(n), wrong=[], hint='Tap one at a time. Count out loud.', explanation='You tapped %d. Great counting!' % n))
    for items in ((3, 7, 5), (9, 2, 6), (4, 1, 8), (6, 3, 9), (7, 5, 2)):
        R.append(dict(subject='maths', topic='sort-compare', difficulty=2, type='order', question='Tap from SMALLEST to BIGGEST', items=[str(x) for x in items],
                      answer=','.join(str(x) for x in sorted(items)), wrong=[], hint='Start with the smallest number.', explanation='Smallest to biggest: %s.' % ', '.join(str(x) for x in sorted(items))))
    for items in ((12, 18, 15), (31, 13, 22), (40, 14, 27), (55, 35, 45)):
        R.append(dict(subject='maths', topic='numbers-10-20' if max(items) <= 20 else 'numbers-21-99', difficulty=3, type='order', question='Tap from SMALLEST to BIGGEST', items=[str(x) for x in items],
                      answer=','.join(str(x) for x in sorted(items)), wrong=[], hint='Look at the tens first.', explanation='Smallest to biggest: %s.' % ', '.join(str(x) for x in sorted(items))))
    return R


# ---------------- text subjects: (subject, topic, diff, question, answer, [3 wrong], hint, explanation)
TEXT = [
 # phonics
 ('english','phonics',1,'🍎 starts with…','A',['B','M','S'],'Say a-a-apple.','Apple starts with A.'),
 ('english','phonics',1,'🐻 starts with…','B',['D','P','T'],'Say b-b-bear.','Bear starts with B.'),
 ('english','phonics',1,'🐱 starts with…','C',['K','G','T'],'Say c-c-cat.','Cat starts with C.'),
 ('english','phonics',1,'🐶 starts with…','D',['B','G','P'],'Say d-d-dog.','Dog starts with D.'),
 ('english','phonics',1,'🐘 starts with…','E',['A','I','O'],'Say e-e-elephant.','Elephant starts with E.'),
 ('english','phonics',1,'🐟 starts with…','F',['P','S','H'],'Say f-f-fish.','Fish starts with F.'),
 ('english','phonics',1,'🌞 starts with…','S',['Z','N','M'],'Say s-s-sun.','Sun starts with S.'),
 ('english','phonics',2,'🐱 c_t','a',['o','u','e'],'c-a-t.','The word is cat.'),
 ('english','phonics',2,'🌞 s_n','u',['a','o','i'],'s-u-n.','The word is sun.'),
 ('english','phonics',2,'🐟 f_sh','i',['a','o','u'],'f-i-sh.','The word is fish.'),
 ('english','phonics',2,'Which word rhymes with CAT?','hat',['dog','sun','pen'],'Same ending sound.','Cat and hat rhyme.'),
 ('english','phonics',2,'Which word rhymes with SUN?','fun',['moon','star','sky'],'Same ending sound.','Sun and fun rhyme.'),
 ('english','phonics',2,'Which one is a vowel?','E',['B','K','T'],'Vowels: A E I O U.','E is a vowel.'),
 # greetings
 ('english','greetings',1,'In the morning we say…','Good morning',['Good night','Goodbye','Sorry'],'The Sun is just up.','We say Good morning in the morning.'),
 ('english','greetings',1,'Before bed we say…','Good night',['Good morning','Hello','Welcome'],'The Moon is out.','We say Good night before bed.'),
 ('english','greetings',1,'Someone helps you. You say…','Thank you',['Sorry','Goodbye','Stop'],'Be polite.','Say thank you to say you are grateful.'),
 ('english','greetings',1,'You bump into a friend. You say…','Sorry',['Thank you','Good night','Hello'],'Be kind.','Say sorry when you hurt someone.'),
 ('english','greetings',1,'When you meet a teacher you say…','Good morning, teacher',['Go away','Give me','Hurry up'],'Be polite.','We greet teachers kindly.'),
 ('english','greetings',2,'You want something. You say…','Please',['Now','Give','Mine'],'The magic word.','Please is the magic word.'),
 # opposites
 ('english','opposites',1,'Opposite of HOT','cold',['warm','big','red'],'Think of ice.','Hot and cold.'),
 ('english','opposites',1,'Opposite of BIG','small',['tall','long','fast'],'Think of an ant.','Big and small.'),
 ('english','opposites',1,'Opposite of UP','down',['out','over','top'],'Slide down!','Up and down.'),
 ('english','opposites',1,'Opposite of HAPPY','sad',['glad','kind','funny'],'😀 and 😢','Happy and sad.'),
 ('english','opposites',2,'Opposite of FAST','slow',['quick','loud','late'],'Think of a snail.','Fast and slow.'),
 ('english','opposites',2,'Opposite of DAY','night',['noon','light','sun'],'Moon time.','Day and night.'),
 # plurals
 ('english','plurals',1,'One cat, many…','cats',['cat','cates','catz'],'Add s.','One cat, many cats.'),
 ('english','plurals',1,'One dog, many…','dogs',['dog','doges','dogz'],'Add s.','One dog, many dogs.'),
 ('english','plurals',2,'One box, many…','boxes',['boxs','boxies','boxz'],'Add es after x.','One box, many boxes.'),
 ('english','plurals',2,'One child, two…','children',['childs','childes','childrens'],'This word changes a lot.','One child, two children.'),
 ('english','plurals',2,'One mouse, two…','mice',['mouses','mices','mouse'],'This word changes a lot.','One mouse, two mice.'),
 # articles
 ('english','articles',1,'___ apple 🍎','an',['a','the','on'],'Apple starts with a vowel sound.','Use an before a, e, i, o, u sounds.'),
 ('english','articles',1,'___ dog 🐶','a',['an','the','in'],'Dog starts with D.','Use a before other sounds.'),
 ('english','articles',2,'___ elephant 🐘','an',['a','the','at'],'E is a vowel.','Use an before a vowel sound.'),
 ('english','articles',2,'___ umbrella ☂️','an',['a','the','it'],'U is a vowel sound here.','Use an before vowel sounds.'),
 # punctuation
 ('english','punctuation',1,'A sentence starts with a…','capital letter',['full stop','comma','number'],'Look at the first letter.','Every sentence starts with a capital letter.'),
 ('english','punctuation',1,'A telling sentence ends with a…','full stop (.)',['question mark (?)','comma (,)','nothing'],'Stop at the end.','A telling sentence ends with a full stop.'),
 ('english','punctuation',2,'An asking sentence ends with…','question mark (?)',['full stop (.)','comma (,)','nothing'],'Are you asking?','An asking sentence ends with a question mark.'),
 ('english','punctuation',2,'Which name starts right?','Ria',['ria','rIa','RIa'],'Names begin with a capital.','Names start with a capital letter.'),
 # tense
 ('english','tense',2,'She ___ a book now.','reads',['read','readed','reading'],'One girl: add s.','We say: she reads.'),
 ('english','tense',2,'They ___ in the park.','play',['plays','playing','played'],'Many people: no s.','We say: they play.'),
 ('english','tense',3,'Yesterday I ___ to school.','went',['go','goes','going'],'Yesterday is past.','The past of go is went.'),
 # body
 ('evs','body',1,'We see with our…','eyes 👀',['ears','nose','hands'],'Open them and look!','We see with our eyes.'),
 ('evs','body',1,'We hear with our…','ears 👂',['eyes','nose','feet'],'Listen to music.','We hear with our ears.'),
 ('evs','body',1,'We smell with our…','nose 👃',['ears','eyes','hands'],'Sniff a flower.','We smell with our nose.'),
 ('evs','body',1,'We taste with our…','tongue 👅',['eyes','ears','hands'],'Ice cream!','We taste with the tongue.'),
 ('evs','body',2,'How many senses do we have?','5',['3','4','10'],'See, hear, smell, taste, touch.','We have five senses.'),
 ('evs','body',2,'Which part pumps blood?','heart ❤️',['brain','tummy','lungs'],'Thump-thump.','The heart pumps blood.'),
 ('evs','body',1,'We clap with our…','hands 👏',['feet','eyes','ears'],'Clap clap!','We clap with our hands.'),
 ('evs','body',1,'We brush our teeth…','twice a day',['never','once a week','only on Sunday'],'Morning and night.','Brush in the morning and at night.'),
 # family
 ('evs','family',1,'Your mother’s mother is your…','grandmother',['aunt','sister','cousin'],'Two steps up the family.','Your mother’s mother is your grandmother.'),
 ('evs','family',1,'Your parents’ other son is your…','brother',['uncle','cousin','teacher'],'Same parents.','Your father’s son is your brother.'),
 ('evs','family',1,'Who looks after us at home?','family 👪',['strangers','robots','no one'],'The people who love you.','Our family looks after us.'),
 ('evs','family',2,'Your uncle’s child is your…','cousin',['brother','grandfather','neighbour'],'A family friend your age.','Your uncle’s child is your cousin.'),
 ('evs','family',1,'We help our family by…','sharing the work',['hiding','shouting','breaking things'],'Be kind.','Helping makes a happy home.'),
 # food
 ('evs','food',1,'Which gives us energy?','rice 🍚',['plastic','stone','paper'],'We eat it every day.','Rice and chapati give energy.'),
 ('evs','food',1,'Which is a fruit?','🍌 banana',['🥕 carrot','🧅 onion','🥔 potato'],'Sweet and yellow.','A banana is a fruit.'),
 ('evs','food',1,'Which is a vegetable?','🥕 carrot',['🍌 banana','🍎 apple','🍇 grapes'],'It grows in the soil.','A carrot is a vegetable.'),
 ('evs','food',2,'Which is good for strong bones?','milk 🥛',['sweets','chips','cold drink'],'Calcium is in it.','Milk helps bones grow strong.'),
 ('evs','food',2,'Before eating we should…','wash our hands',['jump','run','sleep'],'Germs hide on hands.','Washing hands keeps us healthy.'),
 ('evs','food',2,'Honey is made by…','bees 🐝',['ants','flies','butterflies'],'They live in a hive.','Bees make honey.'),
 # animals
 ('evs','animals',1,'🐄 gives us…','milk',['eggs','honey','wool'],'Think of a white drink.','Cows give us milk.'),
 ('evs','animals',1,'🐔 gives us…','eggs',['milk','wool','honey'],'Breakfast!','Hens give us eggs.'),
 ('evs','animals',1,'Which can fly?','🐦 bird',['🐘 elephant','🐟 fish','🐢 tortoise'],'It has wings.','Birds can fly.'),
 ('evs','animals',1,'Which lives in water?','🐟 fish',['🐄 cow','🐕 dog','🐓 hen'],'It swims.','Fish live in water.'),
 ('evs','animals',2,'A baby frog is called a…','tadpole',['puppy','chick','calf'],'Lives in water, has a tail.','A baby frog is a tadpole.'),
 ('evs','animals',2,'Which animal eats only plants?','cow 🐄',['lion 🦁','tiger 🐅','crocodile 🐊'],'Cows eat grass.','Cows eat only plants.'),
 ('evs','animals',1,'A farm 🚜 is a place where we grow…','food',['toys','phones','shoes'],'Fields and animals.','Farms give us food.'),
 # plants
 ('evs','plants',1,'Plants need water and…','sunlight ☀️',['candy','toys','paper'],'Plants like the Sun.','Plants need water and sunlight.'),
 ('evs','plants',1,'Which part is under the soil?','root',['flower','leaf','fruit'],'It holds the plant.','Roots grow under the soil.'),
 ('evs','plants',2,'A seed grows into a…','plant',['stone','egg','toy'],'Plant it and wait.','A seed grows into a plant.'),
 ('evs','plants',2,'Which part makes food using sunlight?','leaf',['root','stem','seed'],'Green and flat.','Leaves make food with sunlight.'),
 ('evs','plants',2,'We get flowers 🌸 from…','plants',['stones','cars','clouds'],'They grow.','Plants make flowers.'),
 # air-water
 ('evs','air-water',1,'We cannot see air but we can…','feel it',['eat it','hold it','drink it'],'Wind on your face.','We can feel moving air.'),
 ('evs','air-water',1,'Water in a glass is a…','liquid',['solid','gas','rock'],'It pours.','Water is a liquid.'),
 ('evs','air-water',2,'Rain comes from…','clouds ☁️',['the ground','trees','the Moon'],'Look up when it rains.','Rain falls from clouds.'),
 ('evs','air-water',2,'We should not waste…','water',['toys','books','pencils'],'Close the tap.','Save water. Close the tap.'),
 ('evs','air-water',1,'We need air to…','breathe',['jump over','paint','sing only'],'In and out.','All living things need air.'),
 # seasons
 ('evs','seasons',1,'Which season is hottest?','summer ☀️',['winter ❄️','spring 🌸','autumn 🍂'],'Ice cream time.','Summer is the hottest season.'),
 ('evs','seasons',1,'In the rainy season we carry an…','umbrella ☂️',['ice cream','kite','fan'],'Water falls from the sky.','An umbrella keeps us dry.'),
 ('evs','seasons',1,'In winter we wear…','sweaters 🧥',['sandals','swimsuits','sunglasses'],'It is cold.','Sweaters keep us warm.'),
 ('evs','seasons',2,'A rainbow 🌈 appears when sun shines and it is…','raining',['snowing','night','windy only'],'Sun and rain together.','A rainbow shows when sun and rain meet.'),
 # safety
 ('evs','safety',1,'At a red 🔴 light we…','stop',['go','run','jump'],'Red means stop.','Red light means stop.'),
 ('evs','safety',1,'At a green 🟢 light we…','go (when safe)',['stop','sleep','sit'],'Green means go.','Green light means go, if it is safe.'),
 ('evs','safety',1,'Should you touch a hot pan?','No',['Yes','Only with wet hands','Yes, quickly'],'Hot things burn.','Never touch hot things.'),
 ('evs','safety',2,'Emergency number in India?','112',['999','000','123'],'Three digits, starts with 1.','112 is the emergency number.'),
 ('evs','safety',1,'We cross the road with…','a grown-up',['our eyes closed','running fast','no one'],'Hold a hand.','Cross with a grown-up.'),
 # india
 ('gk','india',1,'India’s national animal is the…','Tiger 🐅',['Elephant','Lion','Cow'],'It has stripes.','The tiger is India’s national animal.'),
 ('gk','india',1,'India’s national bird is the…','Peacock 🦚',['Parrot','Crow','Sparrow'],'Beautiful tail.','The peacock is India’s national bird.'),
 ('gk','india',2,'Independence Day is on…','15 August',['26 January','2 October','1 May'],'Mid-August.','India became free on 15 August 1947.'),
 ('gk','india',2,'Republic Day is on…','26 January',['15 August','2 October','14 November'],'Start of the year.','Republic Day is 26 January.'),
 ('gk','india',2,'The capital of India is…','New Delhi',['Mumbai','Chennai','Kolkata'],'Parliament is there.','New Delhi is India’s capital.'),
 ('gk','india',1,'Our national flag has how many colours?','3 (and a wheel)',['2','5','7'],'Saffron, white, green.','Saffron, white and green, with a blue wheel.'),
 # colours
 ('gk','colours',1,'🍎 is usually…','red',['blue','black','white'],'Look at the apple.','Apples are often red.'),
 ('gk','colours',1,'The sky 🌤️ looks…','blue',['red','green','pink'],'Look up.','The sky looks blue.'),
 ('gk','colours',1,'Grass 🌱 is…','green',['red','blue','yellow'],'Look at the garden.','Grass is green.'),
 ('gk','colours',1,'Colours in a rainbow?','7',['3','5','9'],'VIBGYOR.','A rainbow has 7 colours.'),
 ('gk','colours',2,'Red + yellow make…','orange',['green','purple','black'],'Mix paints.','Red and yellow make orange.'),
 ('gk','colours',2,'Blue + yellow make…','green',['orange','purple','pink'],'Mix paints.','Blue and yellow make green.'),
 # calendar
 ('gk','calendar',1,'Months in a year?','12',['10','11','13'],'January to December.','A year has 12 months.'),
 ('gk','calendar',1,'Days in a week?','7',['5','6','10'],'Monday to Sunday.','A week has 7 days.'),
 ('gk','calendar',2,'The first month of the year is…','January',['March','December','April'],'New Year!','January is the first month.'),
 ('gk','calendar',2,'Which month comes after June?','July',['May','August','April'],'June, then…','After June comes July.'),
 # devices
 ('computer','devices',1,'Which do we type with?','⌨️ keyboard',['🖱️ mouse','🖥️ screen','🔊 speaker'],'It has many keys.','We type with a keyboard.'),
 ('computer','devices',1,'Which do we click?','🖱️ mouse',['🖥️ screen','🔊 speaker','🖨️ printer'],'Move it and click.','We click with a mouse.'),
 ('computer','devices',1,'Which shows pictures?','🖥️ screen',['⌨️ keyboard','🖱️ mouse','🎧 headphones'],'We look at it.','A screen shows pictures.'),
 ('computer','devices',2,'Which one gives us sound?','🔊 speaker',['🖱️ mouse','⌨️ keyboard','🖨️ printer'],'We listen to it.','A speaker gives sound.'),
 # paint
 ('computer','paint',1,'In Paint we can…','draw and colour',['cook food','run fast','plant trees'],'Think of colours.','Paint is for drawing and colouring.'),
 ('computer','paint',1,'Paint is a program on a…','computer',['spoon','bag','bed'],'It runs on a screen.','Paint is a computer program for drawing.'),
 ('computer','paint',2,'Which tool is used to fill a shape with colour?','bucket 🪣',['pencil','eraser','ruler'],'Pour the colour in.','The fill bucket fills a shape with colour.'),
 # cyber safety
 ('computer','cyber-safety',1,'Should you share your password?','No, only with parents',['Yes, with friends','Yes, with everyone','Yes, online'],'Keep it secret.','Passwords are secret. Tell only a parent.'),
 ('computer','cyber-safety',1,'A stranger online asks where you live. You…','tell a parent',['tell them','send a photo','say yes'],'Tell a grown-up you trust.','Never share where you live.'),
 ('computer','cyber-safety',2,'Before using a tablet we ask a…','parent',['stranger','dog','robot'],'A grown-up at home.','Ask a parent first.'),
]


def olympiad(seed=23):
    """Original olympiad-STYLE reasoning questions for Class 1 (no real exam papers, no exam names). Computed where possible."""
    rng = random.Random(seed)
    R = []
    def add(topic, q, ans, wrong, hint, expl, d=3):
        R.append(dict(subject='olympiad', topic=topic, difficulty=d, question=q, answer=str(ans), wrong=[str(w) for w in wrong],
                      hint=hint, explanation=expl, type='multiple-choice'))
    # patterns: constant step (up and down), growing step, alternating
    for st, s in ((3, 3), (20, -2), (30, -5), (4, 4), (50, -10), (6, 2)):
        seq = [st + s * i for i in range(4)]; n = st + s * 4
        add('oly-patterns', ', '.join(map(str, seq)) + ', ?', n, near(n, [n + 1, n - 1], 0), 'Look at how much it changes each time.', 'It changes by %d each time. Next is %d.' % (s, n))
    for st, g in ((1, 1), (2, 1), (1, 2), (3, 1)):
        seq = [st]; step = g
        for _ in range(3): seq.append(seq[-1] + step); step += 1
        n = seq[-1] + step
        add('oly-patterns', ', '.join(map(str, seq)) + ', ?', n, near(n, [n - 1, n + 1], 0), 'The jump gets bigger by 1 each time.', 'Jumps: %s. Next jump is %d, so %d.' % (', '.join(str(seq[i + 1] - seq[i]) for i in range(3)), step, n))
    for a, b in ((1, 5), (2, 7), (3, 8), (1, 6)):
        seq = [a, b, a + 1, b + 1, a + 2]
        add('oly-patterns', ', '.join(map(str, seq)) + ', ?', b + 2, near(b + 2, [b + 1, a + 3], 0), 'Two number lines share the turns.', 'Even places go up by 1: %d, %d, %d. Next is %d.' % (b, b + 1, b + 2, b + 2))
    for pat, ans, ws in (('🔴🔵🔵🔴🔵🔵🔴 ?', '🔵', ['🔴', '🟢', '🟡']), ('⭐⭐🌙⭐⭐🌙⭐ ?', '⭐', ['🌙', '☀️', '🌟']), ('🍎🍌🍌🍎🍌🍌🍎🍌 ?', '🍌', ['🍎', '🍇', '🍊'])):
        add('oly-patterns', pat, ans, ws, 'Find the part that repeats.', 'The pattern repeats, so the next one is %s.' % ans, 2)
    # missing numbers
    for _ in range(4):
        b = rng.randint(3, 9); t = rng.randint(b + 3, 20)
        add('oly-missing', '? + %d = %d' % (b, t), t - b, near(t - b, [t + b], 0), 'Count up from %d to %d.' % (b, t), '%d + %d = %d' % (t - b, b, t))
    for _ in range(4):
        t = rng.randint(8, 18); r = rng.randint(2, 7)
        add('oly-missing', '%d − ? = %d' % (t, r), t - r, near(t - r, [t + r], 0), 'How many do we take away to reach %d?' % r, '%d − %d = %d' % (t, t - r, r))
    for _ in range(4):
        r = rng.randint(3, 9); b = rng.randint(2, 9)
        add('oly-missing', '? − %d = %d' % (b, r), r + b, near(r + b, [r - b if r > b else r + b + 2], 0), 'Think of the number before you took %d away.' % b, '%d − %d = %d' % (r + b, b, r))
    # number riddles
    for lo in (12, 15, 24, 38):
        add('oly-number-sense', 'I am more than %d and less than %d. Who am I?' % (lo, lo + 2), lo + 1, near(lo + 1, [lo, lo + 2], 0), 'It sits between the two.', '%d is between %d and %d.' % (lo + 1, lo, lo + 2))
    for lo, hi in ((10, 15), (20, 26), (31, 36), (45, 50)):
        add('oly-number-sense', 'How many numbers are between %d and %d?' % (lo, hi), hi - lo - 1, near(hi - lo - 1, [hi - lo], 0), 'Do not count %d and %d.' % (lo, hi), 'The numbers after %d up to before %d: %d of them.' % (lo, hi, hi - lo - 1))
    for a, b in ((4, 7), (2, 9), (3, 8), (5, 6)):
        add('oly-number-sense', 'Biggest 2-digit number using the digits %d and %d?' % (a, b), max(a, b) * 10 + min(a, b), [min(a, b) * 10 + max(a, b), a + b, 99], 'Put the bigger digit in the tens place.', 'Tens %d, ones %d: %d.' % (max(a, b), min(a, b), max(a, b) * 10 + min(a, b)))
        add('oly-number-sense', 'Smallest 2-digit number using the digits %d and %d?' % (a, b), min(a, b) * 10 + max(a, b), [max(a, b) * 10 + min(a, b), a + b, 10], 'Put the smaller digit in the tens place.', 'Tens %d, ones %d: %d.' % (min(a, b), max(a, b), min(a, b) * 10 + max(a, b)))
    # story sums
    for _ in range(4):
        a = rng.randint(4, 9); b = rng.randint(2, 6)
        add('oly-word', 'Ria has %d sweets. Sam has %d more than Ria. How many does Sam have?' % (a, b), a + b, near(a + b, [a, b], 0), '"More than" means add.', '%d + %d = %d' % (a, b, a + b))
    for _ in range(4):
        a = rng.randint(10, 18); b = rng.randint(3, 7); c = rng.randint(1, 3)
        add('oly-word', '%d birds sit on a tree. %d fly away and %d come back. How many birds now?' % (a, b, c), a - b + c, near(a - b + c, [a - b, a + c], 0), 'Take away first, then add.', '%d − %d = %d, then + %d = %d' % (a, b, a - b, c, a - b + c))
    for n in (2, 3, 4, 5):
        add('oly-word', '%d 🐱 cats. Each cat has 4 legs. How many legs in all?' % n, n * 4, near(n * 4, [n + 4, n * 2], 0), 'Skip count by 4.', '%d × 4 = %d' % (n, n * 4))
    for a, b in ((3, 2), (4, 3), (5, 2), (6, 3)):
        add('oly-word', 'Ria has %d pencils. Sam has %d fewer. How many do they have together?' % (a + b, b), (a + b) + a, near((a + b) + a, [a + b, a], 0), 'First find how many Sam has.', 'Sam has %d. Together: %d + %d = %d' % (a, a + b, a, 2 * a + b))
    # shapes counting
    for n in (2, 3, 4):
        add('oly-shape-count', 'How many sides do %d triangles have in all?' % n, 3 * n, near(3 * n, [n + 3, 4 * n], 0), 'One triangle has 3 sides.', '%d × 3 = %d' % (n, 3 * n))
        add('oly-shape-count', 'How many corners do %d squares have in all?' % n, 4 * n, near(4 * n, [n + 4, 3 * n], 0), 'One square has 4 corners.', '%d × 4 = %d' % (n, 4 * n))
    # logic (hand-written)
    for q, a, w, h, e in (
        ('Ria is taller than Sam. Sam is taller than Tia. Who is the SHORTEST?', 'Tia', ['Ria', 'Sam', 'All same'], 'Line them up, tallest first.', 'Ria, Sam, Tia: Tia is shortest.'),
        ('Ria is taller than Sam. Sam is taller than Tia. Who is the TALLEST?', 'Ria', ['Sam', 'Tia', 'All same'], 'Line them up, tallest first.', 'Ria is taller than both.'),
        ('Which is the odd one out?  🍎 🍌 🚗 🍇', '🚗', ['🍎', '🍌', '🍇'], 'Three are fruits.', 'A car is not a fruit.'),
        ('Which is the odd one out?  🐶 🐱 🐮 🌳', '🌳', ['🐶', '🐱', '🐮'], 'Three are animals.', 'A tree is not an animal.'),
        ('Which is the odd one out?  ✏️ 🖍️ 📕 🖊️', '📕', ['✏️', '🖍️', '🖊️'], 'Three are for writing or drawing.', 'A book is not a writing tool.'),
        ('Tom stands 3rd from the front. There are 2 children behind him. How many children in the line?', '5', ['3', '4', '6'], 'Count the ones in front, Tom, and behind.', '2 in front + Tom + 2 behind = 5.'),
        ('If today is Monday, what day will it be after 2 days?', 'Wednesday', ['Tuesday', 'Thursday', 'Friday'], 'Count on: Tuesday, then…', 'Monday, Tuesday, Wednesday.'),
        ('If today is Friday, what day was it 2 days ago?', 'Wednesday', ['Thursday', 'Tuesday', 'Saturday'], 'Count back: Thursday, then…', 'Friday, Thursday, Wednesday.'),
        ('I have 2 eyes, 1 nose and 1 mouth. What am I?', 'a face', ['a house', 'a car', 'a tree'], 'Look in a mirror.', 'A face has these parts.'),
        ('Which is heavier?  1 kg of cotton or 1 kg of stones?', 'same', ['cotton', 'stones', 'none'], 'Both are 1 kg.', '1 kg is 1 kg.'),
    ):
        add('oly-logic', q, a, w, h, e)
    # word pairs (analogies)
    for q, a, w in (
        ('Bird is to fly as fish is to…', 'swim', ['run', 'sing', 'jump']),
        ('Day is to Sun as night is to…', 'Moon', ['star only', 'rain', 'wind']),
        ('Hand is to glove as foot is to…', 'sock', ['hat', 'ring', 'belt']),
        ('Hot is to cold as up is to…', 'down', ['over', 'high', 'top']),
        ('Cow is to milk as hen is to…', 'eggs', ['honey', 'wool', 'rice']),
        ('Eye is to see as ear is to…', 'hear', ['smell', 'taste', 'run']),
        ('Big is to small as tall is to…', 'short', ['long', 'thin', 'fat']),
        ('Morning is to breakfast as night is to…', 'dinner', ['lunch', 'tiffin', 'snack only']),
    ):
        add('oly-analogy', q, a, w, 'Find how the first pair is linked.', 'The same link: %s' % a)
    return R
