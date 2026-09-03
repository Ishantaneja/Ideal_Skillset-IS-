import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserLayout, AdminLayout } from '@/layouts';
import { ProtectedRoute, LoadingSpinner } from '@/components';
import { ROUTES } from '@/utils/constants';

// Lazy-loaded Public Pages
const Landing = lazy(() => import('@/pages/public/Landing'));
const Login = lazy(() => import('@/pages/public/Login'));
const Signup = lazy(() => import('@/pages/public/Signup'));
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));

// Lazy-loaded Candidate User Pages
const UserDashboard = lazy(() => import('@/pages/user/UserDashboard'));
const Profile = lazy(() => import('@/pages/user/Profile'));
const ResumeAnalysis = lazy(() => import('@/pages/user/ResumeAnalysis'));
const JobAnalysis = lazy(() => import('@/pages/user/JobAnalysis'));
const ATSAnalyzer = lazy(() => import('@/pages/user/ATSAnalyzer'));
const SkillGap = lazy(() => import('@/pages/user/SkillGap'));
const Roadmap = lazy(() => import('@/pages/user/Roadmap'));
const Assessment = lazy(() => import('@/pages/user/Assessment'));
const Interview = lazy(() => import('@/pages/user/Interview'));
const ReadinessTwin = lazy(() => import('@/pages/user/ReadinessTwin'));

// Lazy-loaded Admin Pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Loading Ideal Skillset module..." />}>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.HOME} element={<Landing />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.SIGNUP} element={<Signup />} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLogin />} />

        {/* User Application Routes (Wrapped with UserLayout & ProtectedRoute) */}
        <Route
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.USER_DASHBOARD} element={<UserDashboard />} />
          <Route path={ROUTES.PROFILE} element={<Profile />} />
          <Route path={ROUTES.RESUME} element={<ResumeAnalysis />} />
          <Route path={ROUTES.JOB_ANALYSIS} element={<JobAnalysis />} />
          <Route path={ROUTES.ATS} element={<ATSAnalyzer />} />
          <Route path={ROUTES.SKILL_GAP} element={<SkillGap />} />
          <Route path={ROUTES.ROADMAP} element={<Roadmap />} />
          <Route path={ROUTES.ASSESSMENT} element={<Assessment />} />
          <Route path={ROUTES.INTERVIEW} element={<Interview />} />
          <Route path={ROUTES.READINESS} element={<ReadinessTwin />} />
        </Route>

        {/* Admin Application Routes (Wrapped with AdminLayout & ProtectedRoute) */}
        <Route
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </Suspense>
  );
}
