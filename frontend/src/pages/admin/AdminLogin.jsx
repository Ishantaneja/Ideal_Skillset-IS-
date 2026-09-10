import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { Button, ThemeToggle } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';

export default function AdminLogin() {
  useDocumentTitle('Admin Portal Login');
  const navigate = useNavigate();
  const notify = useNotification();
  const { adminLogin } = useAuth();

  const [formData, setFormData] = useState({
    email: 'admin@careergps.internal',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminLogin({ email: formData.email, password: formData.password });
      notify.success('Administrator authorization verified');
      navigate(ROUTES.ADMIN_DASHBOARD);
    } catch (err) {
      notify.error(err.message || 'Admin authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">
      {/* Top Right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle size="sm" />
      </div>

      {/* Admin Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-500 shadow-lg mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Ideal Skillset Admin Portal
        </h2>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          Authorized personnel and administrator access only
        </p>
      </div>

      {/* Admin Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:px-10 transition-colors duration-200">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="adminEmail" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Email
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  required
                  placeholder="admin@careergps.internal"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="adminPassword" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="adminPassword"
                  name="adminPassword"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="danger"
                className="w-full justify-center bg-red-600 hover:bg-red-700"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Admin Login'
                )}
              </Button>
            </div>
          </form>

          {/* Return link */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center space-x-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back Home</span>
            </Link>
            <Link
              to={ROUTES.RECRUITER_LOGIN}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Recruiter Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
