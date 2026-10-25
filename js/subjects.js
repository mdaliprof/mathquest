/* Math Quest - Subjects, Olympiad practice and Mock test.
   Works with the helpers exposed by app.js (window.MQApp). Everything is saved on this device only. */
(function () {
  'use strict';
  var A = function () { return window.MQApp; };
  var DATA = null;          // { index, subj: { id: data } }
  var loading = null;
  var ticker = null;
  var ROUND = 8;            // questions in one practice round
  var MOCK = 20;            // questions in a mock test
  var MOCK_SECONDS = 20 * 60;

  // ------------------------------------------------------------ loading (offline friendly)
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error('script')); };
      document.head.appendChild(s);
    });
  }
  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function fromBundle() {
    if (window.MQ_LEVELS) return Promise.resolve(window.MQ_LEVELS);
    return loadScript('content/levels-bundle.js').then(function () { return window.MQ_LEVELS; });
  }
  function shape(d) {
    var qs = {};
    d.questions.forEach(function (q) { (qs[q.subject] = qs[q.subject] || []).push(q); });
    return { level: d.id, title: d.title, icon: d.icon, subjects: d.subjects, skills: d.skills || [], qs: qs };
  }
  function load(levelId) {
    if (DATA && DATA.level === levelId) return Promise.resolve(DATA);
    var viaNet = A().fileMode ? Promise.reject(new Error('file')) : getJSON('content/levels/' + levelId + '.json');
    return viaNet.catch(function () {
      return fromBundle().then(function (b) { if (!b[levelId]) throw new Error('level'); return b[levelId]; });
    }).then(function (d) { DATA = shape(d); return DATA; });
  }

  // ------------------------------------------------------------ helpers
  function stopTimer() { if (ticker) { clearInterval(ticker); ticker = null; } }
  function pct(r, s) { return s ? Math.round(100 * r / s) : 0; }
  function skillLevel(sid) {
    var st = Store.subjectStats(sid);
    if (st.seen < 6) return 1;
    var p = st.right / st.seen;
    return p >= 0.8 ? 3 : p >= 0.55 ? 2 : 1;
  }
  // pick n questions near the child's level, mixing in a little of the other levels
  function pick(list, n, level) {
    var A_ = A();
    var scored = A_.shuffle(list.slice()).map(function (q) {
      return { q: q, k: Math.abs(q.difficulty - level) + Math.random() * 1.2 };
    });
    scored.sort(function (a, b) { return a.k - b.k; });
    return A_.shuffle(scored.slice(0, n).map(function (x) { return x.q; }));
  }
  function tagged(sid) {
    return (DATA.qs[sid] || []).map(function (q) { var c = Object.assign({}, q); c.sid = sid; return c; });
  }
  function weakTopics() {
    var out = [];
    DATA.subjects.forEach(function (sj) {
      var sid = sj.id;
      var st = Store.subjectStats(sid);
      Object.keys(st.topics).forEach(function (t) {
        if (!nodeById(t, sid)) return;
        var x = st.topics[t], n = x.r + x.w;
        if (n >= 3 && x.r / n < 0.7) out.push({ sid: sid, topic: t, ratio: x.r / n, n: n });
      });
    });
    out.sort(function (a, b) { return a.ratio - b.ratio; });
    return out;
  }
  function subjMeta(sid) { return DATA.subjects.filter(function (x) { return x.id === sid; })[0] || { icon: '', title: sid }; }
  function niceTopic(t) { return t.replace(/-/g, ' '); }

  // ------------------------------------------------------------ menu
  var LEVEL_NAMES = [['pre', '🧸', 'Pre-School'], ['c1', '1️⃣', 'Class 1'], ['c2', '2️⃣', 'Class 2'], ['c3', '3️⃣', 'Class 3'], ['c4', '4️⃣', 'Class 4']];
  function levelPicker() {
    var m = A(), h = m.h;
    m.updateTop('sub');
    m.render(h('div', { class: 'stack' }, h('h2', { class: 'subj-title' }, '🎒'),
      h('div', { class: 'subj-grid' }, LEVEL_NAMES.map(function (l) {
        return h('button', { class: 'subj-card', type: 'button', 'aria-label': l[2],
          onclick: function () { Sfx.ok(); Store.setLevel(l[0]); start(); } },
          h('span', { class: 'si', 'aria-hidden': 'true' }, l[1]), h('span', { class: 'st' }, l[2]));
      })),
      h('button', { class: 'btn small soft', type: 'button', 'aria-label': 'Home', onclick: m.goHome }, '🏠')));
  }
  function start() {
    var m = A();
    m.render(m.h('section', { class: 'hero' }, m.h('div', { class: 'pip' }, '🦊'), m.h('div', { class: 'bubble' }, '⏳')));
    load(Store.level()).then(menu).catch(function () {
      m.render(m.h('section', { class: 'hero' }, m.h('div', { class: 'pip' }, '🦊'), m.h('div', { class: 'bubble' }, '🌐❓'),
        m.h('div', { class: 'where' }, 'Open the app online once, then this works without internet.'),
        m.h('button', { class: 'btn go', type: 'button', 'aria-label': 'Home', onclick: m.goHome }, '🏠')));
    });
  }
  function show() {
    stopTimer();
    A().pushScreen();
    if (!Store.level()) levelPicker(); else start();
  }

  // ------------------------------------------------------------ skill tree and mastery
  function nodes() {
    if (DATA.skills && DATA.skills.length) return DATA.skills;
    var out = [];
    DATA.subjects.forEach(function (sj) {
      var seen = {};
      (DATA.qs[sj.id] || []).forEach(function (q) {
        if (seen[q.topic]) return;
        seen[q.topic] = 1;
        out.push({ id: q.topic, subject: sj.id, title: niceTopic(q.topic), icon: sj.icon, requires: [] });
      });
    });
    return out;
  }
  function nodeById(id, sid) {
    var ns = nodes();
    for (var i = 0; i < ns.length; i++) if (ns[i].id === id && (!sid || ns[i].subject === sid)) return ns[i];
    return null;
  }
  function nodeState(n) { return Store.mastery(n.subject, n.id).state; }
  function isOpen(n) {
    if (Store.unlockAll()) return true;
    return n.requires.every(function (r) { var x = nodeById(r); return !x || nodeState(x) === 'mastered'; });
  }
  function masteredIds(sid) {
    var o = {};
    nodes().forEach(function (n) { if (n.subject === sid && nodeState(n) === 'mastered') o[n.id] = 1; });
    return o;
  }
  function needsText(n) {
    return n.requires.map(function (r) { var x = nodeById(r); return x ? x.title : r; }).join(', ');
  }

  function menu() {
    var m = A(), h = m.h;
    stopTimer();
    m.updateTop('sub');
    var cards = DATA.subjects.map(function (s) {
      var st = Store.subjectStats(s.id);
      return h('button', {
        class: 'subj-card', type: 'button',
        'aria-label': s.title + (st.seen ? ', ' + pct(st.right, st.seen) + ' percent right' : ''),
        onclick: function () { Sfx.tap(); playSubject(s.id); }
      }, h('span', { class: 'si', 'aria-hidden': 'true' }, s.icon), h('span', { class: 'st' }, s.title),
         h('span', { class: 'ss' }, st.seen ? '✅ ' + pct(st.right, st.seen) + '%' : '🆕'));
    });
    var mocks = Store.mocks();
    var best = mocks.reduce(function (b, x) { return Math.max(b, pct(x.score, x.total)); }, 0);
    var weak = weakTopics();
    var wrap = h('div', { class: 'stack' },
      h('h2', { class: 'subj-title' }, '📚 Subjects'),
      h('div', { class: 'subj-grid' }, cards),
      h('button', { class: 'btn go wide', type: 'button', 'aria-label': 'Mock test, ' + MOCK + ' questions', onclick: function () { Sfx.tap(); mockSetup(); } },
        '📝 Mock test', mocks.length ? ' · 🏆 ' + best + '%' : ''),
      DATA.qs.olympiad ? h('button', { class: 'btn go wide', type: 'button', 'aria-label': 'Olympiad mock test', onclick: function () { Sfx.tap(); mockSetup('olympiad'); } }, '🏆 Olympiad mock') : null,
      h('button', { class: 'btn soft wide', type: 'button', 'aria-label': 'Skill map', onclick: function () { Sfx.tap(); skillMap(); } }, '🗺️ Skill map'),
      h('button', {
        class: 'btn soft wide', type: 'button', disabled: !weak.length,
        'aria-label': weak.length ? 'Practise weak spots' : 'Weak spots appear after you play some rounds',
        onclick: function () { Sfx.tap(); playWeak(weak); }
      }, '🎯 Weak spots', weak.length ? ' (' + weak.length + ')' : ''),
      h('div', { class: 'actions' },
        h('button', { class: 'btn small soft', type: 'button', 'aria-label': 'Change class', onclick: function () { Sfx.tap(); levelPicker(); } }, '🎒 ', DATA.title),
        h('button', { class: 'btn small soft', type: 'button', 'aria-label': 'Home', onclick: m.goHome }, '🏠')));
    m.render(wrap);
  }

  // ------------------------------------------------------------ a round of questions
  function runList(list, title, opts, onFinish) {
    var m = A(), h = m.h;
    var st = { i: 0, right: 0, per: {}, wrongTopics: {} };
    opts = opts || {};
    var timerEl = null, left = opts.seconds || 0;

    function finish(timeUp) {
      stopTimer();
      onFinish(st, list, timeUp);
    }
    if (opts.seconds) {
      timerEl = h('div', { class: 'timer', role: 'timer', 'aria-label': 'Time left' });
      var paint = function () {
        var mm = Math.floor(left / 60), ss = left % 60;
        timerEl.textContent = '⏱ ' + mm + ':' + (ss < 10 ? '0' : '') + ss;
        timerEl.classList.toggle('low', left <= 60);
      };
      paint();
      ticker = setInterval(function () {
        if (!document.querySelector('.exam-q')) { stopTimer(); return; }   // child left the test
        left--; paint();
        if (left <= 0) finish(true);
      }, 1000);
    }

    function next() {
      if (st.i >= list.length) return finish(false);
      var q = list[st.i];
      var dots = h('div', { class: 'dots qdots', role: 'img', 'aria-label': 'Question ' + (st.i + 1) + ' of ' + list.length },
        list.map(function (_, k) { return h('span', { class: 'dot' + (k < st.i ? ' ok' : k === st.i ? ' on' : '') }); }));
      var view = m.questionView(q, function (first) {
        var sid = q.sid;
        if (first) st.right++;
        st.per[sid] = st.per[sid] || { r: 0, n: 0 };
        st.per[sid].n++; if (first) st.per[sid].r++;
        if (!first) st.wrongTopics[sid + '/' + q.topic] = 1;
        Store.recordAnswer(sid, q.topic, first);
        st.i++;
        next();
      }, { exam: !!opts.exam });
      m.render(h('section', { class: 'exam-q' }, h('div', { class: 'round-title' }, title), timerEl, dots, view.el));
      m.setKeys(view.onKey);
    }
    next();
  }

  function playSubject(sid) {
    var m = A();
    var s = subjMeta(sid);
    m.updateTop('sub');
    var all = tagged(sid), open = {}, done = {};
    nodes().forEach(function (n) { if (n.subject === sid) { if (isOpen(n)) open[n.id] = 1; if (nodeState(n) === 'mastered') done[n.id] = 1; } });
    if (!Object.keys(open).length) {   // nothing unlocked yet (e.g. Olympiad before the basics are mastered)
      var need = nodes().filter(function (n) { return n.subject === sid; }).reduce(function (acc, n) {
        n.requires.forEach(function (r) { var x = nodeById(r); if (x && acc.indexOf(x.title) < 0) acc.push(x.title); }); return acc; }, []);
      var hh = m.h;
      m.render(hh('section', { class: 'hero' }, hh('div', { class: 'pip' }, '🦊'), hh('div', { class: 'bubble' }, '🔒 ' + s.icon),
        hh('div', { class: 'where' }, 'Master these first: ' + need.slice(0, 4).join(', ')),
        hh('div', { class: 'actions' },
          hh('button', { class: 'btn go', type: 'button', 'aria-label': 'Skill map', onclick: function () { Sfx.tap(); skillMap(); } }, '🗺️'),
          hh('button', { class: 'btn soft', type: 'button', 'aria-label': 'Subjects', onclick: function () { Sfx.tap(); menu(); } }, '📚'))));
      return;
    }
    var practise = all.filter(function (q) { return open[q.topic] && !done[q.topic]; });
    var review = all.filter(function (q) { return done[q.topic]; });
    if (practise.length < 4) { practise = all.filter(function (q) { return open[q.topic]; }); review = []; }
    if (practise.length < 4) { practise = all; review = []; }
    var lvl = skillLevel(sid);
    var list = pick(practise, ROUND - (review.length >= 2 ? 2 : 0), lvl);
    if (review.length >= 2) list = list.concat(A().shuffle(review).slice(0, 2));
    list = A().shuffle(list);
    var before = masteredIds(sid);
    runList(list, s.icon + ' ' + s.title, {}, function (st) { roundDone(sid, s, st, list.length, before, function () { playSubject(sid); }); });
  }

  function playTopic(n) {
    var m = A();
    m.updateTop('sub');
    var pool = tagged(n.subject).filter(function (q) { return q.topic === n.id; });
    var list = A().shuffle(pool).slice(0, ROUND);
    var before = masteredIds(n.subject);
    runList(list, n.icon + ' ' + n.title, {}, function (st) { roundDone(n.subject, subjMeta(n.subject), st, list.length, before, function () { playTopic(n); }, true); });
  }

  function playFix(sid, ids) {
    var m = A();
    m.updateTop('sub');
    var pool = tagged(sid).filter(function (q) { return ids.indexOf(q.topic) >= 0 && q.difficulty <= 2; });
    var list = A().shuffle(pool).slice(0, ROUND);
    var before = masteredIds(sid);
    runList(list, '🛠️', {}, function (st) { roundDone(sid, subjMeta(sid), st, list.length, before, function () { playSubject(sid); }, true); });
  }

  function roundDone(sid, s, st, total, before, again, noFix) {
    var m = A(), h = m.h;
    m.updateTop('sub');
    var stars = st.right >= total ? 3 : st.right >= Math.ceil(total * 0.6) ? 2 : 1;
    var tried = DATA.subjects.every(function (x) { return x.id === 'olympiad' || Store.subjectStats(x.id).seen > 0; });
    var badge = tried ? Store.giveBadge('explorer') : false;
    // newly mastered topics
    var fresh = nodes().filter(function (n) { return n.subject === sid && nodeState(n) === 'mastered' && !(before && before[n.id]); });
    // a Fix-it round: when the round went badly, practise the basics under the weakest topic
    var fixIds = null;
    if (!noFix && st.right < Math.ceil(total * 0.6)) {
      var wk = Object.keys(st.wrongTopics).filter(function (k) { return k.split('/')[0] === sid; })[0];
      var wn = wk ? nodeById(wk.split('/')[1], sid) : null;
      var ids = wn ? (wn.requires.length ? wn.requires : [wn.id]) : [];
      var ok = tagged(sid).filter(function (q) { return ids.indexOf(q.topic) >= 0 && q.difficulty <= 2; });
      if (ok.length >= 4) fixIds = ids;
    }
    Sfx.star();
    m.render(h('section', { class: 'hero' },
      h('div', { class: 'pip pop' }, '🦊'),
      h('div', { class: 'bubble' }, new Array(stars + 1).join('⭐')),
      h('div', { class: 'where big-score' }, st.right + ' / ' + total),
      fresh.length ? h('div', { class: 'newskill', role: 'status' }, fresh.map(function (n) { return h('div', null, '🏅 ', n.icon, ' ', n.title); })) : null,
      badge ? h('div', { class: 'where' }, Store.BADGES.explorer[0] + ' ' + Store.BADGES.explorer[1]) : null,
      h('div', { class: 'actions' },
        fixIds ? h('button', { class: 'btn go', type: 'button', 'aria-label': 'Fix-it round: practise the basics', onclick: function () { Sfx.ok(); playFix(sid, fixIds); } }, '🛠️') : null,
        h('button', { class: fixIds ? 'btn soft' : 'btn go', type: 'button', 'aria-label': 'Play again', onclick: again }, '🔁'),
        h('button', { class: 'btn soft', type: 'button', 'aria-label': 'Skill map', onclick: function () { Sfx.tap(); skillMap(); } }, '🗺️'),
        h('button', { class: 'btn soft', type: 'button', 'aria-label': 'Subjects', onclick: function () { Sfx.tap(); menu(); } }, '📚'))));
  }

  var STATE_ICON = { mastered: '⭐', learning: '🌱', 'new': '🆕' };
  var STATE_WORD = { mastered: 'mastered', learning: 'practising', 'new': 'not started' };
  function skillMap() {
    var m = A(), h = m.h;
    stopTimer();
    m.updateTop('sub');
    var groups = DATA.subjects.map(function (sj) {
      var cards = nodes().filter(function (n) { return n.subject === sj.id; }).map(function (n) {
        var open = isOpen(n), state = nodeState(n);
        var mastery = Store.mastery(n.subject, n.id);
        var label = n.title + ', ' + (open ? STATE_WORD[state] : 'locked, finish ' + needsText(n) + ' first');
        return h('button', {
          class: 'node ' + (open ? state : 'locked'), type: 'button', disabled: !open, 'aria-label': label,
          onclick: function () { Sfx.tap(); playTopic(n); }
        }, h('span', { class: 'ni', 'aria-hidden': 'true' }, n.icon), h('span', { class: 'nt' }, n.title),
           h('span', { class: 'ns', 'aria-hidden': 'true' }, open ? STATE_ICON[state] + (mastery.n ? ' ' + Math.round(mastery.pct * 100) + '%' : '') : '🔒'));
      });
      return h('section', { class: 'sgroup' }, h('h3', { class: 'sg-title' }, sj.icon + ' ' + sj.title), h('div', { class: 'nodes' }, cards));
    });
    m.render(h('div', { class: 'stack' }, h('h2', { class: 'subj-title' }, '🗺️ Skill map'),
      h('div', { class: 'legend', 'aria-hidden': 'true' }, '🆕 new · 🌱 practising · ⭐ mastered · 🔒 locked'),
      groups,
      h('button', { class: 'btn small soft', type: 'button', 'aria-label': 'Subjects', onclick: function () { Sfx.tap(); menu(); } }, '📚')));
  }

  // Parent report: plain list of every topic and how it is going
  function report() {
    var m = A(), h = m.h;
    m.pushScreen();
    m.updateTop('home');
    m.render(h('section', { class: 'hero' }, h('div', { class: 'pip' }, '🦊'), h('div', { class: 'bubble' }, '⏳')));
    load(Store.level() || 'c1').then(function () {
      var rows = [];
      DATA.subjects.forEach(function (sj) {
        rows.push(h('h3', { class: 'sg-title' }, sj.icon + ' ' + sj.title));
        nodes().filter(function (n) { return n.subject === sj.id; }).forEach(function (n) {
          var ms = Store.mastery(n.subject, n.id), open = isOpen(n);
          rows.push(h('div', { class: 'rrow ' + (open ? ms.state : 'locked'), role: 'listitem' },
            h('span', null, n.icon + ' ' + n.title), h('span', null, open ? STATE_WORD[ms.state] + (ms.n ? ' · ' + Math.round(ms.pct * 100) + '% of last ' + ms.n : '') : 'locked · ' + needsText(n))));
        });
      });
      m.render(h('div', { class: 'stack' }, h('h2', { class: 'subj-title' }, '📊 ' + DATA.title),
        h('div', { role: 'list', class: 'rlist' }, rows),
        h('button', { class: 'btn small soft', type: 'button', 'aria-label': 'Home', onclick: m.goHome }, '🏠')));
    }).catch(function () { m.goHome(); });
  }

  function playWeak(weak) {
    var m = A();
    var pool = [];
    weak.slice(0, 4).forEach(function (w) {
      tagged(w.sid).forEach(function (q) { if (q.topic === w.topic) pool.push(q); });
    });
    if (pool.length < 4) { menu(); return; }
    var list = m.shuffle(pool).slice(0, ROUND);
    m.updateTop('sub');
    runList(list, '🎯', {}, function (st) {
      roundDone(list[0].sid, subjMeta(list[0].sid), st, list.length, null, function () { playWeak(weakTopics()); }, true);
    });
  }

  // ------------------------------------------------------------ mock test (olympiad style)
  function mockSetup(mode) {
    var m = A(), h = m.h;
    m.updateTop('sub');
    m.render(h('section', { class: 'hero' },
      h('div', { class: 'pip' }, '🦊'),
      h('div', { class: 'bubble' }, (mode === 'olympiad' ? '🏆 ' : '📝 ') + MOCK),
      h('div', { class: 'where' }, 'One try for each question.'),
      h('div', { class: 'actions' },
        h('button', { class: 'btn go', type: 'button', 'aria-label': 'Timed test, 20 minutes', onclick: function () { Sfx.ok(); mockStart(true, mode); } }, '⏱ 20'),
        h('button', { class: 'btn soft', type: 'button', 'aria-label': 'Relaxed test, no timer', onclick: function () { Sfx.ok(); mockStart(false, mode); } }, '😌')),
      h('button', { class: 'btn small soft', type: 'button', 'aria-label': 'Back', onclick: function () { menu(); } }, '⬅️')));
  }

  function mockStart(timed, mode) {
    if (mode === 'olympiad') {   // half Olympiad Challenge questions, half the hardest from other subjects
      var oly = pick(tagged('olympiad'), Math.min(10, (DATA.qs.olympiad || []).length), 3);
      var hard = [];
      DATA.subjects.forEach(function (sj) { if (sj.id !== 'olympiad') tagged(sj.id).forEach(function (q) { if (q.difficulty >= 3) hard.push(q); }); });
      var ol = oly.concat(A().shuffle(hard).slice(0, MOCK - oly.length));
      runList(A().shuffle(ol), '🏆', { exam: true, seconds: timed ? MOCK_SECONDS : 0 }, function (st, qs, timeUp) { mockDone(st, qs, timeUp); });
      return;
    }
    var ids = DATA.subjects.filter(function (s) { return s.id !== 'olympiad'; }).map(function (s) { return s.id; });
    var per = Math.floor(MOCK / ids.length), extra = MOCK - per * ids.length;
    var list = [];
    ids.forEach(function (sid, k) {
      list = list.concat(pick(tagged(sid), per + (k < extra ? 1 : 0), Math.max(2, skillLevel(sid))));
    });
    if (list.length < MOCK) {   // small subjects: top up from the rest of this class
      var used = {}; list.forEach(function (q) { used[q.id] = 1; });
      var rest = [];
      ids.forEach(function (sid) { tagged(sid).forEach(function (q) { if (!used[q.id]) rest.push(q); }); });
      list = list.concat(A().shuffle(rest).slice(0, MOCK - list.length));
    }
    list = A().shuffle(list);
    runList(list, '📝', { exam: true, seconds: timed ? MOCK_SECONDS : 0 }, function (st, qs, timeUp) { mockDone(st, qs, timeUp); });
  }

  function mockDone(st, qs, timeUp) {
    var m = A(), h = m.h;
    m.updateTop('sub');
    var total = qs.length;
    var fresh = Store.addMock(st.right, total);
    var p = pct(st.right, total);
    Sfx.star();
    var rows = DATA.subjects.map(function (s) {
      var x = st.per[s.id] || { r: 0, n: 0 };
      return h('div', { class: 'mrow', role: 'listitem', 'aria-label': s.title + ' ' + x.r + ' of ' + x.n },
        h('span', { class: 'mi', 'aria-hidden': 'true' }, s.icon),
        h('span', { class: 'mbar' }, h('span', { class: 'mfill', style: 'width:' + pct(x.r, x.n) + '%' })),
        h('span', { class: 'mn' }, x.r + '/' + x.n));
    });
    var weakList = Object.keys(st.wrongTopics).slice(0, 4).map(function (k) {
      var parts = k.split('/');
      return h('li', null, subjMeta(parts[0]).icon + ' ' + niceTopic(parts[1]));
    });
    m.render(h('div', { class: 'stack' },
      h('section', { class: 'hero' },
        h('div', { class: 'pip pop' }, '🦊'),
        h('div', { class: 'bubble' }, p >= 80 ? '🥇' : p >= 50 ? '🌟' : '💪'),
        h('div', { class: 'where big-score' }, st.right + ' / ' + total + (timeUp ? ' ⏱' : '')),
        fresh.length ? h('div', { class: 'trophies' }, fresh.map(function (b) { return h('span', { class: 'tr', 'aria-label': Store.BADGES[b][1] }, Store.BADGES[b][0]); })) : null),
      h('div', { class: 'mrows', role: 'list' }, rows),
      weakList.length ? h('div', null, h('div', { class: 'where' }, '🎯 Practise:'), h('ul', { class: 'weak-list' }, weakList)) : null,
      h('div', { class: 'actions' },
        h('button', { class: 'btn go', type: 'button', 'aria-label': 'Take another mock test', onclick: function () { Sfx.tap(); mockSetup(); } }, '🔁'),
        h('button', { class: 'btn soft', type: 'button', 'aria-label': 'Subjects', onclick: function () { Sfx.tap(); menu(); } }, '📚'))));
  }

  window.MQSubjects = { show: show, report: report };
})();
