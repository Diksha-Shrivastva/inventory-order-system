"""Populate the database with a few demo products and customers.

Run after the API/DB are up:
    python -m app.seed          (from inside the backend/ folder)
or with docker-compose:
    docker compose exec backend python -m app.seed
"""

from decimal import Decimal

from .database import Base, SessionLocal, engine
from .models import Customer, Product

Base.metadata.create_all(bind=engine)

DEMO_PRODUCTS = [
    {"sku": "SKU-001", "name": "Wireless Mouse", "description": "Ergonomic 2.4GHz mouse", "price": Decimal("19.99"), "stock_quantity": 50},
    {"sku": "SKU-002", "name": "Mechanical Keyboard", "description": "RGB hot-swappable", "price": Decimal("79.50"), "stock_quantity": 30},
    {"sku": "SKU-003", "name": "USB-C Hub", "description": "7-in-1 adapter", "price": Decimal("34.00"), "stock_quantity": 0},
    {"sku": "SKU-004", "name": "27\" Monitor", "description": "1440p 144Hz", "price": Decimal("239.00"), "stock_quantity": 12},
]

DEMO_CUSTOMERS = [
    {"name": "Asha Verma", "email": "asha@example.com", "phone": "+91 90000 00001", "address": "Delhi, IN"},
    {"name": "Rahul Nair", "email": "rahul@example.com", "phone": "+91 90000 00002", "address": "Mumbai, IN"},
]


def run() -> None:
    db = SessionLocal()
    try:
        for p in DEMO_PRODUCTS:
            if not db.query(Product).filter(Product.sku == p["sku"]).first():
                db.add(Product(**p))
        for c in DEMO_CUSTOMERS:
            if not db.query(Customer).filter(Customer.email == c["email"]).first():
                db.add(Customer(**c))
        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
