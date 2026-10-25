/* Math Quest - the whole app. Plain JavaScript, no build step, no outside scripts.
   Flow of one day (about 15 minutes):  welcome > warm-up > learn > practice > review > reward  */
(function () {
  'use strict';

  // Older Android WebViews (before 2020) lack replaceChildren
  if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren = function () {
      while (this.firstChild) this.removeChild(this.firstChild);
      for (var i = 0; i < arguments.length; i++) this.appendChild(arguments[i]);
    };
  }

  var STAGES = [['warmup', '⚡', 'Warm-up'], ['learn', '💡', 'Learn'], ['practice', '✏️', 'Practice'],
                ['review', '🧠', 'Review'], ['reward', '🎁', 'Reward']];
  var SHELL = ['index.html', 'offline.html', 'manifest.webmanifest', 'css/styles.css', 'js/app.js',
               'js/storage.js', 'js/audio.js', 'icons/icon-192.png', 'icons/icon-512.png',
               'icons/maskable-512.png', 'icons/icon.svg'];

  var S = { index: null, weeks: {}, stale: {}, facts: [], day: null, deferred: null, keys: null,
            view: 'home', pushed: 0, installed: false };
  var app = document.getElementById('app');

  function $(sel) { return document.querySelector(sel); }

  // ---------------------------------------------------------------- tiny helpers
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { add(el, k); }); return; }
    el.appendChild(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  // Opened by double-click (file://) the browser blocks fetch(), so the lessons come from
  // content/bundle.js instead. The same fallback helps if a fetch fails for any other reason.
  var FILE_MODE = location.protocol === 'file:';
  var bundlePromise = null;
  function loadBundle() {
    if (window.MQ_CONTENT) return Promise.resolve(window.MQ_CONTENT);
    if (!bundlePromise) {
      bundlePromise = new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = 'content/bundle.js';
        s.onload = function () { res(window.MQ_CONTENT); };
        s.onerror = function () { bundlePromise = null; rej(new Error('bundle')); };
        document.head.appendChild(s);
      });
    }
    return bundlePromise;
  }
  function fromBundle(url) {
    return loadBundle().then(function (b) {
      var name = String(url).split('?')[0].split('/').pop();
      if (!b || !b[name]) throw new Error('missing ' + name);
      return b[name];
    });
  }
  function fetchJSON(url, opts) {
    if (FILE_MODE) return fromBundle(url);
    return fetch(url, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).catch(function () { return fromBundle(url); });
  }
  function render(node) {
    S.keys = null;
    app.replaceChildren(node);
    try { window.scrollTo(0, 0); } catch (e) {}
    try { app.focus({ preventScroll: true }); } catch (e) {}
  }
  function streakNow(p) {
    var s = p.streak;
    if (!s.lastPlayed) return 0;
    var t = Store.today();
    var y = new Date(); y.setDate(y.getDate() - 1);
    var ys = y.getFullYear() + '-' + ('0' + (y.getMonth() + 1)).slice(-2) + '-' + ('0' + y.getDate()).slice(-2);
    return (s.lastPlayed === t || s.lastPlayed === ys) ? s.current : 0;
  }
  function weekMeta(w) { return S.index.weeks[w - 1]; }
  function phaseTitle(id) {
    var p = (S.index.phases || []).filter(function (x) { return x.id === id; })[0];
    return p ? p.title : '';
  }

  // ---------------------------------------------------------------- pictures made of emoji
  function emojis(icon, n, crossFrom) {
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push(h('span', { class: 'e' + (crossFrom != null && i >= crossFrom ? ' x' : '') }, icon));
    }
    return out;
  }
  function picEl(p, big) {
    var box = h('div', { class: 'pic' + (big ? ' big' : ''), 'aria-hidden': 'true' });
    if (!p) return box;
    var total = 0;
    if (p.groups) total = p.groups.reduce(function (a, b) { return a + b; }, 0);
    else if (p.friends && p.each != null) total = p.friends * p.each;
    else total = p.count || 0;
    if (total > 40) return box;
    if (p.groups) {
      p.groups.forEach(function (n, i) {
        if (i > 0 && p.op) box.appendChild(h('span', { class: 'op' }, p.op));
        box.appendChild(h('span', { class: 'grp' }, emojis(p.icon, n)));
      });
    } else if (p.friends) {
      if (p.each != null) {
        for (var i = 0; i < p.friends; i++) {
          box.appendChild(h('span', { class: 'friend' }, h('span', { class: 'who' }, '🧒'),
            h('span', { class: 'gets' }, emojis(p.icon, p.each))));
        }
      } else {
        box.appendChild(h('span', { class: 'grp' }, emojis(p.icon, p.count)));
        box.appendChild(h('span', { class: 'op' }, '➡️'));
        for (var k = 0; k < p.friends; k++) {
          box.appendChild(h('span', { class: 'friend' }, h('span', { class: 'who' }, '🧒')));
        }
      }
    } else {
      var from = p.cross ? p.count - p.cross : null;
      emojis(p.icon, p.count, from).forEach(function (e) { box.appendChild(e); });
    }
    return box;
  }


  // ---------------------------------------------------------------- phone helpers: install, share, back button
  function isIOS() {
    var ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function isAndroid() { return /Android/i.test(navigator.userAgent || ''); }
  function isStandalone() {
    try { if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true; } catch (e) {}
    return navigator.standalone === true;
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3500);
  }

  // Only the link to the app is ever shared. Never a name or any progress.
  function appUrl() {
    if (location.protocol === 'file:') return '';
    return location.origin + location.pathname.replace(/index\.html$/, '');
  }
  function copyLink(url) {
    function fallback() { try { window.prompt('Copy this link', url); } catch (e) {} }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { toast('🔗 Link copied ✅'); }, fallback);
    } else { fallback(); }
  }
  function shareApp() {
    var url = appUrl();
    if (!url) { toast('Put the app online first, then share its link.'); return; }
    var data = { title: 'Math Quest', text: 'Math Quest: a fun 15-minute-a-day math course for kids. Works offline.', url: url };
    if (navigator.share) {
      navigator.share(data).catch(function (e) { if (!e || e.name !== 'AbortError') copyLink(url); });
    } else {
      copyLink(url);
    }
  }
  function shareButton(cls) {
    return h('button', { class: (cls || 'btn small soft') + ' js-share', type: 'button', 'aria-label': 'Share the app', onclick: shareApp }, '📤 Share');
  }

  function installNow() {
    var ev = S.deferred;
    if (!ev) { showInstall(); return; }
    S.deferred = null;
    try {
      ev.prompt();
      if (ev.userChoice && ev.userChoice.then) {
        ev.userChoice.then(function (c) { if (c && c.outcome === 'accepted') toast('📲 Installing…'); });
      }
    } catch (e) { showInstall(); }
  }
  function installButton(cls) {
    if (isStandalone() || S.installed) return null;
    return h('button', { class: (cls || 'btn small') + ' js-install', type: 'button', 'aria-label': 'Install the app', onclick: installNow }, '📲 Install');
  }
  function bindInstall() {
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); S.deferred = e; });
    window.addEventListener('appinstalled', function () {
      S.installed = true;
      S.deferred = null;
      Array.prototype.forEach.call(document.querySelectorAll('.js-install'), function (b) { b.hidden = true; });
      toast('✅ Installed! Open Math Quest from your home screen.');
    });
  }

  // Android's back button should go to the home map, not close the app.
  function pushScreen() {
    if (S.view === 'home' && !S.pushed) {
      try { history.pushState({ mq: 1 }, ''); S.pushed = 1; } catch (e) {}
    }
    S.view = 'sub';
  }
  function goHome() {
    var had = S.pushed;
    S.pushed = 0;
    showHome();
    if (had) { try { history.back(); } catch (e) {} }
  }
  window.addEventListener('popstate', function () {
    if (S.pushed) { S.pushed = 0; if (S.view !== 'home') showHome(); }
  });

  function shareIcon() {
    var NS = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', '26');
    s.setAttribute('height', '26');
    s.setAttribute('class', 'shareicon');
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', 'Share button');
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M12 15V3M8 7l4-4 4 4M7 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    s.appendChild(path);
    return s;
  }

  function showInstall() {
    pushScreen();
    updateTop('home');
    var ios = isIOS();
    var here = h('span', { class: 'tag' }, 'This device');

    var iosPanel = h('div', { class: 'panel' },
      h('h2', null, '🍎 iPhone and iPad ', ios ? here : null),
      h('ol', { class: 'steps' },
        h('li', null, h('span', null, 'Open this page in ', h('b', null, 'Safari'), '.')),
        h('li', null, h('span', null, 'Tap the Share button ', shareIcon(), ' (bottom of the screen on iPhone, top on iPad).')),
        h('li', null, h('span', null, 'Scroll down and tap ', h('b', null, '➕ Add to Home Screen'), '.')),
        h('li', null, h('span', null, 'Tap ', h('b', null, 'Add'), '. The Math Quest icon appears on your home screen.'))),
      h('p', null, 'Open it from that icon. It runs full screen and works with no internet. Installing also stops Safari from erasing saved progress when the app is not used for a while.'));

    var androidPanel = h('div', { class: 'panel' },
      h('h2', null, '🤖 Android ', !ios && isAndroid() ? here : null),
      h('ol', { class: 'steps' },
        h('li', null, h('span', null, 'Open this page in ', h('b', null, 'Chrome'), '.')),
        h('li', null, h('span', null, 'Tap the ', h('b', null, '⋮'), ' menu (top right).')),
        h('li', null, h('span', null, 'Tap ', h('b', null, 'Install app'), ' or ', h('b', null, 'Add to Home screen'), '.')),
        h('li', null, h('span', null, 'Tap ', h('b', null, 'Install'), '. The icon appears with your other apps.'))),
      h('p', null, 'Samsung Internet: tap the ☰ menu, then Add page to, then Home screen.'));

    var pcPanel = h('div', { class: 'panel' },
      h('h2', null, '💻 Computer'),
      h('p', null, 'In Chrome or Edge, click the install icon at the right end of the address bar.'));

    var top = [];
    if (isStandalone() || S.installed) {
      top.push(h('div', { class: 'panel center' }, h('div', { class: 'ft', style: 'font-size:2rem' }, '✅ Installed')));
    } else if (S.deferred) {
      top.push(h('button', { class: 'btn go wide js-install', type: 'button', onclick: installNow }, '📲 Install now'));
    }

    render(h('section', { class: 'parent' },
      h('button', { class: 'btn soft wide', type: 'button', 'aria-label': 'Back to home', onclick: goHome }, '🏠'),
      h('h2', null, '📲 Install Math Quest'),
      top,
      ios ? [iosPanel, androidPanel, pcPanel] : [androidPanel, iosPanel, pcPanel],
      h('div', { class: 'actions' }, shareButton('btn small'))));
  }

  // ---------------------------------------------------------------- top bar
  function updateTop(mode, stageIdx) {
    var p = Store.profile();
    var top = $('#topbar');
    top.hidden = !p;
    $('#btn-home').hidden = (mode === 'home' || mode === 'none');
    var st = $('#stages');
    st.replaceChildren();
    if (mode === 'lesson') {
      STAGES.forEach(function (s, i) {
        st.appendChild(h('span', {
          class: 'stage' + (i < stageIdx ? ' past' : i === stageIdx ? ' now' : ''),
          role: 'img', 'aria-label': s[2] + (i === stageIdx ? ', now' : i < stageIdx ? ', done' : '')
        }, s[1]));
      });
    }
    if (p) {
      $('#stat-stars').textContent = '⭐ ' + p.stars;
      $('#stat-streak').textContent = '🔥 ' + streakNow(p);
    }
    var on = Store.settings().sound;
    var sb = $('#btn-sound');
    sb.textContent = on ? '🔊' : '🔇';
    sb.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
    sb.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  // ---------------------------------------------------------------- content loading
  function loadWeek(n) {
    if (S.weeks[n] && !S.stale[n]) return Promise.resolve(S.weeks[n]);
    var wk = weekMeta(n);
    var opts = S.stale[n] ? { cache: 'reload' } : undefined;
    return fetchJSON('content/' + wk.file, opts).then(function (data) {
      S.weeks[n] = data;
      delete S.stale[n];
      return data;
    });
  }

  // ---------------------------------------------------------------- first screen: pick a friend
  function showProfile() {
    updateTop('none');
    render(h('section', { class: 'hero' },
      h('div', { class: 'pip pop' }, '🦊'),
      h('div', { class: 'bubble' }, '👋'),
      h('div', { class: 'avatars', role: 'group', 'aria-label': 'Pick your friend' },
        Store.AVATARS.map(function (a) {
          return h('button', {
            class: 'avatar', type: 'button', 'aria-label': a[1],
            onclick: function () { Sfx.ok(); Store.createProfile(a[0], a[1]); Store.persist(); showHome(); }
          }, a[0]);
        }))));
  }

  // ---------------------------------------------------------------- home: the star map
  function phaseDone(phase) {
    return S.index.weeks.every(function (wk) { return wk.phase !== phase || Store.weekDone(wk.week); });
  }
  function weekStars(w) {
    var n = 0;
    for (var d = 1; d <= Store.DAYS; d++) { var l = Store.lesson(Store.key(w, d)); if (l) n += l.stars; }
    return n;
  }

  function showHome() {
    S.view = 'home';
    S.day = null;
    Voice.stop();
    var p = Store.profile();
    if (!p) return showProfile();
    updateTop('home');
    var nx = Store.next();
    var ses = Store.session();

    var hero = h('section', { class: 'hero' }, h('div', { class: 'pip' }, '🦊'));
    if (nx) {
      var resume = ses && ses.key === Store.key(nx.w, nx.d) && (ses.stage > 0 || ses.qi > 0);
      hero.appendChild(h('div', { class: 'bubble' }, nx.d === 5 ? '👑❓' : '🌟❓'));
      hero.appendChild(h('div', { class: 'mission' },
        h('button', {
          class: 'btn go wide', type: 'button',
          'aria-label': (resume ? 'Continue' : 'Play') + ', week ' + nx.w + ', day ' + nx.d,
          onclick: function () { startDay(nx.w, nx.d); }
        }, weekMeta(nx.w).icon, ' ▶', resume ? ' ⏩' : ''),
        h('div', { class: 'where' }, 'Week ' + nx.w + ' · Day ' + nx.d)));
    } else {
      hero.appendChild(h('div', { class: 'bubble' }, '🏆🎉'));
    }

    var wrap = h('div', { class: 'stack' }, hero);
    wrap.appendChild(h('div', { class: 'actions' },
      h('button', {
        class: 'btn wide subj-btn', type: 'button', 'aria-label': 'More subjects and practice tests',
        onclick: function () { Sfx.tap(); if (window.MQSubjects) window.MQSubjects.show(); }
      }, '📚 🧪 🎯'),
      installButton(), shareButton()));
    if (p.badges.length) {
      wrap.appendChild(h('div', { class: 'trophies', role: 'list', 'aria-label': 'Trophies' },
        p.badges.map(function (b) {
          var info = Store.BADGES[b];
          return h('span', { class: 'tr', role: 'listitem', 'aria-label': info[1] }, info[0]);
        })));
    }

    var map = h('div', { class: 'map' });
    var lastPhase = null;
    S.index.weeks.forEach(function (wk) {
      if (wk.phase !== lastPhase) {
        map.appendChild(h('div', { class: 'phase-title' }, wk.phaseIcon, ' ', phaseTitle(wk.phase)));
        lastPhase = wk.phase;
      }
      var open = Store.isUnlocked(wk.week, 1);
      var cur = nx && nx.w === wk.week;
      var days = h('div', { class: 'days' });
      for (var d = 1; d <= Store.DAYS; d++) {
        (function (d) {
          var l = Store.lesson(Store.key(wk.week, d));
          var done = !!(l && l.completed);
          var unlocked = Store.isUnlocked(wk.week, d);
          var isNow = nx && nx.w === wk.week && nx.d === d;
          var label = 'Week ' + wk.week + ', day ' + d + (d === 5 ? ', boss day' : '') +
            (done ? ', done, ' + l.stars + ' stars' : unlocked ? '' : ', locked');
          days.appendChild(h('button', {
            class: 'day' + (done ? ' done' : '') + (isNow ? ' now' : '') + (d === 5 ? ' boss' : ''),
            type: 'button', disabled: !unlocked, 'aria-label': label,
            onclick: function () { startDay(wk.week, d); }
          }, unlocked ? String(d) : '🔒',
            done ? h('span', { class: 'dstars' }, new Array(l.stars + 1).join('⭐')) : null));
        })(d);
      }
      map.appendChild(h('div', { class: 'week' + (open ? '' : ' locked') + (cur ? ' current' : '') },
        h('div', { class: 'week-head' }, h('span', { class: 'region' }, wk.icon),
          h('span', { class: 'wn' }, 'Week ' + wk.week),
          h('span', { class: 'wstars' }, '⭐ ' + weekStars(wk.week) + '/15')),
        days));
    });
    wrap.appendChild(map);
    render(wrap);
    var curEl = app.querySelector('.week.current');
    if (curEl && curEl.scrollIntoView && nx && (nx.w > 1 || nx.d > 1)) {
      try { curEl.scrollIntoView({ block: 'center' }); } catch (e) {}
    }
  }

  // ---------------------------------------------------------------- one day
  function startDay(w, d) {
    pushScreen();
    Voice.stop();
    if (S.stale[w]) delete S.weeks[w]; // new questions are applied when a day starts, never mid-question
    loadWeek(w).then(function (data) {
      var day = data.days[d - 1];
      var key = Store.key(w, d);
      var ses = Store.session();
      var D = { w: w, d: d, key: key, data: day, stage: 0, qi: 0, correct: 0 };
      if (ses && ses.key === key && (ses.stage > 0 || ses.qi > 0)) {
        D.stage = ses.stage; D.qi = ses.qi; D.correct = ses.correct;
        S.day = D;
        runStage();
      } else {
        S.day = D;
        showWelcome();
      }
    }).catch(function () { showMissing(); });
  }

  function saveSess() {
    var D = S.day;
    if (D) Store.saveSession({ key: D.key, stage: D.stage, qi: D.qi, correct: D.correct });
  }

  function showWelcome() {
    var D = S.day;
    var meta = weekMeta(D.w);
    updateTop('lesson', -1);
    render(h('section', { class: 'hero' },
      h('div', { class: 'pip pop' }, '🦊'),
      h('div', { class: 'bubble' }, D.data.boss ? '👑❓' : '🌟❓'),
      h('div', { style: 'font-size:4.5rem;line-height:1', 'aria-hidden': 'true' }, meta.icon),
      h('div', { class: 'where', style: 'color:var(--muted);font-size:1.2rem' }, 'Week ' + D.w + ' · Day ' + D.d),
      h('button', {
        class: 'btn go wide', type: 'button', 'aria-label': 'Start',
        onclick: function () { Sfx.ok(); D.stage = 0; D.qi = 0; D.correct = 0; saveSess(); runStage(); }
      }, '▶')));
  }

  function runStage() {
    var D = S.day;
    var id = STAGES[D.stage][0];
    if (id === 'warmup') return runQuestions(D.data.warmup, 'warmup');
    if (id === 'learn') return showLearn();
    if (id === 'practice') return runQuestions(D.data.practice, 'practice');
    if (id === 'review') return runQuestions(D.data.review, 'review');
    return finishDay();
  }

  function nextStage() {
    var D = S.day;
    D.stage++;
    D.qi = 0;
    if (D.stage >= 4) return finishDay();
    saveSess();
    runStage();
  }

  function runQuestions(list, kind) {
    var D = S.day;
    if (D.qi >= list.length) return nextStage();
    updateTop('lesson', D.stage);
    var q = list[D.qi];
    var dots = h('div', { class: 'dots qdots', role: 'img', 'aria-label': 'Question ' + (D.qi + 1) + ' of ' + list.length },
      list.map(function (_, i) { return h('span', { class: 'dot' + (i < D.qi ? ' ok' : i === D.qi ? ' on' : '') }); }));
    var view = questionView(q, function (first) {
      if (kind === 'practice' && first) D.correct++;
      D.qi++;
      saveSess();
      runQuestions(list, kind);
    });
    render(h('section', null, dots, view.el));
    S.keys = view.onKey || null;
  }

  function showLearn() {
    var D = S.day;
    var steps = D.data.learn;
    var i = 0;
    updateTop('lesson', 1);
    var host = h('section', { class: 'learn' });
    render(host);
    function draw() {
      var st = steps[i];
      var card = h('div', { class: 'card pop' });
      if (st.pic) card.appendChild(picEl(st.pic, true));
      if (st.big) card.appendChild(h('div', { class: 'big' }, st.big));
      if (st.word) card.appendChild(h('div', { class: 'word' }, st.word));
      if (st.lines) card.appendChild(h('div', { class: 'lines' }, st.lines.map(function (l) { return h('div', null, l); })));
      if (st.say) {
        card.appendChild(h('button', {
          class: 'speak', type: 'button', 'aria-label': 'Listen',
          onclick: function () { Voice.say(st.say, true); }
        }, '🔊'));
      }
      var last = i >= steps.length - 1;
      var dots = h('div', { class: 'dots', role: 'img', 'aria-label': 'Step ' + (i + 1) + ' of ' + steps.length },
        steps.map(function (_, k) { return h('span', { class: 'dot' + (k < i ? ' ok' : k === i ? ' on' : '') }); }));
      var ctr = h('div', { class: 'controls' },
        i > 0 ? h('button', { class: 'btn soft', type: 'button', 'aria-label': 'Back', onclick: function () { i--; draw(); } }, '◀') : null,
        h('button', {
          class: 'btn go', type: 'button', 'aria-label': last ? 'Go to practice' : 'Next',
          onclick: function () { if (last) { Sfx.ok(); nextStage(); } else { Sfx.tap(); i++; draw(); } }
        }, last ? '✏️ ➡️' : '▶'));
      host.replaceChildren(card, dots, ctr);
      if (st.say) Voice.say(st.say);
    }
    draw();
  }

  function finishDay() {
    var D = S.day;
    var wk = weekMeta(D.w);
    var others = true;
    for (var d = 1; d <= Store.DAYS; d++) if (d !== D.d && !Store.isDone(D.w, d)) others = false;
    var wasDone = Store.isDone(D.w, D.d);
    var phaseOk = S.index.weeks.every(function (x) {
      return x.phase !== wk.phase || (x.week === D.w ? others : Store.weekDone(x.week));
    });
    var meta = {
      week: D.w, weekDone: others, phaseDone: phaseOk ? wk.phase : null,
      courseDone: Store.doneCount() + (wasDone ? 0 : 1) >= Store.WEEKS * Store.DAYS
    };
    var res = Store.completeLesson(D.key, D.correct, D.data.practice.length, meta);
    Store.persist();
    updateTop('lesson', 4);
    showReward(res);
  }

  function showReward(res) {
    var D = S.day;
    Sfx.star();
    var idx = Store.indexOf(D.w, D.d);
    var fact = S.facts.length ? S.facts[idx % S.facts.length] : null;
    var nextO = idx + 1 < Store.WEEKS * Store.DAYS ? Store.order(idx + 1) : null;

    var starsRow = h('div', { class: 'stars-row', role: 'img', 'aria-label': res.stars + ' of 3 stars' },
      [1, 2, 3].map(function (n) { return h('span', { class: n <= res.stars ? '' : 'off' }, '⭐'); }));
    var ticks = h('div', { style: 'font-size:1.8rem', 'aria-label': D.correct + ' of ' + D.data.practice.length + ' right first time', role: 'img' },
      D.data.practice.map(function (_, i) { return i < D.correct ? '✅' : '⚪'; }).join(' '));

    var box = h('section', { class: 'reward' },
      h('div', { class: 'pip pop' }, '🦊'),
      starsRow, ticks,
      h('div', { class: 'chip' }, '🔥 ' + res.streak));
    if (res.newBadges.length) {
      box.appendChild(h('div', { class: 'trophies', role: 'list' },
        res.newBadges.map(function (b) {
          return h('span', { class: 'badge-new pop', role: 'listitem', 'aria-label': 'New trophy: ' + Store.BADGES[b][1] }, Store.BADGES[b][0]);
        })));
    }
    if (fact) {
      box.appendChild(h('div', { class: 'fact' },
        h('div', { class: 'fl' }, '💡 ?'), h('div', { class: 'fi' }, fact.icon), h('div', { class: 'ft' }, fact.text)));
    }
    if (nextO) {
      box.appendChild(h('div', { class: 'teaser', 'aria-label': 'Next: week ' + nextO.w + ', day ' + nextO.d }, '➡️ ', weekMeta(nextO.w).icon, ' ' + nextO.w + '·' + nextO.d));
    }
    var row = h('div', { class: 'controls' },
      h('button', { class: 'btn soft', type: 'button', 'aria-label': 'Home', onclick: goHome }, '🏠'),
      nextO ? h('button', { class: 'btn go', type: 'button', 'aria-label': 'Next day', onclick: function () { startDay(nextO.w, nextO.d); } }, '▶') : null);
    box.appendChild(row);
    if (res.firstEver) {
      var ib = installButton('btn small soft');
      if (ib) box.appendChild(ib);
    }
    render(box);
    rain();
  }

  function rain() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var items = ['⭐', '🌟', '✨', '🎉'];
    var r = h('div', { class: 'rain', 'aria-hidden': 'true' });
    for (var i = 0; i < 16; i++) {
      r.appendChild(h('i', { style: 'left:' + Math.floor(Math.random() * 96) + '%;animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's' },
        items[i % items.length]));
    }
    document.body.appendChild(r);
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 4800);
  }

  function showMissing() {
    updateTop('home');
    render(h('section', { class: 'hero' },
      h('div', { class: 'pip' }, '🦊'),
      h('div', { class: 'bubble' }, '📶 ⬇️'),
      h('p', { style: 'font-weight:600;max-width:28ch' }, "This level isn't saved yet. Connect to the internet once to download it."),
      h('button', { class: 'btn', type: 'button', 'aria-label': 'Home', onclick: goHome }, '🏠')));
  }

  // ---------------------------------------------------------------- number pad (used by questions and the parent gate)
  function padControl(onSubmit) {
    var entry = '';
    var show = h('div', { class: 'padshow', role: 'status', 'aria-label': 'Your answer' }, '❓');
    function upd() { show.textContent = entry || '❓'; }
    function press(k) {
      if (k === '⌫') entry = entry.slice(0, -1);
      else if (k === 'OK') {
        if (entry) { var v = entry; entry = ''; upd(); onSubmit(v); }
        return;
      } else if (entry === '0') entry = k;
      else if (entry.length < 4) entry += k;
      Sfx.tap();
      upd();
    }
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'];
    var grid = h('div', { class: 'pad' }, keys.map(function (k) {
      return h('button', {
        class: 'key' + (k === 'OK' ? ' ok' : ''), type: 'button',
        'aria-label': k === '⌫' ? 'Delete' : k === 'OK' ? 'Check' : k,
        onclick: function () { press(k); }
      }, k === 'OK' ? '✅' : k);
    }));
    return {
      el: h('div', { class: 'stack' }, show, grid),
      onKey: function (e) {
        if (/^[0-9]$/.test(e.key)) press(e.key);
        else if (e.key === 'Backspace') press('⌫');
        else if (e.key === 'Enter') press('OK');
      }
    };
  }

  // ---------------------------------------------------------------- reading a question aloud
  // Turns a question and its choices into plain spoken words. Pictures (emoji) cannot be spoken,
  // and counting them aloud would give the answer away, so they are left out.
  function speakable(t) {
    t = String(t == null ? '' : t);
    var hadPic = false;
    try {
      var re = /[\p{Extended_Pictographic}\uFE0F\u200D\u20E3]/gu;
      if (re.test(t)) hadPic = true;
      t = t.replace(/[\p{Extended_Pictographic}\uFE0F\u200D\u20E3]/gu, ' ');
    } catch (e) {}
    t = t.replace(/\((?:[.?,!])\)/g, ' ')
      .replace(/₹\s*(\d+)/g, '$1 rupees')
      .replace(/(\d+)\s*°\s*C/g, '$1 degrees Celsius')
      .replace(/(\d+)\s*kg/gi, '$1 kilograms')
      .replace(/(\d+)\s*cm/gi, '$1 centimetres')
      .replace(/\b1\/2\b/g, 'one half').replace(/\b1\/3\b/g, 'one third').replace(/\b1\/4\b/g, 'one quarter')
      .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 over $2')
      .replace(/,\s*\?\s*$/, ', what comes next? ')
      .replace(/\s*=\s*\?\s*$/, ' equals what? ')
      .replace(/([A-Za-z])_([A-Za-z])/g, '$1, blank, $2')
      .replace(/_{2,}|…/g, ' blank ')
      .replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/[−–]/g, ' minus ')
      .replace(/\+/g, ' plus ').replace(/=/g, ' equals ')
      .replace(/\?(?!\s*$)/g, ' what ')
      .replace(/\bA:/g, 'A,').replace(/\bB:/g, 'B,')
      .replace(/\s+/g, ' ').trim();
    return { text: t, hadPic: hadPic };
  }
  function speakText(q) {
    var parts = [];
    var main = q.type === 'match' ? { text: 'Match each one with its partner.', hadPic: false } : speakable(q.say || q.question);
    if (q.type === 'tap-count') main = { text: 'Tap ' + q.target + ' pictures.', hadPic: false };
    if (q.type === 'order') main = { text: 'Tap the numbers from smallest to biggest.', hadPic: false };
    if (main.text) { if (main.hadPic && !q.say) parts.push('Look at the pictures.'); parts.push(main.text); }
    else if (main.hadPic) parts.push('Look at the pictures.');
    else if (q.pic) parts.push('Look at the picture.');
    if (q.type === 'multiple-choice' && q.choices) {
      var cs = q.choices.map(function (c) { return speakable(c); });
      var words = cs.filter(function (c) { return c.text; }).map(function (c) { return c.text; });
      if (words.length) parts.push('The choices are. ' + words.join('. ') + '.');
      else parts.push('Look at the pictures and pick one.');
    } else if (q.type === 'true-false') {
      parts.push('Is it true or false?');
    } else if (q.type === 'order' && q.items) {
      parts.push('The numbers are. ' + q.items.join('. ') + '.');
    } else if (q.type === 'match' && q.pairs) {
      parts.push('Left side. ' + q.pairs.map(function (p) { return speakable(p[0]).text; }).join('. ') + '. Right side. ' + q.pairs.map(function (p) { return speakable(p[1]).text; }).join('. ') + '.');
    }
    return parts.map(function (p) { return /[.?!]$/.test(p.trim()) ? p.trim() : p.trim() + '.'; }).join(' ');
  }

  // ---------------------------------------------------------------- one question
  function questionView(q, onDone, opts) {
    var tries = 0;
    var finished = false;
    var maxTries = opts && opts.exam ? 1 : q.type === 'match' ? 3 : 2;
    var el = h('div', { class: 'q' });
    var stem = h('div', { class: 'stem' });
    if (q.pic) stem.appendChild(picEl(q.pic, true));
    if (q.type === 'match') stem.appendChild(h('div', { class: 'qtext', 'aria-label': 'Match the pairs' }, '🔗'));
    else if (q.question) stem.appendChild(h('div', { class: 'qtext' + (q.question.length > 40 ? ' xlong' : q.question.length > 16 ? ' long' : '') }, q.question));
    if (Voice.supported()) {
      stem.appendChild(h('button', {
        class: 'speak', type: 'button', 'aria-label': 'Read the question and the answers aloud',
        onclick: function () {
          if (Voice.speaking()) { Voice.stop(); return; }   // tap again to stop
          Voice.say(speakText(q), true);
        }
      }, '🔊'));
    }
    var fb = h('div', { class: 'fb', 'aria-live': 'polite' });
    var actions = h('div', { class: 'controls' });
    var nextBtn = h('button', {
      class: 'btn go', type: 'button', 'aria-label': 'Next',
      onclick: function () { Sfx.tap(); onDone(tries === 0); }
    }, '➡️');
    var interactive = null;
    var lockInput = function () {};

    function ok() {
      finished = true;
      lockInput();
      Sfx.ok();
      fb.className = 'fb ok pop';
      fb.replaceChildren(h('div', { class: 'face' }, '😀'), h('div', { class: 'ftext' }, q.explanation));
      if (q.topic === 'number-words' && q.say && q.type !== 'true-false') Voice.say(q.say);
      actions.replaceChildren(nextBtn);
      try { nextBtn.focus({ preventScroll: true }); } catch (e) {}
    }
    function reveal() {
      finished = true;
      lockInput(true);
      fb.className = 'fb show';
      fb.replaceChildren(h('div', { class: 'face' }, '💡'), h('div', { class: 'ftext' }, q.explanation));
      actions.replaceChildren(nextBtn);
      try { nextBtn.focus({ preventScroll: true }); } catch (e) {}
    }
    function bad() {
      tries++;
      Sfx.no();
      if (tries >= maxTries) { reveal(); return; }
      fb.className = 'fb hint shake';
      fb.replaceChildren(
        h('div', { class: 'face' }, '🤔'),
        h('div', { class: 'hintlabel' }, 'Almost! Try again 🔁'),
        h('div', { class: 'ftext' }, q.hint),
        q.hintPic ? picEl(q.hintPic) : null);
    }

    if (q.type === 'multiple-choice' || q.type === 'true-false') {
      var isTF = q.type === 'true-false';
      var order = isTF ? q.choices.slice() : shuffle(q.choices.slice());
      var btns = [];
      var grid = h('div', { class: 'choices' + (!isTF && q.choices.some(function (x) { return x.length > 16; }) ? ' one' : '') });
      order.forEach(function (c) {
        var b = h('button', {
          class: 'choice' + (isTF ? ' tf' : '') + (!isTF && c.length > 11 ? ' longc' : ''), type: 'button', 'data-v': c,
          'aria-label': isTF ? c : c,
          onclick: function () { choose(b, c); }
        }, isTF ? (c === 'True' ? '✅' : '❌') : c);
        btns.push(b);
        grid.appendChild(b);
      });
      lockInput = function (showRight) {
        btns.forEach(function (x) {
          if (showRight && x.getAttribute('data-v') === q.answer) x.classList.add('right');
          x.disabled = true;
        });
      };
      var choose = function (b, c) {
        if (finished) return;
        if (c === q.answer) { b.classList.add('right'); ok(); return; }
        b.classList.add('wrong');
        b.disabled = true;
        bad();
      };
      interactive = grid;
      S.keys = null;
      var keyFn = function (e) {
        var n = parseInt(e.key, 10);
        if (n >= 1 && n <= btns.length && !btns[n - 1].disabled) btns[n - 1].click();
      };
      el.onKey = keyFn;
    } else if (q.type === 'pad') {
      var pc = padControl(function (v) {
        if (finished) return;
        if (v === q.answer) ok(); else bad();
      });
      lockInput = function () { pc.el.hidden = true; };
      interactive = pc.el;
      el.onKey = pc.onKey;
    } else if (q.type === 'tap-count') {
      // Fun: tap the right number of pictures, then press the tick
      var counted = 0;
      var tiles = [];
      var tgrid = h('div', { class: 'tapgrid', role: 'group', 'aria-label': 'Pictures to tap' });
      var cnt = h('div', { class: 'tapcount', 'aria-live': 'polite' }, '0');
      for (var ti = 0; ti < q.total; ti++) {
        (function () {
          var on = false, num = 0;
          var tb = h('button', { class: 'tile', type: 'button', 'aria-pressed': 'false', 'aria-label': 'Picture' }, q.icon);
          tb.addEventListener('click', function () {
            if (finished) return;
            on = !on;
            if (on) { counted++; num = counted; Sfx.tap(); Voice.say(String(num)); } else { counted--; }
            tb.classList.toggle('on', on);
            tb.setAttribute('aria-pressed', on ? 'true' : 'false');
            tb.replaceChildren(on ? h('span', { class: 'tn' }, String(num)) : q.icon);
            cnt.textContent = String(counted);
          });
          tiles.push(tb);
          tgrid.appendChild(tb);
        })();
      }
      var check = h('button', { class: 'btn go', type: 'button', 'aria-label': 'Check', onclick: function () {
        if (finished) return;
        if (counted === q.target) ok(); else bad();
      } }, '✔️');
      lockInput = function () { tiles.forEach(function (x) { x.disabled = true; }); check.hidden = true; };
      interactive = h('div', { class: 'tapwrap' }, cnt, tgrid, h('div', { class: 'controls' }, check));
    } else if (q.type === 'order') {
      // Fun: tap the numbers in order, smallest first
      var want = q.answer.split(',');
      var placed = 0;
      var line = h('div', { class: 'orderline', 'aria-live': 'polite' });
      var obtns = [];
      var ogrid = h('div', { class: 'ordergrid', role: 'group', 'aria-label': 'Numbers' });
      shuffle(q.items.slice()).forEach(function (it) {
        var ob = h('button', { class: 'ordbtn', type: 'button', 'data-v': it, 'aria-label': it }, it);
        ob.addEventListener('click', function () {
          if (finished) return;
          if (it === want[placed]) {
            placed++; ob.disabled = true; ob.classList.add('right'); Sfx.tap();
            line.appendChild(h('span', { class: 'ordchip' }, it));
            if (placed === want.length) ok();
          } else {
            ob.classList.add('wrong');
            setTimeout(function () { ob.classList.remove('wrong'); }, 500);
            bad();
          }
        });
        obtns.push(ob); ogrid.appendChild(ob);
      });
      lockInput = function () { obtns.forEach(function (x) { x.disabled = true; }); };
      interactive = h('div', { class: 'orderwrap' }, line, ogrid);
    } else if (q.type === 'match') {
      var map = {};
      q.pairs.forEach(function (p) { map[p[0]] = p[1]; });
      var lefts = q.pairs.map(function (p) { return p[0]; });
      var rights = shuffle(q.pairs.map(function (p) { return p[1]; }));
      var lb = {}, rb = {};
      var sel = null, matched = 0;
      var colL = h('div', { class: 'col' }), colR = h('div', { class: 'col' });
      lefts.forEach(function (l) {
        lb[l] = h('button', { class: 'mbtn', type: 'button', onclick: function () { pickL(l); } }, l);
        colL.appendChild(lb[l]);
      });
      rights.forEach(function (r) {
        rb[r] = h('button', { class: 'mbtn', type: 'button', onclick: function () { pickR(r); } }, r);
        colR.appendChild(rb[r]);
      });
      var pickL = function (l) {
        if (finished || lb[l].classList.contains('done')) return;
        lefts.forEach(function (x) { lb[x].classList.remove('sel'); });
        sel = l;
        lb[l].classList.add('sel');
        Sfx.tap();
      };
      var pickR = function (r) {
        if (finished || rb[r].classList.contains('done')) return;
        if (q.topic === 'number-words') Voice.say(r, true);
        if (sel === null) { Sfx.tap(); return; }
        if (map[sel] === r) {
          lb[sel].classList.remove('sel');
          lb[sel].classList.add('done');
          rb[r].classList.add('done');
          sel = null;
          matched++;
          if (matched === lefts.length) ok(); else Sfx.ok();
        } else {
          lb[sel].classList.remove('sel');
          sel = null;
          rb[r].classList.add('no');
          setTimeout(function () { rb[r].classList.remove('no'); }, 500);
          if (tries + 1 >= maxTries) {
            lefts.forEach(function (x) { lb[x].classList.add('done'); rb[map[x]].classList.add('done'); });
          }
          bad();
        }
      };
      lockInput = function () {};
      interactive = h('div', { class: 'match' }, colL, colR);
    }

    el.appendChild(stem);
    if (interactive) el.appendChild(interactive);
    el.appendChild(fb);
    el.appendChild(actions);
    return { el: el, onKey: el.onKey };
  }

  // ---------------------------------------------------------------- parent corner
  function showGate() {
    pushScreen();
    updateTop('home');
    var a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
    var msg = h('p', { 'aria-live': 'polite' }, 'Parents: solve to open.');
    var pc = padControl(function (v) {
      if (parseInt(v, 10) === a * b) { Sfx.ok(); showParent(''); }
      else { Sfx.no(); msg.textContent = 'Try again 🔁'; }
    });
    render(h('section', { class: 'parent' },
      h('div', { class: 'panel center' }, msg, h('div', { class: 'qtext' }, a + ' × ' + b + ' = ?'), pc.el),
      h('button', { class: 'btn soft', type: 'button', 'aria-label': 'Home', onclick: goHome }, '🏠')));
    S.keys = pc.onKey;
  }

  function download(name, text) {
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function showParent(note) {
    pushScreen();
    var p = Store.profile();
    updateTop('home');
    var done = Store.doneCount();
    var total = Store.WEEKS * Store.DAYS;
    var chosen = p.avatar;

    var msg = h('p', { 'aria-live': 'polite', style: 'color:var(--yellow)' }, note || '');
    var nick = h('input', { type: 'text', maxlength: '12', value: p.nickname, 'aria-label': 'Nickname', autocomplete: 'off' });
    var avs = h('div', { class: 'avatars', role: 'group', 'aria-label': 'Avatar' });
    Store.AVATARS.forEach(function (a) {
      var b = h('button', {
        class: 'avatar' + (a[0] === chosen ? ' on' : ''), type: 'button', 'aria-label': a[1],
        onclick: function () {
          chosen = a[0];
          Array.prototype.forEach.call(avs.children, function (x) { x.classList.remove('on'); });
          b.classList.add('on');
        }
      }, a[0]);
      avs.appendChild(b);
    });

    var weeks = h('div', { class: 'weeklist' }, S.index.weeks.map(function (wk) {
      var n = 0;
      for (var d = 1; d <= Store.DAYS; d++) if (Store.isDone(wk.week, d)) n++;
      return h('div', { class: 'wr' }, h('span', null, 'Week ' + wk.week),
        h('div', { class: 'bar', role: 'img', 'aria-label': n + ' of 5 days' }, h('i', { style: 'width:' + (n * 20) + '%' })),
        h('span', null, n + '/5'));
    }));

    var persisted = h('p', null, '');
    Store.isPersisted().then(function (ok) {
      persisted.textContent = ok ? 'Storage: protected ✅' : 'Storage: not protected yet. Adding the app to the home screen helps.';
    });

    var fileIn = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, 'aria-label': 'Choose backup file' });
    fileIn.addEventListener('change', function () {
      var f = fileIn.files && fileIn.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        if (!window.confirm('Replace the progress on this device with this backup?')) return;
        var r = Store.importText(String(rd.result));
        if (r.ok) { showParent('Backup loaded ✅'); } else { msg.textContent = 'That file is not a Math Quest backup.'; }
      };
      rd.readAsText(f);
    });

    var ci = Store.contentInfo();
    render(h('section', { class: 'parent' },
      h('button', { class: 'btn soft wide', type: 'button', 'aria-label': 'Back to home', onclick: goHome }, '🏠'),
      msg,
      h('h2', null, 'Progress'),
      h('div', { class: 'panel' },
        h('p', null, p.nickname + ': ' + done + ' of ' + total + ' days done'),
        h('p', null, '⭐ ' + p.stars + ' of ' + (total * 3) + '   🔥 ' + streakNow(p) + ' (best ' + p.streak.best + ')'),
        h('div', { class: 'bar' }, h('i', { style: 'width:' + Math.round(100 * done / total) + '%' })),
        weeks),
      h('h2', null, 'Name and picture'),
      h('div', { class: 'panel' }, nick, avs,
        h('button', {
          class: 'btn small', type: 'button',
          onclick: function () { Store.updateProfile(nick.value, chosen); updateTop('home'); showParent('Saved ✅'); }
        }, 'Save')),
      h('h2', null, 'Backup'),
      h('div', { class: 'panel' },
        h('p', null, 'Progress lives on this device. Clearing browser data erases it. Use Backup to save a copy.'),
        h('p', null, h('button', { class: 'btn small soft', type: 'button', 'aria-label': 'Skill report', onclick: function () { if (window.MQSubjects) window.MQSubjects.report(); } }, '📊 Skill report'),
          h('button', { class: 'btn small soft', type: 'button', 'aria-pressed': Store.unlockAll() ? 'true' : 'false', 'aria-label': 'Open all topics', onclick: function () { Store.setUnlockAll(!Store.unlockAll()); showParent(Store.unlockAll() ? 'All topics are open.' : 'Topics open one by one.'); } }, Store.unlockAll() ? '🔓 All open' : '🔒 One by one')),
        h('p', null, h('a', { href: 'privacy.html', class: 'btn small soft', 'aria-label': 'Read the privacy notice' }, '🔒 Privacy')),
        h('div', { class: 'row' },
          h('button', {
            class: 'btn small', type: 'button',
            onclick: function () { download('mathquest-backup-' + Store.today() + '.json', Store.exportText()); msg.textContent = 'Backup saved to your downloads ✅'; }
          }, '💾 Save backup'),
          h('button', { class: 'btn small soft', type: 'button', onclick: function () { fileIn.click(); } }, '📂 Load backup'),
          fileIn),
        persisted),
      h('h2', null, 'Install and share'),
      h('div', { class: 'panel' },
        h('p', null, 'Install Math Quest to open it full screen, even with no internet. Sharing sends only the link to the app, never any progress.'),
        h('div', { class: 'row' },
          installButton(),
          h('button', { class: 'btn small soft', type: 'button', onclick: showInstall }, '📖 How to install'),
          shareButton())),
      h('h2', null, 'Start over'),
      h('div', { class: 'panel' },
        h('button', {
          class: 'btn small soft', type: 'button',
          onclick: function () {
            if (window.confirm('Erase all progress on this device?') && window.confirm('Really erase everything? This cannot be undone.')) {
              Store.reset();
              showProfile();
            }
          }
        }, '🗑️ Erase progress')),
      h('p', { style: 'text-align:center;color:var(--muted);font-weight:600;font-size:0.85rem' },
        'Content version ' + (ci.version || (S.index ? S.index.contentVersion : '')))));
  }

  // ---------------------------------------------------------------- offline status and content updates
  function checkOffline(tries) {
    var chip = $('#offline');
    if (FILE_MODE || !('serviceWorker' in navigator) || !window.caches || !S.index) { chip.hidden = true; return; }
    var urls = SHELL.concat(S.index.weeks.map(function (w) { return 'content/' + w.file; }),
      ['content/index.json', 'content/facts.json']);
    Promise.all(urls.map(function (u) {
      return caches.match(u).then(function (r) { return r ? 1 : 0; }, function () { return 0; });
    })).then(function (list) {
      var have = list.reduce(function (a, b) { return a + b; }, 0);
      chip.hidden = false;
      if (have >= urls.length) {
        chip.className = 'chip ready';
        chip.textContent = '✅ Ready offline';
      } else {
        chip.className = 'chip busy';
        chip.textContent = '⬇️ ' + Math.round(100 * have / urls.length) + '%';
        if ((tries || 0) < 40) setTimeout(function () { checkOffline((tries || 0) + 1); }, 1500);
      }
    });
  }

  function checkUpdates() {
    if (FILE_MODE || navigator.onLine === false || !S.index) return;
    var info = Store.contentInfo();
    var files = {};
    S.index.weeks.forEach(function (w) { files[w.file] = w.v; });
    if (!info.version) { Store.setContentInfo(S.index.contentVersion, files); return; }
    if (S.index.contentVersion === info.version) return;
    var changed = S.index.weeks.filter(function (w) { return (info.files[w.file] || 0) !== w.v; });
    var done = Object.assign({}, info.files);
    Promise.all(changed.map(function (w) {
      return fetch('content/' + w.file, { cache: 'reload' }).then(function (r) {
        if (!r.ok) throw new Error('bad');
        S.stale[w.week] = true;
        done[w.file] = w.v;
      }).catch(function () {});
    })).then(function () {
      var all = S.index.weeks.every(function (w) { return done[w.file] === w.v; });
      Store.setContentInfo(all ? S.index.contentVersion : info.version, done);
      if (changed.length) {
        var chip = $('#update');
        chip.hidden = false;
        chip.className = 'chip news';
        chip.textContent = '🆕 New questions!';
        setTimeout(function () { chip.hidden = true; }, 8000);
      }
    });
  }

  function registerSW() {
    if (FILE_MODE || !('serviceWorker' in navigator)) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  // ---------------------------------------------------------------- start
  function bindTop() {
    $('#btn-home').addEventListener('click', function () { goHome(); });
    $('#btn-parent').addEventListener('click', function () { Voice.stop(); showGate(); });
    $('#btn-sound').addEventListener('click', function () {
      var on = !Store.settings().sound;
      Store.setSound(on);
      Sfx.setEnabled(on);
      updateTop(S.day ? 'lesson' : 'home', S.day ? S.day.stage : 0);
      if (on) Sfx.tap();
    });
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (S.keys) S.keys(e);
    });
  }

  function showFatal() {
    render(h('section', { class: 'hero' },
      h('div', { class: 'pip' }, '🦊'),
      h('div', { class: 'bubble' }, '📶 ❌'),
      h('p', { style: 'font-weight:600;max-width:28ch' }, 'Connect to the internet once to get started.'),
      h('button', { class: 'btn', type: 'button', 'aria-label': 'Try again', onclick: function () { location.reload(); } }, '🔁')));
  }

  // A small, fixed set of helpers for js/subjects.js. Nothing else is shared.
  window.MQApp = {
    h: h, render: render, shuffle: shuffle, questionView: questionView, updateTop: updateTop,
    speakText: speakText, pushScreen: pushScreen, goHome: goHome, showHome: showHome, fileMode: FILE_MODE,
    setKeys: function (f) { S.keys = f || null; },
    refreshTop: function () { updateTop('sub'); }
  };

  function boot() {
    bindTop();
    Sfx.setEnabled(Store.settings().sound);
    registerSW();
    bindInstall();
    fetchJSON('content/index.json').then(function (idx) {
      S.index = idx;
      return fetchJSON('content/facts.json').catch(function () { return [{ icon: '⭐', text: '5 points' }]; });
    }).then(function (facts) {
      S.facts = facts;
      if (Store.hasProfile()) showHome(); else showProfile();
      checkUpdates();
      checkOffline(0);
    }).catch(function () { showFatal(); });
  }

  boot();
})();
