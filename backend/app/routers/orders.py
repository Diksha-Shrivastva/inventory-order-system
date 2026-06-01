from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=schemas.OrderOut, status_code=201)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    """Create an order.

    Enforces the core business rules:
      * the customer must exist;
      * every product must exist;
      * an order CANNOT be created if any product has insufficient stock;
      * on success, stock is automatically reduced for each product;
      * the whole thing is atomic — if anything fails, nothing is written.
    """
    # 1. Validate the customer.
    customer = db.get(models.Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    # 2. Combine duplicate product lines into a single requested quantity.
    requested: dict[int, int] = {}
    for item in payload.items:
        requested[item.product_id] = requested.get(item.product_id, 0) + item.quantity

    # 3. Validate every product and check stock BEFORE writing anything.
    products: dict[int, models.Product] = {}
    for product_id, qty in requested.items():
        product = db.get(models.Product, product_id)
        if not product:
            raise HTTPException(
                status_code=404, detail=f"Product with id {product_id} not found."
            )
        if product.stock_quantity < qty:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient stock for '{product.name}' (SKU {product.sku}). "
                    f"Available: {product.stock_quantity}, requested: {qty}."
                ),
            )
        products[product_id] = product

    # 4. All checks passed — create the order, its items, and reduce stock.
    order = models.Order(
        customer_id=customer.id,
        status="confirmed",
        total_amount=Decimal("0.00"),
    )
    db.add(order)
    db.flush()  # assigns order.id without committing

    total = Decimal("0.00")
    for product_id, qty in requested.items():
        product = products[product_id]
        unit_price = Decimal(str(product.price))
        total += unit_price * qty

        # Automatic stock reduction.
        product.stock_quantity -= qty

        db.add(
            models.OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=unit_price,
            )
        )

    order.total_amount = total
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=List[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.id.desc()).all()


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(models.Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order
