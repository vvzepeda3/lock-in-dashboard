// Two interchangeable stores with the same async interface:
// the API (logged-in users) and localStorage (guests).
import { api } from './api.js';

export function createApiStore() {
  return {
    listSubjects: async () => (await api('/subjects')).subjects,
    createSubject: async ({ name, color }) =>
      (await api('/subjects', { method: 'POST', body: { name, color } })).subject,
    deleteSubject: async (id) => {
      await api(`/subjects/${id}`, { method: 'DELETE' });
    },
    listSessions: async ({ from } = {}) =>
      (await api(`/sessions${from ? `?from=${encodeURIComponent(from)}` : ''}`)).sessions,
    createSession: async (session) =>
      (await api('/sessions', { method: 'POST', body: session })).session,
  };
}

const SUBJECTS_KEY = 'lockin_guest_subjects';
const SESSIONS_KEY = 'lockin_guest_sessions';

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? [];
  } catch {
    return [];
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export function createLocalStore() {
  return {
    listSubjects: async () =>
      read(SUBJECTS_KEY).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),

    createSubject: async ({ name, color }) => {
      const trimmed = name.trim();
      if (!trimmed || trimmed.length > 50) throw new Error('Subject name must be 1-50 characters');
      const subjects = read(SUBJECTS_KEY);
      if (subjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
        throw new Error('You already have a subject with that name');
      }
      const subject = { id: crypto.randomUUID(), name: trimmed, color, createdAt: new Date().toISOString() };
      write(SUBJECTS_KEY, [...subjects, subject]);
      return subject;
    },

    deleteSubject: async (id) => {
      write(SUBJECTS_KEY, read(SUBJECTS_KEY).filter((s) => s.id !== id));
      // Mirror the DB's ON DELETE SET NULL
      write(
        SESSIONS_KEY,
        read(SESSIONS_KEY).map((s) => (s.subjectId === id ? { ...s, subjectId: null } : s)),
      );
    },

    listSessions: async ({ from } = {}) => {
      const fromMs = from ? new Date(from).getTime() : -Infinity;
      return read(SESSIONS_KEY)
        .filter((s) => new Date(s.endedAt).getTime() >= fromMs)
        .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt));
    },

    createSession: async ({ subjectId = null, startedAt, endedAt, durationSeconds }) => {
      const session = { id: crypto.randomUUID(), subjectId, startedAt, endedAt, durationSeconds };
      write(SESSIONS_KEY, [...read(SESSIONS_KEY), session]);
      return session;
    },
  };
}
