import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Users,
  CheckCircle,
  XCircle,
  Layers,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import adminService from '@/services/adminService';

export default function AdminJobRoles() {
  const [showAddRole, setShowAddRole] = useState(false);
  const [jobRoles, setJobRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showEditRole, setShowEditRole] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'All',
    experience: 'All',
    participants: 'All',
  });

  useEffect(() => {
    const loadJobRoles = async () => {
      try {
        setLoadingRoles(true);

        const data = await adminService.getJobRoles();

        setJobRoles(data.items || []);
      } catch (error) {
        console.error('Failed to load job roles:', error);
      } finally {
        setLoadingRoles(false);
      }
    };

    loadJobRoles();
  }, []);
  
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    experience: '',
    status: 'Active',
    skills: '',
  });

  const totalRoles = jobRoles.length;

  const activeRoles = jobRoles.filter(
    (role) => role.status?.toLowerCase() === 'active'
  ).length;

  const inactiveRoles = jobRoles.filter(
    (role) => role.status?.toLowerCase() === 'inactive'
  ).length;

  const requiredSkills = new Set(
    jobRoles
      .flatMap((role) =>
        role.skills
          ? role.skills.split(',').map((skill) => skill.trim())
          : []
      )
      .filter(Boolean)
  ).size;

  const filteredJobRoles = jobRoles.filter((role) => {
    // Search filter
    const matchesSearch = role.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      filters.status === 'All' ||
      role.status?.toLowerCase() === filters.status.toLowerCase();

    // Experience filter
    const matchesExperience =
      filters.experience === 'All' ||
      role.experience?.toLowerCase() === filters.experience.toLowerCase();

    // Participants filter
    const participantCount = role.active_participants ?? 0;

    const matchesParticipants =
      filters.participants === 'All' ||
      (filters.participants === 'Has Participants' &&
        participantCount > 0) ||
      (filters.participants === 'No Participants' &&
        participantCount === 0);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesExperience &&
      matchesParticipants
    );
  });

  const handleRoleChange = (field, value) => {
    setRoleForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditClick = (role) => {
    setEditingRole({
      id: role.id,
      name: role.name || '',
      description: role.description || '',
      experience: role.experience || '',
      status: role.status || 'Active',
      skills: role.skills || '',
    });

    setShowEditRole(true);
  };

  const handleCreateRole = async () => {
    try {
      const data = await adminService.createJobRole(roleForm);

      console.log('Job Role Created:', data);

      setShowAddRole(false);

      setRoleForm({
        name: '',
        description: '',
        experience: '',
        status: 'Active',
        skills: '',
      });

    } catch (error) {
      console.error('Failed to create job role:', error);
    }
  };

  const handleUpdateRole = async () => {
    try {
      const data = await adminService.updateJobRole(
        editingRole.id,
        editingRole
      );

      console.log('Job Role Updated:', data);

      // Update UI immediately
      setJobRoles((prevRoles) =>
        prevRoles.map((role) =>
          role.id === editingRole.id
            ? { ...role, ...editingRole }
            : role
        )
      );

      // Close modal
      setShowEditRole(false);
      setEditingRole(null);

    } catch (error) {
      console.error('Failed to update job role:', error);
    }
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Job Roles
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage job roles, required skills and career requirements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddRole(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Job Role
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Roles
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalRoles}
              </p>
            </div>

            <div className="rounded-lg bg-brand-50 p-2.5">
              <Briefcase className="h-5 w-5 text-brand-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active Roles
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {activeRoles}
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 p-2.5">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Inactive Roles
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {inactiveRoles}
              </p>
            </div>

            <div className="rounded-lg bg-slate-100 p-2.5">
              <XCircle className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Required Skills
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {requiredSkills}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-2.5">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

      </div>

      {/* Filters + Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Toolbar */}
        
        <div className="relative flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">

          {/* Search */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search job roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Filter Button */}
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              showFilters
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>

          {/* Filter Panel */}
          {showFilters && (
            <div className="absolute right-4 top-full z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-5 shadow-xl">

              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Filter Job Roles
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setFilters({
                      status: 'All',
                      experience: 'All',
                      participants: 'All',
                    })
                  }
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Clear All
                </button>
              </div>

              {/* Status */}
              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </label>

                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Experience */}
              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Experience
                </label>

                <select
                  value={filters.experience}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      experience: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="All">All Experience</option>
                  <option value="Fresher">Fresher</option>
                  <option value="0-2 years">0-2 years</option>
                  <option value="2-5 years">2-5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>

              {/* Participants */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Participants
                </label>

                <select
                  value={filters.participants}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      participants: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="All">All Participants</option>
                  <option value="Has Participants">Has Participants</option>
                  <option value="No Participants">No Participants</option>
                </select>
              </div>

            </div>
          )}

        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">

            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Job Role
                </th>

                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Experience
                </th>

                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Required Skills
                </th>

                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Active Participants
                </th>

                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {jobRoles.length > 0 ? (
                filteredJobRoles.map((role) => (
                  <tr
                    key={role.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    {/* Job Role */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {role.name}
                        </p>

                        {role.description && (
                          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Experience */}
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {role.experience}
                    </td>

                    {/* Required Skills */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {role.skills
                          ?.split(',')
                          .map((skill) => skill.trim())
                          .filter(Boolean)
                          .map((skill) => (
                            <span
                              key={skill}
                              className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                            >
                              {skill}
                            </span>
                          ))}
                      </div>
                    </td>

                    {/* Active Participants */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                        {role.active_participants ?? 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          role.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {role.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleEditClick(role)}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">

                      <div className="mb-3 rounded-full bg-slate-100 p-4">
                        <Briefcase className="h-6 w-6 text-slate-400" />
                      </div>

                      <p className="text-sm font-semibold text-slate-700">
                        No job roles available
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Create your first job role to get started.
                      </p>

                    </div>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

      </div>

      {showAddRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                <h2 className="text-lg font-bold text-slate-900">
                    Add Job Role
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Create a new career role with its requirements.
                </p>
                </div>

                <button
                type="button"
                onClick={() => setShowAddRole(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                ✕
                </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 px-6 py-6">

                <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Job Role
                </label>

                <input
                    type="text"
                    placeholder="e.g. Data Scientist"
                    value={roleForm.name}
                    onChange={(e) => handleRoleChange('name', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                </label>

                <textarea
                    rows="3"
                    placeholder="Describe the role and its responsibilities..."
                    value={roleForm.description}
                    onChange={(e) => handleRoleChange('description', e.target.value)} 
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Experience Level
                    </label>

                    <select
                    value={roleForm.experience}
                    onChange={(e) => handleRoleChange('experience', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    >
                    <option value="">Select experience</option>
                    <option value="Fresher">Fresher</option>
                    <option value="0-2 years">0-2 years</option>
                    <option value="2-5 years">2-5 years</option>
                    <option value="5+ years">5+ years</option>
                    </select>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                    </label>

                    <select
                    value={roleForm.status}
                    onChange={(e) => handleRoleChange('status', e.target.value)}
                    defaultValue="Active"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    </select>
                </div>

                </div>

                <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Required Skills
                </label>

                <input
                    type="text"
                    placeholder="e.g. Python, SQL, Machine Learning, Pandas"
                    value={roleForm.skills}
                    onChange={(e) => handleRoleChange('skills', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                    Separate multiple skills with commas.
                </p>
                </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">

                <button
                type="button"
                onClick={() => setShowAddRole(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCreateRole}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Create Role
                </button>

            </div>

            </div>
        </div>
        )}

        {showEditRole && editingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Edit Job Role
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Update the career role and its requirements.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowEditRole(false);
                    setEditingRole(null);
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-5 px-6 py-6">

                {/* Job Role */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Job Role
                  </label>

                  <input
                    type="text"
                    value={editingRole.name}
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    rows="3"
                    value={editingRole.description}
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        description: e.target.value,
                      })
                    }
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                {/* Experience + Status */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* Experience */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Experience Level
                    </label>

                    <select
                      value={editingRole.experience}
                      onChange={(e) =>
                        setEditingRole({
                          ...editingRole,
                          experience: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    >
                      <option value="">Select experience</option>
                      <option value="Fresher">Fresher</option>
                      <option value="0-2 years">0-2 years</option>
                      <option value="2-5 years">2-5 years</option>
                      <option value="5+ years">5+ years</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Status
                    </label>

                    <select
                      value={editingRole.status}
                      onChange={(e) =>
                        setEditingRole({
                          ...editingRole,
                          status: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                </div>

                {/* Required Skills */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Required Skills
                  </label>

                  <input
                    type="text"
                    value={editingRole.skills}
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        skills: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Separate multiple skills with commas.
                  </p>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">

                <button
                  type="button"
                  onClick={() => {
                    setShowEditRole(false);
                    setEditingRole(null);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpdateRole}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Save Changes
                </button>

              </div>

            </div>
          </div>
        )}

    </div>
  );
}