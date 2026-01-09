import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { ProductCard } from '../components/ProductCard';
import type { Product, Category, ProductFilters, ProductType, LicenseType } from '../types';
import api from '../api/client';

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const categorySlug = searchParams.get('category_slug') || '';
  const productType = searchParams.get('product_type') as ProductType | undefined;
  const licenseType = searchParams.get('license_type') as LicenseType | undefined;
  const minPrice = searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined;
  const maxPrice = searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined;
  const sortBy = searchParams.get('sort_by') || 'created_at';
  const sortOrder = searchParams.get('sort_order') || 'desc';
  const featuredOnly = searchParams.get('featured_only') === 'true';

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const filters: ProductFilters = {
          page,
          page_size: 12,
          search: search || undefined,
          category_slug: categorySlug || undefined,
          product_type: productType,
          license_type: licenseType,
          min_price: minPrice,
          max_price: maxPrice,
          sort_by: sortBy as ProductFilters['sort_by'],
          sort_order: sortOrder as ProductFilters['sort_order'],
          featured_only: featuredOnly,
        };
        const response = await api.getProducts(filters);
        setProducts(response.products);
        setTotal(response.total);
        setTotalPages(response.total_pages);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [page, search, categorySlug, productType, licenseType, minPrice, maxPrice, sortBy, sortOrder, featuredOnly]);

  const updateFilter = (key: string, value: string | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {search ? `Search results for "${search}"` : 'All Products'}
          </h1>
          <p className="text-gray-600">{total} products found</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [newSortBy, newSortOrder] = value.split('-');
            updateFilter('sort_by', newSortBy);
            updateFilter('sort_order', newSortOrder);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="downloads-desc">Most Popular</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className={`w-64 shrink-0 ${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => updateFilter('category_slug', undefined)}
                  className={`block w-full text-left text-sm ${!categorySlug ? 'font-medium text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => updateFilter('category_slug', category.slug)}
                    className={`block w-full text-left text-sm ${categorySlug === category.slug ? 'font-medium text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {category.name} ({category.product_count})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Product Type</h3>
              <div className="space-y-2">
                {['software', 'tool', 'service', 'subscription'].map((type) => (
                  <div key={type} className="flex items-center">
                    <Checkbox
                      id={`type-${type}`}
                      checked={productType === type}
                      onCheckedChange={(checked) => updateFilter('product_type', checked ? type : undefined)}
                    />
                    <Label htmlFor={`type-${type}`} className="ml-2 text-sm capitalize">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-gray-900">License Type</h3>
              <div className="space-y-2">
                {['perpetual', 'subscription', 'freemium', 'free'].map((type) => (
                  <div key={type} className="flex items-center">
                    <Checkbox
                      id={`license-${type}`}
                      checked={licenseType === type}
                      onCheckedChange={(checked) => updateFilter('license_type', checked ? type : undefined)}
                    />
                    <Label htmlFor={`license-${type}`} className="ml-2 text-sm capitalize">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Price Range</h3>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice || ''}
                  onChange={(e) => updateFilter('min_price', e.target.value || undefined)}
                  className="w-24"
                />
                <span className="text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice || ''}
                  onChange={(e) => updateFilter('max_price', e.target.value || undefined)}
                  className="w-24"
                />
              </div>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="featured"
                checked={featuredOnly}
                onCheckedChange={(checked) => updateFilter('featured_only', checked ? 'true' : undefined)}
              />
              <Label htmlFor="featured" className="ml-2 text-sm">
                Featured Only
              </Label>
            </div>

            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </aside>

        <main className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-600">No products found matching your criteria.</p>
              <Button variant="link" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => updateFilter('page', String(page - 1))}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => updateFilter('page', String(page + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
