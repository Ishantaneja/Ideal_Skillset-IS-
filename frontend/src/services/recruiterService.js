import api from './api';

export const recruiterService = {
  /**
   * Fetch full Recruiter Command Center dashboard metrics
   */
  getDashboard: async () => {
    const response = await api.get('/recruiter/dashboard');
    return response.data;
  },

  /**
   * Fetch legacy dashboard overview metrics
   */
  getDashboardStats: async () => {
    const response = await api.get('/recruiter/dashboard-stats');
    return response.data;
  },

  /**
   * Fetch recruitment funnel analytics and screening efficiency
   */
  getAnalytics: async () => {
    const response = await api.get('/recruiter/analytics');
    return response.data;
  },

  /**
   * Fetch recruiter settings
   */
  getSettings: async () => {
    const response = await api.get('/recruiter/settings');
    return response.data;
  },

  /**
   * Update recruiter screening time assumptions
   */
  updateSettings: async (minutesSavedPerResume) => {
    const response = await api.put('/recruiter/settings', null, {
      params: { minutes_saved_per_resume: minutesSavedPerResume },
    });
    return response.data;
  },

  /**
   * List company jobs
   */
  listJobs: async () => {
    const response = await api.get('/recruiter/jobs');
    return response.data;
  },

  /**
   * Get single job details with AI blueprint
   */
  getJob: async (jobId) => {
    const response = await api.get(`/recruiter/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Create a new job requisition and generate AI Job Blueprint
   */
  createJob: async (jobData) => {
    const response = await api.post('/recruiter/jobs', jobData);
    return response.data;
  },

  /**
   * Update job requisition or edited blueprint
   */
  updateJob: async (jobId, jobData) => {
    const response = await api.put(`/recruiter/jobs/${jobId}`, jobData);
    return response.data;
  },

  /**
   * Regenerate AI Job Blueprint
   */
  regenerateBlueprint: async (jobId) => {
    const response = await api.post(`/recruiter/jobs/${jobId}/blueprint/generate`);
    return response.data;
  },

  /**
   * Get talent insights and missing skills distribution for a job
   */
  getJobInsights: async (jobId) => {
    const response = await api.get(`/recruiter/jobs/${jobId}/insights`);
    return response.data;
  },

  /**
   * Upload multiple candidate resumes in batch for a job
   */
  uploadMultipleResumes: async (jobId, files, onProgress = null) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const response = await api.post(`/recruiter/jobs/${jobId}/upload-resumes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  /**
   * Get applicants for a job with stage, fit, and skill filters
   */
  getJobApplicants: async (jobId, params = {}) => {
    const response = await api.get(`/recruiter/jobs/${jobId}/candidates`, { params });
    return response.data;
  },

  /**
   * Batch re-screen applicants against current job blueprint
   */
  screenJobApplicants: async (jobId) => {
    const response = await api.post(`/recruiter/jobs/${jobId}/screen`);
    return response.data;
  },

  /**
   * Get comprehensive Candidate 360° view with evidence matrix and consistency checks
   */
  getCandidate360: async (candidateId, jobId = null) => {
    const response = await api.get(`/recruiter/candidates/${candidateId}/360`, {
      params: jobId ? { job_id: jobId } : {},
    });
    return response.data;
  },

  /**
   * Get candidate evaluation for a specific job
   */
  getCandidateEvaluation: async (candidateId, jobId) => {
    const response = await api.get(`/recruiter/candidates/${candidateId}/evaluation`, {
      params: { job_id: jobId },
    });
    return response.data;
  },

  /**
   * Side-by-side Candidate Comparison (2 to 5 candidates)
   */
  compareCandidates: async (jobId, candidateIds) => {
    const response = await api.post('/recruiter/compare', {
      job_id: jobId,
      candidate_ids: candidateIds,
    });
    return response.data;
  },

  /**
   * Generate role & gap specific assessment for candidate
   */
  generateAssessment: async (candidateId, jobId) => {
    const response = await api.post('/recruiter/assessments/generate', null, {
      params: { candidate_id: candidateId, job_id: jobId },
    });
    return response.data;
  },

  /**
   * Submit assessment score and interviewer notes
   */
  submitAssessment: async (submissionData) => {
    const response = await api.post('/recruiter/assessments/submit', submissionData);
    return response.data;
  },

  /**
   * Generate technical & behavioral interview plan
   */
  generateInterview: async (candidateId, jobId) => {
    const response = await api.post('/recruiter/interviews/generate', null, {
      params: { candidate_id: candidateId, job_id: jobId },
    });
    return response.data;
  },

  /**
   * Submit interview transcript/notes and receive AI interview summary
   */
  summarizeInterview: async (summaryData) => {
    const response = await api.post('/recruiter/interviews/summarize', summaryData);
    return response.data;
  },

  /**
   * Advance candidate pipeline stage (applied, ai_screened, shortlisted, interview, offer, etc.)
   */
  updateCandidateStage: async (candidateId, jobId, stage, notes = '') => {
    const response = await api.post(`/recruiter/candidates/${candidateId}/stage`, { stage, notes }, {
      params: { job_id: jobId },
    });
    return response.data;
  },

  /**
   * Record formal hiring decision (OFFER, HIRE, REJECT, HOLD, ADVANCE)
   */
  recordDecision: async (decisionData) => {
    const response = await api.post(`/recruiter/candidates/${decisionData.candidate_id}/decision`, decisionData);
    return response.data;
  },

  /**
   * Discover and filter global candidate pool
   */
  discoverCandidates: async (params = {}) => {
    const response = await api.get('/recruiter/candidates', { params });
    return response.data;
  },

  getCandidates: async (params = {}) => {
    const response = await api.get('/recruiter/candidates', { params });
    return response.data;
  },

  /**
   * Toggle candidate shortlist status
   */
  toggleShortlist: async (candidateId) => {
    const response = await api.post(`/recruiter/shortlist/${candidateId}`);
    return response.data;
  },

  /**
   * Fetch recruiter's shortlisted candidates
   */
  getShortlist: async () => {
    const response = await api.get('/recruiter/shortlist');
    return response.data;
  },

  /**
   * Legacy candidate dossier endpoint
   */
  getCandidateDetail: async (candidateId) => {
    const response = await api.get(`/recruiter/candidate/${candidateId}`);
    return response.data;
  },

  /**
   * Configure custom evaluation weights for a job
   */
  updateJobWeights: async (jobId, weights) => {
    const response = await api.post(`/recruiter/jobs/${jobId}/weights`, weights);
    return response.data;
  },

  /**
   * Natural Language Candidate Search
   */
  searchNaturalLanguage: async (query, jobId = null) => {
    const response = await api.post('/recruiter/search/natural-language', { query, job_id: jobId });
    return response.data;
  },

  /**
   * Multi-Source Capability Search
   */
  searchCapability: async (params = {}) => {
    const response = await api.post('/recruiter/search/capability', params);
    return response.data;
  },

  /**
   * What-If Requirements Simulator
   */
  runWhatIfSimulation: async (payload) => {
    const response = await api.post('/recruiter/what-if', payload);
    return response.data;
  },

  /**
   * Generate Job Work Simulation Scenario
   */
  generateWorkSimulation: async (candidateId, jobId, scenarioType = 'production_incident') => {
    const response = await api.post('/recruiter/simulations/work-scenario', null, {
      params: { candidate_id: candidateId, job_id: jobId, scenario_type: scenarioType },
    });
    return response.data;
  },

  /**
   * Evaluate Candidate Work Simulation Submission
   */
  evaluateWorkSimulation: async (submission) => {
    const response = await api.post('/recruiter/simulations/evaluate', submission);
    return response.data;
  },

  /**
   * Trigger AI Recruiter Agent Run
   */
  runAgent: async (prompt, jobId = null) => {
    const response = await api.post('/recruiter/agent/run', { prompt, job_id: jobId });
    return response.data;
  },

  /**
   * Get AI Recruiter Agent Run Transcript & Results
   */
  getAgentRun: async (runId) => {
    const response = await api.get(`/recruiter/agent/${runId}`);
    return response.data;
  },

  /**
   * Submit recruiter feedback / calibration
   */
  submitFeedback: async (feedback) => {
    const response = await api.post('/recruiter/feedback', feedback);
    return response.data;
  },

  /**
   * Get real-time batch screening job status
   */
  getScreeningStatus: async (jobId) => {
    const response = await api.get(`/recruiter/screening-jobs/${jobId}/status`);
    return response.data;
  },
};

export default recruiterService;

