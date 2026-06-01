# Inventory & Order Management System

A full-stack system to manage **products, customers, orders, and inventory tracking**.

- **Backend:** Python + FastAPI (auto-generated API docs at `/docs`)
- **Frontend:** React (Vite) — responsive UI for products, customers, and orders
- **Database:** PostgreSQL
- **Containerized:** Docker + Docker Compose
- **Config:** environment variables only — no hardcoded credentials

---

## Table of contents
1. [Features & business rules](#features--business-rules)
2. [Project structure](#project-structure)
3. [Run locally with Docker (recommended)](#run-locally-with-docker-recommended)
4. [Run locally without Docker](#run-locally-without-docker)
5. [API reference](#api-reference)


---

## Features & business rules

The assessment's required rules are all implemented and enforced server-side:

| Rule | Where it's enforced |
|------|--------------------|
| **Unique product SKU** | DB unique constraint + explicit check in `routers/products.py` |
| **Unique customer email** | DB unique constraint + explicit check in `routers/customers.py` |
| **Inventory validation** | `routers/orders.py` checks every product's stock before writing anything |
| **Orders blocked on insufficient stock** | Order returns `400` with a clear message; nothing is saved |
| **Automatic stock reduction** | On a successful order, each product's `stock_quantity` is decremented |
| **Atomic orders** | All checks happen first; the order + items + stock update commit together |

Plus full CRUD for products and customers, an orders builder, and a dashboard.

---

## Project structure

```
inventory-order-system/
├── docker-compose.yml         # Runs db + backend + frontend together
├── .env.example               # Copy to .env (config / credentials)
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py            # FastAPI app, CORS, table creation
│       ├── config.py          # Reads env vars (DATABASE_URL, CORS_ORIGINS)
│       ├── database.py        # SQLAlchemy engine + session
│       ├── models.py          # Product, Customer, Order, OrderItem
│       ├── schemas.py         # Pydantic request/response models
│       ├── seed.py            # Optional demo data
│       └── routers/           # products / customers / orders endpoints
└── frontend/
    ├── Dockerfile             # Multi-stage build, served by nginx
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.jsx            # Layout, nav, dashboard
        ├── api.js             # Axios client (reads VITE_API_URL)
        └── components/        # Products / Customers / Orders views
```

---

## Run locally with Docker (recommended)

You only need **Docker Desktop** installed.

```bash
# 1. From the project root, create your env file
cp .env.example .env

# 2. Build and start everything (Postgres + API + frontend)
docker compose up --build
```

Then open:

- **Frontend:** http://localhost:5173
- **API docs (Swagger):** http://localhost:8000/docs
- **API root:** http://localhost:8000

Optional — load demo products and customers:

```bash
docker compose exec backend python -m app.seed
```

Stop everything: `Ctrl+C`, then `docker compose down` (add `-v` to also wipe the database).

---

## Run locally without Docker

<details>
<summary>Backend</summary>

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Point at a running Postgres (or use a local one)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventory"
export CORS_ORIGINS="*"

uvicorn app.main:app --reload --port 8000
```
</details>

<details>
<summary>Frontend</summary>

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
# opens http://localhost:5173
```
</details>

---

## API reference

Base URL: `http://localhost:8000` (or your deployed backend URL).
Interactive docs are always available at **`/docs`**.

### Products
| Method | Path | Body | Notes |
|---|---|---|---|
| `POST` | `/products` | `{sku, name, description?, price, stock_quantity}` | 400 if SKU exists |
| `GET` | `/products` | — | list all |
| `GET` | `/products/{id}` | — | |
| `PUT` | `/products/{id}` | `{name?, description?, price?, stock_quantity?}` | SKU is immutable |
| `DELETE` | `/products/{id}` | — | |

### Customers
| Method | Path | Body | Notes |
|---|---|---|---|
| `POST` | `/customers` | `{name, email, phone?, address?}` | 400 if email exists |
| `GET` | `/customers` | — | list all |
| `GET` | `/customers/{id}` | — | |
| `PUT` | `/customers/{id}` | `{name?, phone?, address?}` | email is immutable |
| `DELETE` | `/customers/{id}` | — | |

### Orders
| Method | Path | Body | Notes |
|---|---|---|---|
| `POST` | `/orders` | `{customer_id, items: [{product_id, quantity}]}` | 400 on insufficient stock; reduces stock |
| `GET` | `/orders` | — | list all (with line items) |
| `GET` | `/orders/{id}` | — | |



### Step 1 — Database on Neon (free Postgres)

1. Sign up at **neon.tech** → create a project.
2. Copy the connection string. It looks like:
   `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`
3. Keep this handy — it's your production `DATABASE_URL`.

### Step 2 — Backend image on Docker Hub  → *Backend Docker Hub Image Link*

```bash
# from the project root, with Docker running and logged in (docker login)
docker build -t <dockerhub-username>/ioms-backend:latest ./backend
docker push <dockerhub-username>/ioms-backend:latest
```

Your image link will be:
`https://hub.docker.com/r/<dockerhub-username>/ioms-backend`

### Step 3 — Backend API on Render  → *Backend API Hosted URL*

1. Sign up at **render.com** → **New → Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Docker (auto-detected from the Dockerfile)
3. Add environment variables:
   - `DATABASE_URL` = your Neon connection string from Step 1
   - `CORS_ORIGINS` = `*` (or your Vercel URL once you have it)
4. Create the service. When live you'll get a URL like
   `https://ioms-backend.onrender.com` — verify `/docs` loads.

> *Alternative:* deploy the Docker Hub image directly (Render → New → Web Service →
> "Deploy an existing image") using `<dockerhub-username>/ioms-backend:latest`.
> Railway and Fly.io work the same way if you prefer them.

### Step 4 — Frontend on Vercel  → *Frontend Hosted URL*

1. Sign up at **vercel.com** → **Add New → Project** → import your GitHub repo.
2. Settings:
   - **Root Directory:** `frontend`
   - Framework preset: **Vite** (auto-detected)
3. Add an environment variable:
   - `VITE_API_URL` = your Render backend URL from Step 3 (e.g. `https://ioms-backend.onrender.com`)
4. Deploy. You'll get a URL like `https://your-app.vercel.app`.

> After this, set `CORS_ORIGINS` on Render to your Vercel URL for tighter security
> (optional — `*` also works for the assessment), then redeploy the backend.

### Step 5 — Smoke test

- Open the Vercel URL → add a product, a customer, then place an order.
- Try ordering more than the available stock → you should see the
  "insufficient stock" error and the order should NOT be created.

---

## Submission checklist

| Form field | What to paste |
|---|---|
| **GitHub Repository Link** | `https://github.com/<you>/inventory-order-system` |
| **Backend Docker Hub Image Link** | `https://hub.docker.com/r/<dockerhub-username>/ioms-backend` |
| **Frontend Hosted URL** | your Vercel URL, e.g. `https://your-app.vercel.app` |
| **Backend API Hosted URL** | your Render URL, e.g. `https://ioms-backend.onrender.com` |

> Tip: Render's free tier sleeps after inactivity, so the first request after idle
> can take ~30–50s to wake. Open the backend URL once before submitting so the
> reviewer's first load is fast.
