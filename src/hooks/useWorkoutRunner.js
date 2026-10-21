import { useCallback, useEffect, useRef, useState } from 'react';
import { advance, initialEngineState, skipSegment } from '../lib/session';

const TICK_MS = 100;

/**
 * Drives a prebuilt session in real time. Time is measured with performance.now()
 * deltas so the clock stays accurate even if the tab is throttled; when paused no
 * time accumulates and no events fire.
 *
 * status: 'ready' | 'running' | 'paused' | 'finished'
 */
export function useWorkoutRunner(session, onEvents) {
  const [status, setStatus] = useState('ready');
  const [engine, setEngine] = useState(initialEngineState);
  const engineRef = useRef(engine);
  const lastRef = useRef(0);
  const statusRef = useRef(status);
  const onEventsRef = useRef(onEvents);
  onEventsRef.current = onEvents;

  const commit = useCallback((next) => {
    engineRef.current = next;
    setEngine(next);
  }, []);

  const setStat = useCallback((s) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const tick = useCallback(() => {
    if (statusRef.current !== 'running') return;
    const now = performance.now();
    const dt = (now - lastRef.current) / 1000;
    lastRef.current = now;
    const { state, fired } = advance(session, engineRef.current, dt);
    commit(state);
    if (fired.length) onEventsRef.current?.(fired, state);
    if (state.finished) setStat('finished');
  }, [session, commit, setStat]);

  useEffect(() => {
    if (status !== 'running') return undefined;
    const id = setInterval(tick, TICK_MS);
    const onVis = () => tick();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [status, tick]);

  const start = useCallback(() => {
    lastRef.current = performance.now();
    setStat('running');
    // Fire the events scheduled at t=0 immediately.
    const { state, fired } = advance(session, engineRef.current, 0);
    commit(state);
    if (fired.length) onEventsRef.current?.(fired, state);
  }, [session, commit, setStat]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return;
    tick(); // account for time up to the moment of pausing
    setStat('paused');
  }, [tick, setStat]);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    lastRef.current = performance.now();
    setStat('running');
  }, [setStat]);

  const restart = useCallback(() => {
    commit(initialEngineState());
    setStat('ready');
  }, [commit, setStat]);

  const skip = useCallback(() => {
    const next = skipSegment(session, engineRef.current);
    lastRef.current = performance.now();
    commit(next);
    onEventsRef.current?.([{ type: 'segment', segIndex: next.segIndex, late: 0, skipped: true }], next);
    const { state, fired } = advance(session, next, 0);
    commit(state);
    if (fired.length) onEventsRef.current?.(fired, state);
  }, [session, commit]);

  const finishNow = useCallback(() => {
    if (statusRef.current === 'running') tick();
    setStat('finished');
  }, [tick, setStat]);

  return { status, engine, engineRef, start, pause, resume, restart, skip, finishNow };
}
