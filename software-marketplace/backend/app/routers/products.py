from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List, Optional
from app.database import get_db
from app.models import Product, ProductStatus, ProductType, LicenseType, User, UserRole, Review, Category
from app.schemas import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse, SellerInfo, CategoryResponse
from app.auth import get_current_user, get_current_user_optional
import re

router = APIRouter(prefix="/products", tags=["Products"])


def generate_slug(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


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


@router.get("", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    category_id: Optional[int] = None,
    category_slug: Optional[str] = None,
    product_type: Optional[ProductType] = None,
    license_type: Optional[LicenseType] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query("created_at", pattern="^(created_at|price|name|rating|downloads)$"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$"),
    featured_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Product).options(
        joinedload(Product.seller),
        joinedload(Product.category)
    ).filter(Product.status == ProductStatus.ACTIVE)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if category_slug:
        category = db.query(Category).filter(Category.slug == category_slug).first()
        if category:
            query = query.filter(Product.category_id == category.id)
    
    if product_type:
        query = query.filter(Product.product_type == product_type)
    
    if license_type:
        query = query.filter(Product.license_type == license_type)
    
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.short_description.ilike(search_term)
            )
        )
    
    if featured_only:
        query = query.filter(Product.is_featured == True)
    
    if sort_by == "price":
        query = query.order_by(Product.price.desc() if sort_order == "desc" else Product.price.asc())
    elif sort_by == "name":
        query = query.order_by(Product.name.desc() if sort_order == "desc" else Product.name.asc())
    elif sort_by == "downloads":
        query = query.order_by(Product.download_count.desc() if sort_order == "desc" else Product.download_count.asc())
    else:
        query = query.order_by(Product.created_at.desc() if sort_order == "desc" else Product.created_at.asc())
    
    total = query.count()
    total_pages = (total + page_size - 1) // page_size
    
    products = query.offset((page - 1) * page_size).limit(page_size).all()
    
    product_responses = [get_product_with_stats(p, db) for p in products]
    
    return ProductListResponse(
        products=product_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/featured", response_model=List[ProductResponse])
async def get_featured_products(
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
):
    products = db.query(Product).options(
        joinedload(Product.seller),
        joinedload(Product.category)
    ).filter(
        Product.status == ProductStatus.ACTIVE,
        Product.is_featured == True
    ).order_by(Product.created_at.desc()).limit(limit).all()
    
    return [get_product_with_stats(p, db) for p in products]


@router.get("/new-arrivals", response_model=List[ProductResponse])
async def get_new_arrivals(
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
):
    products = db.query(Product).options(
        joinedload(Product.seller),
        joinedload(Product.category)
    ).filter(
        Product.status == ProductStatus.ACTIVE
    ).order_by(Product.created_at.desc()).limit(limit).all()
    
    return [get_product_with_stats(p, db) for p in products]


@router.get("/trending", response_model=List[ProductResponse])
async def get_trending_products(
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
):
    products = db.query(Product).options(
        joinedload(Product.seller),
        joinedload(Product.category)
    ).filter(
        Product.status == ProductStatus.ACTIVE
    ).order_by(Product.download_count.desc()).limit(limit).all()
    
    return [get_product_with_stats(p, db) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    product = db.query(Product).options(
        joinedload(Product.seller),
        joinedload(Product.category)
    ).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.status != ProductStatus.ACTIVE:
        if not current_user or (current_user.id != product.seller_id and current_user.role != UserRole.ADMIN):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
    
    product.view_count += 1
    db.commit()
    
    return get_product_with_stats(product, db)


@router.get("/slug/{slug}", response_model=ProductResponse)
async def get_product_by_slug(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    product = db.query(Product).options(
        joinedload(Product.seller),
        joinedload(Product.category)
    ).filter(Product.slug == slug).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.status != ProductStatus.ACTIVE:
        if not current_user or (current_user.id != product.seller_id and current_user.role != UserRole.ADMIN):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
    
    product.view_count += 1
    db.commit()
    
    return get_product_with_stats(product, db)


@router.post("", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.SELLER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can create products"
        )
    
    slug = product_data.slug or generate_slug(product_data.name)
    existing = db.query(Product).filter(Product.slug == slug).first()
    if existing:
        slug = f"{slug}-{current_user.id}"
    
    if product_data.category_id:
        category = db.query(Category).filter(Category.id == product_data.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    product = Product(
        seller_id=current_user.id,
        name=product_data.name,
        slug=slug,
        description=product_data.description,
        short_description=product_data.short_description,
        price=product_data.price,
        original_price=product_data.original_price,
        category_id=product_data.category_id,
        product_type=product_data.product_type,
        license_type=product_data.license_type,
        status=product_data.status,
        image_url=product_data.image_url,
        images=product_data.images,
        version=product_data.version,
        demo_url=product_data.demo_url,
        documentation_url=product_data.documentation_url,
        features=product_data.features,
        requirements=product_data.requirements
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return get_product_with_stats(product, db)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.seller_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own products"
        )
    
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return get_product_with_stats(product, db)


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.seller_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own products"
        )
    
    db.delete(product)
    db.commit()
    
    return {"message": "Product deleted successfully"}
