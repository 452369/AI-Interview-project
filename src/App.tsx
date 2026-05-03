/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Settings, 
  MessageSquare, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  ChevronRight,
  TrendingUp,
  Target,
  Zap,
  LayoutDashboard,
  Video,
  FileText,
  Database
} from 'lucide-react';
import { InterviewConfig, Message, EvaluationResult } from './types';
import { generateInterviewQuestion, evaluateInterview, textToSpeech } from './services/geminiService';
import { ReviewRadar } from './components/ReviewRadar';
import { CameraView } from './components/CameraView';
import { AudioPlayer } from './components/AudioPlayer';
import { DashboardView } from './views/DashboardView';
import { ResumeAnalyzerView } from './views/ResumeAnalyzerView';
import { QuestionBankView } from './views/QuestionBankView';
import { LoginView } from './views/LoginView';
import ReactMarkdown from 'react-markdown';
import { ThemeToggle } from './components/ThemeToggle';
import { cn } from './lib/utils';
import { getAuthToken, api } from './services/api';

import { Toaster, toast } from 'sonner';

type BaseView = 'dashboard' | 'interview' | 'resume' | 'questions';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAuthToken());
  const [currentView, setCurrentView] = useState<BaseView>('dashboard');
  const [step, setStep] = useState<'setup' | 'interview' | 'results'>('setup');

  const [config, setConfig] = useState<InterviewConfig>({
    role: '前端开发工程师',
    track: '技术面试',
    difficulty: '中级',
    companyName: '谷歌',
    resumeText: ''
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);
  
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onresult = (event: any) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
           setInputText(prev => prev + final);
        }
        setInterimText(interim);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimText('');
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setInputText('');
      setInterimText('');
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Error starting recognition', e);
      }
    }
  };

  useEffect(() => {
    let interval: any;
    if (step === 'interview') {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);

  const startInterview = async () => {
    setStep('interview');
    setIsLoading(true);
    try {
      // Connect to the Java backend
      const res = await api.interview.createSession({
        jobCategoryId: 1, // Simplified for now; you could let users select it
        difficulty: config.difficulty === '初级' ? 'EASY' : config.difficulty === '中级' ? 'MEDIUM' : 'HARD',
        questionCount: 5,
      });
      
      setSessionId(res.session.id);
      setCurrentQuestionId(res.firstQuestion.id);

      const firstQuestionText = res.firstQuestion.questionText;

      const newMessage: Message = {
        role: 'assistant',
        content: firstQuestionText,
        timestamp: Date.now()
      };
      setMessages([newMessage]);
      
      if (isAudioEnabled) {
        const audio = await textToSpeech(firstQuestionText);
        if (audio) setCurrentAudio(audio);
      }
      toast.success('面试环境已准备就绪！');
    } catch (error: any) {
      console.error('Failed to start interview:', error);
      toast.error(error.message || '启动面试失败，网络可能存在问题');
      setStep('setup'); // Fallback to setup if starting fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !sessionId || !currentQuestionId) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Submit answer to the Java backend
      const res = await api.interview.submitAnswer(currentQuestionId, userMessage.content);
      
      if (res.nextQuestion) {
        setCurrentQuestionId(res.nextQuestion.id);
        const assistantMessage: Message = {
          role: 'assistant',
          content: res.nextQuestion.questionText,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);

        if (isAudioEnabled) {
          const audio = await textToSpeech(res.nextQuestion.questionText);
          if (audio) setCurrentAudio(audio);
        }
      } else {
        // Complete the session
        toast.success('所有问题已答完，正在生成评估报告...');
        await endInterview(sessionId);
      }
    } catch (error: any) {
      console.error('Failed to send answer:', error);
      toast.error(error.message || '发送回答失败，请检查网络');
      // On failure, revert the message view
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const endInterview = async (currentSessionId?: number) => {
    const sId = currentSessionId || sessionId;
    if (!sId) return;
    
    setIsLoading(true);
    try {
      // End tracking on backend side
      await api.interview.completeSession(sId);
      
      // We can reuse the frontend evaluation format or fetch results from backend.
      // E.g. getSessionDetail could contain all stats.
      const sessionDetail = await api.interview.getSessionDetail(sId);
      
      // Let's adapt it to our existing EvaluationResult object structure
      // Sum up average score
      const answers = sessionDetail.questions || [];
      const score = answers.length > 0 ? Math.round(answers.reduce((acc: number, val: any) => acc + (val.score || 0), 0) / answers.length) : 0;
      
      const result: EvaluationResult = {
        overallScore: score,
        communicationScore: score,
        technicalScore: score,
        problemSolvingScore: score,
        strengths: ["系统已记录您的回答", "您的回答已通过后端评估模型判定"],
        improvements: ["评估详细反馈可查看问题回顾"],
        detailedFeedback: answers.map((q: any) => `问题：${q.questionText}\n得分：${q.score || 0}\n反馈：${q.feedback || '无'}`).join('\n\n')
      };
      
      setEvaluation(result);
      setStep('results');
      toast.success('面试报告生成成功！');
    } catch (error: any) {
      console.error('Failed to end interview:', error);
      toast.error(error.message || '拉取面试报告失败，请稍后刷新');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-500/30 flex flex-col transition-colors duration-300">
      <Toaster position="top-center" richColors />
      {isAuthenticated && (
      <nav className="h-16 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-50 backdrop-blur-md transition-colors duration-300">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              AceAI
              <span className="text-indigo-600 dark:text-indigo-400 font-medium text-[10px] uppercase tracking-widest px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-500/20 hidden sm:inline-block">专家版</span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", currentView === 'dashboard' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50")}
            >
              <LayoutDashboard size={16} /> 工作台
            </button>
            <button 
              onClick={() => setCurrentView('interview')}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", currentView === 'interview' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50")}
            >
              <Video size={16} /> 模拟面试
            </button>
            <button 
              onClick={() => setCurrentView('resume')}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", currentView === 'resume' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50")}
            >
              <FileText size={16} /> 简历优化
            </button>
            <button 
              onClick={() => setCurrentView('questions')}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", currentView === 'questions' ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50")}
            >
              <Database size={16} /> 真题面经
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {currentView === 'interview' && step === 'interview' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold tabular-nums tracking-wider">{formatTime(sessionTime)}</span>
            </div>
          )}
          <button 
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={cn(
              "p-2 rounded-full transition-all border",
              isAudioEnabled ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-200 text-slate-400"
            )}
            title={isAudioEnabled ? "静音" : "取消静音"}
          >
            {isAudioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">访客用户</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">在线</p>
            </div>
            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs">
              U
            </div>
          </div>
        </div>
      </nav>
      )}

      <main className={cn(
        "flex-1 w-full flex flex-col",
        (!isAuthenticated || (currentView === 'interview' && step === 'interview')) ? "" : "max-w-7xl mx-auto px-4 py-8"
      )}>
        {!isAuthenticated ? (
          <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />
        ) : (
          <>
            {currentView === 'dashboard' && <DashboardView onNavigate={(view) => setCurrentView(view)} />}
            {currentView === 'resume' && <ResumeAnalyzerView />}
            {currentView === 'questions' && <QuestionBankView onStartPractice={(q) => {
               setConfig({ ...config, role: '自选题目练习', track: '技术面试', difficulty: '中级', companyName: '通用', resumeText: '重点考察：' + q });
               setCurrentView('interview');
               setStep('setup');
            }} />}
            {currentView === 'interview' && (
              <AnimatePresence mode="wait">
                {step === 'setup' && (
                  <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">为梦寐以求的工作做好准备</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg">选择面试参数，开始一场真实的 AI 驱动面试环节。</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Briefcase size={14} className="text-indigo-500" /> 目标职位
                    </label>
                    <input 
                      type="text" 
                      value={config.role}
                      onChange={e => setConfig({...config, role: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="例如：资深前端工程师"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Settings size={14} className="text-indigo-500" /> 面试类别
                    </label>
                    <select 
                      value={config.track}
                      onChange={e => setConfig({...config, track: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all appearance-none"
                    >
                      <option>技术面试</option>
                      <option>行为面试</option>
                      <option>系统设计</option>
                      <option>产品管理</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <TrendingUp size={14} className="text-indigo-500" /> 难度级别
                    </label>
                    <select 
                      value={config.difficulty}
                      onChange={e => setConfig({...config, difficulty: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all appearance-none"
                    >
                      <option>初级</option>
                      <option>中级</option>
                      <option>高级</option>
                      <option>专家/架构师</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Target size={14} className="text-indigo-500" /> 目标公司
                    </label>
                    <input 
                      type="text" 
                      value={config.companyName}
                      onChange={e => setConfig({...config, companyName: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="例如：字节跳动、腾讯、初创公司"
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <MessageSquare size={14} className="text-indigo-500" /> 个人简历 / 工作背景 (可选)
                  </label>
                  <textarea 
                    value={config.resumeText}
                    onChange={e => setConfig({...config, resumeText: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all h-32 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    placeholder="粘贴你的简历或简短描述工作经历，以获得个性化的面试体验。"
                  />
                </div>

                <button 
                  onClick={startInterview}
                  disabled={isLoading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-600/30 active:scale-[0.98]"
                >
                  {isLoading ? '准备实验室中...' : '开始面试环节'}
                  <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'interview' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full p-6 gap-6 bg-slate-50/50"
            >
              {/* Left Panel: Progress */}
              <aside className="w-72 hidden lg:flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">面试进度</h3>
                  <div className="space-y-6">
                    {messages.filter(m => m.role === 'assistant').map((msg, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm shadow-emerald-100">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">问: {msg.content.slice(0, 50)}...</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">已完成</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-lg shadow-indigo-200 animate-pulse">
                        {messages.filter(m => m.role === 'assistant').length + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">当前阶段</p>
                        <p className="text-[10px] text-indigo-500 font-bold mt-0.5 uppercase tracking-wider">进行中</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex-1">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">实时反馈</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-2 uppercase tracking-wider">
                        <span className="text-slate-500">信心水平</span>
                        <span className="text-indigo-600">活跃</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: (messages.length * 10) % 100 || 30 }}
                          className="h-full bg-indigo-500 transition-all duration-1000" 
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-2 uppercase tracking-wider">
                        <span className="text-slate-500">表达清晰度</span>
                        <span className="text-emerald-500">分析中</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: Math.min(messages.length * 15, 95) || 20 }}
                           className="h-full bg-emerald-500 transition-all duration-1000" 
                        />
                      </div>
                    </div>
                    <div className="pt-6 mt-6 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">核心关注点</p>
                      <div className="flex flex-wrap gap-2">
                        {config.role.split(' ').map((word, i) => (
                           <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-slate-200">{word}</span>
                        ))}
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-indigo-100">{config.track}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2 tracking-wider">AI 洞察</p>
                      <p className="text-[11px] text-indigo-900 leading-relaxed italic">
                        "试着使用你过去项目中的具体案例来阐释你的技术决策。"
                      </p>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Center: Stage */}
              <section className="flex-1 flex flex-col gap-6 min-w-0">
                <div className="relative flex-1 bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-slate-200">
                  {/* AI Interviewer Stage */}
                  <div className="absolute inset-0 flex items-center justify-center flex-col bg-slate-950">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={isLoading ? 'loading' : 'ready'}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                      >
                        <div className={cn(
                          "w-48 h-48 rounded-full border-[10px] flex items-center justify-center transition-all duration-700",
                          isLoading 
                            ? "border-indigo-500/20 scale-95" 
                            : "border-indigo-500/40 scale-100 shadow-[0_0_80px_rgba(79,70,229,0.2)]"
                        )}>
                          <div className={cn(
                             "w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-inner transition-all duration-500",
                             isLoading ? "bg-slate-800 scale-90" : "bg-gradient-to-br from-indigo-500 to-indigo-700 scale-100"
                          )}>
                             {isLoading ? "⌛" : "🤖"}
                          </div>
                        </div>
                        {!isLoading && (
                          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5 items-end h-10">
                            {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                              <motion.div 
                                key={i}
                                animate={{ height: [h * 4, h * 8, h * 4] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                                className="w-1.5 bg-indigo-400 rounded-full" 
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                    <p className="text-indigo-200/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-16">
                      {isLoading ? "正在生成问题..." : "AI 面试官正在倾听"}
                    </p>
                  </div>

                  {/* Camera Placeholder */}
                  <div className="absolute top-8 right-8 w-56 h-36 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 overflow-hidden shadow-2xl flex items-center justify-center">
                    <CameraView />
                  </div>

                  {/* High Tech Overlay for current question */}
                  <AnimatePresence>
                    {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-10 left-8 right-8 bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                      >
                         <div className="text-white text-xl font-medium leading-relaxed font-sans prose prose-invert max-w-none">
                           <ReactMarkdown>
                             {messages[messages.length - 1].content}
                           </ReactMarkdown>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Controls */}
                <div className="h-24 px-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="px-5 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                      回顾简历
                    </button>
                    <button 
                      onClick={() => {
                        if (messages.length > 0) {
                          const lastAgentMsg = messages.filter(m => m.role === 'assistant').pop();
                          if (lastAgentMsg) textToSpeech(lastAgentMsg.content).then(a => a && setCurrentAudio(a));
                        }
                      }}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-100 transition-all"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>

                  <div className="flex-1 max-w-xl px-8">
                    <div className="relative flex items-center gap-2">
                      <button 
                        onClick={toggleRecording}
                        className={cn(
                          "absolute left-2 z-10 p-2 rounded-xl transition-all",
                          isRecording 
                            ? "bg-rose-50 text-rose-500 hover:bg-rose-100 animate-pulse border border-rose-200" 
                            : "bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100"
                        )}
                      >
                        <Mic size={18} />
                      </button>
                      <textarea 
                        value={isRecording ? inputText + interimText : inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="在此输入您的回答或点击麦克风说话..."
                        className="w-full bg-slate-50 border-none rounded-2xl pl-14 pr-16 py-4 focus:ring-2 focus:ring-indigo-100 transition-all resize-none h-14 overflow-hidden leading-relaxed font-medium"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() && !interimText.trim() || isLoading}
                        className="absolute right-2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 transition-all shadow-lg shadow-indigo-100"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => endInterview()}
                    className="px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2"
                  >
                    完成面试
                  </button>
                </div>
              </section>

              {/* Right Panel: Transcript */}
              <aside className="w-80 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col shrink-0">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">实时笔录</h3>
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest border border-emerald-100">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    在线
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto space-y-8 custom-scrollbar bg-white">
                  {messages.map((m, i) => (
                    <div key={i} className="space-y-2">
                       <p className={cn(
                         "text-[9px] font-black uppercase tracking-widest",
                         m.role === 'assistant' ? "text-indigo-500" : "text-slate-400"
                       )}>
                         {m.role === 'assistant' ? "AceAI 智能面试官" : "候选人回答"}
                       </p>
                       <div className={cn(
                         "text-xs leading-relaxed text-slate-800 font-medium"
                       )}>
                         <ReactMarkdown>{m.content}</ReactMarkdown>
                       </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-3 py-2">
                       <div className="flex gap-1">
                         <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                         <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                         <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" />
                       </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                   <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     <span>自动分析</span>
                     <span className="text-indigo-500">处理中...</span>
                   </div>
                </div>
              </aside>
            </motion.div>
          )}

          {step === 'results' && evaluation && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">评估结果概览</h2>
                        <p className="text-slate-500 text-sm">本次面试环节的详细分析报告</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-black text-indigo-600 leading-none">{evaluation.overallScore}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">综合得分</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                       <div>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" /> 核心优势
                          </h3>
                          <ul className="space-y-3">
                            {evaluation.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-700">
                                <div className="p-1 bg-emerald-100 rounded-full mt-1">
                                  <ChevronRight size={10} className="text-emerald-700" />
                                </div>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                       </div>
                       <div>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" /> 提升建议
                          </h3>
                          <ul className="space-y-3">
                            {evaluation.improvements.map((im, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-700">
                                <div className="p-1 bg-amber-100 rounded-full mt-1">
                                  <ArrowRight size={10} className="text-amber-700" />
                                </div>
                                <span>{im}</span>
                              </li>
                            ))}
                          </ul>
                       </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                       <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Award size={16} className="text-indigo-500" /> 详细评价
                       </h3>
                       <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed italic">
                         {evaluation.detailedFeedback}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">技能图谱</h3>
                      <ReviewRadar evaluation={evaluation} />
                   </div>

                   <button 
                    onClick={() => {
                      setStep('setup');
                      setMessages([]);
                      setEvaluation(null);
                      setSessionTime(0);
                    }}
                    className="w-full py-4 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 transition-all font-bold rounded-2xl flex items-center justify-center gap-2"
                   >
                     <RefreshCw size={18} />
                     再次练习
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </>
    )}
  </main>
      
      <AudioPlayer base64Audio={currentAudio} onEnded={() => setCurrentAudio(null)} />
    </div>
  );
}
