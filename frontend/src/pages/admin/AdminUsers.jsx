import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';
import { adminService } from '@/services';
import {
  Users,
  Search,
  Filter,
  Shield,
  Trash2,
  Eye,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Layers,
  Globe,
  AlertTriangle,
  Sparkles,
  FileText
} from 'lucide-react';

export default function AdminUsers() {
  useDocumentTitle('Candidate User Management');
  const notify = useNotification();
  const { user: currentAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [targetRole, setTargetRole] = useState('user');
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadUsers = async (targetPage = page, isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await adminService.getUsers({
        page: targetPage,
        limit: 10,
        search: search.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      });

      setUsers(res.items || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.pages || 1);
      setPage(res.page || 1);
      if (isManual) notify.success('User directory refreshed');
    } catch (err) {
      notify.error(err.message || 'Could not load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers(1);
  };

  const openViewModal = async (u) => {
    try {
      const details = await adminService.getUser(u.id);
      setSelectedUser(details);
      setViewModalOpen(true);
    } catch (err) {
      notify.error(err.message || 'Could not load candidate profile details');
    }
  };

  const handleUpdateRole = async () => {
    if (!roleModalUser) return;
    setSubmittingAction(true);
    try {
      const res = await adminService.updateUserRole(roleModalUser.id, targetRole);
      notify.success(res.message || 'Role updated successfully');
      setRoleModalUser(null);
      loadUsers(page);
    } catch (err) {
      notify.error(err.message || 'Failed to update user role');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    setSubmittingAction(true);
    try {
      const res = await adminService.deleteUser(deleteModalUser.id);
      notify.success(res.message || 'User deleted successfully');
      setDeleteModalUser(null);
      loadUsers(page);
    } catch (err) {
      notify.error(err.message || 'Failed to delete user');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Candidate User Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inspect registered accounts, manage administrator privileges, and audit candidate activity
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            onClick={() => loadUsers(page, true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <Input
              id="search-users"
              placeholder="Search by candidate name, email, or role..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="sm:col-span-4">
            <Select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Roles (Users & Admins)' },
                { value: 'user', label: 'Candidate Users Only' },
                { value: 'admin', label: 'System Administrators Only' },
              ]}
            />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" className="w-full justify-center bg-slate-900 dark:bg-red-600">
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Users Table Card */}
      <Card
        title={`Registered Accounts (${totalCount})`}
        subtitle="Active candidate accounts stored in MongoDB collection User_data"
        bodyClassName="p-0"
      >
        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Querying candidate accounts..." />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            No user accounts found matching your query criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Candidate Name</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Target Role</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Registration Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-xs border border-brand-200 dark:border-brand-800">
                          {u.name?.substring(0, 2).toUpperCase() || 'CA'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-400">ID: {u.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-700 dark:text-slate-300">{u.email}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {u.target_role || 'Junior Data Analyst'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={u.role === 'admin' ? 'rose' : 'brand'}>
                        {u.role === 'admin' ? 'ADMIN' : 'USER'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => openViewModal(u)}
                          title="View Profile Details"
                          className="p-1.5 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setRoleModalUser(u);
                            setTargetRole(u.role === 'admin' ? 'user' : 'admin');
                          }}
                          title="Change Role"
                          className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModalUser(u)}
                          title="Delete User"
                          disabled={u.id === currentAdmin?.id}
                          className={`p-1.5 rounded-md transition-colors ${
                            u.id === currentAdmin?.id
                              ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                              : 'text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Page <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span>
            </span>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadUsers(page - 1)}
                disabled={page <= 1}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadUsers(page + 1)}
                disabled={page >= totalPages}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* MODAL 1: Candidate Details View */}
      {viewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-lg">
                  {selectedUser.name?.substring(0, 2).toUpperCase() || 'CA'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Overview Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <FileText className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedUser.resumes_count || 0}</p>
                <p className="text-[10px] text-slate-500">Resumes Uploaded</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <Briefcase className="w-4 h-4 text-primary-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedUser.jobs_count || 0}</p>
                <p className="text-[10px] text-slate-500">Target Jobs</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <Sparkles className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedUser.readiness_count || 0}</p>
                <p className="text-[10px] text-slate-500">Readiness Twins</p>
              </div>
            </div>

            {/* Profile Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400">Target Career Role:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedUser.target_role || 'Junior Data Analyst'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Seniority & Experience:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedUser.experience_level || 'Junior'} ({selectedUser.years_of_experience || 0} years)
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Education:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedUser.degree || 'B.S. Computer Science'} • {selectedUser.university || 'University'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Account Role:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedUser.role?.toUpperCase()}</p>
              </div>
            </div>

            {/* Skills */}
            {selectedUser.skills && selectedUser.skills.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Verified Skill Tags:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUser.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Change Role Confirmation */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-500">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Modify User Access Role</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{roleModalUser.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Select the new security privilege level for <strong className="text-slate-900 dark:text-white">{roleModalUser.name}</strong>:
            </p>

            <Select
              id="modal-target-role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              options={[
                { value: 'user', label: 'Candidate User (Regular access to /dashboard)' },
                { value: 'admin', label: 'System Administrator (Full access to /admin)' },
              ]}
            />

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setRoleModalUser(null)} disabled={submittingAction}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpdateRole}
                disabled={submittingAction}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {submittingAction ? 'Updating...' : 'Confirm Role Change'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete User Confirmation */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600 dark:text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Candidate Record</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Irreversible administrative action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete the account for <strong className="text-slate-900 dark:text-white">{deleteModalUser.name}</strong> ({deleteModalUser.email})?
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setDeleteModalUser(null)} disabled={submittingAction}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteUser}
                disabled={submittingAction}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submittingAction ? 'Deleting...' : 'Confirm Deletion'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

