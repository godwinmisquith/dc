from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, ProductStatus, ProductType, LicenseType, OrderStatus


class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.BUYER
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str
    role: UserRole = UserRole.BUYER
    company_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryWithChildren(CategoryResponse):
    children: List["CategoryWithChildren"] = []
    product_count: int = 0


class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: float = Field(..., gt=0)
    original_price: Optional[float] = None
    category_id: Optional[int] = None
    product_type: ProductType = ProductType.SOFTWARE
    license_type: LicenseType = LicenseType.PERPETUAL
    image_url: Optional[str] = None
    images: Optional[str] = None
    version: Optional[str] = None
    demo_url: Optional[str] = None
    documentation_url: Optional[str] = None
    features: Optional[str] = None
    requirements: Optional[str] = None


class ProductCreate(ProductBase):
    status: ProductStatus = ProductStatus.DRAFT


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    category_id: Optional[int] = None
    product_type: Optional[ProductType] = None
    license_type: Optional[LicenseType] = None
    status: Optional[ProductStatus] = None
    image_url: Optional[str] = None
    images: Optional[str] = None
    version: Optional[str] = None
    demo_url: Optional[str] = None
    documentation_url: Optional[str] = None
    features: Optional[str] = None
    requirements: Optional[str] = None
    is_featured: Optional[bool] = None


class SellerInfo(BaseModel):
    id: int
    name: str
    company_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: int
    seller_id: int
    category_id: Optional[int] = None
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    product_type: ProductType
    license_type: LicenseType
    status: ProductStatus
    image_url: Optional[str] = None
    images: Optional[str] = None
    version: Optional[str] = None
    demo_url: Optional[str] = None
    documentation_url: Optional[str] = None
    features: Optional[str] = None
    requirements: Optional[str] = None
    is_featured: bool
    download_count: int
    view_count: int
    created_at: datetime
    updated_at: datetime
    seller: Optional[SellerInfo] = None
    category: Optional[CategoryResponse] = None
    average_rating: float = 0
    review_count: int = 0

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None


class ReviewerInfo(BaseModel):
    id: int
    name: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    helpful_count: int
    seller_response: Optional[str] = None
    is_verified_purchase: bool
    created_at: datetime
    user: Optional[ReviewerInfo] = None

    class Config:
        from_attributes = True


class CartItemBase(BaseModel):
    product_id: int
    quantity: int = Field(1, ge=1)


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductResponse
    created_at: datetime

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: int
    user_id: int
    items: List[CartItemResponse]
    subtotal: float
    item_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class WishlistItemCreate(BaseModel):
    product_id: int


class WishlistItemResponse(BaseModel):
    id: int
    product_id: int
    product: ProductResponse
    created_at: datetime

    class Config:
        from_attributes = True


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float
    license_key: Optional[str] = None
    download_url: Optional[str] = None
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    payment_method: str = "card"
    billing_name: str
    billing_email: EmailStr
    billing_address: Optional[str] = None
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    buyer_id: int
    order_number: str
    status: OrderStatus
    subtotal: float
    tax: float
    discount: float
    total: float
    payment_method: Optional[str] = None
    payment_status: str
    billing_name: Optional[str] = None
    billing_email: Optional[str] = None
    billing_address: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
    page: int
    page_size: int


class SellerAnalytics(BaseModel):
    total_products: int
    active_products: int
    total_orders: int
    total_revenue: float
    average_rating: float
    total_reviews: int


class SellerOrderResponse(BaseModel):
    id: int
    order_number: str
    buyer_name: str
    buyer_email: str
    product_name: str
    quantity: int
    price: float
    status: OrderStatus
    created_at: datetime

    class Config:
        from_attributes = True
