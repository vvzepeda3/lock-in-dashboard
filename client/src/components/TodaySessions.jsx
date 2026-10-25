import { formatMinutes, formatTime } from '../lib/format.js';

export default function TodaySessions({ sessions, subjects, error }) {
  const byId = new Map(subjects.map((s) => [s.id, s]));
  const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);

  return (
    <section className="card">
      <h2>Today</h2>
      <p className="muted">
        {sessions.length} session{sessions.length === 1 ? '' : 's'} · {formatMinutes(totalSeconds)}
      </p>
      {error && <p className="error">{error}</p>}
      <ul className="session-list">
        {sessions.length === 0 && <li className="muted">Nothing yet. Pick a subject and press Start.</li>}
        {sessions.map((s) => {
          const subject = byId.get(s.subjectId);
          return (
            <li key={s.id}>
              <span className="dot" style={{ background: subject?.color ?? 'var(--line)' }} />
              <span className="session-name">
                {subject?.name ?? 'No subject'}
                <small>{formatTime(s.startedAt)} – {formatTime(s.endedAt)}</small>
              </span>
              <b>{formatMinutes(s.durationSeconds)}</b>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
