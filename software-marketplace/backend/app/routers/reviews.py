from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import Review, Product, ProductStatus, User, UserRole, Order, OrderItem
from app.schemas import ReviewCreate, ReviewUpdate, ReviewResponse, ReviewerInfo
from app.auth import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("/product/{product_id}", response_model=List[ReviewResponse])
async def get_product_reviews(
    product_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    sort_by: str = Query("created_at", pattern="^(created_at|rating|helpful_count)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    query = db.query(Review).options(
        joinedload(Review.user)
    ).filter(Review.product_id == product_id)
    
    if sort_by == "rating":
        query = query.order_by(Review.rating.desc() if sort_order == "desc" else Review.rating.asc())
    elif sort_by == "helpful_count":
        query = query.order_by(Review.helpful_count.desc() if sort_order == "desc" else Review.helpful_count.asc())
    else:
        query = query.order_by(Review.created_at.desc() if sort_order == "desc" else Review.created_at.asc())
    
    reviews = query.offset((page - 1) * page_size).limit(page_size).all()
    
    result = []
    for review in reviews:
        user_info = None
        if review.user:
            user_info = ReviewerInfo(
                id=review.user.id,
                name=review.user.name,
                avatar_url=review.user.avatar_url
            )
        result.append(ReviewResponse(
            id=review.id,
            product_id=review.product_id,
            user_id=review.user_id,
            rating=review.rating,
            title=review.title,
            comment=review.comment,
            helpful_count=review.helpful_count,
            seller_response=review.seller_response,
            is_verified_purchase=review.is_verified_purchase,
            created_at=review.created_at,
            user=user_info
        ))
    
    return result


@router.post("/product/{product_id}", response_model=ReviewResponse)
async def create_review(
    product_id: int,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.status != ProductStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot review inactive product"
        )
    
    existing_review = db.query(Review).filter(
        Review.product_id == product_id,
        Review.user_id == current_user.id
    ).first()
    
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product"
        )
    
    has_purchased = db.query(OrderItem).join(Order).filter(
        Order.buyer_id == current_user.id,
        OrderItem.product_id == product_id
    ).first() is not None
    
    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=review_data.rating,
        title=review_data.title,
        comment=review_data.comment,
        is_verified_purchase=has_purchased
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    
    user_info = ReviewerInfo(
        id=current_user.id,
        name=current_user.name,
        avatar_url=current_user.avatar_url
    )
    
    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        helpful_count=review.helpful_count,
        seller_response=review.seller_response,
        is_verified_purchase=review.is_verified_purchase,
        created_at=review.created_at,
        user=user_info
    )


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(Review).options(
        joinedload(Review.user)
    ).filter(Review.id == review_id).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own reviews"
        )
    
    if review_data.rating is not None:
        review.rating = review_data.rating
    if review_data.title is not None:
        review.title = review_data.title
    if review_data.comment is not None:
        review.comment = review_data.comment
    
    db.commit()
    db.refresh(review)
    
    user_info = ReviewerInfo(
        id=current_user.id,
        name=current_user.name,
        avatar_url=current_user.avatar_url
    )
    
    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        helpful_count=review.helpful_count,
        seller_response=review.seller_response,
        is_verified_purchase=review.is_verified_purchase,
        created_at=review.created_at,
        user=user_info
    )


@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    if review.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reviews"
        )
    
    db.delete(review)
    db.commit()
    
    return {"message": "Review deleted successfully"}


@router.post("/{review_id}/helpful")
async def mark_review_helpful(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    review.helpful_count += 1
    db.commit()
    
    return {"message": "Marked as helpful", "helpful_count": review.helpful_count}


@router.post("/{review_id}/respond")
async def respond_to_review(
    review_id: int,
    response: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(Review).options(
        joinedload(Review.product)
    ).filter(Review.id == review_id).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    if review.product.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the product seller can respond to reviews"
        )
    
    review.seller_response = response
    db.commit()
    
    return {"message": "Response added successfully"}
