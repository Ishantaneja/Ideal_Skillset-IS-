import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  User,
  Mail,
  Lock,
  Briefcase,
  Loader2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Button, Input, Select, ThemeToggle } from '@/components';
import { ROUTES, DEFAULT_TARGET_ROLES } from '@/utils/constants';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';

export default function Signup() {
  useDocumentTitle('Create Candidate Account');
  const navigate = useNavigate();
  const notify = useNotification();
  const { signup } = useAuth();

  // Form inputs
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    targetRole: DEFAULT_TARGET_ROLES[0],
  });

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      notify.error('Passwords do not match. Please verify.');
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      notify.error('Password must be at least 6 characters long.');
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        targetRole: formData.targetRole,
      });

      notify.success('Account created successfully! Welcome to Ideal Skillset.');
      navigate(ROUTES.USER_DASHBOARD);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200 relative">
      {/* Top Right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle size="sm" />
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to={ROUTES.HOME} className="inline-flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-primary-600 flex items-center justify-center text-white shadow-md">
            <Compass className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ideal Skillset</span>
        </Link>
        <h2 className="mt-6 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create your Candidate Account
        </h2>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          Begin your journey toward career readiness and AI-guided skill validation
        </p>
      </div>

      {/* Main Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:px-10 transition-colors duration-200">
          {/* Error Alert Box */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              id="fullName"
              label="Full Name"
              type="text"
              required
              placeholder="Alex Morgan"
              icon={User}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />

            <Input
              id="email"
              label="Email Address"
              type="email"
              required
              placeholder="candidate@university.edu"
              icon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Select
              id="targetRole"
              label="Target Career Track"
              icon={Briefcase}
              options={DEFAULT_TARGET_ROLES}
              value={formData.targetRole}
              onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
            />

            <Input
              id="password"
              label="Password (min 6 characters)"
              type="password"
              required
              placeholder="••••••••"
              icon={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              required
              placeholder="••••••••"
              icon={Lock}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center text-sm font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Already have an account */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
