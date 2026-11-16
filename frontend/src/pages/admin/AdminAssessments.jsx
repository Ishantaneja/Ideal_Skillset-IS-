import React, { useEffect, useMemo, useState } from 'react';
import adminService from '@/services/adminService';
import {
  ClipboardList,
  CheckCircle,
  Users,
  ChartColumn,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [jobRoles, setJobRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    const loadJobRoles = async () => {
        try {
        const data = await adminService.getJobRoles();

        const activeRoles = (data.items || []).filter(
            (role) => role.status?.toLowerCase() === 'active'
        );

        setJobRoles(activeRoles);
        } catch (error) {
        console.error('Failed to load job roles:', error);
        } finally {
        setLoadingRoles(false);
        }
    };

    loadJobRoles();
    }, []);

  useEffect(() => {
    const loadAssessments = async () => {
        try {
        const data = await adminService.getAssessments();

        const formattedAssessments = (data.items || []).map((item) => ({
            id: item.id,
            name: item.name || '',
            role: item.job_role || '',
            category: item.category || '',
            questions: item.total_questions || 0,
            duration: item.duration || 0,
            passingScore: item.passing_score || 0,
            status: item.status || 'Inactive',
        }));

        setAssessments(formattedAssessments);
        } catch (error) {
        console.error('Failed to load assessments:', error);
        }
    };

    loadAssessments();
    }, []);

  const createEmptyQuestion = () => ({
    type: 'mcq',
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    language: 'Python',
    starter_code: '',
    test_cases: [
        {
        input: '',
        expected_output: '',
        },
    ],
    marks: 1,
    });

    const emptyForm = {
    name: '',
    role: '',
    category: 'Technical',
    questions: [createEmptyQuestion()],
    duration: '',
    passingScore: '',
    status: 'Active',
    };

    const [form, setForm] = useState(emptyForm);

  const roles = useMemo(
    () => jobRoles.map((role) => role.name),
    [jobRoles]
  );

  // Update any field of a question
  const updateQuestion = (index, field, value) => {
    setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((question, i) =>
        i === index
            ? { ...question, [field]: value }
            : question
        ),
    }));
    };

    // Add a new question
    const addQuestion = () => {
    setForm((prev) => ({
        ...prev,
        questions: [...prev.questions, createEmptyQuestion()],
    }));
    };

    // Remove a question
    const removeQuestion = (index) => {
    setForm((prev) => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index),
    }));
    };

    // Update MCQ option
    const updateOption = (questionIndex, optionIndex, value) => {
    setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((question, i) =>
        i === questionIndex
            ? {
                ...question,
                options: question.options.map((option, j) =>
                j === optionIndex ? value : option
                ),
            }
            : question
        ),
    }));
    };

    // Update practical test case
    const updateTestCase = (questionIndex, caseIndex, field, value) => {
    setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((question, i) =>
        i === questionIndex
            ? {
                ...question,
                test_cases: question.test_cases.map((testCase, j) =>
                j === caseIndex
                    ? { ...testCase, [field]: value }
                    : testCase
                ),
            }
            : question
        ),
    }));
    };

    // Add practical test case
    const addTestCase = (questionIndex) => {
    setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((question, i) =>
        i === questionIndex
            ? {
                ...question,
                test_cases: [
                ...question.test_cases,
                { input: '', expected_output: '' },
                ],
            }
            : question
        ),
    }));
    };

    // Remove practical test case
    const removeTestCase = (questionIndex, caseIndex) => {
    setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((question, i) =>
        i === questionIndex
            ? {
                ...question,
                test_cases: question.test_cases.filter(
                (_, j) => j !== caseIndex
                ),
            }
            : question
        ),
    }));
    };

  
    const filteredAssessments = assessments.filter((item) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
        item.name.toLowerCase().includes(search) ||
        item.role.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search);

    const matchesStatus =
        statusFilter === 'All' || item.status === statusFilter;

    const matchesRole =
        roleFilter === 'All' || item.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
    });


  const activeCount = assessments.filter(
    (a) => a.status === 'Active'
  ).length;

  const stats = [
    {
      title: 'Total Assessments',
      value: assessments.length,
      icon: ClipboardList,
    },
    {
      title: 'Active Assessments',
      value: activeCount,
      icon: CheckCircle,
    },
    {
      title: 'Completed Attempts',
      value: 0,
      icon: Users,
    },
    {
      title: 'Average Score',
      value: 'N/A',
      icon: ChartColumn,
    },
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingId) {
      alert('Please use the existing Create Assessment flow.');
      return;
    }

    try {
      await adminService.updateAssessmentStatus(
        editingId,
        form.status
      );

      setAssessments((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, status: form.status }
            : item
        )
      );

      alert('Assessment status updated successfully!');

      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);

    } catch (error) {
      console.error('Failed to update assessment status:', error);
      alert(
        error.response?.data?.detail ||
        'Failed to update assessment status.'
      );
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);

    setForm({
      ...emptyForm,
      name: item.name,
      role: item.role,
      category: item.category,
      questions: Array.from(
        { length: Math.max(1, Number(item.questions) || 1) },
        () => createEmptyQuestion()
      ),
      duration: String(item.duration),
      passingScore: String(item.passingScore),
      status: item.status,
    });

    setShowModal(true);
  };


  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      setAssessments((prev) =>
        prev.filter((item) => item.id !== id)
      );
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Assessment Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create assessments and monitor candidate evaluation.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <Plus size={18} />
          Add Assessment
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">
                  {item.title}
                </p>
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mt-4">
                {item.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Assessment Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">

        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            All Assessments
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            View and manage all platform assessments.
          </p>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-3 mt-5">

            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white"
              >
                <option value="All">All Job Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('All');
                  setStatusFilter('All');
                }}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                title="Reset filters"
              >
                <Filter size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-4">Assessment Name</th>
                <th className="px-5 py-4">Job Role</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Questions</th>
                <th className="px-5 py-4">Duration</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredAssessments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {item.name}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {item.role}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {item.category}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {item.questions}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {item.duration} min
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Active'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-600 hover:text-indigo-800"
                        title="Edit"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAssessments.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <ClipboardList className="mx-auto w-10 h-10 text-slate-300 mb-3" />
                    <p className="font-medium text-slate-600">
                      No assessments found
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Add an assessment to get started.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 text-sm text-slate-500">
          Showing {filteredAssessments.length} of {assessments.length} assessments
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingId ? 'Edit Assessment' : 'Add New Assessment'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter the assessment details below.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Assessment Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Python Programming Test"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                    Job Role
                </label>

                <select
                    required
                    value={form.role}
                    onChange={(e) =>
                    setForm({ ...form, role: e.target.value })
                    }
                    disabled={loadingRoles}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white disabled:bg-slate-100"
                >
                    <option value="">
                    {loadingRoles ? 'Loading job roles...' : 'Select Job Role'}
                    </option>

                    {roles.map((role) => (
                    <option key={role} value={role}>
                        {role}
                    </option>
                    ))}
                </select>

                {!loadingRoles && roles.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                    No active job roles available. Please add a job role first.
                    </p>
                )}
                </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white"
                >
                  <option>Technical</option>
                  <option>Aptitude</option>
                  <option>Practical</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Total Questions
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.questions}
                    onChange={(e) => setForm({ ...form, questions: e.target.value })}
                    placeholder="20"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Duration (minutes)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="30"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Passing Score (%)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={form.passingScore}
                  onChange={(e) => setForm({ ...form, passingScore: e.target.value })}
                  placeholder="60"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Ended</option>
                </select>
              </div>
              
                {/* Question Builder */}
                <div className="space-y-4 border-t pt-5">
                <div className="flex items-center justify-between">
                    <div>
                    <h3 className="text-base font-semibold text-slate-900">
                        Assessment Questions
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Add MCQ or practical coding questions.
                    </p>
                    </div>

                    <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                    {form.questions.length} Questions
                    </span>
                </div>

                {form.questions.map((question, index) => (
                    <div
                    key={index}
                    className="border border-slate-200 rounded-xl p-4 space-y-4"
                    >
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-slate-800">
                        Question {index + 1}
                        </h4>

                        <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        disabled={form.questions.length === 1}
                        className="text-red-500 text-xs disabled:opacity-30"
                        >
                        <Trash2 size={16} />
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                        Question Type
                        </label>

                        <select
                        value={question.type}
                        onChange={(e) =>
                            updateQuestion(
                            index,
                            'type',
                            e.target.value
                            )
                        }
                        className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white"
                        >
                        <option value="mcq">MCQ</option>
                        <option value="practical">Practical / Coding</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                        Question
                        </label>

                        <textarea
                        required
                        value={question.question_text}
                        onChange={(e) =>
                            updateQuestion(
                            index,
                            'question_text',
                            e.target.value
                            )
                        }
                        placeholder="Enter your question..."
                        rows={3}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm"
                        />
                    </div>

                    {question.type === 'mcq' ? (
                        <div className="space-y-3">
                        <label className="block text-sm font-medium">
                            Answer Options
                        </label>

                        {question.options.map((option, optionIndex) => (
                            <div key={optionIndex}>
                            <label className="text-xs text-slate-500">
                                Option {optionIndex + 1}
                            </label>

                            <input
                                required
                                value={option}
                                onChange={(e) =>
                                updateOption(
                                    index,
                                    optionIndex,
                                    e.target.value
                                )
                                }
                                placeholder={`Enter option ${optionIndex + 1}`}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                            </div>
                        ))}

                        <label className="block text-sm font-medium">
                            Correct Answer
                        </label>

                        <select
                            required
                            value={question.correct_answer}
                            onChange={(e) =>
                            updateQuestion(
                                index,
                                'correct_answer',
                                e.target.value
                            )
                            }
                            className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white"
                        >
                            <option value="">Select Correct Answer</option>

                            {question.options
                            .filter((option) => option.trim())
                            .map((option, i) => (
                                <option key={i} value={option}>
                                {option}
                                </option>
                            ))}
                        </select>
                        </div>
                    ) : (
                        <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                            Programming Language
                            </label>

                            <select
                            value={question.language}
                            onChange={(e) =>
                                updateQuestion(index, 'language', e.target.value)
                            }
                            className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white"
                            >
                            <option>Python</option>
                            <option>Java</option>
                            <option>JavaScript</option>
                            <option>C++</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                            Starter Code
                            </label>

                            <textarea
                            value={question.starter_code}
                            onChange={(e) =>
                                updateQuestion(index, 'starter_code', e.target.value)
                            }
                            placeholder="Enter starter code..."
                            rows={4}
                            className="w-full border rounded-lg px-3 py-2.5 text-sm font-mono"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                                Test Cases
                            </label>

                            <button
                                type="button"
                                onClick={() => addTestCase(index)}
                                className="text-indigo-600 text-xs font-medium"
                            >
                                + Add Test Case
                            </button>
                            </div>

                            {question.test_cases.map((testCase, caseIndex) => (
                            <div
                                key={caseIndex}
                                className="bg-slate-50 rounded-lg p-3 space-y-2"
                            >
                                <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-slate-600">
                                    Test Case {caseIndex + 1}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => removeTestCase(index, caseIndex)}
                                    disabled={question.test_cases.length === 1}
                                    className="text-red-500 text-xs disabled:opacity-30"
                                >
                                    Remove
                                </button>
                                </div>

                                <input
                                required
                                value={testCase.input}
                                onChange={(e) =>
                                    updateTestCase(
                                    index,
                                    caseIndex,
                                    'input',
                                    e.target.value
                                    )
                                }
                                placeholder="Input (e.g. 2, 3)"
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                />

                                <input
                                required
                                value={testCase.expected_output}
                                onChange={(e) =>
                                    updateTestCase(
                                    index,
                                    caseIndex,
                                    'expected_output',
                                    e.target.value
                                    )
                                }
                                placeholder="Expected output (e.g. 5)"
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            ))}
                        </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                        Marks
                        </label>

                        <input
                        type="number"
                        min="1"
                        required
                        value={question.marks}
                        onChange={(e) =>
                            updateQuestion(index, 'marks', Number(e.target.value))
                        }
                        className="w-full border rounded-lg px-3 py-2.5 text-sm"
                        />
                    </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addQuestion}
                    className="w-full border border-dashed border-indigo-300 text-indigo-600 rounded-lg py-3 text-sm font-medium hover:bg-indigo-50"
                >
                    <Plus size={16} className="inline mr-2" />
                    Add Another Question
                </button>
                </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                >
                  {editingId ? 'Save Changes' : 'Create Assessment'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
