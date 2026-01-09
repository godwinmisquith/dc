from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import Cart, CartItem, Product, ProductStatus, User, Review
from app.schemas import CartItemCreate, CartItemUpdate, CartItemResponse, CartResponse, ProductResponse, SellerInfo, CategoryResponse
from app.auth import get_current_user

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])


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


def get_or_create_cart(user: User, db: Session) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    if not cart:
        cart = Cart(user_id=user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


@router.get("", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(current_user, db)
    
    items = db.query(CartItem).options(
        joinedload(CartItem.product).joinedload(Product.seller),
        joinedload(CartItem.product).joinedload(Product.category)
    ).filter(CartItem.cart_id == cart.id).all()
    
    cart_items = []
    subtotal = 0
    for item in items:
        if item.product and item.product.status == ProductStatus.ACTIVE:
            product_response = get_product_response(item.product, db)
            cart_items.append(CartItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                product=product_response,
                created_at=item.created_at
            ))
            subtotal += item.product.price * item.quantity
    
    return CartResponse(
        id=cart.id,
        user_id=cart.user_id,
        items=cart_items,
        subtotal=round(subtotal, 2),
        item_count=len(cart_items),
        created_at=cart.created_at
    )


@router.post("/items", response_model=CartItemResponse)
async def add_to_cart(
    item_data: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).options(
        joinedload(Product.seller),
        joinedload(Product.category)
    ).filter(Product.id == item_data.product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.status != ProductStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product is not available"
        )
    
    cart = get_or_create_cart(current_user, db)
    
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == item_data.product_id
    ).first()
    
    if existing_item:
        existing_item.quantity += item_data.quantity
        db.commit()
        db.refresh(existing_item)
        cart_item = existing_item
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity
        )
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)
    
    product_response = get_product_response(product, db)
    
    return CartItemResponse(
        id=cart_item.id,
        product_id=cart_item.product_id,
        quantity=cart_item.quantity,
        product=product_response,
        created_at=cart_item.created_at
    )


@router.put("/items/{item_id}", response_model=CartItemResponse)
async def update_cart_item(
    item_id: int,
    item_data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(current_user, db)
    
    cart_item = db.query(CartItem).options(
        joinedload(CartItem.product).joinedload(Product.seller),
        joinedload(CartItem.product).joinedload(Product.category)
    ).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    
    cart_item.quantity = item_data.quantity
    db.commit()
    db.refresh(cart_item)
    
    product_response = get_product_response(cart_item.product, db)
    
    return CartItemResponse(
        id=cart_item.id,
        product_id=cart_item.product_id,
        quantity=cart_item.quantity,
        product=product_response,
        created_at=cart_item.created_at
    )


@router.delete("/items/{item_id}")
async def remove_from_cart(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(current_user, db)
    
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    
    db.delete(cart_item)
    db.commit()
    
    return {"message": "Item removed from cart"}


@router.delete("")
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(current_user, db)
    
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    
    return {"message": "Cart cleared"}
