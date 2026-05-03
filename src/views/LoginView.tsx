import React, { useState, useEffect } from 'react';
import { api, setAuthToken } from '../services/api';
import { LogIn, Rocket, Sparkles, Target, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ThemeToggle } from '../components/ThemeToggle';

const StarrySky = () => {
  const [stars, setStars] = useState<{id: number, x: number, y: number, r: number, opacity: number, animationDelay: string, animationDuration: string}[]>([]);
  
  useEffect(() => {
    // Generate stars only on client side to avoid hydration mismatch if SSR (thought this is Vite SPA)
    const generatedStars = Array.from({ length: 800 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: Math.random() * 1.2 + 0.3,
      opacity: Math.random() * 0.8 + 0.2,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${Math.random() * 3 + 2}s`
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-[#020813] via-[#071328] to-[#020813]" />
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.r}px`,
            height: `${star.r}px`,
            opacity: star.opacity,
            animationDelay: star.animationDelay,
            animationDuration: star.animationDuration
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(2,8,19,0.8)_100%)]" />
    </div>
  );
};

export function LoginView({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.auth.login({ username, password });
        setAuthToken(res.token);
        toast.success('登录成功，欢迎回来！');
      } else {
        const res = await api.auth.register({ username, password });
        setAuthToken(res.token);
        toast.success('注册成功，正在进入系统！');
      }
      onLoginSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-0 bg-[#FAFAFA] dark:bg-[#09090B] transition-colors duration-500 relative w-full overflow-hidden items-center justify-center p-4">
      {/* Theme Toggle at Top Right */}
      <div className="absolute top-6 right-8 z-50">
        <ThemeToggle />
      </div>

      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <StarrySky />
        
        {/* Light mode glows */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-b from-sky-200/40 to-blue-200/40 dark:hidden blur-[120px] mix-blend-multiply animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-t from-cyan-200/40 to-sky-200/40 dark:hidden blur-[120px] mix-blend-multiply animate-[pulse_10s_ease-in-out_infinite]" style={{ animationDelay: '5s' }} />
        
        {/* Dark mode nebula glowing effects */}
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 hidden dark:block blur-[120px] mix-blend-screen animate-[pulse_15s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 hidden dark:block blur-[150px] mix-blend-screen animate-[pulse_15s_ease-in-out_infinite]" style={{ animationDelay: '7s' }} />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01OS41IDB2NjBIMHYtMWg1OXYtNTloMXoiIGZpbGw9IiM4MDgwODAiIGZpbGwtb3BhY2l0eT0iMC4wNSIgZmlsbC1ydWxlPSJldmVub2RkIi8+Cjwvc3ZnPg==')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] dark:[mask-image:radial-gradient(ellipse_at_center,white_10%,transparent_80%)] opacity-50 dark:opacity-20 z-0" />
      </div>

      {/* Floating Rich Content Elements (Hidden on mobile) */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
        className="absolute top-[25%] left-[10%] hidden xl:flex items-center gap-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/50 dark:border-zinc-800/50 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Target size={24} />
        </div>
        <div>
          <div className="text-2xl font-black text-zinc-800 dark:text-white leading-none mb-1">98%</div>
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">通过率显著提升</div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.8, type: 'spring' }}
        className="absolute bottom-[25%] right-[10%] hidden xl:flex items-center gap-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/50 dark:border-zinc-800/50 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50"
      >
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Zap size={24} />
        </div>
        <div>
          <div className="text-2xl font-black text-zinc-800 dark:text-white leading-none mb-1">&lt; 0.5s</div>
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">超低延迟语音交互</div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, type: 'spring' }}
        className="absolute top-[15%] right-[15%] hidden xl:flex items-center gap-3 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl py-3 px-5 rounded-full border border-white/50 dark:border-zinc-800/50 shadow-xl shadow-zinc-200/50 dark:shadow-black/50"
      >
        <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">企业级安全标准</span>
      </motion.div>

      {/* Main Login Form */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-zinc-300/50 dark:shadow-black/80 border border-white dark:border-zinc-800 p-8 sm:p-12 relative overflow-hidden">
          
          {/* Subtle inner top highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white dark:via-zinc-700 to-transparent opacity-50" />

          <div className="flex justify-center mb-10">
            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 blur-xl opacity-40 dark:opacity-20 animate-pulse" />
                <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-950 dark:from-zinc-100 dark:to-zinc-300 rounded-2xl flex items-center justify-center shadow-xl text-white dark:text-zinc-900 relative z-10 border border-zinc-700 dark:border-white">
                  <Sparkles size={28} />
                </div>
              </div>
              <div className="text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isLogin ? 'login' : 'register'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                      {isLogin ? '欢迎回来' : '开启未来'}
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm font-medium tracking-wide">
                      {isLogin ? '登录以继续您的 AI 面试之旅' : '创建您的专属高级账户'}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-left relative z-10">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">用户名</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium shadow-inner shadow-zinc-100 dark:shadow-none"
                placeholder="请输入用户名"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">密码</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium shadow-inner shadow-zinc-100 dark:shadow-none"
                placeholder="请输入密码"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8 relative overflow-hidden group shadow-xl shadow-zinc-900/20 dark:shadow-white/20 transition-all active:scale-[0.98]"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-zinc-900/10 to-transparent skew-x-12" />
              
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
              ) : isLogin ? (
                <><LogIn size={18} /> 立即登录</>
              ) : (
                <><Rocket size={18} /> 注册并进入</>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {isLogin ? "第一次来这里？" : "已经拥有账号？"}{' '}
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {isLogin ? "创建您的免费账户" : "在此登录"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

