import { useState } from "react";

// Editable daily calorie + macro goals.
export default function GoalsModal({ goals, onSave, onClose }) {
  const [form, setForm] = useState(goals);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: Number(value) || 0 }));
  }

  const fields = [
    { key: "calories", label: "Calories", unit: "cal" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "carbs", label: "Carbs", unit: "g" },
    { key: "fat", label: "Fat", unit: "g" },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Daily goals</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="muted">
          Default is 2500 cal (lightly active, 6'1" / 150 lbs). Adjust to fit you.
        </p>
        <div className="goals-grid">
          {fields.map((f) => (
            <label key={f.key} className="goal-field">
              <span>{f.label}</span>
              <div className="goal-input-wrap">
                <input
                  type="number"
                  min="0"
                  value={form[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                />
                <span className="unit">{f.unit}</span>
              </div>
            </label>
          ))}
        </div>
        <button className="btn btn-primary full" onClick={() => onSave(form)}>
          Save goals
        </button>
      </div>
    </div>
  );
}
