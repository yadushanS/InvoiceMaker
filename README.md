# Invoice Maker

A local invoice maker for businesses: register an account, organize invoices into folders, and create fully editable invoices styled after your uploaded logo's colors.

## Structure

- `server/` — Node/Express API, MySQL database (via mysql2), JWT auth, logo upload + automatic color extraction (node-vibrant)
- `client/` — React (Vite) frontend, mobile-friendly, live invoice preview, PDF export (html2canvas + jsPDF)

## Setup (first time)

### 1. Create the database

This app expects a MySQL server (local for now; point it at a hosted MySQL instance later by changing the same env vars). Copy [`server/setup.sql.example`](server/setup.sql.example) to `server/setup.sql` (gitignored, since it'll contain a real password), replace `CHANGE_ME` with a password you choose, then run it in **MySQL Workbench** connected as `root`. This creates a `invoice_maker` database and a dedicated `invoice_maker_app` user (so the app never needs your root password).

Then set `DB_PASSWORD` in `server/.env` to the same password you chose.

The app creates its own tables automatically on first run — no manual schema needed.

### 2. Install dependencies

```bash
cd "server" && npm install
cd "../client" && npm install
```

## Running

Open two terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

Then open the URL Vite prints (e.g. `http://localhost:5173`). The client proxies `/api` and `/uploads` to the API server on port `4100` (configured in `client/vite.config.js` and `server/.env`).

> Note: the API defaults to port 4100 instead of 4000 because 4000 was already occupied by another process on this machine during setup. Change `PORT` in `server/.env` (and the proxy targets in `client/vite.config.js`) if you'd like a different port.

## How it works

1. **Register** a business account (email/password + business name).
2. In **Settings**, upload your logo — invoice accent colors (primary/dark/light) are automatically extracted from it and applied across the app and every invoice. Fill in default address, ABN, and bank details (used to pre-fill new invoices).
3. On the **Folders** page, create a folder per client/category.
4. Inside a folder, create a **new invoice** — every field (bill-to, dates, line items, tax, bank details, notes, etc.) is editable, with a live preview on the right styled after a professional tax-invoice layout.
5. **Save** to persist a draft/sent/paid invoice, or **Download PDF** to export it.

## Data storage

Business/folder/invoice records live in the `invoice_maker` MySQL database. Uploaded logos are saved to `server/uploads/` on disk (gitignored) — note that this won't survive on most serverless hosts (e.g. Vercel), so if you deploy there later you'll need to swap logo storage for an object store (e.g. S3-compatible). A host that runs a normal persistent Node process (Railway, Render, a VPS, etc.) works as-is.

Database connection is configured entirely via `server/.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) — point these at a hosted MySQL instance when you're ready to deploy.

## Deploying (GitHub + Railway + Vercel)

Architecture: GitHub hosts the source. **Railway** runs the `server/` API and a managed MySQL database. **Vercel** builds and serves the `client/` static frontend. Both Railway and Vercel auto-redeploy on every push to your GitHub branch once connected — no extra CI config needed.

### 1. Railway (backend + database)

1. New Project → **Deploy from GitHub repo** → pick this repo.
2. On the created service: Settings → set **Root Directory** to `server`.
3. Add a database: **+ New → Database → MySQL** in the same project.
4. On the `server` service → **Variables**, add:
   - `JWT_SECRET` — a long random string (different from the local dev one)
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — copy these from the MySQL service's **Connect** tab (or reference them directly, e.g. `${{MySQL.MYSQLHOST}}`, if Railway offers that for your plan)
   - `CORS_ORIGIN` — your Vercel URL once you have it (e.g. `https://your-app.vercel.app`); can leave unset until step 2 is done
   - Do **not** set `PORT` — Railway injects it automatically and the app already reads `process.env.PORT`.
5. **Persistent uploads**: by default Railway's filesystem is ephemeral (uploaded logos would be lost on redeploy). Add a **Volume** to the `server` service mounted at `/app/uploads` so logos survive deploys.
6. Deploy, then copy the public URL Railway gives the service (Settings → Networking → Generate Domain).

### 2. Vercel (frontend)

1. New Project → import the same GitHub repo.
2. Set **Root Directory** to `client`. Vercel auto-detects Vite (`npm run build`, output `dist`).
3. Add an environment variable: `VITE_API_URL` = the Railway URL from step 1.6 (no trailing slash).
4. Deploy, then copy the Vercel URL and go back to Railway to set `CORS_ORIGIN` to it.

### 3. Auto-deploy on push

Both platforms watch the branch you connected (typically `main`) and redeploy automatically on every push — that's the "automated updates" behavior, built in once the two steps above are done. No GitHub Actions workflow is required.
