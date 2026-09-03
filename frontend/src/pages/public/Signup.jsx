import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, User, Mail, Lock, Briefcase, Loader2 } from 'lucide-react';
import { Button, Input, Select } from '@/components';
import { ROUTES, DEFAULT_TARGET_ROLES } from '@/utils/constants';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';

export default function Signup() {
  useDocumentTitle('Create Candidate Account');
  const navigate = useNavigate();
  const notify = useNotification();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    targetRole: DEFAULT_TARGET_ROLES[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      notify.error('Passwords do not match. Please check again.');
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        targetRole: formData.targetRole,
      });
      notify.success('Account created successfully! Welcome to Ideal Skillset.');
      navigate(ROUTES.USER_DASHBOARD);
    } catch (err) {
      notify.error(err.message || 'Registration failed. Please try again.');
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
          Create your Ideal Skillset account
        </h2>
        <p className="mt-2 text-xs text-slate-600">
          Begin your journey toward career readiness and AI-guided skill validation
        </p>
      </div>

      {/* Signup Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
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
              label="Target Career Role"
              icon={Briefcase}
              options={DEFAULT_TARGET_ROLES}
              value={formData.targetRole}
              onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
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

            {/* Create Account Button */}
            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full justify-center" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </form>

          {/* Already have an account */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} className="font-semibold text-brand-600 hover:text-brand-700">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
