from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import Product, ProductStatus, User, UserRole, Order, OrderItem, Review
from app.schemas import ProductResponse, SellerAnalytics, SellerOrderResponse, SellerInfo, CategoryResponse
from app.auth import get_current_user

router = APIRouter(prefix="/seller", tags=["Seller Dashboard"])


def get_product_with_stats(product: Product, db: Session) -> ProductResponse:
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


def require_seller(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.SELLER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller access required"
        )
    return current_user


@router.get("/analytics", response_model=SellerAnalytics)
async def get_seller_analytics(
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    total_products = db.query(func.count(Product.id)).filter(
        Product.seller_id == current_user.id
    ).scalar()
    
    active_products = db.query(func.count(Product.id)).filter(
        Product.seller_id == current_user.id,
        Product.status == ProductStatus.ACTIVE
    ).scalar()
    
    seller_product_ids = db.query(Product.id).filter(
        Product.seller_id == current_user.id
    ).subquery()
    
    order_items = db.query(OrderItem).filter(
        OrderItem.product_id.in_(seller_product_ids)
    ).all()
    
    total_orders = len(set(item.order_id for item in order_items))
    total_revenue = sum(item.price * item.quantity for item in order_items)
    
    avg_rating = db.query(func.avg(Review.rating)).filter(
        Review.product_id.in_(seller_product_ids)
    ).scalar() or 0
    
    total_reviews = db.query(func.count(Review.id)).filter(
        Review.product_id.in_(seller_product_ids)
    ).scalar()
    
    return SellerAnalytics(
        total_products=total_products,
        active_products=active_products,
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        average_rating=round(float(avg_rating), 1),
        total_reviews=total_reviews
    )


@router.get("/products", response_model=List[ProductResponse])
async def get_seller_products(
    status_filter: ProductStatus = None,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    query = db.query(Product).options(
        joinedload(Product.seller),
        joinedload(Product.category)
    ).filter(Product.seller_id == current_user.id)
    
    if status_filter:
        query = query.filter(Product.status == status_filter)
    
    products = query.order_by(Product.created_at.desc()).all()
    
    return [get_product_with_stats(p, db) for p in products]


@router.get("/orders", response_model=List[SellerOrderResponse])
async def get_seller_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    seller_product_ids = db.query(Product.id).filter(
        Product.seller_id == current_user.id
    ).subquery()
    
    order_items = db.query(OrderItem).options(
        joinedload(OrderItem.order).joinedload(Order.buyer),
        joinedload(OrderItem.product)
    ).filter(
        OrderItem.product_id.in_(seller_product_ids)
    ).order_by(OrderItem.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    result = []
    for item in order_items:
        result.append(SellerOrderResponse(
            id=item.id,
            order_number=item.order.order_number,
            buyer_name=item.order.buyer.name if item.order.buyer else "Unknown",
            buyer_email=item.order.buyer.email if item.order.buyer else "Unknown",
            product_name=item.product.name if item.product else "Unknown",
            quantity=item.quantity,
            price=item.price,
            status=item.order.status,
            created_at=item.created_at
        ))
    
    return result


@router.get("/reviews", response_model=List)
async def get_seller_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    seller_product_ids = db.query(Product.id).filter(
        Product.seller_id == current_user.id
    ).subquery()
    
    reviews = db.query(Review).options(
        joinedload(Review.user),
        joinedload(Review.product)
    ).filter(
        Review.product_id.in_(seller_product_ids)
    ).order_by(Review.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    result = []
    for review in reviews:
        result.append({
            "id": review.id,
            "product_id": review.product_id,
            "product_name": review.product.name if review.product else "Unknown",
            "user_name": review.user.name if review.user else "Unknown",
            "rating": review.rating,
            "title": review.title,
            "comment": review.comment,
            "seller_response": review.seller_response,
            "created_at": review.created_at.isoformat()
        })
    
    return result
