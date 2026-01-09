from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from datetime import datetime
import uuid
from app.database import get_db
from app.models import Order, OrderItem, OrderStatus, Cart, CartItem, Product, ProductStatus, User, Review
from app.schemas import CheckoutRequest, OrderResponse, OrderListResponse, OrderItemResponse, ProductResponse, SellerInfo, CategoryResponse
from app.auth import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


def get_product_response(product: Product, db: Session) -> ProductResponse:
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.product_id == product.id).scalar() or 0
    review_count = db.query(func.count(Review.id)).filter(Review.product_id == product.id).scalar()
    
    seller_info = None
    if product.seller:
        seller_info = SellerInfo(
            id=product.seller.id,
            name=product.seller.name,
            company_name=product.seller.company_name,
            avatar_url=product.seller.avatar_url
        )
    
    category_info = None
    if product.category:
        category_info = CategoryResponse(
            id=product.category.id,
            name=product.category.name,
            slug=product.category.slug,
            description=product.category.description,
            image_url=product.category.image_url,
            parent_id=product.category.parent_id,
            created_at=product.category.created_at
        )
    
    return ProductResponse(
        id=product.id,
        seller_id=product.seller_id,
        category_id=product.category_id,
        name=product.name,
        slug=product.slug,
        description=product.description,
        short_description=product.short_description,
        price=product.price,
        original_price=product.original_price,
        product_type=product.product_type,
        license_type=product.license_type,
        status=product.status,
        image_url=product.image_url,
        images=product.images,
        version=product.version,
        demo_url=product.demo_url,
        documentation_url=product.documentation_url,
        features=product.features,
        requirements=product.requirements,
        is_featured=product.is_featured,
        download_count=product.download_count,
        view_count=product.view_count,
        created_at=product.created_at,
        updated_at=product.updated_at,
        seller=seller_info,
        category=category_info,
        average_rating=round(float(avg_rating), 1),
        review_count=review_count
    )


def generate_order_number() -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    unique_id = uuid.uuid4().hex[:6].upper()
    return f"ORD-{timestamp}-{unique_id}"


def generate_license_key() -> str:
    return f"LIC-{uuid.uuid4().hex[:8].upper()}-{uuid.uuid4().hex[:8].upper()}"


@router.get("", response_model=OrderListResponse)
async def get_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status_filter: OrderStatus = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Order).filter(Order.buyer_id == current_user.id)
    
    if status_filter:
        query = query.filter(Order.status == status_filter)
    
    total = query.count()
    
    orders = query.options(
        joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.seller),
        joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.category)
    ).order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    order_responses = []
    for order in orders:
        items = []
        for item in order.items:
            product_response = get_product_response(item.product, db) if item.product else None
            items.append(OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.price,
                license_key=item.license_key,
                download_url=item.download_url,
                product=product_response
            ))
        
        order_responses.append(OrderResponse(
            id=order.id,
            buyer_id=order.buyer_id,
            order_number=order.order_number,
            status=order.status,
            subtotal=order.subtotal,
            tax=order.tax,
            discount=order.discount,
            total=order.total,
            payment_method=order.payment_method,
            payment_status=order.payment_status,
            billing_name=order.billing_name,
            billing_email=order.billing_email,
            billing_address=order.billing_address,
            notes=order.notes,
            items=items,
            created_at=order.created_at,
            updated_at=order.updated_at
        ))
    
    return OrderListResponse(
        orders=order_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.seller),
        joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.category)
    ).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own orders"
        )
    
    items = []
    for item in order.items:
        product_response = get_product_response(item.product, db) if item.product else None
        items.append(OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.price,
            license_key=item.license_key,
            download_url=item.download_url,
            product=product_response
        ))
    
    return OrderResponse(
        id=order.id,
        buyer_id=order.buyer_id,
        order_number=order.order_number,
        status=order.status,
        subtotal=order.subtotal,
        tax=order.tax,
        discount=order.discount,
        total=order.total,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        billing_name=order.billing_name,
        billing_email=order.billing_email,
        billing_address=order.billing_address,
        notes=order.notes,
        items=items,
        created_at=order.created_at,
        updated_at=order.updated_at
    )


@router.post("/checkout", response_model=OrderResponse)
async def checkout(
    checkout_data: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )
    
    cart_items = db.query(CartItem).options(
        joinedload(CartItem.product).joinedload(Product.seller),
        joinedload(CartItem.product).joinedload(Product.category)
    ).filter(CartItem.cart_id == cart.id).all()
    
    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )
    
    valid_items = []
    subtotal = 0
    for item in cart_items:
        if item.product and item.product.status == ProductStatus.ACTIVE:
            valid_items.append(item)
            subtotal += item.product.price * item.quantity
    
    if not valid_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid items in cart"
        )
    
    tax = round(subtotal * 0.1, 2)
    total = round(subtotal + tax, 2)
    
    order = Order(
        buyer_id=current_user.id,
        order_number=generate_order_number(),
        status=OrderStatus.CONFIRMED,
        subtotal=subtotal,
        tax=tax,
        discount=0,
        total=total,
        payment_method=checkout_data.payment_method,
        payment_status="completed",
        billing_name=checkout_data.billing_name,
        billing_email=checkout_data.billing_email,
        billing_address=checkout_data.billing_address,
        notes=checkout_data.notes
    )
    db.add(order)
    db.flush()
    
    order_items = []
    for cart_item in valid_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            price=cart_item.product.price,
            license_key=generate_license_key(),
            download_url=cart_item.product.demo_url
        )
        db.add(order_item)
        order_items.append(order_item)
        
        cart_item.product.download_count += cart_item.quantity
    
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    
    db.commit()
    db.refresh(order)
    
    items = []
    for item in order_items:
        db.refresh(item)
        product = db.query(Product).options(
            joinedload(Product.seller),
            joinedload(Product.category)
        ).filter(Product.id == item.product_id).first()
        product_response = get_product_response(product, db) if product else None
        items.append(OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.price,
            license_key=item.license_key,
            download_url=item.download_url,
            product=product_response
        ))
    
    return OrderResponse(
        id=order.id,
        buyer_id=order.buyer_id,
        order_number=order.order_number,
        status=order.status,
        subtotal=order.subtotal,
        tax=order.tax,
        discount=order.discount,
        total=order.total,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        billing_name=order.billing_name,
        billing_email=order.billing_email,
        billing_address=order.billing_address,
        notes=order.notes,
        items=items,
        created_at=order.created_at,
        updated_at=order.updated_at
    )
