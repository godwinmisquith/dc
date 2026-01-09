from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import Category, Product, ProductStatus, User, UserRole
from app.schemas import CategoryCreate, CategoryResponse, CategoryWithChildren
from app.auth import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryWithChildren])
async def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).filter(Category.parent_id == None).all()
    result = []
    for cat in categories:
        product_count = db.query(func.count(Product.id)).filter(
            Product.category_id == cat.id,
            Product.status == ProductStatus.ACTIVE
        ).scalar()
        cat_dict = CategoryWithChildren(
            id=cat.id,
            name=cat.name,
            slug=cat.slug,
            description=cat.description,
            image_url=cat.image_url,
            parent_id=cat.parent_id,
            created_at=cat.created_at,
            children=[],
            product_count=product_count
        )
        for child in cat.children:
            child_count = db.query(func.count(Product.id)).filter(
                Product.category_id == child.id,
                Product.status == ProductStatus.ACTIVE
            ).scalar()
            cat_dict.children.append(CategoryWithChildren(
                id=child.id,
                name=child.name,
                slug=child.slug,
                description=child.description,
                image_url=child.image_url,
                parent_id=child.parent_id,
                created_at=child.created_at,
                children=[],
                product_count=child_count
            ))
        result.append(cat_dict)
    return result


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category


@router.get("/slug/{slug}", response_model=CategoryResponse)
async def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.slug == slug).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category


@router.post("", response_model=CategoryResponse)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create categories"
        )
    
    existing = db.query(Category).filter(Category.slug == category_data.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this slug already exists"
        )
    
    if category_data.parent_id:
        parent = db.query(Category).filter(Category.id == category_data.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent category not found"
            )
    
    category = Category(**category_data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
