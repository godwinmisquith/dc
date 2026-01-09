import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Cloud, Code, Palette, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ProductCard } from '../components/ProductCard';
import type { Product, Category } from '../types';
import api from '../api/client';

export function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, arrivals, trending, cats] = await Promise.all([
          api.getFeaturedProducts(8),
          api.getNewArrivals(8),
          api.getTrendingProducts(8),
          api.getCategories(),
        ]);
        setFeaturedProducts(featured);
        setNewArrivals(arrivals);
        setTrendingProducts(trending);
        setCategories(cats);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const categoryIcons: Record<string, React.ReactNode> = {
    'development-tools': <Code className="h-8 w-8" />,
    'security-privacy': <Shield className="h-8 w-8" />,
    'cloud-services': <Cloud className="h-8 w-8" />,
    'design-creative': <Palette className="h-8 w-8" />,
    'ai-machine-learning': <Zap className="h-8 w-8" />,
    'marketing-tools': <TrendingUp className="h-8 w-8" />,
  };

  return (
    <div>
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              Discover Premium Software Solutions
            </h1>
            <p className="mb-8 text-lg text-blue-100 md:text-xl">
              The marketplace for software companies to sell their services, tools, and software products. Find the perfect solution for your business.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link to="/products">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/register?role=seller">
                <Button size="lg" variant="outline" className="w-full border-white text-white hover:bg-white hover:text-blue-600 sm:w-auto">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 md:text-3xl">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
            {categories.slice(0, 8).map((category) => (
              <Link key={category.id} to={`/products?category_slug=${category.slug}`}>
                <Card className="group h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col items-center p-4 text-center">
                    <div className="mb-3 rounded-full bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-100">
                      {categoryIcons[category.slug] || <Code className="h-8 w-8" />}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {category.product_count} products
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                Featured Products
              </h2>
              <Link to="/products?featured_only=true">
                <Button variant="ghost">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {trendingProducts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                Trending Now
              </h2>
              <Link to="/products?sort_by=downloads&sort_order=desc">
                <Button variant="ghost">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trendingProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                New Arrivals
              </h2>
              <Link to="/products?sort_by=created_at&sort_order=desc">
                <Button variant="ghost">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-blue-600 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-2xl font-bold md:text-3xl">
              Ready to Start Selling?
            </h2>
            <p className="mb-8 text-blue-100">
              Join thousands of software companies already selling on SoftMarket. Reach millions of potential customers worldwide.
            </p>
            <Link to="/register?role=seller">
              <Button size="lg" variant="secondary">
                Become a Seller
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
