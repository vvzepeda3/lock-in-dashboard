import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useDataStore } from '../hooks/useDataStore.js';
import { usePomodoro } from '../hooks/usePomodoro.js';
import { useSessions } from '../hooks/useSessions.js';
import { useSubjects } from '../hooks/useSubjects.js';
import { startOfToday } from '../lib/format.js';
import Timer from '../components/Timer.jsx';
import SubjectSelect from '../components/SubjectSelect.jsx';
import SubjectManager from '../components/SubjectManager.jsx';
import TodaySessions from '../components/TodaySessions.jsx';

export default function Dashboard() {
  const { user, isGuest } = useAuth();
  const store = useDataStore();
  const [todayIso] = useState(() => startOfToday().toISOString());

  const { subjects, addSubject, removeSubject, error: subjectsError } = useSubjects(store);
  const { sessions, addSession, error: sessionsError } = useSessions(store, todayIso);

  // Separate timer per identity so a guest timer never logs to an account
  const timer = usePomodoro(`lockin_timer_${isGuest ? 'guest' : user.id}`, {
    onFocusComplete: addSession,
  });

  async function handleRemoveSubject(id) {
    await removeSubject(id);
    if (timer.subjectId === id) timer.setSubject(null);
  }

  return (
    <div className="dashboard">
      {isGuest && <p className="banner">Guest mode: sessions are saved in this browser only.</p>}

      <Timer
        timer={timer}
        subjectName={subjects.find((s) => s.id === timer.subjectId)?.name}
        sessionsToday={sessions.length}
      >
        <SubjectSelect
          subjects={subjects}
          value={timer.subjectId}
          onChange={timer.setSubject}
          disabled={timer.status !== 'idle'}
        />
      </Timer>

      <div className="below">
        <SubjectManager subjects={subjects} onAdd={addSubject} onRemove={handleRemoveSubject} />
        <TodaySessions sessions={sessions} subjects={subjects} error={sessionsError} />
      </div>
      {subjectsError && <p className="error">{subjectsError}</p>}
    </div>
  );
}
