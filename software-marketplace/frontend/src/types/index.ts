export type UserRole = 'buyer' | 'seller' | 'admin';
export type ProductStatus = 'active' | 'inactive' | 'draft';
export type ProductType = 'software' | 'tool' | 'service' | 'subscription';
export type LicenseType = 'perpetual' | 'subscription' | 'freemium' | 'free';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'refunded';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  company_name?: string;
  company_description?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  created_at: string;
  children?: Category[];
  product_count?: number;
}

export interface SellerInfo {
  id: number;
  name: string;
  company_name?: string;
  avatar_url?: string;
}

export interface Product {
  id: number;
  seller_id: number;
  category_id?: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  original_price?: number;
  product_type: ProductType;
  license_type: LicenseType;
  status: ProductStatus;
  image_url?: string;
  images?: string;
  version?: string;
  demo_url?: string;
  documentation_url?: string;
  features?: string;
  requirements?: string;
  is_featured: boolean;
  download_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  seller?: SellerInfo;
  category?: Category;
  average_rating: number;
  review_count: number;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ReviewerInfo {
  id: number;
  name: string;
  avatar_url?: string;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title?: string;
  comment?: string;
  helpful_count: number;
  seller_response?: string;
  is_verified_purchase: boolean;
  created_at: string;
  user?: ReviewerInfo;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
  created_at: string;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  subtotal: number;
  item_count: number;
  created_at: string;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  product: Product;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  license_key?: string;
  download_url?: string;
  product?: Product;
}

export interface Order {
  id: number;
  buyer_id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method?: string;
  payment_status: string;
  billing_name?: string;
  billing_email?: string;
  billing_address?: string;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  page_size: number;
}

export interface SellerAnalytics {
  total_products: number;
  active_products: number;
  total_orders: number;
  total_revenue: number;
  average_rating: number;
  total_reviews: number;
}

export interface SellerOrder {
  id: number;
  order_number: string;
  buyer_name: string;
  buyer_email: string;
  product_name: string;
  quantity: number;
  price: number;
  status: OrderStatus;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface ProductFilters {
  page?: number;
  page_size?: number;
  category_id?: number;
  category_slug?: string;
  product_type?: ProductType;
  license_type?: LicenseType;
  min_price?: number;
  max_price?: number;
  search?: string;
  sort_by?: 'created_at' | 'price' | 'name' | 'rating' | 'downloads';
  sort_order?: 'asc' | 'desc';
  featured_only?: boolean;
}
