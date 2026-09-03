import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Menu, X } from 'lucide-react';
import Button from '../common/Button';
import { ROUTES } from '@/utils/constants';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '/#features' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'About', href: '/#about' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to={ROUTES.HOME} className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-primary-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">Ideal Skillset</span>
              <span className="text-[10px] font-medium tracking-wide text-brand-600 uppercase">AI Readiness</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to={ROUTES.SIGNUP}>
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 rounded-md"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2">
            <Link to={ROUTES.LOGIN} onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center" size="sm">
                Login
              </Button>
            </Link>
            <Link to={ROUTES.SIGNUP} onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full justify-center" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

