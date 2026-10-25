import { useEffect } from 'react';
import { MODES } from '../lib/timerConfig.js';
import { formatClock } from '../lib/format.js';
import { LILAC, PINK } from '../lib/pixel.js';
import FlipClock from './FlipClock.jsx';
import PixelPlanet from './PixelPlanet.jsx';

export default function Timer({ timer, subjectName, sessionsToday, children }) {
  const { mode, status, remainingMs, completedFocus } = timer;
  const clock = formatClock(remainingMs);
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);

  useEffect(() => {
    document.title = status === 'idle' ? 'Lock In' : `${clock} · ${MODES[mode].label}`;
  }, [clock, mode, status]);

  useEffect(() => () => {
    document.title = 'Lock In';
  }, []);

  return (
    <section className={`stage${mode === 'focus' ? '' : ' rest'}`} aria-label="Timer">
      <PixelPlanet className="deco a" size={40} radius={11} pal={PINK} withRing />
      <PixelPlanet className="deco b" size={24} radius={8} pal={LILAC} />

      <div className="modes" role="group" aria-label="Timer mode">
        {Object.entries(MODES).map(([key, { label }]) => (
          <button key={key} aria-pressed={mode === key} onClick={() => timer.setMode(key)}>
            {label}
          </button>
        ))}
      </div>

      <FlipClock
        minutes={Math.floor(totalSeconds / 60)}
        seconds={totalSeconds % 60}
        mode={mode}
        subject={subjectName}
        sessionsToday={sessionsToday}
      />

      {children}

      <div className="ctrls">
        {status === 'running' ? (
          <button className="btn go" onClick={timer.pause}>Pause</button>
        ) : (
          <button className="btn go" onClick={timer.start}>{status === 'paused' ? 'Resume' : 'Start'}</button>
        )}
        <button className="btn" onClick={timer.reset} disabled={status === 'idle'}>Reset</button>
        <button className="btn" onClick={timer.skip}>Skip</button>
      </div>
      <p className="cycle">Pomodoros completed this cycle: {completedFocus}</p>
    </section>
  );
}
