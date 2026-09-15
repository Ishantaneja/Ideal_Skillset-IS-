import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  Terminal,
  Play,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Plus,
  X,
  FileCode2,
  Database,
  ArrowRight,
  Info,
  Award
} from 'lucide-react';
import { recruiterService } from '@/services/recruiterService';
import { useNotification } from '@/hooks';

export default function RecruiterSimulations() {
  const notify = useNotification();

  const [activeTab, setActiveTab] = useState('what-if'); // 'what-if' | 'work-scenario'
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  // --- What-If Simulator State ---
  const [simCriticalSkills, setSimCriticalSkills] = useState([]);
  const [simPreferredSkills, setSimPreferredSkills] = useState([]);
  const [newCritSkill, setNewCritSkill] = useState('');
  const [newPrefSkill, setNewPrefSkill] = useState('');
  const [minFitThreshold, setMinFitThreshold] = useState(70);
  const [weights, setWeights] = useState({
    technical_skills: 0.35,
    experience: 0.25,
    practical_evidence: 0.15,
    assessment: 0.10,
    communication: 0.10,
    education: 0.05
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isApplyingPolicy, setIsApplyingPolicy] = useState(false);

  // --- Work Simulation State ---
  const [scenarioType, setScenarioType] = useState('production_incident');
  const [applicants, setApplicants] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [workScenario, setWorkScenario] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [technicalDecisions, setTechnicalDecisions] = useState([]);
  const [newDecision, setNewDecision] = useState('');
  const [isEvaluatingScenario, setIsEvaluatingScenario] = useState(false);
  const [scenarioEvaluation, setScenarioEvaluation] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadJobDetails(selectedJobId);
      loadApplicants(selectedJobId);
    }
  }, [selectedJobId]);

  const loadJobs = async () => {
    try {
      const data = await recruiterService.listJobs();
      setJobs(data || []);
      if (data && data.length > 0) {
        setSelectedJobId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  const loadJobDetails = async (jobId) => {
    try {
      const job = await recruiterService.getJob(jobId);
      setSelectedJob(job);
      const crit = job.blueprint?.critical_skills?.map((s) => s.name) || job.required_skills || [];
      const pref = job.blueprint?.preferred_skills?.map((s) => s.name) || job.preferred_skills || [];
      setSimCriticalSkills(crit);
      setSimPreferredSkills(pref);
      if (job.weights) {
        setWeights(job.weights);
      }
      setSimulationResult(null);
    } catch (err) {
      console.error('Failed to load job details:', err);
    }
  };

  const loadApplicants = async (jobId) => {
    try {
      const data = await recruiterService.listApplicants(jobId);
      setApplicants(data || []);
      if (data && data.length > 0) {
        setSelectedCandidateId(data[0].candidate_id);
      }
    } catch (err) {
      console.error('Failed to load applicants:', err);
    }
  };

  // --- What-If Actions ---
  const handleAddCriticalSkill = (e) => {
    e.preventDefault();
    if (!newCritSkill.trim()) return;
    if (!simCriticalSkills.includes(newCritSkill.trim())) {
      setSimCriticalSkills([...simCriticalSkills, newCritSkill.trim()]);
    }
    setNewCritSkill('');
  };

  const handleRemoveCriticalSkill = (skillToRemove) => {
    setSimCriticalSkills(simCriticalSkills.filter((s) => s !== skillToRemove));
  };

  const handleAddPreferredSkill = (e) => {
    e.preventDefault();
    if (!newPrefSkill.trim()) return;
    if (!simPreferredSkills.includes(newPrefSkill.trim())) {
      setSimPreferredSkills([...simPreferredSkills, newPrefSkill.trim()]);
    }
    setNewPrefSkill('');
  };

  const handleRemovePreferredSkill = (skillToRemove) => {
    setSimPreferredSkills(simPreferredSkills.filter((s) => s !== skillToRemove));
  };

  const handleRunWhatIf = async () => {
    if (!selectedJobId) return;
    setIsSimulating(true);
    try {
      const payload = {
        job_id: selectedJobId,
        simulated_critical_skills: simCriticalSkills,
        simulated_preferred_skills: simPreferredSkills,
        simulated_weights: weights,
        min_fit_threshold: parseFloat(minFitThreshold)
      };
      const res = await recruiterService.runWhatIfSimulation(payload);
      setSimulationResult(res);
      notify.success('What-If simulation calculated! Review pool impact below.');
    } catch (err) {
      console.error('Simulation failed:', err);
      notify.error(err.response?.data?.detail || 'Simulation calculation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyPolicyToRequisition = async () => {
    if (!selectedJobId) return;
    setIsApplyingPolicy(true);
    try {
      // 1. Update weights
      await recruiterService.updateJobWeights(selectedJobId, weights);
      // 2. Update blueprint critical & preferred skills
      if (selectedJob && selectedJob.blueprint) {
        const updatedBp = {
          ...selectedJob.blueprint,
          critical_skills: simCriticalSkills.map((name) => ({ name, importance: 'critical' })),
          preferred_skills: simPreferredSkills.map((name) => ({ name, importance: 'preferred' }))
        };
        await recruiterService.updateJob(selectedJobId, { blueprint: updatedBp });
      }
      notify.success('Simulated policy successfully adopted and applied to live requisition!');
      loadJobDetails(selectedJobId);
    } catch (err) {
      console.error('Failed to apply policy:', err);
      notify.error('Failed to apply simulated policy to live requisition.');
    } finally {
      setIsApplyingPolicy(false);
    }
  };

  // --- Work Simulation Actions ---
  const handleGenerateWorkScenario = async () => {
    if (!selectedJobId || !selectedCandidateId) {
      notify.warning('Please select a candidate and job first.');
      return;
    }
    setIsGeneratingScenario(true);
    setScenarioEvaluation(null);
    try {
      const res = await recruiterService.generateWorkSimulation(selectedCandidateId, selectedJobId, scenarioType);
      setWorkScenario(res);
      setResponseText(
        '1. Root Cause Analysis: Latency spike caused by unindexed collection scan under burst traffic.\n' +
        '2. Tactical Mitigation: Immediately add compound index and increase MongoDB connection pool limit from 100 to 250.\n' +
        '3. Resilience Architecture: Deploy Redis cache for read-heavy aggregations and introduce token bucket rate limiting.'
      );
      setTechnicalDecisions(['Emergency compound indexing', 'Connection pool size increase', 'Redis caching']);
      notify.success('Real-world work simulation generated!');
    } catch (err) {
      console.error('Failed to generate work scenario:', err);
      notify.error(err.response?.data?.detail || 'Failed to generate scenario.');
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  const handleAddDecision = (e) => {
    e.preventDefault();
    if (!newDecision.trim()) return;
    if (!technicalDecisions.includes(newDecision.trim())) {
      setTechnicalDecisions([...technicalDecisions, newDecision.trim()]);
    }
    setNewDecision('');
  };

  const handleRemoveDecision = (dec) => {
    setTechnicalDecisions(technicalDecisions.filter((d) => d !== dec));
  };

  const handleEvaluateScenario = async () => {
    if (!workScenario || !responseText.trim()) {
      notify.warning('Please enter the candidate response text.');
      return;
    }
    setIsEvaluatingScenario(true);
    try {
      const submission = {
        simulation_id: workScenario.id,
        candidate_id: selectedCandidateId,
        job_id: selectedJobId,
        response_text: responseText.trim(),
        technical_decisions: technicalDecisions
      };
      const res = await recruiterService.evaluateWorkSimulation(submission);
      setScenarioEvaluation(res);
      notify.success('Work simulation evaluated! Score generated.');
    } catch (err) {
      console.error('Evaluation failed:', err);
      notify.error(err.response?.data?.detail || 'Work simulation evaluation failed.');
    } finally {
      setIsEvaluatingScenario(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Recruitment Simulations Studio
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Simulate hiring policies before changing production requirements, and evaluate candidates on real-world Day-in-the-Life technical incident challenges.
          </p>
        </div>

        {/* Requisition Selector */}
        <div className="w-full md:w-72">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Active Requisition Context
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.applicant_count} candidates)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('what-if')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'what-if'
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" /> What-If Policy & Requirements Simulator
        </button>
        <button
          onClick={() => setActiveTab('work-scenario')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'work-scenario'
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" /> Job Work Simulations (Day-in-the-Life)
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: WHAT-IF POLICY SIMULATOR */}
      {/* ===================================================================== */}
      {activeTab === 'what-if' && (
        <div className="space-y-8">
          {/* Non-mutating guarantee alert */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm text-purple-300">In-Memory Policy Sandbox</span>
              Adjusting requirements in this simulator will NEVER modify your live job posting, current applicant stages, or database requisitions unless you explicitly click "Apply Simulated Policy".
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controls Left 1 Col */}
            <div className="space-y-6">
              {/* Critical Skills */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Simulated Critical Skills</span>
                  <span className="text-xs font-normal text-slate-400">Must-Have</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {simCriticalSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveCriticalSkill(s)}
                        className="hover:text-rose-100 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddCriticalSkill} className="flex gap-2">
                  <input
                    type="text"
                    value={newCritSkill}
                    onChange={(e) => setNewCritSkill(e.target.value)}
                    placeholder="Add critical skill..."
                    className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Preferred Skills */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Simulated Preferred Skills</span>
                  <span className="text-xs font-normal text-slate-400">Nice-to-Have</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {simPreferredSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemovePreferredSkill(s)}
                        className="hover:text-blue-100 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddPreferredSkill} className="flex gap-2">
                  <input
                    type="text"
                    value={newPrefSkill}
                    onChange={(e) => setNewPrefSkill(e.target.value)}
                    placeholder="Add preferred skill..."
                    className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Fit Threshold Slider */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-200">Shortlist Fit Threshold</span>
                  <span className="text-purple-400 font-bold">{minFitThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="90"
                  step="1"
                  value={minFitThreshold}
                  onChange={(e) => setMinFitThreshold(e.target.value)}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Candidates above {minFitThreshold}% overall fit qualify for automatic shortlisting.
                </p>
              </div>

              {/* Weight Distribution */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white">Evaluation Weighting</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Technical Competencies</span>
                      <span className="font-semibold">{Math.round(weights.technical_skills * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.6"
                      step="0.05"
                      value={weights.technical_skills}
                      onChange={(e) => setWeights({ ...weights, technical_skills: parseFloat(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Relevant Experience</span>
                      <span className="font-semibold">{Math.round(weights.experience * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.5"
                      step="0.05"
                      value={weights.experience}
                      onChange={(e) => setWeights({ ...weights, experience: parseFloat(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Practical Code Evidence</span>
                      <span className="font-semibold">{Math.round(weights.practical_evidence * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.4"
                      step="0.05"
                      value={weights.practical_evidence}
                      onChange={(e) => setWeights({ ...weights, practical_evidence: parseFloat(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Run Button */}
              <button
                type="button"
                onClick={handleRunWhatIf}
                disabled={isSimulating || !selectedJobId}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Simulating Pool Shifts...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" /> Run What-If Simulation
                  </>
                )}
              </button>
            </div>

            {/* Results Right 2 Cols */}
            <div className="lg:col-span-2 space-y-6">
              {simulationResult ? (
                <>
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                        Shortlisted Talent Pool
                      </span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-white">
                          {simulationResult.simulated_shortlisted_count}
                        </span>
                        <span className="text-xs text-slate-400">
                          from {simulationResult.original_shortlisted_count}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
                        {simulationResult.additional_candidates_count > 0 ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> +{simulationResult.additional_candidates_count} Candidates
                          </span>
                        ) : simulationResult.additional_candidates_count < 0 ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <TrendingDown className="w-3.5 h-3.5" /> {simulationResult.additional_candidates_count} Candidates
                          </span>
                        ) : (
                          <span className="text-slate-400">0 Pool Delta</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                        Critical Skill Coverage
                      </span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-white">
                          {simulationResult.critical_skill_coverage_simulated}%
                        </span>
                        <span className="text-xs text-slate-400">
                          (orig: {simulationResult.critical_skill_coverage_original}%)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Average candidate match across simulated critical skills.
                      </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                        Average Overall Fit
                      </span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-purple-400">
                          {simulationResult.average_fit_simulated}%
                        </span>
                        <span className="text-xs text-slate-400">
                          (orig: {simulationResult.average_fit_original}%)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Re-weighted fit score across total applicant pipeline.
                      </p>
                    </div>
                  </div>

                  {/* Tradeoff Explanation Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Info className="w-4 h-4 text-purple-400" /> Talent Availability & Quality Tradeoff
                    </h3>
                    <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                      <p className="font-semibold text-purple-300">
                        {simulationResult.talent_availability_impact}
                      </p>
                      <p className="text-slate-400">
                        {simulationResult.quality_tradeoff_summary}
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleApplyPolicyToRequisition}
                        disabled={isApplyingPolicy}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        {isApplyingPolicy ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adopting Policy...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Apply Simulated Policy to Requisition
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Candidate Impact Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center justify-between">
                      <span>Candidate-Level Pipeline Shifts</span>
                      <span className="text-xs text-slate-400 font-normal">
                        Top {simulationResult.candidate_changes?.length || 0} Affected Applicants
                      </span>
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-950/60 border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">Candidate</th>
                            <th className="py-3 px-4">Original Fit</th>
                            <th className="py-3 px-4">Simulated Fit</th>
                            <th className="py-3 px-4">Fit Delta</th>
                            <th className="py-3 px-4">Status Shift</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {simulationResult.candidate_changes?.map((c, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 font-semibold text-white">{c.name}</td>
                              <td className="py-3 px-4">{c.original_fit}%</td>
                              <td className="py-3 px-4 font-bold text-purple-300">{c.simulated_fit}%</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`font-semibold ${
                                    c.fit_delta > 0
                                      ? 'text-emerald-400'
                                      : c.fit_delta < 0
                                      ? 'text-rose-400'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {c.fit_delta > 0 ? `+${c.fit_delta}` : c.fit_delta}%
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {c.status_change === 'newly_shortlisted' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Newly Shortlisted
                                  </span>
                                ) : c.status_change === 'dropped_from_shortlist' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    Dropped
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">Unchanged</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">No Active Simulation Results</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Adjust the simulated critical skills, preferred skills, fit threshold, or evaluation weights on the left, then click <strong>Run What-If Simulation</strong> to calculate the talent pool impact.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: JOB WORK SIMULATIONS (DAY-IN-THE-LIFE) */}
      {/* ===================================================================== */}
      {activeTab === 'work-scenario' && (
        <div className="space-y-8">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" /> Work Simulation Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Select Candidate</label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-purple-500"
                >
                  {applicants.map((a) => (
                    <option key={a.candidate_id} value={a.candidate_id}>
                      {a.name} ({a.overall_fit}% Fit)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Scenario Type</label>
                <select
                  value={scenarioType}
                  onChange={(e) => setScenarioType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-purple-500"
                >
                  <option value="production_incident">Production Incident Triage (Latency Spike & DB Starvation)</option>
                  <option value="api_design">Microservice API Architecture (High-Throughput Ingestion)</option>
                  <option value="codebase_debugging">Concurrency Debugging (Async Deadlocks in Workers)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleGenerateWorkScenario}
                  disabled={isGeneratingScenario || !selectedCandidateId}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isGeneratingScenario ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating Challenge...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" /> Generate Work Challenge
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {workScenario ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Col: Work Scenario Challenge Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 inline-block mb-2">
                    {workScenario.scenario_type.replace('_', ' ')}
                  </span>
                  <h3 className="text-base font-bold text-white">{workScenario.title}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {workScenario.context_description}
                  </p>
                </div>

                {/* Server Logs Box */}
                {workScenario.system_logs && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Live System Logs
                    </h4>
                    <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-400/90 border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                      {workScenario.system_logs}
                    </pre>
                  </div>
                )}

                {/* Database Behavior & Bug Report */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {workScenario.database_behavior && (
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                      <span className="font-semibold text-purple-400 block flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" /> Database Behavior
                      </span>
                      <p className="text-slate-300">{workScenario.database_behavior}</p>
                    </div>
                  )}
                  {workScenario.api_requirements && (
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                      <span className="font-semibold text-blue-400 block flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5" /> SLA & Requirements
                      </span>
                      <p className="text-slate-300">{workScenario.api_requirements}</p>
                    </div>
                  )}
                </div>

                {/* Tasks to Solve */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Candidate Challenge Objectives
                  </h4>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {workScenario.tasks_to_solve?.map((task, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Col: Candidate Submission & Instant Evaluation */}
              <div className="space-y-6">
                {/* Submission Console */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-purple-400" /> Candidate Decision Console
                  </h3>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-semibold">
                      Candidate Written Decisions & Root Cause Analysis
                    </label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={6}
                      placeholder="Candidate's technical diagnosis, immediate mitigations, code modifications, and architectural resilience..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500 font-mono"
                    />
                  </div>

                  {/* Technical Decisions Tag Manager */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-semibold">
                      Key Technical Decisions
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {technicalDecisions.map((dec, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs"
                        >
                          {dec}
                          <button
                            type="button"
                            onClick={() => handleRemoveDecision(dec)}
                            className="hover:text-indigo-100 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <form onSubmit={handleAddDecision} className="flex gap-2">
                      <input
                        type="text"
                        value={newDecision}
                        onChange={(e) => setNewDecision(e.target.value)}
                        placeholder="Add decision tag (e.g. 'Compound index', 'Rate limiting')..."
                        className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-purple-500"
                      />
                      <button
                        type="submit"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>

                  <button
                    type="button"
                    onClick={handleEvaluateScenario}
                    disabled={isEvaluatingScenario || !responseText.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {isEvaluatingScenario ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating Decision Quality...
                      </>
                    ) : (
                      <>
                        <Award className="w-3.5 h-3.5" /> Evaluate Work Simulation with AI
                      </>
                    )}
                  </button>
                </div>

                {/* Evaluation Rubric Scorecard */}
                {scenarioEvaluation && (
                  <div className="bg-gradient-to-br from-slate-900 to-purple-950/20 border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                        <Award className="w-4 h-4" /> Work Simulation Evaluation Scorecard
                      </div>
                      <span className="text-2xl font-black text-white">
                        {scenarioEvaluation.practical_readiness_score}%
                      </span>
                    </div>

                    {/* Dimension Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">Technical Reasoning</span>
                        <span className="text-base font-bold text-slate-100">
                          {scenarioEvaluation.technical_reasoning_score}%
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">Debugging Accuracy</span>
                        <span className="text-base font-bold text-slate-100">
                          {scenarioEvaluation.debugging_score}%
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">Architecture Resilience</span>
                        <span className="text-base font-bold text-slate-100">
                          {scenarioEvaluation.architecture_score}%
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px]">Decision Quality</span>
                        <span className="text-base font-bold text-slate-100">
                          {scenarioEvaluation.decision_quality_score}%
                        </span>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="space-y-2 text-xs">
                      {scenarioEvaluation.strengths?.map((s, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </div>
                      ))}
                      {scenarioEvaluation.weaknesses?.map((w, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      {scenarioEvaluation.overall_summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Generate a Day-in-the-Life Work Challenge</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select a candidate and challenge scenario (production latency incident, API spec design, or async concurrency debugging) above, then click <strong>Generate Work Challenge</strong>.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

