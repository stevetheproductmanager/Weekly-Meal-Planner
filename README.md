# Weekly Meal Planner

A full-stack React + Tailwind + Express app for planning up to **7 dinners per week**, managing a library of mains and sides, auto-generating a grocery list from your plan, and tracking what you buy.

---

## Features

### Weekly Plan
- Build a weekly plan with up to **7 dinners** (Monday–Sunday)
- List view and Calendar view (desktop)
- Add mains from your library via a searchable modal picker
- Attach side dishes to any dinner in the plan
- Save the current week as a named snapshot and reload it later from Plan History

### Mains & Sides Inventory
- Separate **Mains** and **Sides** tabs, each with Cards or List view
- Full CRUD — add, edit, and delete dishes with a rich dialog
- Per-dish: name, category, tags, recipe URL, notes, and ingredient list (with quantity + unit)
- Add a main to the week directly from the inventory
- Attach a side to any dinner in the current week via a quick-pick dialog
- Visual **"In plan"** badge on sides already attached to a dinner

### Grocery List
- Auto-generated from all mains and sides in the current weekly plan
- Quantities are combined when the same ingredient appears across multiple dishes
- Group by **category** or **by meal**
- Live search / filter
- Dismiss individual items (hide items you already have) with a Reset option
- **Shopping mode** — checkboxes appear, checked items fade + strikethrough, state persists in `localStorage`

### Other Items
- A reusable inventory of non-meal grocery items (soap, foil, snacks, etc.)
- One-click to add any item to this week's grocery list
- **"In list"** badge and button style change when an item is already on the list
- Cards or List view, with live search

### Plan History
- Save the current week with a custom name
- Browse past plans — see every dinner at a glance
- Reload any saved plan as the current week (dishes that no longer exist are skipped)
- Delete saved plans

### UX & Polish
- **Toast notifications** for all create / update / delete / add-to-plan actions
- Light and Dark mode (persisted in `localStorage`)
- Mobile-responsive: short tab labels, scrollable tab bar, stacked layouts, dialog gutters
- Confirmation dialogs for destructive actions with inline plan-impact warnings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v3 |
| Backend | Node.js, Express |
| Persistence | Flat JSON files (`server/data/*.json`) |
| Dev runner | `concurrently` (runs both servers with one command) |

---

## Project Structure

```
Weekly-Meal-Planner/
├─ package.json              # Root — runs client + server together
├─ client/                   # React + Tailwind frontend (Vite)
│   ├─ index.html
│   ├─ vite.config.mjs       # Proxies /api → localhost:5000
│   ├─ tailwind.config.js
│   └─ src/
│       ├─ App.jsx            # Root component, all state & API calls
│       ├─ index.css          # Tailwind directives + custom animations
│       └─ components/
│           ├─ Icons.jsx
│           ├─ Toast.jsx
│           ├─ InventoryTab.jsx
│           ├─ MiscItemsTab.jsx
│           ├─ PlanTab.jsx
│           ├─ PlanHistoryTab.jsx
│           ├─ dialogs/
│           │   ├─ AttachSideDialog.jsx
│           │   ├─ ConfirmDialog.jsx
│           │   ├─ DishDialog.jsx
│           │   ├─ MiscItemDialog.jsx
│           │   └─ SavePlanDialog.jsx
│           ├─ dishes/
│           │   ├─ DishCard.jsx
│           │   └─ DishListTable.jsx
│           ├─ grocery/
│           │   └─ GroceryList.jsx
│           └─ plan/
│               └─ WeeklyPlan.jsx
└─ server/
    ├─ server.js              # Express API
    └─ data/                  # Auto-created on first run
        ├─ meals.json          # Mains library
        ├─ sides.json          # Sides library
        ├─ plan.json           # Current weekly plan
        ├─ miscitem.json       # Other items inventory
        └─ saved-plans.json    # Plan history snapshots
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later

---

### Option A — One command (recommended)

From the repo root, install root dependencies and start both servers together:

```bash
npm install
npm run dev
```

This uses `concurrently` to start the Express API (port **5000**) and the Vite dev server (port **5173**) in a single terminal.

Open **http://localhost:5173** in your browser.

---

### Option B — Two terminals

**Terminal 1 — API server:**

```bash
cd server
npm install
npm run dev        # nodemon, auto-restarts on changes
```

**Terminal 2 — Frontend:**

```bash
cd client
npm install
npm run dev        # Vite dev server
```

Open **http://localhost:5173** in your browser.

> The Vite proxy in `vite.config.mjs` forwards all `/api` requests to `http://localhost:5000`, so the frontend and backend run on different ports without CORS issues.

---

## API Reference

The Express server exposes the following endpoints. All bodies and responses are JSON.

### Mains — `GET/POST /api/mains`, `PUT/DELETE /api/mains/:id`
### Sides — `GET/POST /api/sides`, `PUT/DELETE /api/sides/:id`

```json
{
  "id": "main_abc123",
  "name": "Grilled Chicken",
  "category": "Protein",
  "tags": ["quick", "kid-friendly"],
  "recipeUrl": "https://example.com/recipe",
  "notes": "Great with a simple salad.",
  "ingredients": [
    { "name": "chicken breast", "quantity": "2", "unit": "lbs" },
    { "name": "olive oil",      "quantity": "2", "unit": "tbsp" }
  ]
}
```

### Weekly Plan — `GET/PUT /api/plan`

```json
{
  "entries": [
    { "id": "entry_1", "mainId": "main_abc123", "sideIds": ["side_xyz"] }
  ]
}
```

### Grocery List — `POST /api/grocery-list`

Request body: same `entries` array as the plan (or omit to use the saved plan).

Response:
```json
{
  "items": [
    { "name": "chicken breast", "quantity": "2", "unit": "lbs", "quantityText": "2", "fromMeals": ["Grilled Chicken"], "category": "" }
  ]
}
```

### Other Items — `GET/POST /api/misc-items`, `PUT/DELETE /api/misc-items/:id`

```json
{ "id": "misc_abc", "name": "Tin foil", "createdAt": "2025-01-01T00:00:00.000Z" }
```

### Saved Plans — `GET/POST /api/saved-plans`, `DELETE /api/saved-plans/:id`

```json
{
  "id": "plan_abc",
  "name": "Week of May 15",
  "savedAt": "2025-05-15T10:00:00.000Z",
  "entries": [
    { "mainId": "main_abc", "mainName": "Grilled Chicken", "sideIds": [], "sides": [] }
  ]
}
```

---

## Data Persistence

All data is stored as plain JSON files in `server/data/`. The folder and files are created automatically on first run — no database setup needed.

> **Note:** `server/data/` is tracked by Git so your saved dishes and plans survive a fresh clone. If you want a clean slate, delete the contents of the JSON files (replace with `[]` or the appropriate empty value).

---

## Notes

- `node_modules/` is excluded from Git via `.gitignore`.
- Theme preference (light/dark) is stored in `localStorage`.
- Shopping mode checkbox state and hidden grocery items are also persisted in `localStorage`.
- The weekly plan enforces a hard limit of **7 dinners**.
- Calendar view is only available on desktop (hidden on mobile).
