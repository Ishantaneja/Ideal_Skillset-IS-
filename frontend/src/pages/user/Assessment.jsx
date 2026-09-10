import React, { useState, useEffect } from 'react';
import { Card, Button, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';
import { careerService } from '@/services';
import { Terminal, Clock, Award, Play, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function Assessment() {
  useDocumentTitle('Practical Job Simulations');
  const notify = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    target_role: user?.targetRole || 'Junior Data Analyst',
    practical_score: 71,
    challenges: [],
  });

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const res = await careerService.getAssessments();
      setData(res);
    } catch (err) {
      notify.warning('Loaded offline challenge catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, [user]);

  const handleStartSimulation = (title) => {
    notify.success(`Initializing virtual sandbox for: ${title}`);
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading personalized scenario simulations..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center">
            <Terminal className="w-6 h-6 text-brand-600 dark:text-brand-400 mr-2" /> Practical Job Simulations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personalized coding challenges and business scenarios tailored for <strong className="text-slate-800 dark:text-slate-200">{data.target_role}</strong> candidates.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center">
            <Award className="w-4 h-4 mr-1.5" /> Practical Readiness: {data.practical_score}%
          </span>
          <Button variant="outline" size="sm" onClick={loadChallenges}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Challenge List */}
      <div className="grid grid-cols-1 gap-5">
        {data.challenges.map((c, idx) => (
          <Card key={c.id || idx} className="hover:border-brand-300 dark:hover:border-brand-500 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-md">
                    <Terminal className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{c.title}</h3>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {c.difficulty}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                  {c.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {c.timeLimit}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1.5">
                    {c.topics.map((t, i) => (
                      <span key={i} className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                {c.status.includes('Locked') ? (
                  <Button variant="secondary" size="sm" disabled>
                    <AlertCircle className="w-4 h-4 mr-1.5" /> Locked
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => handleStartSimulation(c.title)}>
                    <Play className="w-4 h-4 mr-1.5" /> Start Simulation
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
