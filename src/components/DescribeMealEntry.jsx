import { useRef, useState } from "react";
import { parseMealText, hasApiKey } from "../api/gemini";
import { nutritionForGrams } from "../api/openFoodFacts";
import ApiKeySetup from "./ApiKeySetup";

// Describe-a-meal entry: the user types a meal in plain language, an AI parses
// it into items, and the user reviews/edits before adding them all to the log.
// Calls onAddMany(items) with the confirmed items.
export default function DescribeMealEntry({ onAddMany, onClose }) {
  const [needsKey, setNeedsKey] = useState(!hasApiKey());
  const [text, setText] = useState("");
  const [items, setItems] = useState(null); // null = not parsed yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  async function parse() {
    if (text.trim().length < 2) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseMealText(text, { signal: controller.signal });
      if (parsed.length === 0) {
        setError("Couldn't find any foods in that. Try describing it differently.");
      }
      setItems(parsed);
    } catch (e) {
      if (e.name === "AbortError") return;
      if (e.code === "NO_KEY" || e.code === "BAD_KEY") {
        setNeedsKey(true);
        setError(e.code === "BAD_KEY" ? e.message : null);
      } else {
        setError(e.message || "AI parsing failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Recompute an item's nutrition when its grams are edited, using the
  // per-100g profile (same logic as database foods).
  function updateGrams(id, grams) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, grams, nutrition: nutritionForGrams(it, Number(grams) || 0) }
          : it
      )
    );
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function addAll() {
    const ready = items
      .filter((it) => (Number(it.grams) || 0) > 0)
      .map((it) => ({
        food: { id: it.id, name: it.name, per100g: it.per100g },
        grams: Number(it.grams),
        nutrition: it.nutrition,
      }));
    if (ready.length) onAddMany(ready);
  }

  if (needsKey) {
    return (
      <ApiKeySetup
        onSaved={() => {
          setNeedsKey(false);
          setError(null);
        }}
        onClose={onClose}
      />
    );
  }

  const total = items
    ? items.reduce((s, it) => s + (it.nutrition?.calories || 0), 0)
    : 0;

  return (
    <div className="describe-entry">
      {items === null ? (
        <>
          <label className="qty-label">
            Describe your meal
            <textarea
              className="describe-input"
              rows={3}
              placeholder="e.g. 2 scrambled eggs, a slice of toast with butter, and a black coffee"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
          </label>
          {error && <p className="error">{error}</p>}
          <p className="muted photo-hint">
            Your text is sent to Google Gemini to estimate nutrition. You review
            everything before it's added.
          </p>
          <button
            className="btn btn-primary full"
            onClick={parse}
            disabled={loading || text.trim().length < 2}
          >
            {loading ? "Reading your meal…" : "Parse meal →"}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            className="btn btn-ghost back-btn"
            onClick={() => setItems(null)}
          >
            ← Edit description
          </button>

          {error && <p className="error">{error}</p>}

          {items.length > 0 ? (
            <>
              <div className="section-title">
                Review {items.length} item{items.length > 1 ? "s" : ""} · {total} cal total
              </div>
              <ul className="ai-items">
                {items.map((it) => (
                  <li key={it.id} className="ai-item">
                    <div className="ai-item-main">
                      <div className="food-name">{it.name}</div>
                      <div className="food-sub">
                        {it.nutrition.calories} cal · P{it.nutrition.protein} C
                        {it.nutrition.carbs} F{it.nutrition.fat}
                      </div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      className="qty-input ai-grams"
                      value={it.grams}
                      onChange={(e) => updateGrams(it.id, e.target.value)}
                      aria-label={`grams of ${it.name}`}
                    />
                    <span className="ai-unit">g</span>
                    <button
                      className="icon-btn"
                      onClick={() => removeItem(it.id)}
                      aria-label={`Remove ${it.name}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button className="btn btn-primary full" onClick={addAll}>
                Add {items.length} item{items.length > 1 ? "s" : ""} to log
              </button>
            </>
          ) : (
            <p className="muted">No items to add. Go back and try again.</p>
          )}
        </>
      )}
    </div>
  );
}
