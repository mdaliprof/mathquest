/* Math Quest - progress saved on this device (no accounts, no tracking).
   Shape follows math-kids-offline-context.md, section 5. */
(function (root) {
  'use strict';

  var KEY = 'mathquest.v1';
  var WEEKS = 18;
  var DAYS = 5;
  var AVATARS = [
    ['🦁', 'Lion'], ['🐼', 'Panda'], ['🐯', 'Tiger'], ['🐸', 'Frog'],
    ['🐵', 'Monkey'], ['🐘', 'Elephant'], ['🦄', 'Unicorn'], ['🐰', 'Bunny']
  ];
  var BADGES = {
    'first-day': ['🌟', 'First mission'],
    'streak-3': ['🔥', '3 days in a row'],
    'streak-5': ['🔥', '5 days in a row'],
    'streak-7': ['🏆', '7 days in a row'],
    'perfect': ['💯', 'All right first time'],
    'phase-words': ['🔤', 'Number words done'],
    'phase-add': ['➕', 'Addition done'],
    'phase-sub': ['➖', 'Subtraction done'],
    'phase-tables': ['✖️', 'Tables done'],
    'phase-div': ['➗', 'Division done'],
    'course': ['🎓', 'Course done']
  };
  for (var w = 1; w <= WEEKS; w++) BADGES['week-' + w] = ['🏅', 'Week ' + w + ' done'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function dateStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return dateStr(new Date()); }
  function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }

  function blank() {
    return { v: 1, active: null, profiles: {}, settings: { sound: true }, content: { version: 0, files: {} } };
  }

  function key(w, d) { return 'W' + pad(w) + 'D' + d; }
  function order(i) { return { w: Math.floor(i / DAYS) + 1, d: (i % DAYS) + 1 }; }
  function indexOf(w, d) { return (w - 1) * DAYS + (d - 1); }

  // Keep only the shapes we expect, so a bad import can never break the app.
  function cleanProfile(p, id) {
    if (!p || typeof p !== 'object') return null;
    var out = {
      profileId: id,
      nickname: String(p.nickname || 'Star').slice(0, 12),
      avatar: String(p.avatar || '🦁').slice(0, 8),
      stars: 0,
      streak: { current: 0, best: 0, lastPlayed: null },
      badges: [],
      lessons: {},
      session: null,
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString()
    };
    var s = p.streak || {};
    out.streak.current = Math.max(0, parseInt(s.current, 10) || 0);
    out.streak.best = Math.max(0, parseInt(s.best, 10) || 0);
    out.streak.lastPlayed = /^\d{4}-\d{2}-\d{2}$/.test(s.lastPlayed || '') ? s.lastPlayed : null;
    (Array.isArray(p.badges) ? p.badges : []).forEach(function (b) {
      if (BADGES[b] && out.badges.indexOf(b) < 0) out.badges.push(b);
    });
    var L = p.lessons && typeof p.lessons === 'object' ? p.lessons : {};
    Object.keys(L).forEach(function (k) {
      var m = /^W(\d{2})D(\d)$/.exec(k);
      if (!m) return;
      var w = +m[1], d = +m[2];
      if (w < 1 || w > WEEKS || d < 1 || d > DAYS) return;
      var x = L[k] || {};
      out.lessons[k] = {
        completed: !!x.completed,
        bestScore: Math.min(5, Math.max(0, parseInt(x.bestScore, 10) || 0)),
        stars: Math.min(3, Math.max(0, parseInt(x.stars, 10) || 0)),
        attempts: Math.max(0, parseInt(x.attempts, 10) || 0)
      };
    });
    var se = p.session;
    if (se && /^W\d{2}D\d$/.test(se.key || '')) {
      out.session = {
        key: se.key,
        stage: Math.min(4, Math.max(0, parseInt(se.stage, 10) || 0)),
        qi: Math.max(0, parseInt(se.qi, 10) || 0),
        correct: Math.min(5, Math.max(0, parseInt(se.correct, 10) || 0))
      };
    }
    recount(out);
    return out;
  }

  function sanitize(s) {
    var out = blank();
    if (!s || typeof s !== 'object' || !s.profiles || typeof s.profiles !== 'object') return out;
    Object.keys(s.profiles).slice(0, 8).forEach(function (id) {
      var p = cleanProfile(s.profiles[id], String(id).slice(0, 20));
      if (p) out.profiles[p.profileId] = p;
    });
    out.active = out.profiles[s.active] ? s.active : (Object.keys(out.profiles)[0] || null);
    out.settings.sound = !(s.settings && s.settings.sound === false);
    var c = s.content || {};
    out.content.version = parseInt(c.version, 10) || 0;
    if (c.files && typeof c.files === 'object') {
      Object.keys(c.files).forEach(function (f) {
        if (/^week-\d{2}\.json$/.test(f)) out.content.files[f] = parseInt(c.files[f], 10) || 0;
      });
    }
    return out;
  }

  var state = load();

  function load() {
    try {
      var raw = root.localStorage.getItem(KEY);
      if (!raw) return blank();
      return sanitize(JSON.parse(raw));
    } catch (e) { return blank(); }
  }

  function save() {
    try { root.localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }

  function recount(p) {
    var total = 0;
    Object.keys(p.lessons).forEach(function (k) { total += p.lessons[k].stars || 0; });
    p.stars = total;
  }

  function profile() { return state.active ? state.profiles[state.active] : null; }

  function touch() { var p = profile(); if (p) p.updatedAt = new Date().toISOString(); save(); }

  var Store = {
    AVATARS: AVATARS,
    BADGES: BADGES,
    WEEKS: WEEKS,
    DAYS: DAYS,
    key: key,
    order: order,
    indexOf: indexOf,
    today: today,

    hasProfile: function () { return !!profile(); },
    profile: profile,
    settings: function () { return state.settings; },
    setSound: function (on) { state.settings.sound = !!on; save(); },

    createProfile: function (avatar, nickname) {
      var id = 'kid-1';
      state.profiles[id] = cleanProfile({ nickname: nickname, avatar: avatar }, id);
      state.active = id;
      save();
      return state.profiles[id];
    },
    updateProfile: function (nickname, avatar) {
      var p = profile();
      if (!p) return;
      if (typeof nickname === 'string' && nickname.trim()) p.nickname = nickname.trim().slice(0, 12);
      if (avatar) p.avatar = avatar;
      touch();
    },

    lesson: function (k) { var p = profile(); return p && p.lessons[k] ? p.lessons[k] : null; },
    isDone: function (w, d) { var l = Store.lesson(key(w, d)); return !!(l && l.completed); },
    // A day opens when the one before it is finished. Finished days can be replayed.
    isUnlocked: function (w, d) {
      var i = indexOf(w, d);
      if (i === 0) return true;
      var prev = order(i - 1);
      return Store.isDone(prev.w, prev.d);
    },
    next: function () {
      for (var i = 0; i < WEEKS * DAYS; i++) {
        var o = order(i);
        if (!Store.isDone(o.w, o.d)) return o;
      }
      return null;
    },
    doneCount: function () {
      var p = profile(), n = 0;
      if (!p) return 0;
      Object.keys(p.lessons).forEach(function (k) { if (p.lessons[k].completed) n++; });
      return n;
    },
    weekDone: function (w) {
      for (var d = 1; d <= DAYS; d++) if (!Store.isDone(w, d)) return false;
      return true;
    },

    // Saved after every answer, so closing the app never loses the day.
    saveSession: function (s) { var p = profile(); if (!p) return; p.session = s; touch(); },
    session: function () { var p = profile(); return p ? p.session : null; },
    clearSession: function () { var p = profile(); if (!p) return; p.session = null; touch(); },

    // meta: { weekDone, phaseDone (phase id or null), courseDone }
    completeLesson: function (k, correct, total, meta) {
      var p = profile();
      var stars = correct >= total ? 3 : correct >= 3 ? 2 : 1;
      var prev = p.lessons[k] || { completed: false, bestScore: 0, stars: 0, attempts: 0 };
      var firstEver = Object.keys(p.lessons).every(function (x) { return !p.lessons[x].completed; });
      p.lessons[k] = {
        completed: true,
        bestScore: Math.max(prev.bestScore, correct),
        stars: Math.max(prev.stars, stars),
        attempts: prev.attempts + 1
      };
      recount(p);

      var t = today();
      var s = p.streak;
      if (s.lastPlayed !== t) {
        s.current = s.lastPlayed === yesterday() ? s.current + 1 : 1;
        s.lastPlayed = t;
        if (s.current > s.best) s.best = s.current;
      }

      var fresh = [];
      function give(id) { if (p.badges.indexOf(id) < 0) { p.badges.push(id); fresh.push(id); } }
      if (firstEver) give('first-day');
      if (s.current >= 3) give('streak-3');
      if (s.current >= 5) give('streak-5');
      if (s.current >= 7) give('streak-7');
      if (correct >= total) give('perfect');
      if (meta && meta.weekDone) give('week-' + meta.week);
      if (meta && meta.phaseDone) give('phase-' + meta.phaseDone);
      if (meta && meta.courseDone) give('course');
      p.session = null;
      touch();
      return { stars: stars, newBadges: fresh, streak: s.current, firstEver: firstEver };
    },

    contentInfo: function () { return state.content; },
    setContentInfo: function (version, files) {
      state.content.version = version;
      state.content.files = files || {};
      save();
    },

    exportText: function () {
      return JSON.stringify({ app: 'mathquest', exportedAt: new Date().toISOString(), data: state }, null, 1);
    },
    importText: function (text) {
      var obj;
      try { obj = JSON.parse(text); } catch (e) { return { ok: false }; }
      var data = obj && obj.app === 'mathquest' && obj.data ? obj.data : null;
      if (!data || !data.profiles || typeof data.profiles !== 'object') return { ok: false };
      var clean = sanitize(data);
      if (!clean.active) return { ok: false };
      var keepContent = state.content;
      state = clean;
      state.content = keepContent;
      save();
      return { ok: true };
    },
    reset: function () { state = blank(); try { root.localStorage.removeItem(KEY); } catch (e) {} },

    // Ask the browser not to clear our data when space is low.
    persist: function () {
      try {
        if (root.navigator && root.navigator.storage && root.navigator.storage.persist) {
          return root.navigator.storage.persist();
        }
      } catch (e) {}
      return Promise.resolve(false);
    },
    isPersisted: function () {
      try {
        if (root.navigator && root.navigator.storage && root.navigator.storage.persisted) {
          return root.navigator.storage.persisted();
        }
      } catch (e) {}
      return Promise.resolve(false);
    }
  };

  root.Store = Store;
})(typeof window !== 'undefined' ? window : this);
