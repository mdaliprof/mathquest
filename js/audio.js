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

  var Voice = {
    supported: function () { return !!(root.speechSynthesis && root.SpeechSynthesisUtterance); },
    // force = true when the child taps a speaker button on purpose
    say: function (text, force) {
      if (!text || !Voice.supported()) return;
      if (!force && !enabled) return;
      try {
        root.speechSynthesis.cancel();
        var u = new root.SpeechSynthesisUtterance(String(text));
        u.lang = 'en-IN';
        u.rate = 0.8;
        u.pitch = 1.1;
        root.speechSynthesis.speak(u);
      } catch (e) {}
    },
    stop: function () { try { if (Voice.supported()) root.speechSynthesis.cancel(); } catch (e) {} },
    speaking: function () { try { return !!(Voice.supported() && root.speechSynthesis.speaking); } catch (e) { return false; } }
  };

  root.Sfx = Sfx;
  root.Voice = Voice;
})(typeof window !== 'undefined' ? window : this);
