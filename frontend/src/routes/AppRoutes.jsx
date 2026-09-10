import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserLayout, AdminLayout, RecruiterLayout } from '@/layouts';
import { ProtectedRoute, LoadingSpinner } from '@/components';
import { ROUTES } from '@/utils/constants';

// Lazy-loaded Public Pages
const Landing = lazy(() => import('@/pages/public/Landing'));
const Login = lazy(() => import('@/pages/public/Login'));
const Signup = lazy(() => import('@/pages/public/Signup'));
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const RecruiterLogin = lazy(() => import('@/pages/recruiter/RecruiterLogin'));
const RecruiterSignup = lazy(() => import('@/pages/recruiter/RecruiterSignup'));

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

// Lazy-loaded Recruiter Pages
const RecruiterDashboard = lazy(() => import('@/pages/recruiter/RecruiterDashboard'));
const RecruiterCandidates = lazy(() => import('@/pages/recruiter/RecruiterCandidates'));
const RecruiterShortlist = lazy(() => import('@/pages/recruiter/RecruiterShortlist'));

// Lazy-loaded Admin Pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminResumes = lazy(() => import('@/pages/admin/AdminResumes'));
const AdminJobs = lazy(() => import('@/pages/admin/AdminJobs'));
const AdminATS = lazy(() => import('@/pages/admin/AdminATS'));
const AdminSkills = lazy(() => import('@/pages/admin/AdminSkills'));
const AdminReadiness = lazy(() => import('@/pages/admin/AdminReadiness'));
const AdminAssessments = lazy(() => import('@/pages/admin/AdminAssessments'));
const AdminInterviews = lazy(() => import('@/pages/admin/AdminInterviews'));
const AdminRoadmaps = lazy(() => import('@/pages/admin/AdminRoadmaps'));
const AdminAI = lazy(() => import('@/pages/admin/AdminAI'));
const AdminAuditLogs = lazy(() => import('@/pages/admin/AdminAuditLogs'));
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Loading Ideal Skillset module..." />}>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.HOME} element={<Landing />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.SIGNUP} element={<Signup />} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLogin />} />
        <Route path={ROUTES.RECRUITER_LOGIN} element={<RecruiterLogin />} />
        <Route path={ROUTES.RECRUITER_SIGNUP} element={<RecruiterSignup />} />

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

        {/* Recruiter Application Routes (Wrapped with RecruiterLayout & ProtectedRoute) */}
        <Route
          element={
            <ProtectedRoute requiredRole="recruiter">
              <RecruiterLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.RECRUITER_DASHBOARD} element={<RecruiterDashboard />} />
          <Route path={ROUTES.RECRUITER_CANDIDATES} element={<RecruiterCandidates />} />
          <Route path={ROUTES.RECRUITER_SHORTLIST} element={<RecruiterShortlist />} />
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
          <Route path={ROUTES.ADMIN_USERS} element={<AdminUsers />} />
          <Route path={ROUTES.ADMIN_RESUMES} element={<AdminResumes />} />
          <Route path={ROUTES.ADMIN_JOBS} element={<AdminJobs />} />
          <Route path={ROUTES.ADMIN_ATS} element={<AdminATS />} />
          <Route path={ROUTES.ADMIN_SKILLS} element={<AdminSkills />} />
          <Route path={ROUTES.ADMIN_READINESS} element={<AdminReadiness />} />
          <Route path={ROUTES.ADMIN_ASSESSMENTS} element={<AdminAssessments />} />
          <Route path={ROUTES.ADMIN_INTERVIEWS} element={<AdminInterviews />} />
          <Route path={ROUTES.ADMIN_ROADMAPS} element={<AdminRoadmaps />} />
          <Route path={ROUTES.ADMIN_AI} element={<AdminAI />} />
          <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={<AdminAuditLogs />} />
          <Route path={ROUTES.ADMIN_NOTIFICATIONS} element={<AdminNotifications />} />
          <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettings />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </Suspense>
  );
}
