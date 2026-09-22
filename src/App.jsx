import { useMemo, useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import {
  DEFAULT_GOALS,
  MEAL_TYPES,
  dateKey,
  shiftDate,
  formatDateLabel,
  sumEntries,
} from "./lib/nutrition";
import DailySummary from "./components/DailySummary";
import WeeklyChart from "./components/WeeklyChart";
import MealSection from "./components/MealSection";
import AddFoodModal from "./components/AddFoodModal";
import GoalsModal from "./components/GoalsModal";
import "./App.css";

const emptyDay = () => ({ breakfast: [], lunch: [], dinner: [], snacks: [] });

export default function App() {
  const [goals, setGoals] = useLocalStorage("mt.goals", DEFAULT_GOALS);
  const [log, setLog] = useLocalStorage("mt.log", {});
  const [usualFoods, setUsualFoods] = useLocalStorage("mt.usual", []);

  const [day, setDay] = useState(dateKey());
  const [addingMeal, setAddingMeal] = useState(null); // meal object or null
  const [showGoals, setShowGoals] = useState(false);

  const dayData = log[day] || emptyDay();
  const totals = useMemo(
    () => sumEntries(Object.values(dayData).flat()),
    [dayData]
  );

  function addEntry({ food, grams, nutrition }) {
    const mealKey = addingMeal.key;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      food,
      grams,
      nutrition,
    };
    setLog((prev) => {
      const current = prev[day] || emptyDay();
      return {
        ...prev,
        [day]: { ...current, [mealKey]: [...current[mealKey], entry] },
      };
    });
    setAddingMeal(null);
  }

  // Add several parsed items to the current meal at once (used by the
  // AI "describe a meal" flow).
  function addManyEntries(list) {
    const mealKey = addingMeal.key;
    const entries = list.map((item) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      food: item.food,
      grams: item.grams,
      nutrition: item.nutrition,
    }));
    setLog((prev) => {
      const current = prev[day] || emptyDay();
      return {
        ...prev,
        [day]: { ...current, [mealKey]: [...current[mealKey], ...entries] },
      };
    });
    setAddingMeal(null);
  }

  function removeEntry(mealKey, entryId) {
    setLog((prev) => {
      const current = prev[day] || emptyDay();
      return {
        ...prev,
        [day]: {
          ...current,
          [mealKey]: current[mealKey].filter((e) => e.id !== entryId),
        },
      };
    });
  }

  function saveUsual(food) {
    setUsualFoods((prev) => {
      if (prev.some((f) => f.id === food.id)) return prev;
      return [food, ...prev].slice(0, 20);
    });
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo">🍽️</span>
          <h1>Meal Tracker</h1>
        </div>
        <button className="btn btn-ghost" onClick={() => setShowGoals(true)}>
          ⚙️ Goals
        </button>
      </header>

      <div className="date-nav">
        <button className="icon-btn" onClick={() => setDay((d) => shiftDate(d, -1))}>
          ‹
        </button>
        <div className="date-label">{formatDateLabel(day)}</div>
        <button
          className="icon-btn"
          onClick={() => setDay((d) => shiftDate(d, 1))}
          disabled={day >= dateKey()}
        >
          ›
        </button>
      </div>

      <DailySummary totals={totals} goals={goals} />

      <WeeklyChart log={log} endKey={day} goals={goals} />

      <main className="meals">
        {MEAL_TYPES.map((meal) => (
          <MealSection
            key={meal.key}
            meal={meal}
            entries={dayData[meal.key]}
            onAdd={setAddingMeal}
            onRemove={removeEntry}
            onSaveUsual={saveUsual}
          />
        ))}
      </main>

      <footer className="app-footer">
        Nutrition data from{" "}
        <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">
          Open Food Facts
        </a>
        . Estimates only — not medical advice.
      </footer>

      {addingMeal && (
        <AddFoodModal
          mealLabel={addingMeal.label}
          usualFoods={usualFoods}
          onAdd={addEntry}
          onAddMany={addManyEntries}
          onClose={() => setAddingMeal(null)}
        />
      )}
      {showGoals && (
        <GoalsModal
          goals={goals}
          onSave={(g) => {
            setGoals(g);
            setShowGoals(false);
          }}
          onClose={() => setShowGoals(false)}
        />
      )}
    </div>
  );
}
