import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePomodoro } from './usePomodoro.js';
import { MODES } from '../lib/timerConfig.js';

const KEY = 'test_timer';

describe('usePomodoro', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('survives a remount (page refresh) while running', () => {
    const first = renderHook(() => usePomodoro(KEY));
    act(() => first.result.current.start());
    act(() => vi.advanceTimersByTime(10 * 60 * 1000));
    first.unmount();

    // "Refresh": 2 more minutes pass while the page is gone
    vi.setSystemTime(Date.now() + 2 * 60 * 1000);
    const second = renderHook(() => usePomodoro(KEY));
    expect(second.result.current.status).toBe('running');
    expect(second.result.current.remainingMs).toBe(MODES.focus.ms - 12 * 60 * 1000);
  });

  it('keeps paused time across a remount', () => {
    const first = renderHook(() => usePomodoro(KEY));
    act(() => first.result.current.start());
    act(() => vi.advanceTimersByTime(60 * 1000));
    act(() => first.result.current.pause());
    first.unmount();

    vi.setSystemTime(Date.now() + 60 * 60 * 1000);
    const second = renderHook(() => usePomodoro(KEY));
    expect(second.result.current.status).toBe('paused');
    expect(second.result.current.remainingMs).toBe(MODES.focus.ms - 60 * 1000);
  });

  it('logs a focus session exactly once, even if it ended while the page was closed', () => {
    const onFocusComplete = vi.fn();
    const first = renderHook(() => usePomodoro(KEY, { onFocusComplete }));
    act(() => first.result.current.setSubject(7));
    act(() => first.result.current.start());
    const startedAt = Date.now();
    first.unmount();

    vi.setSystemTime(startedAt + MODES.focus.ms + 5 * 60 * 1000);
    const second = renderHook(() => usePomodoro(KEY, { onFocusComplete }));
    const third = renderHook(() => usePomodoro(KEY, { onFocusComplete })); // e.g. a second tab

    expect(onFocusComplete).toHaveBeenCalledTimes(1);
    expect(onFocusComplete).toHaveBeenCalledWith({
      subjectId: 7,
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(startedAt + MODES.focus.ms).toISOString(),
      durationSeconds: MODES.focus.ms / 1000,
    });
    expect(second.result.current.mode).toBe('short');
    expect(second.result.current.subjectId).toBe(7);
    third.unmount();
  });

  it('goes to a long break after 4 focus sessions and does not log breaks', () => {
    const onFocusComplete = vi.fn();
    const { result } = renderHook(() => usePomodoro(KEY, { onFocusComplete }));
    for (let i = 0; i < 4; i++) {
      act(() => result.current.start());
      act(() => vi.advanceTimersByTime(MODES[result.current.mode].ms + 500));
      if (i < 3) {
        expect(result.current.mode).toBe('short');
        act(() => result.current.start());
        act(() => vi.advanceTimersByTime(MODES.short.ms + 500));
        expect(result.current.mode).toBe('focus');
      }
    }
    expect(result.current.mode).toBe('long');
    expect(onFocusComplete).toHaveBeenCalledTimes(4);
  });

  it('skip and reset never log a session', () => {
    const onFocusComplete = vi.fn();
    const { result } = renderHook(() => usePomodoro(KEY, { onFocusComplete }));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(60 * 1000));
    act(() => result.current.reset());
    expect(result.current.remainingMs).toBe(MODES.focus.ms);
    act(() => result.current.skip());
    expect(result.current.mode).toBe('short');
    expect(onFocusComplete).not.toHaveBeenCalled();
  });
});
