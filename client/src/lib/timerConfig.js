// Run `VITE_FAST_TIMER=1 npm run dev` to make every "minute" a second for testing.
const UNIT_MS = import.meta.env.VITE_FAST_TIMER === '1' ? 1000 : 60 * 1000;

export const MODES = {
  focus: { label: 'Focus', ms: 25 * UNIT_MS },
  short: { label: 'Short break', ms: 5 * UNIT_MS },
  long: { label: 'Long break', ms: 15 * UNIT_MS },
};

export const FOCUS_PER_LONG_BREAK = 4;
