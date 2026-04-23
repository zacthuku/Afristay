from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.all_models import CartItem, Service
from app.schemas.cart import CartItemAdd, CartItemUpdate

router = APIRouter(prefix="/cart", tags=["Cart"])

PRICE_LOCK_MINUTES = 15


def _serialize_item(item: CartItem) -> dict:
    meta = item.service.service_metadata or {} if item.service else {}
    nights = max(1, (item.check_out - item.check_in).days)
    return {
        "id": str(item.id),
        "service_id": str(item.service_id),
        "title": item.service.title if item.service else None,
        "location": meta.get("location"),
        "images": meta.get("images", []),
        "pricing_type": item.service.pricing_type if item.service else None,
        "check_in": item.check_in,
        "check_out": item.check_out,
        "nights": nights,
        "quantity": item.quantity,
        "unit_price": float(item.saved_price),
        "subtotal": float(item.saved_price) * item.quantity * nights,
    }


@router.get("/")
def get_cart(user=Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(CartItem).filter(CartItem.user_id == user.id).all()
    serialized = [_serialize_item(i) for i in items]
    total = sum(i["subtotal"] for i in serialized)
    platform_fee = round(total * 0.12, 2)
    return {
        "items": serialized,
        "subtotal": round(total, 2),
        "platform_fee": platform_fee,
        "total": round(total + platform_fee, 2),
    }


@router.post("/add")
def add_to_cart(data: CartItemAdd, user=Depends(get_current_user), db: Session = Depends(get_db)):
    service = db.query(Service).filter(
        Service.id == data.service_id,
        Service.approval_status == "approved",
    ).first()
    if not service:
        raise HTTPException(404, "Service not found or not available")

    if data.check_out < data.check_in:
        raise HTTPException(400, "Check-out must be on or after check-in")

    existing = db.query(CartItem).filter(
        CartItem.user_id == user.id,
        CartItem.service_id == data.service_id,
    ).first()
    if existing:
        existing.check_in = data.check_in
        existing.check_out = data.check_out
        existing.quantity = data.quantity
        existing.saved_price = float(service.price_base or 0)
        db.commit()
        db.refresh(existing)
        return {"message": "Cart item updated", "item": _serialize_item(existing)}

    item = CartItem(
        user_id=user.id,
        service_id=service.id,
        check_in=data.check_in,
        check_out=data.check_out,
        quantity=data.quantity,
        saved_price=float(service.price_base or 0),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"message": "Added to cart", "item": _serialize_item(item)}


@router.put("/{item_id}")
def update_cart_item(
    item_id: str,
    data: CartItemUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == user.id).first()
    if not item:
        raise HTTPException(404, "Cart item not found")

    if data.check_in is not None:
        item.check_in = data.check_in
    if data.check_out is not None:
        item.check_out = data.check_out
    if data.quantity is not None:
        item.quantity = data.quantity

    if item.check_out <= item.check_in:
        raise HTTPException(400, "Check-out must be after check-in")

    db.commit()
    db.refresh(item)
    return {"message": "Cart item updated", "item": _serialize_item(item)}


@router.delete("/{item_id}")
def remove_from_cart(item_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == user.id).first()
    if not item:
        raise HTTPException(404, "Cart item not found")

    db.delete(item)
    db.commit()
    return {"message": "Item removed from cart"}


@router.delete("/")
def clear_cart(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
    return {"message": "Cart cleared"}
