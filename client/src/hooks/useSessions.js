import { useCallback, useEffect, useState } from 'react';

export function useSessions(store, from) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    store
      .listSessions({ from })
      .then((list) => !cancelled && setSessions(list))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [store, from]);

  const addSession = useCallback(
    async (payload) => {
      try {
        const session = await store.createSession(payload);
        setSessions((prev) => [session, ...prev]);
        setError('');
      } catch (err) {
        setError(`Couldn't save session: ${err.message}`);
      }
    },
    [store],
  );

  return { sessions, loading, error, addSession };
}
