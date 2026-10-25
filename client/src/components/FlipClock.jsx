import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

const HALF_MS = 210;

// One card: static top + bottom halves, plus two leaves that fold over them.
// Digits are written straight to the DOM so React re-renders never fight a running animation.
function FlipCard({ value, reduce, children }) {
  const card = useRef(null);
  const staticTop = useRef(null);
  const staticBottom = useRef(null);
  const leafTop = useRef(null);
  const leafBottom = useRef(null);
  const shown = useRef(null);
  const anims = useRef(null);

  useLayoutEffect(() => {
    const old = shown.current;
    if (old === value) return;
    shown.current = value;

    const lt = leafTop.current;
    const lb = leafBottom.current;
    anims.current?.forEach((a) => a.cancel());
    anims.current = null;
    lt.hidden = true;
    lb.hidden = true;

    if (old === null || reduce || !lt.animate || !card.current.offsetParent) {
      staticTop.current.textContent = value;
      staticBottom.current.textContent = value;
      return;
    }

    // New value is revealed on top as the old top leaf falls; old bottom stays until the new leaf lands
    staticTop.current.textContent = value;
    staticBottom.current.textContent = old;
    lt.firstChild.textContent = old;
    lb.firstChild.textContent = value;
    lt.hidden = false;
    lb.hidden = false;

    const fold = lt.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], {
      duration: HALF_MS,
      easing: 'ease-in',
      fill: 'forwards',
    });
    const land = lb.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], {
      duration: HALF_MS,
      delay: HALF_MS,
      easing: 'ease-out',
      fill: 'both',
    });
    anims.current = [fold, land];
    land.onfinish = () => {
      staticBottom.current.textContent = value;
      lt.hidden = true;
      lb.hidden = true;
      anims.current = null;
    };
  }, [value, reduce]);

  useLayoutEffect(() => () => anims.current?.forEach((a) => a.cancel()), []);

  return (
    <div className="flip" ref={card}>
      <div className="half top"><b ref={staticTop} /></div>
      <div className="half bottom"><b ref={staticBottom} /></div>
      <div className="half top leaf-top" ref={leafTop} hidden><b /></div>
      <div className="half bottom leaf-bottom" ref={leafBottom} hidden><b /></div>
      {children}
    </div>
  );
}

const pad = (n) => String(n).padStart(2, '0');

export default function FlipClock({ minutes, seconds, mode, subject, sessionsToday }) {
  const reduce = useReducedMotion();
  const rest = mode !== 'focus';
  const label = `${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${seconds === 1 ? '' : 's'} left`;

  return (
    <div className="clock" role="timer" aria-label={label}>
      <FlipCard value={pad(minutes)} reduce={reduce}>
        <span className="tag tl">{rest ? 'Rest' : 'Focus'}</span>
      </FlipCard>
      <FlipCard value={pad(seconds)} reduce={reduce}>
        <span className="tag tr">{rest ? 'Breathe' : subject || 'No subject'}</span>
        <span className="tag br">{sessionsToday} today</span>
      </FlipCard>
    </div>
  );
}
