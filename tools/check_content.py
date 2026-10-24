#!/usr/bin/env python3
"""Math Quest content checker.

Re-checks every question with code that is separate from the generator:
arithmetic is re-parsed from the question text and recomputed, number words are
checked against their own table, and the structure rules are enforced.

Run:  python3 tools/check_content.py
Exit code 0 = all good, 1 = problems found.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.normpath(os.path.join(HERE, '..', 'content'))

# Separate table, typed again on purpose (not shared with the generator).
W2N = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7,
    'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
    'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
    'seventy': 70, 'eighty': 80, 'ninety': 90, 'one hundred': 100,
}

errors = []


def err(qid, msg):
    errors.append(f"{qid}: {msg}")


def calc(a, op, b):
    if op == '+':
        return a + b
    if op == '−':
        return a - b
    if op == '×':
        return a * b
    if op == '÷':
        if b == 0 or a % b:
            return None
        return a // b
    return None


EXPR = r'(\d+) ([+−×÷]) (\d+)'


def check_arith(q):
    t, text, ans = q['type'], q['question'], q['answer']
    qid = q['id']
    m = re.fullmatch(EXPR + r' = \?', text)
    if m and t in ('multiple-choice', 'pad'):
        v = calc(int(m[1]), m[2], int(m[3]))
        if v is None or str(v) != ans:
            err(qid, f"'{text}' answer {ans}, expected {v}")
        return True
    m = re.fullmatch(EXPR + r' = (\d+)', text)
    if m and t == 'true-false':
        v = calc(int(m[1]), m[2], int(m[3]))
        truth = 'True' if v is not None and v == int(m[4]) else 'False'
        if truth != ans:
            err(qid, f"'{text}' marked {ans}, really {truth}")
        return True
    m = re.fullmatch(r'(\d+) ([+−×÷]) \? = (\d+)', text)
    if m:
        a, op, r = int(m[1]), m[2], int(m[3])
        b = int(ans)
        if calc(a, op, b) != r:
            err(qid, f"'{text}' answer {ans} does not work")
        return True
    m = re.fullmatch(r'\? ([+−×÷]) (\d+) = (\d+)', text)
    if m:
        op, b, r = m[1], int(m[2]), int(m[3])
        if calc(int(ans), op, b) != r:
            err(qid, f"'{text}' answer {ans} does not work")
        return True
    m = re.fullmatch(r'(\d+), (\d+), (\d+)(?:, (\d+))?, \?', text)
    if m:
        nums = [int(x) for x in m.groups() if x]
        step = nums[0]
        if any(nums[i] != step * (i + 1) for i in range(len(nums))):
            err(qid, f"'{text}' is not a skip-count list")
        if int(ans) != step * (len(nums) + 1):
            err(qid, f"'{text}' answer {ans} wrong")
        return True
    return False


def check_words(q):
    t, text, ans, qid = q['type'], q['question'], q['answer'], q['id']
    if q['topic'] == 'counting':
        if q.get('pic', {}).get('count') != int(ans):
            err(qid, 'counting picture does not match answer')
        return True
    if q['topic'] != 'number-words':
        return False
    if t == 'multiple-choice' and text.isdigit():
        if W2N.get(ans) != int(text):
            err(qid, f"{text} is not '{ans}'")
        return True
    if t in ('multiple-choice', 'pad') and not text.isdigit():
        if W2N.get(text) != int(ans):
            err(qid, f"'{text}' is not {ans}")
        return True
    if t == 'true-false':
        m = re.fullmatch(r'(\d+) = (.+)', text)
        truth = 'True' if m and W2N.get(m[2]) == int(m[1]) else 'False'
        if truth != ans:
            err(qid, f"'{text}' marked {ans}, really {truth}")
        return True
    if t == 'match':
        for a, b in q['pairs']:
            if W2N.get(b) != int(a):
                err(qid, f"match pair {a} = {b} is wrong")
        return True
    return False


def check_question(q):
    qid = q['id']
    for key in ('id', 'level', 'topic', 'type', 'question', 'answer', 'hint', 'explanation',
                'skills', 'difficulty'):
        if key not in q:
            err(qid, f"missing '{key}'")
            return
    if q['difficulty'] not in (1, 2, 3):
        err(qid, 'difficulty must be 1-3')
    if not q['hint'] or not q['explanation']:
        err(qid, 'empty hint or explanation')
    t = q['type']
    if t == 'multiple-choice':
        ch = q.get('choices', [])
        if len(ch) != 4 or len(set(ch)) != 4:
            err(qid, 'need 4 different choices')
        if ch.count(q['answer']) != 1:
            err(qid, 'answer must be in choices exactly once')
    elif t == 'true-false':
        if q.get('choices') != ['True', 'False'] or q['answer'] not in ('True', 'False'):
            err(qid, 'bad true/false')
    elif t == 'pad':
        if not q['answer'].isdigit():
            err(qid, 'pad answer must be digits')
    elif t == 'match':
        pairs = q.get('pairs', [])
        if len(pairs) != 3 or len({p[0] for p in pairs}) != 3 or len({p[1] for p in pairs}) != 3:
            err(qid, 'match needs 3 different pairs')
    else:
        err(qid, f"unknown type {t}")
        return
    if t == 'match' and q['topic'] != 'number-words':
        for left, right in q['pairs']:
            m = re.fullmatch(EXPR, left)
            if not m or str(calc(int(m[1]), m[2], int(m[3]))) != right:
                err(qid, f"match pair '{left}' = {right} is wrong")
        return
    if check_words(q):
        return
    if t != 'match' and not check_arith(q):
        err(qid, f"could not re-check question '{q['question']}'")


def main():
    with open(os.path.join(CONTENT, 'index.json'), encoding='utf-8') as fh:
        index = json.load(fh)
    if len(index['weeks']) != 18:
        err('index', 'expected 18 weeks')
    seen = {}
    counts = {}
    total_q = 0
    for wk in index['weeks']:
        with open(os.path.join(CONTENT, wk['file']), encoding='utf-8') as fh:
            data = json.load(fh)
        if len(data['days']) != 5:
            err(wk['file'], 'expected 5 days')
        for day in data['days']:
            key = day['key']
            if len(day['warmup']) != 3 or len(day['practice']) != 5 or len(day['review']) != 2:
                err(key, 'need 3 warm-up, 5 practice, 2 review')
            if not day['learn']:
                err(key, 'no learn steps')
            for section in ('warmup', 'practice', 'review'):
                for q in day[section]:
                    total_q += 1
                    check_question(q)
                    counts[q['type']] = counts.get(q['type'], 0) + 1
                    if q['id'] in seen:
                        if seen[q['id']] != q:
                            err(q['id'], 'same id but different content')
                    else:
                        seen[q['id']] = q
            ids = [q['id'] for q in day['practice']]
            if len(set(ids)) != 5:
                err(key, 'duplicate ids in practice')
            looks = [(q['type'], q['question'], json.dumps(q.get('pairs'))) for q in day['practice']]
            if len(set(looks)) != 5:
                err(key, 'the same question appears twice in practice')
    print(f"Checked {total_q} questions ({len(seen)} unique), types: {counts}")
    if errors:
        print(f"\n{len(errors)} PROBLEMS:")
        for e in errors[:50]:
            print(' -', e)
        sys.exit(1)
    print('All arithmetic, number words and structure rules passed.')


if __name__ == '__main__':
    main()
