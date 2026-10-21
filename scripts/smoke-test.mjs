/**
 * End-to-end smoke test for Thai Coach (Playwright).
 *
 *   BASE_URL=http://localhost:4173 node scripts/smoke-test.mjs
 *   BASE_URL=https://your-site.netlify.app node scripts/smoke-test.mjs
 *
 * Uses Playwright's fake clock to fast-forward workout timers and records every
 * speechSynthesis.speak() call so callouts can be verified without audio output.
 * Requires the `playwright` package (installed globally or locally).
 */
import { chromium } from 'playwright';

const BASE = (process.env.BASE_URL || 'http://localhost:4173').replace(/\/$/, '');
const SHOTS = process.env.SHOT_DIR || '';
const results = [];
let failures = 0;

function check(name, ok, detail = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

const SPEECH_SPY = () => {
  window.__spoken = [];
  window.__cancels = 0;
  if ('speechSynthesis' in window) {
    const synth = window.speechSynthesis;
    const speak = synth.speak.bind(synth);
    const cancel = synth.cancel.bind(synth);
    synth.speak = (u) => {
      if (u.text.trim()) window.__spoken.push({ text: u.text, t: performance.now() });
      try { speak(u); } catch { /* ignore */ }
    };
    synth.cancel = () => { window.__cancels++; try { cancel(); } catch { /* ignore */ } };
  }
};

async function newPage(browser, viewport, errors) {
  const context = await browser.newContext({ viewport, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  await page.addInitScript(SPEECH_SPY);
  return { context, page };
}

const timerSeconds = async (page) => {
  const t = await page.getByTestId('timer').innerText();
  const [m, s] = t.split(':').map(Number);
  return m * 60 + s;
};

async function shot(page, name) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
}

async function noHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];

try {
  // ── Desktop: home, navigation, AI coach ────────────────
  {
    const { context, page } = await newPage(browser, { width: 1366, height: 900 }, errors);
    const res = await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    check('Home responds 200', res.status() === 200, `status ${res.status()}`);
    check('Tagline visible', await page.getByRole('heading', { name: /Train Smarter\.\s*Strike Better\./ }).isVisible());
    check('Start Training button', await page.getByTestId('start-training').isVisible());
    const tels = await page.$$eval('a[href^="tel:"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
    check('All call links use tel:+15618138430', tels.length === 1 && tels[0] === 'tel:+15618138430', tels.join(','));
    check('Phone number displayed', (await page.content()).includes('+1 (561) 813-8430'));
    check('Featured workouts shown', (await page.getByTestId('workout-card').count()) >= 4);
    check('Category links shown', (await page.getByTestId('category-link').count()) === 10);
    await shot(page, 'desktop-home');

    for (const [label, path, heading] of [
      ['Workouts', '/workouts', /Workouts/],
      ['Quick Training', '/quick', /Build your session/],
      ['AI Coach', '/ai-coach', /One Call Away/],
      ['My Progress', '/progress', /Your training/],
      ['Home', '/', /Strike Better/],
    ]) {
      await page.getByRole('navigation', { name: 'Main' }).first().getByRole('link', { name: label, exact: true }).click();
      await page.waitForURL(`${BASE}${path}`);
      const h1 = page.getByRole('heading', { level: 1, name: heading });
      await h1.waitFor({ timeout: 10000 }).catch(() => {});
      check(`Nav → ${label}`, await h1.isVisible());
    }

    await page.goto(`${BASE}/ai-coach`);
    check('AI Coach number', (await page.getByTestId('coach-number').innerText()).trim() === '+1 (561) 813-8430');
    check('AI Coach call href', (await page.getByTestId('call-coach').first().getAttribute('href')) === 'tel:+15618138430');
    await page.getByTestId('copy-number').click();
    await page.waitForTimeout(150);
    const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
    const btnText = await page.getByTestId('copy-number').innerText();
    check('Copy number works', copied === '+1 (561) 813-8430' || /Copied/.test(btnText), `clipboard=${copied} button=${btnText}`);
    await shot(page, 'desktop-ai-coach');

    // Library filtering
    await page.goto(`${BASE}/workouts`);
    const total = await page.getByTestId('workout-card').count();
    check('Library has ≥12 workouts', total >= 12, `${total}`);
    await page.getByTestId('filter-level-beginner').click();
    const beginners = await page.getByTestId('workout-card').count();
    check('Difficulty filter narrows list', beginners > 0 && beginners < total, `${beginners}/${total}`);
    await page.getByTestId('filter-duration-45').click();
    check('Duration filter shows empty state when no match', (await page.getByTestId('workout-card').count()) === 0 && (await page.getByText('No workouts match').isVisible()));
    await page.goto(`${BASE}/workouts?duration=45`);
    check('Duration filter via URL', (await page.getByTestId('workout-card').count()) >= 1);
    await page.goto(`${BASE}/workouts?category=elbows-clinch`);
    check('Category filter via URL', (await page.getByTestId('workout-card').count()) >= 1);
    await context.close();
  }

  // ── Direct deep links (SPA routing) ─────────────────────
  {
    const { context, page } = await newPage(browser, { width: 1280, height: 800 }, errors);
    for (const p of ['/workouts', '/ai-coach', '/quick', '/progress', '/workouts/low-kick-hunter']) {
      const res = await page.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('h1');
      check(`Deep link ${p}`, res.status() === 200);
    }
    await context.close();
  }

  // ── Mobile: player with fake clock ──────────────────────
  {
    const { context, page } = await newPage(browser, { width: 390, height: 844 }, errors);
    await page.clock.install();
    await page.goto(`${BASE}/`);
    check('Mobile home: no horizontal scroll', await noHorizontalScroll(page));
    await shot(page, 'mobile-home');
    for (const p of ['/workouts', '/ai-coach', '/quick', '/progress']) {
      await page.goto(`${BASE}${p}`);
      await page.waitForSelector('h1');
      check(`Mobile ${p}: no horizontal scroll`, await noHorizontalScroll(page));
      await shot(page, `mobile${p.replace('/', '-')}`);
    }
    await page.goto(`${BASE}/progress`);
    await page.getByTestId('progress-empty').waitFor({ timeout: 10000 }).catch(() => {});
    check('Progress empty state for new user', await page.getByTestId('progress-empty').isVisible());

    await page.goto(`${BASE}/play/shadow-warmup-5?audio=1&stance=orthodox&seed=5`);
    await page.getByTestId('begin').click();
    check('Player prep phase', /Get ready/i.test(await page.getByTestId('phase').innerText()));
    const t0 = await timerSeconds(page);
    check('Prep countdown starts at 0:10', t0 === 10, `${t0}`);
    await page.clock.runFor(5000);
    const t1 = await timerSeconds(page);
    check('Timer counts down', t1 === 5, `${t1}`);
    await page.clock.runFor(6000);
    check('Round 1 starts after prep', /Fight/i.test(await page.getByTestId('phase').innerText()) && /Round 1 \/ 3/i.test(await page.getByTestId('round-indicator').innerText()));
    await shot(page, 'mobile-player-round1');

    // Pause: timer and callouts must stop.
    await page.getByTestId('pause-resume').click();
    const pausedAt = await timerSeconds(page);
    const spokenBefore = await page.evaluate(() => window.__spoken.length);
    await page.clock.runFor(15000);
    check('Pause freezes timer', (await timerSeconds(page)) === pausedAt, `${pausedAt}`);
    check('Pause stops new callouts', (await page.evaluate(() => window.__spoken.length)) === spokenBefore);
    check('Paused label', /Paused/i.test(await page.getByTestId('phase').innerText()));
    await page.getByTestId('pause-resume').click();
    await page.clock.runFor(3000);
    const resumed = await timerSeconds(page);
    check('Resume continues countdown', resumed === pausedAt - 3, `${pausedAt} → ${resumed}`);

    // Run through round 1 → rest.
    await page.clock.runFor((resumed + 1) * 1000);
    check('Rest period after round', /Rest/i.test(await page.getByTestId('phase').innerText()));
    await shot(page, 'mobile-player-rest');
    await page.getByTestId('skip').click();
    check('Skip rest → round 2', /Round 2 \/ 3/i.test(await page.getByTestId('round-indicator').innerText()));
    await page.clock.runFor(10000);
    check('Combination shown on screen', await page.getByTestId('combo').isVisible());
    await shot(page, 'mobile-player-combo');

    // Mute stops speech.
    await page.getByTestId('mute').click();
    const mutedCount = await page.evaluate(() => window.__spoken.length);
    await page.clock.runFor(15000);
    check('Mute stops spoken callouts', (await page.evaluate(() => window.__spoken.length)) === mutedCount);
    check('Combos still shown while muted', await page.getByTestId('combo').isVisible());
    await page.getByTestId('mute').click();

    // Finish the remaining session.
    await page.clock.runFor(400000);
    check('Completion screen', (await page.getByTestId('summary-title').innerText()).toLowerCase().includes('workout complete'));
    await shot(page, 'mobile-summary');

    const spoken = await page.evaluate(() => window.__spoken.map((s) => s.text));
    const has = (re) => spoken.some((s) => re.test(s));
    check('Spoke prep cue', has(/^Get ready\. Round one/));
    check('Spoke round start', has(/^Round 1\./));
    check('Spoke combinations', spoken.filter((s) => /,|^(Jab|Cross|Left|Right)/.test(s)).length >= 5, `${spoken.length} callouts`);
    check('Spoke "Thirty seconds remaining."', has(/^Thirty seconds remaining\.$/));
    check('Spoke rest cue', has(/^Round complete\. Rest for 20 seconds\.$/));
    check('Spoke completion', has(/Workout complete/));
    // Each speak() is preceded by cancel(): never two utterances at once.
    const cancels = await page.evaluate(() => window.__cancels);
    check('Every callout cancels the previous one (no overlap)', cancels >= spoken.length, `${cancels} cancels / ${spoken.length} speaks`);

    await page.goto(`${BASE}/progress`);
    await page.getByTestId('history').waitFor({ timeout: 10000 }).catch(() => {});
    check('Completed workout recorded', (await page.getByTestId('history').innerText()).includes('Completed'));
    check('Stats show 1 completed', /Completed\s*1/i.test(await page.getByTestId('progress-stats').innerText()));
    await shot(page, 'mobile-progress');

    // Ended-early flow.
    await page.goto(`${BASE}/play/jab-cross-foundations?audio=0`);
    await page.getByTestId('begin').click();
    await page.clock.runFor(30000);
    await page.getByTestId('finish').click();
    await page.getByTestId('confirm').click();
    check('Finish early → summary', /Session ended/i.test(await page.getByTestId('summary-title').innerText()));
    check('Audio off → no speech', (await page.evaluate(() => window.__spoken.length)) === 0);
    await page.goto(`${BASE}/progress`);
    await page.getByTestId('history').waitFor({ timeout: 10000 }).catch(() => {});
    check('Ended-early recorded distinctly', (await page.getByTestId('history').innerText()).includes('Ended early'));

    // Quick training.
    await page.goto(`${BASE}/quick`);
    await page.getByRole('radio', { name: 'Kickboxing' }).click();
    await page.getByRole('radio', { name: 'Advanced' }).click();
    await page.getByRole('radio', { name: '10 min' }).click();
    check('Quick: duration sets rounds', (await page.getByTestId('rounds-value').innerText()) === '3');
    await page.getByTestId('quick-start').click();
    await page.waitForURL(/\/play\/quick\?/);
    await page.getByTestId('begin').click();
    await page.clock.runFor(30000);
    check('Quick session plays', await page.getByTestId('combo').isVisible());
    const qs = await page.evaluate(() => window.__spoken.map((s) => s.text));
    check('Kickboxing quick session has no elbows', !qs.some((s) => /elbow|clinch/i.test(s)));
    await context.close();
  }
} catch (e) {
  check('Unexpected exception', false, e.stack || String(e));
} finally {
  await browser.close();
}

check('No runtime errors', errors.length === 0, errors.slice(0, 5).join(' | '));
console.log(results.join('\n'));
console.log(`\n${results.length - failures}/${results.length} checks passed against ${BASE}`);
process.exit(failures ? 1 : 0);
