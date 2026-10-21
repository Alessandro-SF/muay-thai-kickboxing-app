/**
 * Prerecorded audio manifest.
 *
 * Thai Coach currently ships with NO prerecorded voice recordings: every spoken
 * instruction is produced by the browser's built-in speech synthesis.
 *
 * To add real recordings later, drop MP3 files in /public/audio and map the exact
 * callout text (as produced by lib/combos.js → spokenCombo, or a cue string from
 * lib/session.js) to the file path, e.g.:
 *
 *   'Jab, cross, left hook.': '/audio/jab-cross-left-hook.mp3',
 *   'Thirty seconds remaining.': '/audio/thirty-seconds.mp3',
 *
 * The player automatically prefers a mapped clip and falls back to speech
 * synthesis if the file fails to load.
 */
export const AUDIO_CLIPS = {};

export const HAS_PRERECORDED_AUDIO = Object.keys(AUDIO_CLIPS).length > 0;
