import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Download, ExternalLink, Check, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import type { Product, Review } from '../types';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const productData = await api.getProductBySlug(slug);
        setProduct(productData);
        const reviewsData = await api.getProductReviews(productData.id);
        setReviews(reviewsData);
        if (isAuthenticated) {
          const wishlistStatus = await api.checkWishlist(productData.id);
          setIsInWishlist(wishlistStatus.in_wishlist);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [slug, isAuthenticated]);

  const handleAddToCart = async () => {
    if (!product || !isAuthenticated) return;
    setIsAddingToCart(true);
    try {
      await addToCart(product.id);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product || !isAuthenticated) return;
    try {
      if (isInWishlist) {
        await api.removeFromWishlist(product.id);
        setIsInWishlist(false);
      } else {
        await api.addToWishlist(product.id);
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !isAuthenticated) return;
    setIsSubmittingReview(true);
    try {
      const newReview = await api.createReview(product.id, {
        rating: reviewRating,
        title: reviewTitle || undefined,
        comment: reviewComment || undefined,
      });
      setReviews([newReview, ...reviews]);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="aspect-video bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="h-10 w-48 bg-gray-200 rounded" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <Link to="/products">
          <Button className="mt-4">Browse Products</Button>
        </Link>
      </div>
    );
  }

  const features = product.features?.split(',').map(f => f.trim()) || [];
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/products" className="hover:text-blue-600">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/products?category_slug=${product.category.slug}`} className="hover:text-blue-600">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No image available
              </div>
            )}
            {discount > 0 && (
              <Badge className="absolute left-4 top-4 bg-red-500 text-lg">
                -{discount}% OFF
              </Badge>
            )}
          </div>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="outline">{product.product_type}</Badge>
            <Badge variant="secondary">{product.license_type}</Badge>
            {product.version && <Badge variant="outline">v{product.version}</Badge>}
          </div>

          <h1 className="mb-2 text-3xl font-bold text-gray-900">{product.name}</h1>

          {product.seller && (
            <p className="mb-4 text-gray-600">
              by <span className="font-medium">{product.seller.company_name || product.seller.name}</span>
            </p>
          )}

          <div className="mb-4 flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(product.average_rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600">
              {product.average_rating.toFixed(1)} ({product.review_count} reviews)
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">
              <Download className="mr-1 inline h-4 w-4" />
              {product.download_count.toLocaleString()} downloads
            </span>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.original_price && (
                <span className="text-xl text-gray-500 line-through">
                  ${product.original_price.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {product.license_type === 'subscription' ? 'per month' : 'one-time purchase'}
            </p>
          </div>

          {product.short_description && (
            <p className="mb-6 text-gray-700">{product.short_description}</p>
          )}

          <div className="mb-6 flex gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
                <Button
                  size="lg"
                  variant={isInWishlist ? 'default' : 'outline'}
                  onClick={handleToggleWishlist}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
                </Button>
              </>
            ) : (
              <Link to="/login" className="flex-1">
                <Button size="lg" className="w-full">
                  Login to Purchase
                </Button>
              </Link>
            )}
          </div>

          {(product.demo_url || product.documentation_url) && (
            <div className="flex gap-4">
              {product.demo_url && (
                <a href={product.demo_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Live Demo
                  </Button>
                </a>
              )}
              {product.documentation_url && (
                <a href={product.documentation_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Documentation
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="description" className="mt-12">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({product.review_count})</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <Card>
            <CardContent className="prose max-w-none p-6">
              <p className="whitespace-pre-wrap text-gray-700">
                {product.description || 'No description available.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <Card>
            <CardContent className="p-6">
              {features.length > 0 ? (
                <ul className="grid gap-3 md:grid-cols-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No features listed.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <p className="whitespace-pre-wrap text-gray-700">
                {product.requirements || 'No specific requirements listed.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-6">
            {isAuthenticated && (
              <Card>
                <CardHeader>
                  <CardTitle>Write a Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <Label>Rating</Label>
                      <div className="mt-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= reviewRating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="review-title">Title (optional)</Label>
                      <input
                        id="review-title"
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="Summarize your experience"
                      />
                    </div>
                    <div>
                      <Label htmlFor="review-comment">Review (optional)</Label>
                      <Textarea
                        id="review-comment"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this product"
                        rows={4}
                      />
                    </div>
                    <Button type="submit" disabled={isSubmittingReview}>
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          {review.is_verified_purchase && (
                            <Badge variant="secondary" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="mb-1 font-semibold">{review.title}</h4>
                      )}
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        by {review.user?.name || 'Anonymous'}
                      </p>
                      {review.seller_response && (
                        <div className="mt-4 rounded-lg bg-gray-50 p-4">
                          <p className="text-sm font-medium text-gray-900">Seller Response:</p>
                          <p className="text-sm text-gray-700">{review.seller_response}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-600">
                  No reviews yet. Be the first to review this product!
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
