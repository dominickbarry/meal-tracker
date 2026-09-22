// Gemini API service — parses a free-text meal description into structured
// food items with estimated nutrition. Uses the user's own API key (stored
// locally in the browser). Free-tier friendly: uses the fast, low-cost
// gemini-2.0-flash model.
//
// Get a free key at https://aistudio.google.com/apikey
// Docs: https://ai.google.dev/gemini-api/docs

const MODEL = "gemini-2.0-flash";
const ENDPOINT = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    key
  )}`;

const KEY_STORAGE = "mt.geminiKey";

export function getApiKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function setApiKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* ignore storage errors */
  }
}

export function hasApiKey() {
  return getApiKey().length > 0;
}

// Instruction that forces the model to return strict JSON we can parse.
const SYSTEM_PROMPT = `You are a nutrition estimator. The user describes a meal in plain language.
Break it into individual food items. For EACH item, estimate a reasonable portion
in grams and the nutrition for THAT portion (not per 100g).

Return ONLY valid JSON, no markdown, no commentary, in exactly this shape:
{
  "items": [
    {
      "name": "string, short food name",
      "grams": number,
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ]
}

Rules:
- calories are whole numbers; protein, carbs, fat are grams (one decimal ok).
- If a quantity is given (e.g. "2 eggs"), reflect it in grams and totals.
- If unclear, assume a typical single serving.
- Never include foods the user did not mention.`;

function extractJson(text) {
  if (!text) throw new Error("Empty response from the AI.");
  // Strip ```json fences if the model added them despite instructions.
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  // Fall back to grabbing the outermost {...} if there is stray text.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice);
}

function round1(v) {
  return typeof v === "number" && isFinite(v) ? Math.round(v * 10) / 10 : 0;
}
function roundInt(v) {
  return typeof v === "number" && isFinite(v) ? Math.round(v) : 0;
}

// Parse a meal description. Returns an array of items shaped for the log:
// { id, name, grams, per100g, nutrition } so they slot straight into addEntry.
export async function parseMealText(text, { signal } = {}) {
  const key = getApiKey();
  if (!key) {
    const err = new Error("No Gemini API key set.");
    err.code = "NO_KEY";
    throw err;
  }
  if (!text || text.trim().length < 2) return [];

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: text.trim() }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(ENDPOINT(MODEL, key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let detail = "";
    try {
      const e = await res.json();
      detail = e?.error?.message || "";
    } catch {
      /* ignore */
    }
    if (res.status === 400 && /API key not valid/i.test(detail)) {
      const err = new Error("That Gemini API key looks invalid. Check it and try again.");
      err.code = "BAD_KEY";
      throw err;
    }
    if (res.status === 429) {
      const err = new Error("Gemini rate limit reached. Wait a moment and try again.");
      err.code = "RATE_LIMIT";
      throw err;
    }
    throw new Error(`AI request failed (${res.status}). ${detail}`.trim());
  }

  const data = await res.json();
  const textOut =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  const parsed = extractJson(textOut);
  const items = Array.isArray(parsed?.items) ? parsed.items : [];

  return items
    .filter((it) => it && it.name)
    .map((it, i) => {
      const grams = roundInt(it.grams) || 100;
      const nutrition = {
        calories: roundInt(it.calories),
        protein: round1(it.protein),
        carbs: round1(it.carbs),
        fat: round1(it.fat),
      };
      // Back-compute a per-100g profile so edits to grams recompute correctly,
      // consistent with how database foods are stored.
      const factor = grams > 0 ? 100 / grams : 1;
      return {
        id: `ai-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        name: it.name.trim(),
        grams,
        per100g: {
          calories: roundInt(nutrition.calories * factor),
          protein: round1(nutrition.protein * factor),
          carbs: round1(nutrition.carbs * factor),
          fat: round1(nutrition.fat * factor),
        },
        nutrition,
      };
    });
}
