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
    'course': ['🎓', 'Course done'],
    'mock-1': ['📝', 'First mock test'],
    'mock-80': ['🥇', 'Mock test 80% or more'],
    'explorer': ['🧭', 'Tried every subject']
  };
  // Optional photo avatar. The picture lives in its own storage slot (not in the progress data),
  // so a normal backup never contains it. Frames and stickers are just short names/emoji.
  var PHOTO_KEY = 'mathquest.photo.';
  var PHOTO_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+\/]+={0,2}$/;
  var PHOTO_MAX = 40000;   // characters; a 160px picture is about 15000
  var FRAMES = [['gold', 'Gold'], ['green', 'Green'], ['blue', 'Blue'], ['pink', 'Pink'], ['rainbow', 'Rainbow']];
  var STICKERS = ['', '👑', '😎', '⭐', '🎀', '🎩', '🌈'];
  var SUBJECT_IDS = ['maths', 'english', 'evs', 'science', 'computer', 'gk', 'social', 'olympiad'];
  var LEVEL_IDS = ['pre', 'c1', 'c2', 'c3', 'c4'];
  for (var w = 1; w <= WEEKS; w++) BADGES['week-' + w] = ['🏅', 'Week ' + w + ' done'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function dateStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return dateStr(new Date()); }
  function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }

  function blank() {
    return { v: 1, active: null, profiles: {}, settings: { sound: true, photo: false }, content: { version: 0, files: {} } };
  }

  // Sticker place (percent across and down the picture; below 0 or above 100 sits outside the circle) and size step (1 small to 5 big).
  var ST_DEFAULT = { x: 86, y: 10, s: 3 };
  function bound(v, lo, hi, d) { var n = parseInt(v, 10); return isNaN(n) ? d : Math.min(hi, Math.max(lo, n)); }

  function frameOk(f) { return FRAMES.some(function (x) { return x[0] === f; }); }
  function validPhoto(s) { return typeof s === 'string' && s.length <= PHOTO_MAX && PHOTO_RE.test(s); }

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
      frame: frameOk(p.frame) ? p.frame : 'gold',
      sticker: STICKERS.indexOf(p.sticker) >= 0 ? p.sticker : '',
      sx: bound(p.sx, -50, 150, ST_DEFAULT.x),
      sy: bound(p.sy, -50, 150, ST_DEFAULT.y),
      ss: bound(p.ss, 1, 5, ST_DEFAULT.s),
      stars: 0,
      streak: { current: 0, best: 0, lastPlayed: null },
      badges: [],
      lessons: {},
      session: null,
      level: LEVEL_IDS.indexOf(p.level) >= 0 ? p.level : null,
      unlockAll: p.unlockAll === true,
      subjects: {},
      mocks: [],
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
    cleanSubjects(p, out);
    recount(out);
    return out;
  }

  // Subject practice stats: small, bounded numbers only.
  function num(v, max) { return Math.min(max, Math.max(0, parseInt(v, 10) || 0)); }
  function cleanSubjects(p, out) {
    var S = p.subjects && typeof p.subjects === 'object' ? p.subjects : {};
    SUBJECT_IDS.forEach(function (sid) {
      var x = S[sid];
      if (!x || typeof x !== 'object') return;
      var o = { seen: num(x.seen, 100000), right: num(x.right, 100000), topics: {} };
      if (o.right > o.seen) o.right = o.seen;
      var T = x.topics && typeof x.topics === 'object' ? x.topics : {};
      Object.keys(T).slice(0, 40).forEach(function (t) {
        if (!/^[a-z0-9-]{1,24}$/.test(t)) return;
        var r = num(T[t] && T[t].r, 100000), w = num(T[t] && T[t].w, 100000);
        var hh = T[t] && typeof T[t].h === 'string' && /^[01]{0,10}$/.test(T[t].h) ? T[t].h : '';
        o.topics[t] = { r: r, w: w, h: hh };
      });
      out.subjects[sid] = o;
    });
    (Array.isArray(p.mocks) ? p.mocks : []).slice(-20).forEach(function (m) {
      if (!m) return;
      var total = num(m.total, 100), score = Math.min(total, num(m.score, 100));
      if (total < 1) return;
      out.mocks.push({ score: score, total: total, date: /^\d{4}-\d{2}-\d{2}$/.test(m.date || '') ? m.date : null });
    });
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
    out.settings.photo = !!(s.settings && s.settings.photo === true);
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
    FRAMES: FRAMES,
    STICKERS: STICKERS,
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

    // ---- optional photo avatar (off until a parent turns it on; stays on this device)
    photoOn: function () { return state.settings.photo === true; },
    // Turning it off also deletes the picture.
    setPhotoOn: function (on) {
      state.settings.photo = !!on;
      if (!on) Store.removePhoto();
      save();
    },
    photo: function () {
      var p = profile();
      if (!p || !state.settings.photo) return null;
      try {
        var s = root.localStorage.getItem(PHOTO_KEY + p.profileId);
        return validPhoto(s) ? s : null;
      } catch (e) { return null; }
    },
    setPhoto: function (dataUrl) {
      var p = profile();
      if (!p || !state.settings.photo || !validPhoto(dataUrl)) return false;
      try { root.localStorage.setItem(PHOTO_KEY + p.profileId, dataUrl); return true; }
      catch (e) { return false; }
    },
    removePhoto: function () {
      try {
        var gone = [];
        for (var i = 0; i < root.localStorage.length; i++) {
          var k = root.localStorage.key(i);
          if (k && k.indexOf(PHOTO_KEY) === 0) gone.push(k);
        }
        gone.forEach(function (k) { root.localStorage.removeItem(k); });
      } catch (e) {}
    },
    setLook: function (frame, sticker) {
      var p = profile();
      if (!p) return;
      if (frameOk(frame)) p.frame = frame;
      if (STICKERS.indexOf(sticker) >= 0) p.sticker = sticker;
      touch();
    },

    // Move or resize the sticker. Pass null to leave a value as it is.
    setStickerPlace: function (x, y, size) {
      var p = profile();
      if (!p) return;
      if (x != null) p.sx = bound(x, -50, 150, p.sx);
      if (y != null) p.sy = bound(y, -50, 150, p.sy);
      if (size != null) p.ss = bound(size, 1, 5, p.ss);
      touch();
    },
    resetStickerPlace: function () {
      var p = profile();
      if (!p) return;
      p.sx = ST_DEFAULT.x; p.sy = ST_DEFAULT.y; p.ss = ST_DEFAULT.s;
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

    SUBJECT_IDS: SUBJECT_IDS,
    LEVEL_IDS: LEVEL_IDS,
    level: function () { var p = profile(); return p ? p.level : null; },
    unlockAll: function () { var p = profile(); return !!(p && p.unlockAll); },
    setUnlockAll: function (on) { var p = profile(); if (p) { p.unlockAll = !!on; touch(); } },
    // Mastery of one topic: last 10 first-try results. Mastered = at least 6 tries and 80% or better.
    mastery: function (sid, topic) {
      var st = Store.subjectStats(sid), t = st.topics[topic];
      var h = t && t.h ? t.h : '';
      var n = h.length, r = 0;
      for (var i = 0; i < n; i++) if (h.charAt(i) === '1') r++;
      var pct = n ? r / n : 0;
      var state = n === 0 ? 'new' : (n >= 6 && pct >= 0.8) ? 'mastered' : 'learning';
      return { n: n, pct: pct, state: state };
    },
    setLevel: function (l) { var p = profile(); if (!p || LEVEL_IDS.indexOf(l) < 0) return; p.level = l; touch(); },
    subjectStats: function (sid) { var p = profile(); return p && p.subjects[sid] ? p.subjects[sid] : { seen: 0, right: 0, topics: {} }; },
    mocks: function () { var p = profile(); return p ? p.mocks : []; },
    recordAnswer: function (sid, topic, firstTry) {
      var p = profile();
      if (!p || SUBJECT_IDS.indexOf(sid) < 0) return;
      var x = p.subjects[sid] || (p.subjects[sid] = { seen: 0, right: 0, topics: {} });
      x.seen = Math.min(100000, x.seen + 1);
      if (firstTry) x.right = Math.min(100000, x.right + 1);
      var t = /^[a-z0-9-]{1,24}$/.test(topic || '') ? topic : 'other';
      var tt = x.topics[t] || (x.topics[t] = { r: 0, w: 0, h: '' });
      if (firstTry) tt.r++; else tt.w++;
      tt.h = ((tt.h || '') + (firstTry ? '1' : '0')).slice(-10);
      save();
    },
    addMock: function (score, total) {
      var p = profile();
      if (!p) return [];
      p.mocks.push({ score: score, total: total, date: today() });
      p.mocks = p.mocks.slice(-20);
      var fresh = [];
      function give(id) { if (p.badges.indexOf(id) < 0) { p.badges.push(id); fresh.push(id); } }
      give('mock-1');
      if (total > 0 && score / total >= 0.8) give('mock-80');
      touch();
      return fresh;
    },
    giveBadge: function (id) {
      var p = profile();
      if (!p || !BADGES[id] || p.badges.indexOf(id) >= 0) return false;
      p.badges.push(id); touch(); return true;
    },

    contentInfo: function () { return state.content; },
    setContentInfo: function (version, files) {
      state.content.version = version;
      state.content.files = files || {};
      save();
    },

    // The photo is left out of a backup unless the parent asks for it.
    exportText: function (includePhoto) {
      var out = { app: 'mathquest', exportedAt: new Date().toISOString(), data: state };
      if (includePhoto) { var ph = Store.photo(); if (ph) out.photo = ph; }
      return JSON.stringify(out, null, 1);
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
      // A backup with photo avatars switched off must not leave an old photo behind.
      if (!state.settings.photo) Store.removePhoto();
      else if (validPhoto(obj.photo)) Store.setPhoto(obj.photo);
      return { ok: true };
    },
    reset: function () { Store.removePhoto(); state = blank(); try { root.localStorage.removeItem(KEY); } catch (e) {} },

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
