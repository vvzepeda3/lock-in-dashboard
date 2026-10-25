import { useCallback, useEffect, useRef, useState } from 'react';
import { FOCUS_PER_LONG_BREAK, MODES } from '../lib/timerConfig.js';

// Timer state lives in localStorage and is the source of truth. While running
// we store the absolute end timestamp (endAt), so a refresh or closed tab
// just recomputes the remaining time, and a timer that ended while the page
// was closed is completed (and logged) on the next load.

function freshState(mode, { completedFocus = 0, subjectId = null } = {}) {
  return {
    mode,
    status: 'idle', // idle | running | paused
    totalMs: MODES[mode].ms,
    remainingMs: MODES[mode].ms,
    endAt: null,
    startedAt: null,
    completedFocus,
    subjectId,
  };
}

function load(key) {
  try {
    const s = JSON.parse(localStorage.getItem(key));
    if (s && MODES[s.mode] && ['idle', 'running', 'paused'].includes(s.status)) return s;
  } catch {
    /* fall through */
  }
  return freshState('focus');
}

function nextMode(state) {
  if (state.mode !== 'focus') return { mode: 'focus', completedFocus: state.completedFocus };
  const completedFocus = state.completedFocus + 1;
  return {
    mode: completedFocus % FOCUS_PER_LONG_BREAK === 0 ? 'long' : 'short',
    completedFocus,
  };
}

export function usePomodoro(storageKey, { onFocusComplete } = {}) {
  const [state, setState] = useState(() => load(storageKey));
  const [now, setNow] = useState(() => Date.now());
  const onCompleteRef = useRef(onFocusComplete);

  useEffect(() => {
    onCompleteRef.current = onFocusComplete;
  });

  // Every transition reads the latest stored state and writes synchronously,
  // which keeps completion idempotent (StrictMode double effects, multiple tabs).
  const update = useCallback(
    (fn) => {
      const current = load(storageKey);
      const next = fn(current, Date.now());
      if (next === current) return current;
      localStorage.setItem(storageKey, JSON.stringify(next));
      setState(next);
      return current;
    },
    [storageKey],
  );

  const tick = useCallback(() => {
    let finished = null;
    update((s, t) => {
      if (s.status !== 'running' || t < s.endAt) return s;
      finished = s;
      const { mode, completedFocus } = nextMode(s);
      return freshState(mode, { completedFocus, subjectId: s.subjectId });
    });
    if (finished?.mode === 'focus') {
      onCompleteRef.current?.({
        subjectId: finished.subjectId,
        startedAt: new Date(finished.startedAt).toISOString(),
        endedAt: new Date(finished.endAt).toISOString(),
        durationSeconds: Math.round(finished.totalMs / 1000),
      });
    }
    setNow(Date.now());
  }, [update]);

  useEffect(() => {
    tick();
    if (state.status !== 'running') return undefined;
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [state.status, tick]);

  // Keep multiple tabs in sync
  useEffect(() => {
    const onStorage = (e) => e.key === storageKey && setState(load(storageKey));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey]);

  const start = useCallback(
    () =>
      update((s, t) =>
        s.status === 'running'
          ? s
          : { ...s, status: 'running', endAt: t + s.remainingMs, startedAt: s.startedAt ?? t },
      ),
    [update],
  );

  const pause = useCallback(
    () =>
      update((s, t) =>
        s.status !== 'running' ? s : { ...s, status: 'paused', remainingMs: Math.max(0, s.endAt - t), endAt: null },
      ),
    [update],
  );

  const reset = useCallback(() => update((s) => freshState(s.mode, s)), [update]);

  const skip = useCallback(
    () =>
      update((s) => {
        // Skipping doesn't log a session or count toward the long break
        const mode = s.mode === 'focus' ? 'short' : 'focus';
        return freshState(mode, s);
      }),
    [update],
  );

  const setMode = useCallback(
    (mode) => update((s) => (s.mode === mode && s.status === 'idle' ? s : freshState(mode, s))),
    [update],
  );

  const setSubject = useCallback(
    (subjectId) => update((s) => (s.subjectId === subjectId ? s : { ...s, subjectId })),
    [update],
  );

  const remainingMs = state.status === 'running' ? Math.max(0, state.endAt - now) : state.remainingMs;

  return { ...state, remainingMs, start, pause, reset, skip, setMode, setSubject };
}
