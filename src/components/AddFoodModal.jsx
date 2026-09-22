import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { searchFoods, lookupBarcode, nutritionForGrams } from "../api/openFoodFacts";

// Lazy-load the scanner so the heavy ZXing barcode library only downloads
// when the user actually opens the camera.
const BarcodeScanner = lazy(() => import("./BarcodeScanner"));

// Modal for finding a food (search or barcode) and adding it to a meal.
export default function AddFoodModal({ mealLabel, usualFoods, onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState(null); // food pending quantity
  const [grams, setGrams] = useState(100);

  const abortRef = useRef(null);

  // Debounced search-as-you-type.
  useEffect(() => {
    if (selected || scanning) return;
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const found = await searchFoods(query, { signal: controller.signal });
        setResults(found);
        if (found.length === 0) setError("No matches found. Try another name.");
      } catch (e) {
        if (e.name !== "AbortError") setError("Search failed. Check your connection.");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query, selected, scanning]);

  async function handleBarcode(code) {
    setScanning(false);
    setLoading(true);
    setError(null);
    try {
      const food = await lookupBarcode(code);
      if (!food) {
        setError(`No product found for barcode ${code}. Try searching by name.`);
      } else {
        pickFood(food);
      }
    } catch {
      setError("Barcode lookup failed. Try searching by name.");
    } finally {
      setLoading(false);
    }
  }

  function pickFood(food) {
    setSelected(food);
    setGrams(food.servingSize || 100);
  }

  function confirmAdd() {
    if (!selected) return;
    const g = Number(grams) || 0;
    onAdd({
      food: selected,
      grams: g,
      nutrition: nutritionForGrams(selected, g),
    });
  }

  const preview = selected ? nutritionForGrams(selected, Number(grams) || 0) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add to {mealLabel}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {scanning ? (
          <Suspense fallback={<p className="muted">Loading camera…</p>}>
            <BarcodeScanner onDetected={handleBarcode} onClose={() => setScanning(false)} />
          </Suspense>
        ) : selected ? (
          <div className="quantity-view">
            <button className="btn btn-ghost back-btn" onClick={() => setSelected(null)}>
              ← Back to results
            </button>
            <div className="selected-food">
              {selected.image && <img src={selected.image} alt="" className="food-thumb" />}
              <div>
                <div className="food-name">{selected.name}</div>
                <div className="food-sub">
                  {selected.per100g.calories} cal / 100g
                  {selected.servingText ? ` · serving: ${selected.servingText}` : ""}
                </div>
              </div>
            </div>
            <label className="qty-label">
              Amount (grams)
              <input
                type="number"
                min="1"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                className="qty-input"
                autoFocus
              />
            </label>
            <div className="preview-macros">
              <Macro label="Calories" value={preview.calories} unit="" strong />
              <Macro label="Protein" value={preview.protein} unit="g" />
              <Macro label="Carbs" value={preview.carbs} unit="g" />
              <Macro label="Fat" value={preview.fat} unit="g" />
            </div>
            <button className="btn btn-primary full" onClick={confirmAdd}>
              Add to {mealLabel}
            </button>
          </div>
        ) : (
          <>
            <div className="search-row">
              <input
                type="text"
                placeholder="Search foods (e.g. banana, greek yogurt)…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
                autoFocus
              />
              <button className="btn btn-scan" onClick={() => setScanning(true)} title="Scan barcode">
                📷 Scan
              </button>
            </div>

            {usualFoods.length > 0 && query.trim().length < 2 && (
              <div className="usual-section">
                <div className="section-title">⭐ Your usual foods</div>
                <div className="usual-list">
                  {usualFoods.map((f) => (
                    <button key={f.id} className="usual-chip" onClick={() => pickFood(f)}>
                      {f.name} · {f.per100g.calories} cal/100g
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && <p className="muted">Searching…</p>}
            {error && <p className="error">{error}</p>}

            <ul className="results">
              {results.map((f) => (
                <li key={f.id}>
                  <button className="result-item" onClick={() => pickFood(f)}>
                    {f.image ? (
                      <img src={f.image} alt="" className="food-thumb" />
                    ) : (
                      <div className="food-thumb placeholder">🍴</div>
                    )}
                    <div className="result-info">
                      <div className="food-name">{f.name}</div>
                      <div className="food-sub">
                        {f.per100g.calories} cal · P{f.per100g.protein} C{f.per100g.carbs} F{f.per100g.fat} (per 100g)
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function Macro({ label, value, unit, strong }) {
  return (
    <div className={`macro ${strong ? "macro-strong" : ""}`}>
      <div className="macro-value">
        {value}
        {unit}
      </div>
      <div className="macro-label">{label}</div>
    </div>
  );
}
