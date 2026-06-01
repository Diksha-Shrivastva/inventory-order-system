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



