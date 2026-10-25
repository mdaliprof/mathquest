# Security and legal review (v4: class ladder Pre-School to Class 4)
Update: content now comes from content/levels (387 questions, all marked unverified, sources in docs/SYLLABUS_RESEARCH.md). Same security results; re-tested. ICSE is used only to say which school syllabus topics were followed; the app is not affiliated with or endorsed by CISCE.
Status: reviewed 25 Oct 2026. Published after the owner's go-ahead. No security blockers. Content is still marked UNVERIFIED until the owner checks it against the school books (see docs/CLASS1_REVIEW.md).

## Security: no blockers found
| Check | Result |
|---|---|
| innerHTML / eval / document.write in app code | None. All text is set with textContent. |
| Outside web addresses in app files | None. No ads, trackers, fonts or scripts from other sites. |
| Network calls | Only to the app's own /content files. |
| Camera, microphone, location | Not used. Blocked by Permissions-Policy on Netlify. |
| Content Security Policy | Same site only. `style-src 'unsafe-inline'` kept because pictures use inline style (low risk: no user text is ever put into HTML). |
| Backup file import | Sanitized. Tested with a hostile file: bad topics, huge numbers, fake subjects and script text were all dropped. |
| What is stored | Nickname (12 letters max), animal avatar, scores. Only on the device. Nothing is sent anywhere. |
| Sharing | Shares only the app link. |

## Legal and content
1. **ASK - Facts need a human check.** All 165 subject questions were written by Claude from basic, widely taught facts (no exam papers copied, no olympiad names used). Project rule: never invent curriculum facts. Please read them, especially India GK (flag, national animal/bird, 15 Aug, 26 Jan) and Social Science, and say if your board (CBSE/ICSE/state) words anything differently. Files: tools/banks/*.py.
2. **DONE - Privacy notice.** privacy.html is written (plain words, linked from the footer and Parent corner, works offline). The page has no contact line (a placeholder was removed so nothing unfinished is public); add one if you want. Original note: The app collects no personal data, so child-privacy laws (COPPA, GDPR-K, India DPDP) are not triggered by the app itself. Before a public launch, add a short plain "Privacy" page saying: no accounts, no tracking, data stays on the device, Netlify hosting may keep ordinary server logs. Say if you want me to write it.
3. No trademark risk: "Olympiad" is used only as a general word. SOF, IMO, NSO, IEO and similar names are NOT used and the app does not claim to match any of them.
4. The fox "Pip", the emoji pictures and all text are original or system emoji. No third-party images or fonts.
5. The mock test is practice only. The app does not promise exam results.

## Test run (simulated browser; a real-phone check is still advised)
- Old course: all 90 days played, all trophies, install, share, back button, file:// mode, offline service worker: PASS.
- New: 6 subjects x 8-question rounds, weak spots, 20-question mock (one try each), timer start and stop, offline and file:// loading, hostile import: PASS (21/21).
- Content checkers: 900 math questions OK; 200 subject questions OK (math puzzles re-solved independently).
- NOT done: a real phone or desktop browser check. Please open it on your phone before going live.

## v5 additions
- Privacy page added (privacy.html). It makes factual claims (no accounts, no trackers, nothing leaves the device, Netlify logs). Those are true for this code today; re-check if features change.
- New stored values: per-topic last-10 results (0/1 only), class, an 'all open' switch. All sanitized on import (tested with hostile input).
- The Class 1 topics follow NCERT chapter titles (official) and ICSE school lists (secondary). 'NCERT' and 'ICSE' are used only to say which topics were followed. No NCERT text or pictures are copied. App is not affiliated with NCERT, CISCE or any school.
- Olympiad Challenge questions are original, computed or hand-written; no real exam papers, names or logos. They are described as 'olympiad-style' practice only.
- Old unused subject files were removed from the repo (never published).
