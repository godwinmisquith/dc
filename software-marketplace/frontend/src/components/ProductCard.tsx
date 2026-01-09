import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/client';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onWishlistChange?: () => void;
}

export function ProductCard({ product, onWishlistChange }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    setIsAddingToCart(true);
    try {
      await addToCart(product.id);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    setIsAddingToWishlist(true);
    try {
      await api.addToWishlist(product.id);
      onWishlistChange?.();
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <Link to={`/products/${product.slug}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No image
            </div>
          )}
          {discount > 0 && (
            <Badge className="absolute left-2 top-2 bg-red-500">
              -{discount}%
            </Badge>
          )}
          {product.is_featured && (
            <Badge className="absolute right-2 top-2 bg-yellow-500">
              Featured
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <div className="mb-2">
            <Badge variant="outline" className="text-xs">
              {product.product_type}
            </Badge>
            {product.category && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {product.category.name}
              </Badge>
            )}
          </div>
          <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900 group-hover:text-blue-600">
            {product.name}
          </h3>
          {product.short_description && (
            <p className="mb-2 line-clamp-2 text-sm text-gray-600">
              {product.short_description}
            </p>
          )}
          {product.seller && (
            <p className="mb-2 text-xs text-gray-500">
              by {product.seller.company_name || product.seller.name}
            </p>
          )}
          <div className="mb-3 flex items-center gap-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(product.average_rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              ({product.review_count})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.original_price && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  ${product.original_price.toFixed(2)}
                </span>
              )}
            </div>
            {isAuthenticated && (
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddToWishlist}
                  disabled={isAddingToWishlist}
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
