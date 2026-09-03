import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Mail, Lock, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';

export default function Login() {
  useDocumentTitle('Candidate Login');
  const navigate = useNavigate();
  const notify = useNotification();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login({ email: formData.email, password: formData.password });
      notify.success('Signed in successfully! Welcome back.');
      navigate(ROUTES.USER_DASHBOARD);
    } catch (err) {
      notify.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to={ROUTES.HOME} className="inline-flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-primary-600 flex items-center justify-center text-white shadow-md">
            <Compass className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">Ideal Skillset</span>
        </Link>
        <h2 className="mt-6 text-2xl font-extrabold text-slate-900 tracking-tight">
          Welcome back to Ideal Skillset
        </h2>
        <p className="mt-2 text-xs text-slate-600">
          Sign in to access your personalized career readiness dashboard
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
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

            <Input
              id="password"
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              icon={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              rightElement={
                <button
                  type="button"
                  onClick={() => notify.info('Password reset instructions sent to email')}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Forgot Password?
                </button>
              }
            />

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600">
                Remember me for 30 days
              </label>
            </div>

            {/* Login Button */}
            <div>
              <Button type="submit" variant="primary" className="w-full justify-center" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Don't have an account?{' '}
              <Link to={ROUTES.SIGNUP} className="font-semibold text-brand-600 hover:text-brand-700">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Distinct Admin Login Navigation */}
        <div className="mt-6 text-center">
          <Link
            to={ROUTES.ADMIN_LOGIN}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white/80 px-3.5 py-2 rounded-lg border border-slate-200 transition-colors shadow-xs"
          >
            <Shield className="w-3.5 h-3.5 text-slate-600" />
            <span>Admin Portal Login</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
