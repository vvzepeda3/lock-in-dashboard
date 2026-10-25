import { useState } from 'react';

// Pastel planet colors that read on white and shade nicely in the orbit panel
const PALETTE = ['#ff8fba', '#b9a0ff', '#ffc861', '#ff9f87', '#7fcfb8', '#8fb8ff'];

export default function SubjectManager({ subjects, onAdd, onRemove }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await onAdd(name, color);
      setName('');
      setColor(PALETTE[(subjects.length + 1) % PALETTE.length]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(subject) {
    if (!window.confirm(`Delete "${subject.name}"? Past sessions keep their time but lose the tag.`)) return;
    try {
      await onRemove(subject.id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card">
      <h2>Subjects</h2>
      {subjects.length === 0 && <p className="muted">No subjects yet. Add one below.</p>}
      <ul className="chips">
        {subjects.map((s) => (
          <li key={s.id} className="chip">
            <span className="dot" style={{ background: s.color }} />
            {s.name}
            <button className="chip-x" aria-label={`Delete ${s.name}`} onClick={() => handleRemove(s)}>×</button>
          </li>
        ))}
      </ul>
      <form className="add-form" onSubmit={handleSubmit}>
        <input
          placeholder="New subject (e.g. Calculus)"
          aria-label="New subject"
          value={name}
          maxLength={50}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Subject color" />
        <button className="btn" type="submit">Add</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
