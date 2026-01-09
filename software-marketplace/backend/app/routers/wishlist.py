from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import WishlistItem, Product, ProductStatus, User, Review
from app.schemas import WishlistItemCreate, WishlistItemResponse, ProductResponse, SellerInfo, CategoryResponse
from app.auth import get_current_user

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


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


@router.get("", response_model=List[WishlistItemResponse])
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(WishlistItem).options(
        joinedload(WishlistItem.product).joinedload(Product.seller),
        joinedload(WishlistItem.product).joinedload(Product.category)
    ).filter(WishlistItem.user_id == current_user.id).order_by(WishlistItem.created_at.desc()).all()
    
    result = []
    for item in items:
        if item.product and item.product.status == ProductStatus.ACTIVE:
            product_response = get_product_response(item.product, db)
            result.append(WishlistItemResponse(
                id=item.id,
                product_id=item.product_id,
                product=product_response,
                created_at=item.created_at
            ))
    
    return result


@router.post("", response_model=WishlistItemResponse)
async def add_to_wishlist(
    item_data: WishlistItemCreate,
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
    
    existing = db.query(WishlistItem).filter(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == item_data.product_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product already in wishlist"
        )
    
    wishlist_item = WishlistItem(
        user_id=current_user.id,
        product_id=item_data.product_id
    )
    db.add(wishlist_item)
    db.commit()
    db.refresh(wishlist_item)
    
    product_response = get_product_response(product, db)
    
    return WishlistItemResponse(
        id=wishlist_item.id,
        product_id=wishlist_item.product_id,
        product=product_response,
        created_at=wishlist_item.created_at
    )


@router.delete("/{product_id}")
async def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wishlist_item = db.query(WishlistItem).filter(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == product_id
    ).first()
    
    if not wishlist_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not in wishlist"
        )
    
    db.delete(wishlist_item)
    db.commit()
    
    return {"message": "Item removed from wishlist"}


@router.get("/check/{product_id}")
async def check_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exists = db.query(WishlistItem).filter(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == product_id
    ).first() is not None
    
    return {"in_wishlist": exists}
