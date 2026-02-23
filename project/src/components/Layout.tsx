import { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { List, X, BarChart3, MessageSquare, Info, MapIcon } from 'lucide-react';

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prev || '';
    }
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [mobileMenuOpen]);
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <header className="bg-gradient-to-r from-[#2563eb] to-[#fb923c] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Fulton Care Connect" className="h-28 w-28 object-contain" />
              <span className="text-xl font-bold text-white">Fulton Care Connect</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-white hover:text-white/80 transition-colors font-medium">Home</Link>
              <Link to="/directory" className="text-white hover:text-white/80 transition-colors font-medium">Directory</Link>
              <Link to="/map" className="text-white hover:text-white/80 transition-colors font-medium">Map</Link>
              <Link to="/ai" className="text-white hover:text-white/80 transition-colors font-medium">AI Help</Link>
              <Link to="/about" className="text-white hover:text-white/80 transition-colors font-medium">About</Link>
            </nav>

            {/* Hamburger for Mobile */}
            <nav className="flex md:hidden">
              <button className="p-2" aria-label="Open menu" onClick={() => setMobileMenuOpen(true)}>
                <List className="w-6 h-6 text-white" />
              </button>
            </nav>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[10000] bg-black/40 flex justify-end md:hidden">
            <div className="w-64 bg-white h-full shadow-lg flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <span className="text-lg font-bold text-[#2563eb]">Menu</span>
                <button className="p-2" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-gray-700" />
                </button>
              </div>
              <nav className="flex flex-col gap-4 p-4">
                <Link to="/" className="text-gray-800 font-medium" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                <Link to="/directory" className="text-gray-800 font-medium" onClick={() => setMobileMenuOpen(false)}>Directory</Link>
                <Link to="/map" className="text-gray-800 font-medium" onClick={() => setMobileMenuOpen(false)}>Map</Link>
                <Link to="/ai" className="text-gray-800 font-medium" onClick={() => setMobileMenuOpen(false)}>AI Help</Link>
                <Link to="/about" className="text-gray-800 font-medium" onClick={() => setMobileMenuOpen(false)}>About</Link>
              </nav>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Prevent background scrolling when mobile menu open */}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Fulton Care Connect</h3>
              <p className="text-sm text-gray-600">
                Connecting Fulton County residents with free and low-cost community resources.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/directory" className="text-gray-600 hover:text-[#2563eb]">
                    Browse Directory
                  </Link>
                </li>
                <li>
                  <Link to="/map" className="text-gray-600 hover:text-[#2563eb]">
                    View Map
                  </Link>
                </li>
                <li>
                  <Link to="/ai" className="text-gray-600 hover:text-[#2563eb]">
                    Ask AI for Help
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-600 hover:text-[#2563eb]">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Emergency Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Crisis/Mental Health: <strong>988</strong></li>
                <li>Emergency Services: <strong>911</strong></li>
                <li>Community Resources: <strong>211</strong></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-sm text-gray-600">
            <p className="mb-2">
              <strong>Disclaimer:</strong> This directory is for informational purposes only.
              Always call providers directly to confirm hours, eligibility, and services before visiting.
            </p>
            <p>
              Data sources: SKYE, FACAA, DFCS, and community partners.
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
