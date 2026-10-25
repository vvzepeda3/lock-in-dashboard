import { useMemo } from 'react';
import { useDataStore } from '../hooks/useDataStore.js';
import { useSessions } from '../hooks/useSessions.js';
import { useSubjects } from '../hooks/useSubjects.js';
import { formatMinutes, startOfToday } from '../lib/format.js';
import OrbitPanel from '../components/OrbitPanel.jsx';

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

function summarize(sessions, subjects) {
  const byDay = new Map();
  const bySubject = new Map();
  for (const s of sessions) {
    const key = dayKey(new Date(s.endedAt));
    byDay.set(key, (byDay.get(key) ?? 0) + s.durationSeconds);
    if (s.subjectId != null) bySubject.set(s.subjectId, (bySubject.get(s.subjectId) ?? 0) + s.durationSeconds);
  }

  const today = startOfToday();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6);
    return {
      key: dayKey(d),
      label: d.toLocaleDateString([], { weekday: 'short' }),
      minutes: Math.round((byDay.get(dayKey(d)) ?? 0) / 60),
      today: i === 6,
    };
  });

  // A streak still counts if today has nothing yet but yesterday did
  let streak = 0;
  let cursor = byDay.has(dayKey(today)) ? today : addDays(today, -1);
  while (byDay.has(dayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  return {
    week,
    streak,
    todaySeconds: byDay.get(dayKey(today)) ?? 0,
    weekSeconds: week.reduce((sum, d) => sum + d.minutes * 60, 0),
    planets: subjects.map((s) => ({ ...s, minutes: Math.round((bySubject.get(s.id) ?? 0) / 60) })),
  };
}

export default function Stats() {
  const store = useDataStore();
  const { subjects, error: subjectsError } = useSubjects(store);
  // No "from": the streak and planet sizes need the full history
  const { sessions, error: sessionsError } = useSessions(store, undefined);
  const stats = useMemo(() => summarize(sessions, subjects), [sessions, subjects]);

  const maxDay = Math.max(25, ...stats.week.map((d) => d.minutes));
  const maxPlanet = Math.max(1, ...stats.planets.map((p) => p.minutes));
  const chartLabel = `Minutes per day, last 7 days: ${stats.week.map((d) => `${d.label} ${d.minutes}`).join(', ')}`;

  return (
    <div className="stats">
      <OrbitPanel subjects={stats.planets} />

      <div className="kpis">
        <div className="kpi"><b>{formatMinutes(stats.todaySeconds)}</b><span>studied today</span></div>
        <div className="kpi"><b>{stats.streak}</b><span>day streak</span></div>
        <div className="kpi"><b>{formatMinutes(stats.weekSeconds)}</b><span>last 7 days</span></div>
      </div>

      {(sessionsError || subjectsError) && <p className="error">{sessionsError || subjectsError}</p>}

      <div className="two">
        <section className="card">
          <h2>Minutes per day</h2>
          <div className="bars" role="img" aria-label={chartLabel}>
            {stats.week.map((d) => (
              <div key={d.key} className={`bar${d.today ? ' today' : ''}`} aria-hidden="true">
                <span>{d.minutes || ''}</span>
                <i style={{ height: `${Math.round((d.minutes / maxDay) * 150)}px` }} />
              </div>
            ))}
          </div>
          <div className="days" aria-hidden="true">
            {stats.week.map((d) => <span key={d.key}>{d.label}</span>)}
          </div>
        </section>

        <section className="card">
          <h2>Your planets</h2>
          {stats.planets.length === 0 ? (
            <p className="muted">Add a subject on the timer page and it becomes a planet here.</p>
          ) : (
            <ul className="rows">
              {stats.planets.map((p) => (
                <li key={p.id}>
                  <div className="row-top">
                    <span className="dot" style={{ background: p.color }} />
                    <span>{p.name}</span>
                    <em>{formatMinutes(p.minutes * 60)}</em>
                  </div>
                  <div className="track">
                    <div className="fill" style={{ width: `${Math.round((p.minutes / maxPlanet) * 100)}%`, background: p.color }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
