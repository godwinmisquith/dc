import type {
  User,
  Token,
  Category,
  Product,
  ProductListResponse,
  ProductFilters,
  Cart,
  CartItem,
  WishlistItem,
  Order,
  OrderListResponse,
  Review,
  SellerAnalytics,
  SellerOrder,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || 'An error occurred');
    }

    return response.json();
  }

  async register(email: string, password: string, name: string, role: 'buyer' | 'seller' = 'buyer', company_name?: string): Promise<Token> {
    const data = await this.request<Token>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role, company_name }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async login(email: string, password: string): Promise<Token> {
    const data = await this.request<Token>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async updateProfile(data: { name?: string; company_name?: string; company_description?: string; avatar_url?: string }): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async becomeSeller(company_name: string): Promise<User> {
    return this.request<User>(`/auth/become-seller?company_name=${encodeURIComponent(company_name)}`, {
      method: 'POST',
    });
  }

  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories');
  }

  async getCategory(id: number): Promise<Category> {
    return this.request<Category>(`/categories/${id}`);
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    return this.request<Category>(`/categories/slug/${slug}`);
  }

  async getProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    return this.request<ProductListResponse>(`/products?${params.toString()}`);
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return this.request<Product[]>(`/products/featured?limit=${limit}`);
  }

  async getNewArrivals(limit = 8): Promise<Product[]> {
    return this.request<Product[]>(`/products/new-arrivals?limit=${limit}`);
  }

  async getTrendingProducts(limit = 8): Promise<Product[]> {
    return this.request<Product[]>(`/products/trending?limit=${limit}`);
  }

  async getProduct(id: number): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async getProductBySlug(slug: string): Promise<Product> {
    return this.request<Product>(`/products/slug/${slug}`);
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: number): Promise<void> {
    await this.request(`/products/${id}`, { method: 'DELETE' });
  }

  async getCart(): Promise<Cart> {
    return this.request<Cart>('/cart');
  }

  async addToCart(product_id: number, quantity = 1): Promise<CartItem> {
    return this.request<CartItem>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id, quantity }),
    });
  }

  async updateCartItem(item_id: number, quantity: number): Promise<CartItem> {
    return this.request<CartItem>(`/cart/items/${item_id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(item_id: number): Promise<void> {
    await this.request(`/cart/items/${item_id}`, { method: 'DELETE' });
  }

  async clearCart(): Promise<void> {
    await this.request('/cart', { method: 'DELETE' });
  }

  async getWishlist(): Promise<WishlistItem[]> {
    return this.request<WishlistItem[]>('/wishlist');
  }

  async addToWishlist(product_id: number): Promise<WishlistItem> {
    return this.request<WishlistItem>('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id }),
    });
  }

  async removeFromWishlist(product_id: number): Promise<void> {
    await this.request(`/wishlist/${product_id}`, { method: 'DELETE' });
  }

  async checkWishlist(product_id: number): Promise<{ in_wishlist: boolean }> {
    return this.request<{ in_wishlist: boolean }>(`/wishlist/check/${product_id}`);
  }

  async getOrders(page = 1, page_size = 10): Promise<OrderListResponse> {
    return this.request<OrderListResponse>(`/orders?page=${page}&page_size=${page_size}`);
  }

  async getOrder(id: number): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async checkout(data: {
    payment_method?: string;
    billing_name: string;
    billing_email: string;
    billing_address?: string;
    notes?: string;
  }): Promise<Order> {
    return this.request<Order>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProductReviews(product_id: number, page = 1, page_size = 10): Promise<Review[]> {
    return this.request<Review[]>(`/reviews/product/${product_id}?page=${page}&page_size=${page_size}`);
  }

  async createReview(product_id: number, data: { rating: number; title?: string; comment?: string }): Promise<Review> {
    return this.request<Review>(`/reviews/product/${product_id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReview(review_id: number, data: { rating?: number; title?: string; comment?: string }): Promise<Review> {
    return this.request<Review>(`/reviews/${review_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReview(review_id: number): Promise<void> {
    await this.request(`/reviews/${review_id}`, { method: 'DELETE' });
  }

  async markReviewHelpful(review_id: number): Promise<{ helpful_count: number }> {
    return this.request<{ helpful_count: number }>(`/reviews/${review_id}/helpful`, {
      method: 'POST',
    });
  }

  async getSellerAnalytics(): Promise<SellerAnalytics> {
    return this.request<SellerAnalytics>('/seller/analytics');
  }

  async getSellerProducts(status?: string): Promise<Product[]> {
    const params = status ? `?status_filter=${status}` : '';
    return this.request<Product[]>(`/seller/products${params}`);
  }

  async getSellerOrders(page = 1, page_size = 20): Promise<SellerOrder[]> {
    return this.request<SellerOrder[]>(`/seller/orders?page=${page}&page_size=${page_size}`);
  }

  async getSellerReviews(page = 1, page_size = 20): Promise<Review[]> {
    return this.request<Review[]>(`/seller/reviews?page=${page}&page_size=${page_size}`);
  }
}

export const api = new ApiClient();
export default api;
