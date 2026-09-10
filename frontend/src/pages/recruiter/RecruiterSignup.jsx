import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User, Briefcase, Loader2, ArrowLeft } from 'lucide-react';
import { Button, ThemeToggle } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';

export default function RecruiterSignup() {
  useDocumentTitle('Create Recruiter & Employer Account');
  const navigate = useNavigate();
  const notify = useNotification();
  const { recruiterSignup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company_name: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      notify.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await recruiterSignup({
        name: formData.name,
        email: formData.email,
        company_name: formData.company_name,
        password: formData.password,
      });
      notify.success('Recruiter account created successfully! Welcome.');
      navigate(ROUTES.RECRUITER_DASHBOARD);
    } catch (err) {
      notify.error(err.message || 'Registration failed. Please try again.');
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

      {/* Recruiter Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to={ROUTES.HOME} className="inline-flex items-center space-x-2.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Building2 className="w-7 h-7" />
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Register Employer Account
        </h2>
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
          Source, evaluate, and hire verified high-readiness technical talent
        </p>
      </div>

      {/* Signup Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:px-10 transition-colors duration-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recruiter / Hiring Manager Name
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Sarah Jenkins"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="company" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company / Organization Name
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Briefcase className="w-4 h-4" />
                </div>
                <input
                  id="company"
                  type="text"
                  required
                  placeholder="Acme Corp / TechHire Global"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Corporate Work Email
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="sarah@acme.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password (min 6 characters)
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
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
                    Creating Account...
                  </>
                ) : (
                  'Create Recruiter Account'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Already have a recruiter account?{' '}
              <Link to={ROUTES.RECRUITER_LOGIN} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

