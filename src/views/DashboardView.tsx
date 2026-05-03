import { Briefcase, FileText, Database, ArrowRight, Activity, Target } from 'lucide-react';
import { motion } from 'motion/react';

export function DashboardView({ onNavigate }: { onNavigate: (view: 'interview' | 'resume' | 'questions') => void }) {
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">你好，欢迎回来 👋</h1>
          <p className="text-slate-500 mt-2">今天是提升面试技巧的好日子，让我们开始练习吧。</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
             <div className="text-2xl font-black text-indigo-600">12</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">累计面试(次)</div>
          </div>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
             <div className="text-2xl font-black text-emerald-600">85</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">平均得分</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
         <button 
           onClick={() => onNavigate('interview')}
           className="relative overflow-hidden group bg-gradient-to-br from-indigo-600 to-purple-700 text-left p-8 rounded-3xl text-white shadow-xl shadow-indigo-200 transition-transform transform hover:-translate-y-1"
         >
            <div className="absolute top-0 right-0 p-8 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
               <Briefcase size={120} />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between min-h-[200px]">
               <div>
                 <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                    <Briefcase size={24} className="text-white" />
                 </div>
                 <h2 className="text-2xl font-bold mb-2">AI 模拟面试</h2>
                 <p className="text-indigo-100 font-medium">全真语音交互，极速生成面谈评估报告。</p>
               </div>
               <div className="flex items-center gap-2 font-bold text-sm text-white mt-8 group-hover:translate-x-2 transition-transform">
                  开始创建房间 <ArrowRight size={16} />
               </div>
            </div>
         </button>

         <button 
           onClick={() => onNavigate('resume')}
           className="relative overflow-hidden group bg-white border border-slate-200 text-left p-8 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-emerald-100 transition-all transform hover:-translate-y-1"
         >
            <div className="relative z-10 h-full flex flex-col justify-between min-h-[200px]">
               <div>
                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                    <FileText size={24} className="text-emerald-600" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">简历智能诊断</h2>
                 <p className="text-slate-500 font-medium">分析简历不足，提供大厂标准修改建议。</p>
               </div>
               <div className="flex items-center gap-2 font-bold text-sm text-emerald-600 mt-8 group-hover:translate-x-2 transition-transform">
                  优化我的简历 <ArrowRight size={16} />
               </div>
            </div>
         </button>

         <button 
           onClick={() => onNavigate('questions')}
           className="relative overflow-hidden group bg-white border border-slate-200 text-left p-8 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-blue-100 transition-all transform hover:-translate-y-1"
         >
            <div className="relative z-10 h-full flex flex-col justify-between min-h-[200px]">
               <div>
                 <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                    <Database size={24} className="text-blue-600" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">全真题库训练</h2>
                 <p className="text-slate-500 font-medium">前沿技术栈面经沉淀，系统设计全方位覆盖。</p>
               </div>
               <div className="flex items-center gap-2 font-bold text-sm text-blue-600 mt-8 group-hover:translate-x-2 transition-transform">
                  浏览题库 <ArrowRight size={16} />
               </div>
            </div>
         </button>
      </div>
    </div>
  );
}
