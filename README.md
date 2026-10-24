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

## Changing the content
Questions are made by a script so every answer is computed, not typed.
```
python3 tools/generate_content.py   # rebuilds content/*.json
python3 tools/check_content.py      # re-checks all arithmetic and number words
```
- Tables up to x20 instead of x10: set `MAX_MULT = 20` in `tools/generate_content.py`.
- After any content change, raise `CONTENT_VERSION` in the same file. Devices then download the new questions and show "New questions!".
- More "Did you know?" facts: add lines to `content/facts.json` (icon + a few words).

## After any app change
Raise `VERSION` in `sw.js` (for example `mathquest-v2`) so phones replace the old saved files.

## Test before each release
- Open once online. The badge at the bottom turns green: "Ready offline".
- Turn the network off (Chrome DevTools > Application > Service Workers > Offline), hard reload. The app must still open and play.
- Parent corner (the 👪 button, then solve the sum): Save backup, clear site data, Load backup.
- Lighthouse > PWA audit.

## Files
```
index.html  manifest.webmanifest  sw.js  offline.html  netlify.toml
css/styles.css
js/app.js (screens and lesson flow)  js/storage.js (progress)  js/audio.js (sounds, read-aloud)
content/index.json  week-01..18.json  facts.json
icons/  tools/
```
