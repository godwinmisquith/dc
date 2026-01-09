import { Link } from 'react-router-dom';
import { Package, Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">SoftMarket</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              The premier marketplace for software companies to sell their services, tools, and software products.
            </p>
            <div className="mt-4 flex gap-4">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">Products</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/products?product_type=software" className="text-sm text-gray-600 hover:text-blue-600">
                  Software
                </Link>
              </li>
              <li>
                <Link to="/products?product_type=tool" className="text-sm text-gray-600 hover:text-blue-600">
                  Tools
                </Link>
              </li>
              <li>
                <Link to="/products?product_type=service" className="text-sm text-gray-600 hover:text-blue-600">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/products?product_type=subscription" className="text-sm text-gray-600 hover:text-blue-600">
                  Subscriptions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">Company</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/about" className="text-sm text-gray-600 hover:text-blue-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-blue-600">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm text-gray-600 hover:text-blue-600">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-gray-600 hover:text-blue-600">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">Support</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/help" className="text-sm text-gray-600 hover:text-blue-600">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-gray-600 hover:text-blue-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-600 hover:text-blue-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/seller-guide" className="text-sm text-gray-600 hover:text-blue-600">
                  Seller Guide
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} SoftMarket. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
