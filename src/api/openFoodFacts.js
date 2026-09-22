// Open Food Facts API service — free, no API key required.
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/

const SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product";

// Pull calories + macros (per 100g) out of a raw Open Food Facts product.
function normalizeProduct(p) {
  if (!p) return null;
  const n = p.nutriments || {};
  const per = (key) =>
    typeof n[`${key}_100g`] === "number" ? n[`${key}_100g`] : null;

  const kcal =
    per("energy-kcal") ??
    (typeof n["energy-kcal_value"] === "number" ? n["energy-kcal_value"] : null);

  const name =
    p.product_name ||
    p.product_name_en ||
    p.generic_name ||
    "Unknown food";

  // Skip products with no usable calorie data.
  if (kcal == null) return null;

  return {
    id: p.code || p._id || `${name}-${Math.random().toString(36).slice(2)}`,
    name: p.brands ? `${name} (${p.brands.split(",")[0].trim()})` : name,
    barcode: p.code || null,
    image: p.image_front_small_url || p.image_url || null,
    // All values are per 100 g (Open Food Facts standard reference).
    per100g: {
      calories: Math.round(kcal),
      protein: round1(per("proteins")),
      carbs: round1(per("carbohydrates")),
      fat: round1(per("fat")),
    },
    servingSize: p.serving_quantity ? Number(p.serving_quantity) : null,
    servingText: p.serving_size || null,
  };
}

function round1(v) {
  return typeof v === "number" ? Math.round(v * 10) / 10 : 0;
}

export async function searchFoods(query, { signal } = {}) {
  if (!query || query.trim().length < 2) return [];
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "20",
    fields:
      "code,product_name,product_name_en,generic_name,brands,nutriments,image_front_small_url,image_url,serving_quantity,serving_size",
  });

  const res = await fetch(`${SEARCH_URL}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const data = await res.json();
  return (data.products || [])
    .map(normalizeProduct)
    .filter(Boolean)
    .slice(0, 15);
}

export async function lookupBarcode(barcode, { signal } = {}) {
  if (!barcode) return null;
  const params = new URLSearchParams({
    fields:
      "code,product_name,product_name_en,generic_name,brands,nutriments,image_front_small_url,image_url,serving_quantity,serving_size",
  });
  const res = await fetch(
    `${PRODUCT_URL}/${encodeURIComponent(barcode)}.json?${params.toString()}`,
    { signal }
  );
  if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return normalizeProduct(data.product);
}

// Compute nutrition for a given gram amount from a per-100g food.
export function nutritionForGrams(food, grams) {
  const factor = grams / 100;
  return {
    calories: Math.round(food.per100g.calories * factor),
    protein: round1(food.per100g.protein * factor),
    carbs: round1(food.per100g.carbs * factor),
    fat: round1(food.per100g.fat * factor),
  };
}
