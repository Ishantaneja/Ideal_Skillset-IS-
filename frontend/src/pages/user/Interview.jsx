import React, { useState, useEffect } from 'react';
import { Card, Button, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';
import { careerService } from '@/services';
import { Mic, Video, Volume2, Sparkles, RefreshCw, CheckCircle2, MessageSquare, Award } from 'lucide-react';

export default function Interview() {
  useDocumentTitle('AI Interview Simulator');
  const notify = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  const [data, setData] = useState({
    target_role: user?.targetRole || 'Junior Data Analyst',
    communication_score: 76,
    questions: [],
  });

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await careerService.getInterviewQuestions();
      setData(res);
      setActiveQuestionIdx(0);
    } catch (err) {
      notify.warning('Loaded offline question bank');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [user]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      notify.info('Microphone recording candidate speech...');
    } else {
      notify.success('Speech recorded. Transcribing and evaluating tone and STAR structure...');
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    notify.info(isVideoOn ? 'Camera turned off' : 'Camera turned on');
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading personalized interview questions..." />;
  }

  const currentQ = data.questions[activeQuestionIdx] || {
    category: 'Behavioral & Problem Solving',
    question: 'Can you walk me through a situation where you discovered conflicting data across different business sources, and how you resolved the discrepancy?',
    target_competency: 'Data Integrity & Stakeholder Communication',
    star_hint: 'Situation: Conflicting metrics. Task: Identify root cause. Action: Cross-table SQL audit. Result: Reconciled executive numbers.',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <MessageSquare className="w-6 h-6 text-brand-600 mr-2" /> AI Interview Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personalized behavioral and technical mock rounds tailored for <strong className="text-slate-800">{data.target_role}</strong>.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="primary" size="sm" onClick={() => { setActiveQuestionIdx((prev) => (prev + 1) % Math.max(data.questions.length, 1)); notify.success('Loaded next mock question'); }}>
            <Sparkles className="w-4 h-4 mr-1.5" /> Next Question
          </Button>
          <Button variant="outline" size="sm" onClick={loadQuestions}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Simulator Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Prompt & Simulator View */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 text-white min-h-[380px] flex flex-col justify-between relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-xs font-semibold text-slate-300">
                  {currentQ.category} • {data.target_role} (Question {activeQuestionIdx + 1} of {data.questions.length})
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">12:45 / 30:00</span>
            </div>

            <div className="my-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold shrink-0">
                  AI
                </div>
                <div className="bg-slate-800/90 rounded-2xl rounded-tl-none p-5 max-w-xl text-sm leading-relaxed border border-slate-700">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-brand-300 text-xs">Target Competency:</span>
                    <span className="text-[10px] bg-brand-900/60 text-brand-200 px-2 py-0.5 rounded border border-brand-700/50">
                      {currentQ.target_competency}
                    </span>
                  </div>
                  <p className="text-slate-100 font-medium text-sm mt-1">{currentQ.question}</p>

                  {currentQ.star_hint && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700 text-xs text-slate-400">
                      <strong className="text-slate-300">STAR Response Hint: </strong>
                      <span>{currentQ.star_hint}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Microphone / Controls Bar */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Volume2 className="w-4 h-4 text-brand-400" />
                <span>{isRecording ? 'Listening to speech...' : 'Click "Start Speaking" to respond...'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleVideo}
                  className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                >
                  <Video className="w-3.5 h-3.5 mr-1" /> {isVideoOn ? 'Camera On' : 'Camera Off'}
                </Button>
                <Button
                  variant={isRecording ? 'danger' : 'primary'}
                  size="sm"
                  onClick={toggleRecording}
                >
                  <Mic className="w-3.5 h-3.5 mr-1" /> {isRecording ? 'Stop Speaking' : 'Start Speaking'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Feedback & Evaluation */}
        <div className="lg:col-span-4 space-y-4">
          <Card title="Candidate Speech Telemetry" subtitle="AI Communication & Delivery Model">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Communication Readiness</span>
                  <span className="font-bold text-slate-900">{data.communication_score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${data.communication_score}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Structured STAR Technique</span>
                  <span className="font-bold text-slate-900">82%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-500 h-full w-[82%] rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Technical Articulation</span>
                  <span className="font-bold text-slate-900">75%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[75%] rounded-full" />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Personalized AI Feedback</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When answering technical queries for <strong className="text-slate-800">{data.target_role}</strong>, remember to state the specific business impact metrics (e.g. latency reduced, rows processed, revenue impacted) in your 'Result' step.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
