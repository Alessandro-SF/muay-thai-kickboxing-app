# Thai Coach

**Train Smarter. Strike Better.**

Thai Coach is a Muay Thai & Kickboxing training web app with two ways to train:

1. **Guided Workouts:** a library of 16 playable sessions with spoken combinations, round and rest timers, progress tracking and Quick Training.
2. **Live AI Coach:** links to the existing Thai Coach AI phone coach at **+1 (561) 813-8430** (`tel:+15618138430`). The app only links to the phone service. It does not run or simulate the AI agent.

## Features

- **Workout library:** 16 workouts across 10 categories, 3 levels and 5–45 minute lengths. You can filter by difficulty, type, length and style, and search. Filters are kept in the URL, so filtered views can be shared.
- **Workout player:** a large countdown with a progress ring, round X / Y, prep, round and rest phases, and a session progress bar. Controls cover pause, resume, restart, skip rest, finish early and mute. It shows a completion summary at the end, keeps the screen awake where the browser supports it, and supports keyboard shortcuts (Space, M).
- **Guided audio:** browser speech synthesis (free, no API) calls out combinations, "Thirty seconds remaining.", rest and get-ready cues. The bell and countdown beeps are tones generated with the Web Audio API. Callouts never overlap, and pausing stops all audio and new callouts. Combinations are always shown on screen.
- **Combination system:** standard 1–6 punch numbering, plus kicks, teeps, knees, elbows, defense, footwork and clinch, with orthodox/southpaw mirroring. Rules are checked by unit tests:
  - a lead-hand finish is followed by a rear kick, and a rear-hand finish by a lead kick
  - no kick straight after an elbow
  - no combination repeats within the last 4 calls
  - no elbows or clinch in Kickboxing
- **Quick Training:** choose style, level, focus, total duration (which sets the number of rounds), round length, rest, number of rounds, stance and audio. The whole session is generated from a seed before the first bell, so it stays the same through pause, resume and restart.
- **My Progress:** completed workouts, sessions, minutes, rounds, current and best streaks, a 7-day chart and recent history. Each session is labelled *Completed*, *Ended early* or *Started — not finished*. New users see an empty state, and no statistics are invented.
- **AI Coach page:** a large phone number, call button, copy-number button (with a fallback), how-it-works steps and notes on call charges.

## Tech stack

React 18, Vite 6, Tailwind CSS 4, React Router 6, Lucide icons, Recharts (lazy-loaded), and Vitest with Testing Library. No backend, no paid APIs and no secrets.

## Project structure

```
src/
  config.js                 phone number + app constants
  data/                     editable content
    techniques.js           technique catalog (orthodox-relative, mirrored for southpaw)
    combos.js               curated combinations per level
    workouts.js             workout library (rounds, timers, focus, equipment)
    categories.js           categories, levels, durations
    audioManifest.js        map callout text → prerecorded MP3 (empty for now)
  lib/
    combos.js               rules, validation, generator, non-repeating picker
    session.js              deterministic session timeline + pure timer engine
    customWorkout.js        Quick Training → workout definition
    audio.js                VoiceCoach: TTS / MP3 clips, synthesized bell & beeps
    storage.js              versioned localStorage (sync-ready records)
    stats.js                progress statistics & streaks
  hooks/                    runner, wake lock, clipboard, store
  pages/                    Home, Workouts, WorkoutDetail, Player, QuickTraining, AICoach, Progress
public/audio, public/video  slots for future recordings & instructional video
tests/                      unit tests (Vitest)
scripts/smoke-test.mjs      end-to-end browser smoke test (Playwright)
```

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run build      # production build → dist/
npm run preview    # serve dist/ on http://localhost:4173
```

End-to-end smoke test. It needs the `playwright` package and a Chromium browser:

```bash
npm run build && npm run preview &
BASE_URL=http://localhost:4173 node scripts/smoke-test.mjs
BASE_URL=https://<your-site>.netlify.app node scripts/smoke-test.mjs   # against production
```

## Adding content

- **A workout:** add an object to `src/data/workouts.js`. Rounds can be `combos` (with focus tags or a fixed `pool`), `tips` (freestyle with coaching tips) or `blocks` (timed intervals). Then run `npm test`. The tests check that every combination follows the rules and that the stated duration matches the actual timeline.
- **Combinations:** add strings of technique ids to `src/data/combos.js`.
- **Prerecorded audio:** put MP3s in `public/audio/` and map the exact callout text in `src/data/audioManifest.js`. The player prefers a clip when one exists and falls back to speech synthesis if it can't play.
- **Video:** put files in `public/video/` and reference them from a workout's `media` field.
- **Accounts and cloud sync:** every stored session already has a stable `id`, timestamps and a `syncedAt` field, and all reads and writes go through `src/lib/storage.js`.

## Deployment (Netlify)

`netlify.toml` configures:

- build command `npm run build`
- publish directory `dist`
- Node 22
- SPA fallback (`/* → /index.html 200`)

`public/_redirects` is included as a backup for the SPA fallback.

To turn on continuous deployment, go to Netlify, choose **Add new site → Import an existing project → GitHub**, and select `Alessandro-SF/muay-thai-kickboxing-app` with branch `main`. The build settings are read from `netlify.toml`. After that, every push to `main` redeploys the site.

## Notes and limitations

- Voice instructions use **synthesized speech** from the browser. No prerecorded recordings are bundled. Voice quality depends on the device and browser.
- Mobile browsers only allow audio after a tap, so the player starts from a **Start** button. iOS may pause speech when the screen locks. Keep the screen on (the app requests a wake lock where it's supported).
- Progress is stored in this browser only. Clearing site data removes it.
- The AI coach is an external phone service. Calling charges and service restrictions may apply.
