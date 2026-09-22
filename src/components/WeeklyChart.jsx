import { useState } from "react";
import { weeklyTotals, weekdayShort, round } from "../lib/nutrition";

const METRICS = [
  { key: "calories", label: "Calories", unit: "", color: "#22c55e" },
  { key: "protein", label: "Protein", unit: "g", color: "#3b82f6" },
  { key: "carbs", label: "Carbs", unit: "g", color: "#f59e0b" },
  { key: "fat", label: "Fat", unit: "g", color: "#ef4444" },
];

// 7-day bar chart. Defaults to calories; toggle to view a macro instead.
export default function WeeklyChart({ log, endKey, goals }) {
  const [metric, setMetric] = useState("calories");
  const days = weeklyTotals(log, endKey);
  const active = METRICS.find((m) => m.key === metric);
  const goal = goals[metric] || 0;

  const values = days.map((d) => round(d.totals[metric]));
  // Scale so bars and the goal line both fit, with a little headroom.
  const max = Math.max(goal, ...values, 1) * 1.1;

  const logged = values.filter((v) => v > 0);
  const avg = logged.length
    ? round(logged.reduce((a, b) => a + b, 0) / logged.length)
    : 0;

  return (
    <div className="week-card">
      <div className="week-head">
        <div className="week-title">
          <span>📈 Last 7 days</span>
          <span className="week-avg">
            avg {avg}
            {active.unit} / day
          </span>
        </div>
        <div className="metric-toggle">
          {METRICS.map((m) => (
            <button
              key={m.key}
              className={`metric-btn ${metric === m.key ? "active" : ""}`}
              style={metric === m.key ? { background: m.color, color: "#07110a" } : undefined}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="week-chart">
        <div className="week-plot">
          {goal > 0 && goal <= max && (
            <div
              className="goal-line"
              style={{ bottom: `${(goal / max) * 100}%` }}
              title={`Goal: ${goal}${active.unit}`}
            >
              <span className="goal-line-label">goal {goal}{active.unit}</span>
            </div>
          )}
        </div>
        {days.map((d) => {
          const value = round(d.totals[metric]);
          const heightPct = (value / max) * 100;
          const overGoal = goal > 0 && value > goal;
          return (
            <div className="week-col" key={d.key}>
              <div className="week-bar-track">
                {value > 0 && (
                  <div
                    className="week-bar"
                    style={{
                      height: `${Math.max(heightPct, 2)}%`,
                      background: active.color,
                      opacity: overGoal ? 1 : 0.85,
                    }}
                    title={`${value}${active.unit}`}
                  >
                    <span className="week-bar-value">{value}</span>
                  </div>
                )}
              </div>
              <div className={`week-day ${d.isToday ? "is-today" : ""}`}>
                {d.isToday ? "Today" : weekdayShort(d.key)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
