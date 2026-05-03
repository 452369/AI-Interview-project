import { useState } from 'react';
import { FileText, Sparkles, AlertCircle, CheckCircle2, ArrowUpCircle } from 'lucide-react';
import { analyzeResumeText } from '../services/geminiService';
import { ResumeAnalysisResult } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function ResumeAnalyzerView() {
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const res = await analyzeResumeText(resumeText);
      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
          <FileText size={32} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">智能简历优化专家</h1>
        <p className="text-slate-500 text-lg max-w-2xl">
          结合大厂招聘标准，全方位分析您的简历，发掘亮点、指出不足，并提供针对性的修改建议，助您斩获心仪 Offer。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-500" />
              解析简历内容
            </h3>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="请在此粘贴您的纯文本简历内容..."
              className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-[400px] text-sm leading-relaxed"
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !resumeText.trim()}
              className="mt-4 w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles size={18} className="animate-spin" />
                  AI 正在深度解析...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  开始解析简历
                </>
              )}
            </button>
          </div>
        </div>

        <div className="h-full">
          <AnimatePresence mode="wait">
            {!result && !isAnalyzing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl w-full h-[500px] flex flex-col items-center justify-center text-slate-400 p-8 text-center"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                  <FileText size={32} className="text-slate-300" />
                </div>
                <p className="font-medium text-lg text-slate-600 mb-2">等待简历输入</p>
                <p className="text-sm max-w-sm">
                  请在左侧输入您的简历文本，点击解析即可获取 AI 专家级优化报告。
                </p>
              </motion.div>
            ) : isAnalyzing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl w-full h-[500px] border border-slate-200 shadow-sm flex flex-col items-center justify-center"
              >
                <div className="relative">
                   <div className="w-24 h-24 border-4 border-indigo-100 rounded-full animate-spin">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-500 rounded-full" />
                   </div>
                   <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" size={32} />
                </div>
                <p className="font-bold text-slate-600 mt-8">正在从多维度评估简历匹配度...</p>
              </motion.div>
            ) : result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">简历诊断报告</h2>
                    <p className="text-slate-500 text-sm mt-1">{result.summary}</p>
                  </div>
                  <div className="text-center bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100">
                    <div className="text-4xl font-black text-indigo-600 leading-none">{result.overallScore}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">综合评分</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <CheckCircle2 size={16} /> 核心亮点优势
                    </h3>
                    <ul className="space-y-3">
                      {result.strengths.map((item, i) => (
                        <li key={i} className="flex gap-3 text-slate-700 text-sm">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <AlertCircle size={16} /> 薄弱环节与风险
                    </h3>
                    <ul className="space-y-3">
                      {result.weaknesses.map((item, i) => (
                        <li key={i} className="flex gap-3 text-slate-700 text-sm">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <ArrowUpCircle size={16} /> 优化建议与行动项
                    </h3>
                    <ul className="space-y-4">
                      {result.suggestions.map((item, i) => (
                        <li key={i} className="flex items-start gap-4">
                           <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">{i + 1}</div>
                           <p className="text-sm text-slate-700 leading-relaxed font-medium">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
