// Default daily goals. Calorie target set to 2500 (user-specified).
// Macro split: ~30% protein, ~45% carbs, ~25% fat at 2500 kcal.
// protein/carbs = 4 kcal/g, fat = 9 kcal/g.
export const DEFAULT_GOALS = {
  calories: 2500,
  protein: 185, // ~30% of 2500
  carbs: 280, // ~45% of 2500
  fat: 70, // ~25% of 2500
};

export const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", icon: "🌅" },
  { key: "lunch", label: "Lunch", icon: "🥗" },
  { key: "dinner", label: "Dinner", icon: "🍽️" },
  { key: "snacks", label: "Snacks", icon: "🍎" },
];

// Local date key: YYYY-MM-DD in the user's timezone.
export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDate(key, deltaDays) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return dateKey(dt);
}

export function formatDateLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const today = dateKey();
  const yesterday = shiftDate(today, -1);
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function sumEntries(entries = []) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.nutrition.calories || 0),
      protein: acc.protein + (e.nutrition.protein || 0),
      carbs: acc.carbs + (e.nutrition.carbs || 0),
      fat: acc.fat + (e.nutrition.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function round(v) {
  return Math.round(v);
}


// Short weekday label for a date key, e.g. "Mon".
export function weekdayShort(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
  });
}

// Build totals for the 7-day window ending on `endKey` (inclusive).
// Returns oldest -> newest so the chart reads left to right.
export function weeklyTotals(log, endKey) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const key = shiftDate(endKey, -i);
    const day = log[key];
    const entries = day ? Object.values(day).flat() : [];
    days.push({
      key,
      isToday: key === dateKey(),
      totals: sumEntries(entries),
    });
  }
  return days;
}
