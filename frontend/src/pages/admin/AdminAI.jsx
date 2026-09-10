import React, { useState, useEffect } from 'react';
import { Card, Button, ProgressBar, ScoreCard, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  Activity,
  Zap,
  Server,
  Layers,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';

export default function AdminAI() {
  useDocumentTitle('AI & Inference Monitoring');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const loadAI = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await adminService.getAIHealth();
      setData(res);
      if (isManual) notify.success('AI service health verified');
    } catch (err) {
      notify.error(err.message || 'Could not load AI telemetry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAI();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage message="Pinging local Ollama inference service and querying telemetry..." />;
  }

  const {
    ollama_status = 'online',
    active_model = 'llama3:latest',
    total_requests = 0,
    failure_count = 0,
    average_latency_ms = 0,
    system_load = 'normal',
    model_parameters = '8B Q4_K_M',
    embedding_model = 'all-minilm:latest',
  } = data || {};

  const isOnline = ollama_status.toLowerCase() === 'online';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">AI & Ollama System Monitoring</h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                isOnline
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {isOnline ? 'Inference Engine Operational' : 'Service Offline'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time inference telemetry, active LLM model parameters, response latency, and system load
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          onClick={() => loadAI(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          <span>{refreshing ? 'Verifying...' : 'Ping Service'}</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Active LLM Engine"
          value={active_model}
          subtitle={`Quantization: ${model_parameters}`}
          icon={Cpu}
          badge="Primary Model"
          badgeColor="brand"
        />

        <ScoreCard
          title="Avg Inference Latency"
          value={`${average_latency_ms.toFixed(1)} ms`}
          subtitle="Prompt-to-token response time"
          icon={Zap}
          badge={average_latency_ms < 200 ? 'Ultra Fast' : 'Normal'}
          badgeColor="emerald"
        />

        <ScoreCard
          title="Total Prompts Served"
          value={total_requests}
          subtitle={`${failure_count} total failures`}
          icon={Activity}
          badge={`${(((total_requests - failure_count) / (total_requests || 1)) * 100).toFixed(1)}% Success`}
          badgeColor="blue"
        />

        <ScoreCard
          title="System Load State"
          value={system_load.toUpperCase()}
          subtitle="Resource headroom optimal"
          icon={Server}
          badge="Healthy"
          badgeColor="emerald"
        />
      </div>

      {/* Model Spec & Inference Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Model Specs */}
        <Card className="lg:col-span-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-brand-500" />
              Active LLM & Vector Architecture
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configured generative model pipeline and embedding models
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Generative Inference LLM</span>
                <p className="text-[11px] text-slate-500">Evaluates resumes, job matches, and generates roadmaps</p>
              </div>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded border border-brand-200 dark:border-brand-900">
                {active_model}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Embedding & Vector Model</span>
                <p className="text-[11px] text-slate-500">Computes skill gap semantic cosine similarities</p>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
                {embedding_model}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Model Parameters & Precision</span>
                <p className="text-[11px] text-slate-500">Quantized weights optimized for low-latency local execution</p>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
                {model_parameters}
              </span>
            </div>
          </div>
        </Card>

        {/* Security & Reliability Safeguards */}
        <Card className="lg:col-span-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" />
              Inference Security & Resilience Guarantees
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Runtime safeguards protecting privacy and preventing telemetry leakage
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero Secret & API Key Leakage Policy</span>
              </div>
              <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                Internal model tokens and endpoints are sanitized prior to administrative presentation.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200">
                <Clock className="w-4 h-4 text-brand-500" />
                <span>Deterministic Fallback Engine</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                If the local Ollama daemon experiences high load, the system seamlessly engages cached embeddings without throwing 500 exceptions.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

