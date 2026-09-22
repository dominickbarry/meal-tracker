import { round } from "../lib/nutrition";

// Top card showing totals vs. goals with progress bars.
export default function DailySummary({ totals, goals }) {
  const items = [
    { key: "calories", label: "Calories", unit: "", color: "#22c55e" },
    { key: "protein", label: "Protein", unit: "g", color: "#3b82f6" },
    { key: "carbs", label: "Carbs", unit: "g", color: "#f59e0b" },
    { key: "fat", label: "Fat", unit: "g", color: "#ef4444" },
  ];

  return (
    <div className="summary-card">
      <div className="cal-ring-row">
        <div className="cal-big">
          <span className="cal-num">{round(totals.calories)}</span>
          <span className="cal-goal">/ {goals.calories} cal</span>
        </div>
        <div className="cal-remaining">
          {goals.calories - round(totals.calories) >= 0
            ? `${goals.calories - round(totals.calories)} left`
            : `${round(totals.calories) - goals.calories} over`}
        </div>
      </div>
      <div className="bars">
        {items.map((it) => {
          const value = round(totals[it.key]);
          const goal = goals[it.key] || 1;
          const pct = Math.min(100, (value / goal) * 100);
          return (
            <div className="bar-row" key={it.key}>
              <div className="bar-label">
                <span>{it.label}</span>
                <span className="bar-values">
                  {value}
                  {it.unit} / {goal}
                  {it.unit}
                </span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${pct}%`, background: it.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
