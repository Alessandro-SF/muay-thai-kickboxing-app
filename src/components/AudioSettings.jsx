import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Info } from 'lucide-react';
import Segmented from './Segmented';
import { VoiceCoach, listVoices } from '../lib/audio';
import { HAS_PRERECORDED_AUDIO } from '../data/audioManifest';

/** Stance + audio preferences shared by workout detail and Quick Training. */
export default function AudioSettings({ prefs, onChange, showStance = true }) {
  const [voices, setVoices] = useState(() => listVoices());
  const coach = useRef(null);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) return undefined;
    const load = () => setVoices(listVoices());
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', load);
  }, [supported]);

  const testVoice = () => {
    if (!coach.current) coach.current = new VoiceCoach();
    const c = coach.current;
    c.unlock();
    c.configure({ rate: prefs.voiceRate, voiceURI: prefs.voiceURI, sounds: prefs.sounds });
    c.bell('start');
    setTimeout(() => c.speak(prefs.stance === 'southpaw' ? 'Jab, cross, right kick.' : 'Jab, cross, left kick.'), 350);
  };

  return (
    <div className="grid gap-5">
      {showStance && (
        <Segmented
          label="Stance"
          value={prefs.stance}
          onChange={(v) => onChange({ stance: v })}
          options={[
            { value: 'orthodox', label: 'Orthodox (left lead)' },
            { value: 'southpaw', label: 'Southpaw (right lead)' },
          ]}
        />
      )}
      <Segmented
        label="Spoken instructions"
        value={prefs.audio}
        onChange={(v) => onChange({ audio: v })}
        options={[
          { value: true, label: 'Audio on' },
          { value: false, label: 'Audio off (on-screen only)' },
        ]}
      />
      {prefs.audio && (
        <>
          <Segmented
            label="Voice speed"
            value={prefs.voiceRate}
            onChange={(v) => onChange({ voiceRate: v })}
            options={[
              { value: 0.9, label: 'Relaxed' },
              { value: 1.05, label: 'Normal' },
              { value: 1.2, label: 'Fast' },
            ]}
          />
          {voices.length > 1 && (
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white/80">Voice</span>
              <select
                value={prefs.voiceURI}
                onChange={(e) => onChange({ voiceURI: e.target.value })}
                className="rounded-xl border border-white/10 bg-ink-900 px-3 py-3 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">Automatic</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </label>
          )}
          <Segmented
            label="Bell & countdown beeps"
            value={prefs.sounds}
            onChange={(v) => onChange({ sounds: v })}
            options={[
              { value: true, label: 'On' },
              { value: false, label: 'Off' },
            ]}
          />
          <button type="button" onClick={testVoice} className="btn btn-secondary justify-self-start" disabled={!supported}>
            <Volume2 className="h-4 w-4" aria-hidden="true" /> Test voice
          </button>
        </>
      )}
      <p className="flex gap-2 text-xs leading-relaxed text-white/50">
        {supported ? <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <VolumeX className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />}
        <span>
          {supported
            ? `Instructions are spoken by your browser's built-in synthesized voice${HAS_PRERECORDED_AUDIO ? ' (prerecorded clips are used where available)' : ' — no prerecorded recordings are used'}. Bell and beeps are generated tones. Combinations are always shown on screen.`
            : 'Your browser does not support speech synthesis. Combinations will be shown on screen only.'}
        </span>
      </p>
    </div>
  );
}
