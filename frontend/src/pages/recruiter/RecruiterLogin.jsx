import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, ArrowRight, Loader2, Sparkles, User, ShieldCheck } from 'lucide-react';
import { Button, ThemeToggle } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';

export default function RecruiterLogin() {
  useDocumentTitle('Recruiter & Employer Login');
  const navigate = useNavigate();
  const notify = useNotification();
  const { recruiterLogin } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await recruiterLogin({ email: formData.email, password: formData.password });
      notify.success('Signed in to Recruiter Portal! Welcome.');
      navigate(ROUTES.RECRUITER_DASHBOARD);
    } catch (err) {
      notify.error(err.message || 'Recruiter login failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseDemoCredentials = () => {
    setFormData({
      email: 'recruiter@techhire.io',
      password: 'Recruiter1234!',
    });
    notify.info('Demo recruiter credentials prefilled!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">
      {/* Top Right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle size="sm" />
      </div>

      {/* Recruiter Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to={ROUTES.HOME} className="inline-flex items-center space-x-2.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Building2 className="w-7 h-7" />
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Recruiter & Employer Portal
        </h2>
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
          Discover candidates with verified skills, 5D Readiness Twins, and code proof
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:px-10 transition-colors duration-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="recruiterEmail" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Corporate / Work Email
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="recruiterEmail"
                  name="recruiterEmail"
                  type="email"
                  required
                  placeholder="recruiter@techhire.io"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="recruiterPassword" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="recruiterPassword"
                  name="recruiterPassword"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl shadow-md shadow-indigo-600/20"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In as Recruiter'
                )}
              </Button>
            </div>
          </form>

          {/* Demo Credentials Helper */}
          <div className="mt-4 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 flex items-center justify-between text-xs">
            <span className="text-indigo-950 dark:text-indigo-200 font-medium">Quick Demo Access:</span>
            <button
              type="button"
              onClick={handleUseDemoCredentials}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Fill Demo Login
            </button>
          </div>

          {/* Recruiter Sign Up Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              New hiring organization?{' '}
              <Link to={ROUTES.RECRUITER_SIGNUP} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Create Recruiter Account
              </Link>
            </p>
          </div>
        </div>

        {/* Portal Switcher Links */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>Candidate Login</span>
          </Link>
          <Link
            to={ROUTES.ADMIN_LOGIN}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Admin Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

