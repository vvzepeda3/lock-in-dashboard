export default function SubjectSelect({ subjects, value, onChange, disabled }) {
  const known = subjects.some((s) => s.id === value);

  return (
    <label className="subject-select">
      Subject
      <select
        value={known ? String(value) : ''}
        disabled={disabled}
        onChange={(e) => {
          const subject = subjects.find((s) => String(s.id) === e.target.value);
          onChange(subject ? subject.id : null);
        }}
      >
        <option value="">No subject</option>
        {subjects.map((s) => (
          <option key={s.id} value={String(s.id)}>{s.name}</option>
        ))}
      </select>
    </label>
  );
}
