import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Footer, Button, ReadinessCard } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useDocumentTitle } from '@/hooks';
import {
  FileSearch,
  CheckCircle,
  TrendingUp,
  MapPin,
  Terminal,
  MessageSquareCode,
  Sparkles,
  ArrowRight,
  UploadCloud,
  Target,
  SearchCode,
  Flame,
  Code2,
  Video,
  Award,
  Check
} from 'lucide-react';

export default function Landing() {
  useDocumentTitle('AI Career Readiness Platform');

  const features = [
    {
      title: 'Resume Analysis',
      description: 'Deep semantic analysis that extracts your technical skills, certifications, and experience evidence.',
      icon: FileSearch,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Explainable ATS Score',
      description: 'Get clear, granular, transparent ATS scoring with actionable tips to bypass applicant tracking filters.',
      icon: CheckCircle,
      color: 'from-indigo-500 to-purple-600',
    },
    {
      title: 'Skill Gap Analysis',
      description: 'Pinpoint exact missing competencies and requirements compared against real industry job descriptions.',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Personalized Roadmap',
      description: 'Step-by-step milestone learning pathways curated specifically to close your identified skill gaps.',
      icon: MapPin,
      color: 'from-pink-500 to-rose-600',
    },
    {
      title: 'Practical Job Simulation',
      description: 'Solve authentic scenario-based challenges to prove hands-on technical ability beyond paper credentials.',
      icon: Terminal,
      color: 'from-rose-500 to-amber-600',
    },
    {
      title: 'Interview Simulator',
      description: 'Interactive AI-driven behavioral & technical interviews with live speech-to-text and detailed feedback.',
      icon: MessageSquareCode,
      color: 'from-amber-500 to-emerald-600',
    },
    {
      title: 'Readiness Twin',
      description: 'A dynamic AI digital twin computing your 5-dimensional holistic score of career role readiness.',
      icon: Sparkles,
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  const steps = [
    { title: 'Upload Resume', desc: 'Import your existing resume in PDF or DOCX format', icon: UploadCloud },
    { title: 'Choose Target Role', desc: 'Select your dream career role and target seniority', icon: Target },
    { title: 'Analyze Skills', desc: 'AI maps your verified proficiencies and strengths', icon: SearchCode },
    { title: 'Identify Gaps', desc: 'Detect missing critical tools and required knowledge', icon: Flame },
    { title: 'Test Practical Ability', desc: 'Complete realistic workplace mini-projects', icon: Code2 },
    { title: 'Practice Interview', desc: 'Simulate full mock interview rounds with instant feedback', icon: Video },
    { title: 'Measure Readiness', desc: 'Generate your multi-dimensional Readiness Twin score', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-400/10 dark:bg-brand-500/15 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-primary-400/10 dark:bg-primary-500/15 blur-[90px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/80 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Career Readiness Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                Know Where You Stand.{' '}
                <span className="bg-gradient-to-r from-brand-600 via-primary-600 to-indigo-600 dark:from-brand-400 dark:via-primary-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Know What to Improve.
                </span>{' '}
                Know When You're Ready.
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Ideal Skillset is an AI-powered career readiness platform that evaluates your skills, evidence, practical ability, and interview readiness to help you reach your target role.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to={ROUTES.SIGNUP} className="w-full sm:w-auto">
                  <Button variant="accent" size="lg" className="w-full sm:w-auto group">
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to={ROUTES.LOGIN} className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Login to Account
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Explainable ATS Scoring</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Interactive Mock Interviews</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Holistic Readiness Twin</span>
                </div>
              </div>
            </div>

            {/* Right Hero Preview Column: Readiness Twin Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md relative">
                <div className="absolute -top-4 -left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl p-3 shadow-lg border border-slate-200/80 dark:border-slate-800 z-10 hidden sm:flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                    92%
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white">ATS Optimization</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Junior Data Analyst</p>
                  </div>
                </div>

                <ReadinessCard
                  overallScore={74}
                  title="Readiness Twin"
                  subtitle="Target Role: Junior Data Analyst"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">Comprehensive Features</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Everything you need to transition into your dream career
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-3 text-base">
            From automated resume feedback to simulated technical assessments and personalized pathways.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md shadow-slate-200 dark:shadow-none mb-5 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300">
                  <span>Explore module</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-24 bg-white dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">The Ideal Skillset Pathway</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How Ideal Skillset Guides You
            </p>
            <p className="text-slate-600 dark:text-slate-400 mt-3 text-base">
              A structured 7-step pipeline designed to take you from uncertain applicant to job-ready candidate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div key={idx} className="relative flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center mb-3 shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-brand-600 dark:text-brand-400 mb-3 shadow-xs">
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">{step.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-gradient-to-r from-brand-900 via-slate-900 to-brand-950 rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-2xl space-y-6 relative z-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-300">About The Project</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Bridging the gap between academic learning and industry readiness.
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Ideal Skillset was engineered to eliminate ambiguity for graduating students and career switchers. Rather than relying on simple keyword matching, our multi-dimensional evaluation system tests your applied problem solving, code quality, and interview fluency.
            </p>
            <div className="pt-2">
              <Link to={ROUTES.SIGNUP}>
                <Button variant="accent" size="lg">
                  Start Your Assessment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

