import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { WishlistItem } from '../types';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Wishlist() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      try {
        const wishlistItems = await api.getWishlist();
        setItems(wishlistItems);
      } catch (error) {
        console.error('Failed to fetch wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWishlist();
  }, [isAuthenticated]);

  const handleRemove = async (productId: number) => {
    try {
      await api.removeFromWishlist(productId);
      setItems(items.filter((item) => item.product_id !== productId));
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart(productId);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Heart className="mx-auto h-16 w-16 text-gray-400" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Please login</h1>
        <p className="mt-2 text-gray-600">Login to view your wishlist</p>
        <Link to="/login">
          <Button className="mt-6">Login</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">My Wishlist</h1>
        <div className="animate-pulse grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Heart className="mx-auto h-16 w-16 text-gray-400" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Your wishlist is empty</h1>
        <p className="mt-2 text-gray-600">Save items you like by clicking the heart icon</p>
        <Link to="/products">
          <Button className="mt-6">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        My Wishlist ({items.length} {items.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.id} className="group overflow-hidden">
            <div className="relative aspect-video overflow-hidden bg-gray-100">
              {item.product.image_url ? (
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No image
                </div>
              )}
              <button
                onClick={() => handleRemove(item.product_id)}
                className="absolute right-2 top-2 rounded-full bg-white p-2 shadow-md hover:bg-red-50"
              >
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              </button>
            </div>
            <CardContent className="p-4">
              <Badge variant="outline" className="mb-2 text-xs">
                {item.product.product_type}
              </Badge>
              <Link to={`/products/${item.product.slug}`}>
                <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900 hover:text-blue-600">
                  {item.product.name}
                </h3>
              </Link>
              {item.product.seller && (
                <p className="mb-2 text-xs text-gray-500">
                  by {item.product.seller.company_name || item.product.seller.name}
                </p>
              )}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  ${item.product.price.toFixed(2)}
                </span>
                {item.product.original_price && (
                  <span className="text-sm text-gray-500 line-through">
                    ${item.product.original_price.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  size="sm"
                  onClick={() => handleAddToCart(item.product_id)}
                >
                  <ShoppingCart className="mr-1 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(item.product_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
