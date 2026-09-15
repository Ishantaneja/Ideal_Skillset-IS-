import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Clock,
  ShieldCheck,
  Save,
  Sliders,
  Check,
  Sparkles,
} from 'lucide-react';
import { Card, Button, Input, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterSettings() {
  useDocumentTitle('Recruiter & Company Settings');
  const notify = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    company_name: '',
    minutes_saved_per_resume: 3.5,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await recruiterService.getSettings();
        setSettings(data);
      } catch (err) {
        notify.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await recruiterService.updateSettings(settings.minutes_saved_per_resume);
      setSettings(updated);
      notify.success('Screening assumptions updated successfully!');
    } catch (err) {
      notify.error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading settings..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
          <Settings className="w-4 h-4" />
          <span>Organization Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Recruiter & Screening Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Customize your company profile and screening time benchmarks for ROI analytics.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Profile Card */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            Company & Recruiter Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Company Name
              </label>
              <Input
                type="text"
                disabled
                value={settings.company_name || user?.companyName || 'TechHire Global Talent'}
                className="bg-slate-100 dark:bg-slate-800 text-slate-500"
              />
              <span className="text-[10px] text-slate-400">
                Managed under multi-tenant enterprise isolation.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Recruiter Name
              </label>
              <Input
                type="text"
                disabled
                value={user?.name || 'Recruiter Lead'}
                className="bg-slate-100 dark:bg-slate-800 text-slate-500"
              />
            </div>
          </div>
        </Card>

        {/* Screening Time Assumptions */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            Screening Time & ROI Assumptions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define the baseline minutes a human recruiter typically spends reading each resume. This parameter drives the hours-saved and efficiency analytics.
          </p>

          <div className="max-w-xs space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Minutes Saved per Screened Resume:
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="30"
                value={settings.minutes_saved_per_resume}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minutes_saved_per_resume: parseFloat(e.target.value) || 3.5,
                  })
                }
              />
              <span className="text-xs font-bold text-slate-500">minutes</span>
            </div>
          </div>
        </Card>

        {/* Responsible AI & Fairness Notice */}
        <Card className="p-6 bg-slate-50/60 dark:bg-slate-850 border-dashed space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Fairness & Neutrality Guarantee</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            All candidate evaluations are strictly grounded in verifiable technical skills, project codebase artifacts, work experience tenure, and formal credentials. Ideal Skillset never uses protected demographic characteristics (gender, race, age, photo) in resume screening.
          </p>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

