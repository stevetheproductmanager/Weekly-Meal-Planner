# Weekly Meal Planner

A small React + Tailwind app for planning up to **7 dinners per week**, managing mains & sides, and auto-generating a grocery list from your plan.

---

## What it does

- Store a reusable library of **mains** and **sides**
- Build a weekly plan with up to **7 dinners**
- Attach sides to each main
- Auto-generate a **grocery list** from the current weekly plan
- Hide grocery items you already have
- Switch between **light** and **dark** themes

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS (`darkMode: "class"`)
- **Backend:** Node.js + Express-style API under `/api`

---

## Project Structure

```text
meal-planner-app/
  ├─ client/           # React + Tailwind frontend
  │   ├─ index.html
  │   ├─ package.json
  │   ├─ tailwind.config.js
  │   ├─ postcss.config.js
  │   └─ src/
  │       ├─ main.jsx
  │       ├─ App.jsx
  │       ├─ index.css
  │       └─ components/
  │           ├─ InventoryTab.jsx
  │           ├─ PlanTab.jsx
  │           ├─ dishes/
  │           ├─ plan/
  │           ├─ grocery/
  │           └─ dialogs/
  └─ server/           # Node/Express backend
      ├─ package.json
      └─ server.js / index.js (API implementation)
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/stevetheproductmanager/Weekly-Meal-Planner.git
cd Weekly-Meal-Planner
```

---

### 2. Start the backend (API server)

From the `server` folder:

```bash
cd server
npm install      # first time only
npm run dev      # or: npm start (whichever is defined in package.json)
```

This should start a server that exposes the following endpoints under `/api`:

- `GET /api/mains`
- `GET /api/sides`
- `POST /api/mains`
- `POST /api/sides`
- `PUT /api/mains/:id`
- `PUT /api/sides/:id`
- `DELETE /api/mains/:id`
- `DELETE /api/sides/:id`
- `GET /api/plan`
- `PUT /api/plan`
- `POST /api/grocery-list`

Make sure it’s listening on the port your frontend expects (commonly `http://localhost:3000` with a Vite proxy).

---

### 3. Start the frontend (React app)

Open a **second terminal** and from the repo root:

```bash
cd client
npm install      # first time only
npm run dev
```

Vite will print a local dev URL, usually:

```text
http://localhost:5173
```

Open that in your browser.

The frontend will call the backend at `/api/...`. In dev, this is typically wired via a Vite proxy (e.g. `vite.config.js` mapping `/api` → `http://localhost:3000`).

---

## API Expectations (Quick Summary)

The frontend expects JSON responses like:

### Dishes (`/api/mains`, `/api/sides`)

```json
{
  "id": "main_1",
  "name": "Grilled Chicken",
  "category": "Protein",
  "tags": ["quick", "kid-friendly"],
  "notes": "Great with a simple salad.",
  "ingredients": [
    { "name": "chicken breast" },
    { "name": "olive oil" },
    { "name": "salt" }
  ]
}
```

### Weekly Plan (`/api/plan`)

```json
{
  "entries": [
    {
      "id": "entry_1",
      "mainId": "main_1",
      "sideIds": ["side_1", "side_2"]
    }
  ]
}
```

### Grocery List (`/api/grocery-list`)

Request:

```json
{
  "entries": [
    {
      "mainId": "main_1",
      "sideIds": ["side_1", "side_2"]
    }
  ]
}
```

Response:

```json
{
  "items": [
    {
      "name": "chicken breast",
      "fromMeals": ["Grilled Chicken"]
    }
  ]
}
```

---

## Notes

- `node_modules` is intentionally **not** tracked by Git (`.gitignore` includes it).
- Theme preference (light or dark) is stored in `localStorage`.
- The UI enforces a **7-dinner limit** and shows a small dialog if you try to add more.
