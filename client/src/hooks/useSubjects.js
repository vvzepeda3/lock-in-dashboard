import { useCallback, useEffect, useState } from 'react';

export function useSubjects(store) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    store
      .listSubjects()
      .then((list) => !cancelled && setSubjects(list))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [store]);

  const addSubject = useCallback(
    async (name, color) => {
      const subject = await store.createSubject({ name, color });
      setSubjects((prev) =>
        [...prev, subject].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
      );
      return subject;
    },
    [store],
  );

  const removeSubject = useCallback(
    async (id) => {
      await store.deleteSubject(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    },
    [store],
  );

  return { subjects, loading, error, addSubject, removeSubject };
}
