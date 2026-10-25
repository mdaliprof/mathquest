# Math Quest

A 15-minutes-a-day math course for kids. Plain HTML, CSS and JavaScript. Works offline. No accounts, no tracking, no outside scripts.

## Try it on your computer
```
cd mathquest
python3 -m http.server 8080
```
Open http://localhost:8080. Double-clicking `index.html` also works for a quick look, but the offline install only works from `http://localhost` or `https`.

## Put it online (Netlify)
Push this folder to GitHub, connect the repo to Netlify. No build command. Publish directory: `.`
`netlify.toml` already sets the right headers.

## Installing on a phone (also shown inside the app: 📲 Install)
The site must be on https (Netlify is). Open the link, then:
- **Android (Chrome):** tap the 📲 Install button in the app, or the ⋮ menu > Install app / Add to Home screen > Install. Samsung Internet: ☰ menu > Add page to > Home screen.
- **iPhone / iPad:** open the link in **Safari**, tap Share (square with an up arrow) > **Add to Home Screen** > Add. iOS has no install pop-up, so the app's 📲 Install button opens these steps. Installing also stops Safari from clearing saved progress when the app is unused for a while.
- **Computer (Chrome or Edge):** click the install icon at the right end of the address bar.

The 📤 Share button opens the phone's share sheet (WhatsApp, Messages and so on). On a computer it copies the link. It shares only the link, never progress.
Android's back button returns to the home map instead of closing the app.

## The course
18 weeks, 5 days a week, day 5 is a boss day. One day is about 15 minutes:
warm-up (3) > learn (steps) > practice (5) > review (2) > reward.

| Weeks | Topic |
|---|---|
| 1-3 | Number words: 0-10, 11-20, tens to 100 |
| 4-5 | Addition within 10, within 20 |
| 6-7 | Subtraction within 10, within 20 |
| 8-16 | Tables 2 to 20 (x1 to x10), week 16 is mixed |
| 17-18 | Division: sharing, then with tables |

## Subjects and mock tests (new)
📚 button on the home screen: Maths Puzzles, English, Science, Computer Thinking, General Knowledge, Social Science. 8-question rounds that adjust to how the child is doing, a 🎯 Weak spots round, and a 📝 20-question Mock test (timed 20 minutes or relaxed, one try per question).
```
python3 tools/build_levels.py       # rebuilds content/levels/*.json (Pre-School to Class 4) and levels-bundle.js
python3 tools/check_levels.py       # structure + re-solves every maths question
```
Add questions in `tools/banks/levels_*.py`. All class-ladder questions are marked unverified until checked against the school books. See MORNING_HANDOVER.md. See RISK_REVIEW.md before going live.

## Learning approach (new)
- **Class 1 skill tree:** 42 skills, including a 🏆 **Olympiad Challenge** (7 skills: pattern detective, missing numbers, number riddles, story sums, think-and-decide, count the sides, word pairs). These open as the matching basics are mastered, and there is a 🏆 **Olympiad mock** (20 questions, timed or relaxed). All olympiad-style questions are original; no real exam papers or exam names are used. Maths follows NCERT *Joyful Mathematics 1* (13 chapters) plus ICSE-style extras (tables 2-5). A topic opens when the basics under it are **mastered** (6 or more tries, 80% or better on the last 10). Mock tests count towards mastery.
- **Skill map** 🗺️ (child) and **Skill report** 📊 (Parent corner). Parents can open every topic with "All open".
- **Fix-it round** 🛠️ appears after a rough round and practises the basics under the weakest topic.
- **Fun activities:** tap-to-count and put-in-order, besides pictures and multiple choice.
- Pre-School, Class 2, 3, 4 have the older simple lists (no gate yet).

## Changing the content
Questions are made by a script so every answer is computed, not typed.
```
python3 tools/generate_content.py   # rebuilds content/*.json
python3 tools/check_content.py      # re-checks all arithmetic and number words
```
- Class 1 content lives in `tools/banks/class1.py`; run `python3 tools/build_levels.py` then `python3 tools/check_levels.py`.
- Tables up to x20 instead of x10: set `MAX_MULT = 20` in `tools/generate_content.py`.
- After any content change, raise `CONTENT_VERSION` in the same file. Devices then download the new questions and show "New questions!".
- More "Did you know?" facts: add lines to `content/facts.json` (icon + a few words).

## After any app change
Raise `VERSION` in `sw.js` (now `mathquest-v6`) so phones replace the old saved files.

## Test before each release
- Open once online. The badge at the bottom turns green: "Ready offline".
- Turn the network off (Chrome DevTools > Application > Service Workers > Offline), hard reload. The app must still open and play.
- Parent corner (the 👪 button, then solve the sum): Save backup, clear site data, Load backup.
- Lighthouse > PWA audit.

## Files
```
index.html  manifest.webmanifest  sw.js  offline.html  netlify.toml
css/styles.css  privacy.html  docs/
js/app.js (screens and lesson flow)  js/storage.js (progress)  js/audio.js (sounds, read-aloud)
content/index.json  week-01..18.json  facts.json
icons/  tools/
```
