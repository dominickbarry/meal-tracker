# 🍽️ Meal Tracker

A simple web app to track your daily meals, calories, and macros — **without typing nutrition info by hand**. Search a food database or scan a product barcode, and calories/protein/carbs/fat fill in automatically.

## Features

- **Search-as-you-type food lookup** — powered by [Open Food Facts](https://world.openfoodfacts.org) (free, no API key). Type a food name, pick a result, adjust the amount.
- **Barcode scanning** — use your device camera to scan a product barcode and pull its nutrition instantly.
- **Daily calorie & macro totals** — see progress bars against your goals for calories, protein, carbs, and fat.
- **Meals by section** — Breakfast, Lunch, Dinner, Snacks, with per-day navigation.
- **My usual foods** — star foods you eat often and re-add them in one tap.
- **Editable goals** — default is **2,500 cal/day** (tuned for 6'1" / 150 lbs, lightly active); change it anytime.
- **Saved locally** — everything persists in your browser (localStorage). No account, no server.

## Your default goals

| Metric | Goal |
|---|---|
| Calories | 2,500 cal |
| Protein | 185 g |
| Carbs | 280 g |
| Fat | 70 g |

Edit these in the app via the **⚙️ Goals** button.

## Run it

```bash
npm install
npm run dev
```

Then open the printed URL (usually http://localhost:5173).

> **Barcode scanning** needs camera access, which browsers only allow over HTTPS or `localhost`. `npm run dev` on localhost works. If you deploy, use HTTPS.

## Build for production

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

## Tech

- React + Vite
- [@zxing/browser](https://github.com/zxing-js/browser) for barcode scanning (lazy-loaded, so it only downloads when you open the camera)
- Open Food Facts REST API (called from the browser)

## Notes

Calorie and macro numbers are **estimates for general tracking, not medical advice**. For personalized nutrition guidance, consult a doctor or registered dietitian. Nutrition values come from Open Food Facts and are normalized per 100 g; accuracy depends on that community database.
