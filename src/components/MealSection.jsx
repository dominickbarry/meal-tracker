import { sumEntries, round } from "../lib/nutrition";

// One meal (breakfast/lunch/etc) with its entries and an add button.
export default function MealSection({ meal, entries, onAdd, onRemove, onSaveUsual }) {
  const totals = sumEntries(entries);
  return (
    <section className="meal">
      <div className="meal-head">
        <div className="meal-title">
          <span className="meal-icon">{meal.icon}</span>
          <span>{meal.label}</span>
          <span className="meal-cal">{round(totals.calories)} cal</span>
        </div>
        <button className="btn btn-add" onClick={() => onAdd(meal)}>
          + Add food
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="meal-empty">Nothing logged yet.</p>
      ) : (
        <ul className="entry-list">
          {entries.map((e) => (
            <li key={e.id} className="entry">
              <div className="entry-main">
                <div className="entry-name">{e.food.name}</div>
                <div className="entry-sub">
                  {e.grams}g · {e.nutrition.calories} cal · P{e.nutrition.protein} C
                  {e.nutrition.carbs} F{e.nutrition.fat}
                </div>
              </div>
              <div className="entry-actions">
                <button
                  className="icon-btn"
                  title="Save to my usual foods"
                  onClick={() => onSaveUsual(e.food)}
                >
                  ⭐
                </button>
                <button
                  className="icon-btn danger"
                  title="Remove"
                  onClick={() => onRemove(meal.key, e.id)}
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
