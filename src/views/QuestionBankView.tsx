import { Search, Flame, Code, Users, PlayCircle, FolderOpen } from 'lucide-react';

const categories = [
  {
    title: '前端高频',
    icon: <Code size={20} />,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    questions: [
      { id: 1, text: 'React的Fiber架构是如何工作的？', difficulty: '困难', tags: ['React', '源码'] },
      { id: 2, text: '请解释Event Loop机制以及宏任务/微任务。', difficulty: '中等', tags: ['JavaScript', '并发'] },
      { id: 3, text: 'Vue3响应式原理与Vue2有什么区别？', difficulty: '中等', tags: ['Vue', '响应式'] },
    ]
  },
  {
    title: '系统设计',
    icon: <FolderOpen size={20} />,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    questions: [
      { id: 4, text: '如何设计一个高并发的秒杀系统？', difficulty: '困难', tags: ['架构', '高并发'] },
      { id: 5, text: '设计一个短链接生成服务。', difficulty: '中等', tags: ['系统设计', '算法'] },
    ]
  },
  {
    title: '行为面试 (HR面)',
    icon: <Users size={20} />,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    questions: [
      { id: 6, text: '请描述一次你在项目中遇到重大挫折的经历。', difficulty: '一般', tags: ['抗压', '总结'] },
      { id: 7, text: '如果你和直属上级意见不合，你会怎么处理？', difficulty: '中等', tags: ['沟通', '情商'] },
    ]
  }
];

export function QuestionBankView({ onStartPractice }: { onStartPractice: (q: string) => void }) {
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center justify-center pt-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">全真面试题库</h1>
        <div className="w-full max-w-2xl relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
             <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="搜索你想练习的面经或题目 (例如：React Hooks, 分布式锁...)"
            className="w-full py-4 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat, idx) => (
          <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className={`p-6 border-b border-slate-100 ${cat.bg} flex items-center justify-between`}>
               <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm ${cat.color}`}>
                   {cat.icon}
                 </div>
                 <h2 className="text-lg font-bold text-slate-800">{cat.title}</h2>
               </div>
            </div>
            <div className="p-2 flex-1">
              {cat.questions.map(q => (
                <div key={q.id} className="p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                  <h3 className="font-medium text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors leading-relaxed tracking-tight">
                    {q.text}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
                     <div className="flex items-center gap-2">
                       <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${
                         q.difficulty === '困难' ? 'bg-rose-50 text-rose-600' :
                         q.difficulty === '中等' ? 'bg-amber-50 text-amber-600' :
                         'bg-emerald-50 text-emerald-600'
                       }`}>
                         {q.difficulty}
                       </span>
                       {q.tags.map(t => (
                         <span key={t} className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-medium hidden sm:inline-block">
                           {t}
                         </span>
                       ))}
                     </div>
                     <button
                       onClick={() => onStartPractice(q.text)}
                       className="p-2 rounded-full text-indigo-600 hover:bg-indigo-50 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0.5"
                       title="立刻练习这道题"
                     >
                       <PlayCircle size={18} />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
