/* Math Quest - small sounds and read-aloud. Everything is built in, nothing is downloaded.
   Voices use the device's own speech, which works offline on most devices. */
(function (root) {
  'use strict';

  var ctx = null;
  var enabled = true;

  function audio() {
    if (ctx) return ctx;
    try {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch (e) { ctx = null; }
    return ctx;
  }

  function tone(freq, start, len, type, vol) {
    var c = audio();
    if (!c) return;
    try {
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      var t0 = c.currentTime + start;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
      o.connect(g);
      g.connect(c.destination);
      o.start(t0);
      o.stop(t0 + len + 0.05);
    } catch (e) {}
  }

  function play(notes) {
    if (!enabled) return;
    var c = audio();
    if (c && c.state === 'suspended' && c.resume) { try { c.resume(); } catch (e) {} }
    notes.forEach(function (n) { tone(n[0], n[1], n[2], n[3], n[4]); });
  }

  var Sfx = {
    setEnabled: function (on) { enabled = !!on; if (!on) Voice.stop(); },
    tap: function () { play([[520, 0, 0.06, 'sine', 0.08]]); },
    ok: function () { play([[660, 0, 0.12, 'triangle'], [880, 0.1, 0.18, 'triangle']]); },
    no: function () { play([[300, 0, 0.14, 'sine', 0.1], [250, 0.12, 0.18, 'sine', 0.1]]); },
    star: function () {
      play([[523, 0, 0.14, 'triangle'], [659, 0.12, 0.14, 'triangle'],
            [784, 0.24, 0.14, 'triangle'], [1047, 0.36, 0.3, 'triangle']]);
    }
  };

  // Pick the clearest voice the device has. Indian English first, then other English; natural-sounding
  // and on-device voices (they work offline) are preferred. Falls back to the phone's default.
  var chosen = null, chosenDone = false;
  function pickVoice() {
    if (chosenDone) return chosen;
    var list = [];
    try { list = root.speechSynthesis.getVoices() || []; } catch (e) {}
    if (!list.length) return null;   // not loaded yet: try again next time
    var best = null, bestScore = -1;
    list.forEach(function (v) {
      var l = String(v.lang || '').replace('_', '-').toLowerCase();
      if (l.indexOf('en') !== 0) return;
      var s = l === 'en-in' ? 60 : l === 'en-gb' ? 40 : l === 'en-au' ? 32 : l === 'en-us' ? 30 : 10;
      if (/natural|neural|enhanced|premium/i.test(v.name)) s += 25;
      if (/google|siri|samantha|veena|rishi|heera|neerja|kalpana|lekha|daniel|serena/i.test(v.name)) s += 12;
      if (/compact|espeak|robot/i.test(v.name)) s -= 30;
      if (v.localService) s += 40;   // on-device voices keep working with no internet
      if (s > bestScore) { bestScore = s; best = v; }
    });
    chosen = best; chosenDone = !!best;
    return chosen;
  }
  function utter(text) {
    var u = new root.SpeechSynthesisUtterance(String(text));
    var v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'en-IN'; }
    u.rate = 0.82;    // slow and clear for little ears
    u.pitch = 1.0;    // natural pitch is easier to understand than a raised one
    u.volume = 1;
    return u;
  }
  try {
    if (root.speechSynthesis && root.speechSynthesis.addEventListener) {
      root.speechSynthesis.addEventListener('voiceschanged', function () { chosenDone = false; pickVoice(); });
    }
  } catch (e) {}

  var token = 0, seqActive = false, marked = null, keep = null;
  function clearMark() {
    if (marked && marked.classList) marked.classList.remove('reading');
    marked = null;
  }

  var Voice = {
    supported: function () { return !!(root.speechSynthesis && root.SpeechSynthesisUtterance); },
    // force = true when the child taps a speaker button on purpose
    say: function (text, force) {
      if (!text || !Voice.supported()) return;
      if (!force && !enabled) return;
      try {
        root.speechSynthesis.cancel();
        root.speechSynthesis.speak(utter(text));
      } catch (e) {}
    },
    // Reads a list of {text, el} one by one and lights up each el while it is spoken.
    sequence: function (segs, force) {
      if (!Voice.supported()) return;
      if (!force && !enabled) return;
      Voice.stop();
      var my = ++token;
      seqActive = true;
      var step = function (i) {
        if (my !== token) return;
        clearMark();
        if (i >= segs.length) { seqActive = false; return; }
        var s = segs[i];
        if (!s || !s.text) { step(i + 1); return; }
        if (s.el && s.el.classList) { s.el.classList.add('reading'); marked = s.el; }
        try {
          var u = utter(s.text);
          u.onend = function () { step(i + 1); };
          u.onerror = function () { step(i + 1); };
          keep = u;   // keep a reference so the phone does not drop it
          root.speechSynthesis.speak(u);
        } catch (e) { seqActive = false; clearMark(); }
      };
      step(0);
    },
    stop: function () {
      token++; seqActive = false; clearMark();
      try { if (Voice.supported()) root.speechSynthesis.cancel(); } catch (e) {}
    },
    speaking: function () {
      if (seqActive) return true;
      try { return !!(Voice.supported() && root.speechSynthesis.speaking); } catch (e) { return false; }
    }
  };

  root.Sfx = Sfx;
  root.Voice = Voice;
})(typeof window !== 'undefined' ? window : this);
