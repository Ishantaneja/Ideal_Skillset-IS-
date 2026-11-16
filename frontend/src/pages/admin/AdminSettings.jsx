
import React, { useState } from 'react';
import {
  User,
  Lock,
  Shield,
  Monitor,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services';

export default function AdminSettings() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    type: '',
    text: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    setMessage({ type: '', text: '' });
  };

  const togglePassword = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const { current_password, new_password, confirm_password } = formData;

    if (!current_password || !new_password || !confirm_password) {
      setMessage({
        type: 'error',
        text: 'Please fill in all password fields.'
      });
      return;
    }

    if (new_password !== confirm_password) {
      setMessage({
        type: 'error',
        text: 'New password and confirm password do not match.'
      });
      return;
    }

    if (new_password.length < 8 || new_password.length > 72) {
      setMessage({
        type: 'error',
        text: 'Password must contain 8 to 72 characters.'
      });
      return;
    }

    if (
      new_password.trim() !== new_password ||
      !/[A-Z]/.test(new_password) ||
      !/[a-z]/.test(new_password) ||
      !/[0-9]/.test(new_password)
    ) {
      setMessage({
        type: 'error',
        text: 'Password must contain uppercase, lowercase and a number, without leading or trailing spaces.'
      });
      return;
    }

    try {
      setLoading(true);

      const response = await adminService.changeAdminPassword({
        current_password,
        new_password
      });

      setMessage({
        type: 'success',
        text: response.message || 'Password changed successfully.'
      });

      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error.response?.data?.detail ||
          'Unable to change password. Please check your current password.'
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordField = (label, name, visibilityKey) => (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={showPasswords[visibilityKey] ? 'text' : 'password'}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-12 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />

        <button
          type="button"
          onClick={() => togglePassword(visibilityKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
          aria-label={`Toggle ${label} visibility`}
        >
          {showPasswords[visibilityKey] ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Admin Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your admin account and system preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* Admin Profile */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <User className="mb-3 h-6 w-6 text-red-600" />

          <h2 className="font-bold text-slate-900">
            Admin Profile
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <p className="text-slate-600">
              <span className="font-semibold text-slate-800">Name:</span>{' '}
              {user?.name || 'Not available'}
            </p>

            <p className="text-slate-600">
              <span className="font-semibold text-slate-800">Email:</span>{' '}
              {user?.email || 'Not available'}
            </p>

            <p className="text-slate-600">
              <span className="font-semibold text-slate-800">Role:</span>{' '}
              {user?.role || 'Admin'}
            </p>

            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Administrator Account
            </span>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Lock className="h-6 w-6 text-red-600" />

            <h2 className="font-bold text-slate-900">
              Change Password
            </h2>
          </div>

          <p className="mb-5 text-sm text-slate-500">
            Update your administrator account password.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">

            {passwordField(
              'Current Password',
              'current_password',
              'current'
            )}

            {passwordField(
              'New Password',
              'new_password',
              'new'
            )}

            {passwordField(
              'Confirm New Password',
              'confirm_password',
              'confirm'
            )}

            {/* Password Requirements */}
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p className="mb-2 font-semibold text-slate-800">
                Password Requirements
              </p>

              <ul className="list-inside list-disc space-y-1">
                <li>8 to 72 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one lowercase letter</li>
                <li>At least one number</li>
                <li>No leading or trailing spaces</li>
              </ul>
            </div>

            {/* Success / Error Message */}
            {message.text && (
              <div
                className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle size={18} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                )}

                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound size={17} />

              {loading ? 'Updating Password...' : 'Update Password'}
            </button>

          </form>
        </div>

        {/* Security */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Shield className="mb-3 h-6 w-6 text-red-600" />

          <h2 className="font-bold text-slate-900">
            Security
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Your account uses JWT-based authentication to protect
            administrator-only resources.
          </p>

          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle size={17} />
              Authentication Enabled
            </div>

            <p className="mt-1 text-xs">
              Protected admin access is enabled.
            </p>
          </div>
        </div>

        {/* System Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Monitor className="mb-3 h-6 w-6 text-red-600" />

          <h2 className="font-bold text-slate-900">
            System Information
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Application and platform information.
          </p>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Application</span>
              <span className="font-medium text-slate-800">
                Ideal Skillset
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Portal</span>
              <span className="font-medium text-slate-800">
                Admin Portal
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Authentication</span>
              <span className="font-medium text-green-600">
                JWT
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Backend</span>
              <span className="font-medium text-slate-800">
                FastAPI
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Database</span>
              <span className="font-medium text-slate-800">
                MongoDB
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
