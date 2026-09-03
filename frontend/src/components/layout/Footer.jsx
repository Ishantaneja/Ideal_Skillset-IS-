import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to={ROUTES.HOME} className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-primary-500 flex items-center justify-center text-white shadow-md">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Ideal Skillset</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Know where you stand. Know what to improve. Know when you're ready.
            </p>
            <div className="pt-2">
              <Link
                to={ROUTES.ADMIN_LOGIN}
                className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to={ROUTES.RESUME} className="hover:text-white transition-colors">Resume Analysis</Link></li>
              <li><Link to={ROUTES.READINESS} className="hover:text-white transition-colors">Readiness Twin</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/#about" className="hover:text-white transition-colors">About</Link></li>
              <li><a href="mailto:contact@careergps.ai" className="hover:text-white transition-colors">Contact</a></li>
              <li><Link to={ROUTES.SIGNUP} className="hover:text-white transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Ideal Skillset — AI Career Readiness Platform. All rights reserved.</p>
          <p className="mt-4 md:mt-0">Designed for academic excellence and industry transition.</p>
        </div>
      </div>
    </footer>
  );
}

