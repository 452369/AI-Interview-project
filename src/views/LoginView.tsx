import React, { useState } from 'react';
import { api, setAuthToken } from '../services/api';
import { LogIn, UserPlus, FileSignature } from 'lucide-react';
import { motion } from 'framer-motion';

export function LoginView({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const res = await api.auth.login({ username, password });
        setAuthToken(res.token);
      } else {
        const res = await api.auth.register({ username, password });
        setAuthToken(res.token);
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <LogIn size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isLogin ? '欢迎回来' : '创建账号'}
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            连接到 Ai-Interviewer 本地后端
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-6 border border-rose-100 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">用户名</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="请输入用户名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="请输入密码"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              <><LogIn size={18} /> 登录</>
            ) : (
              <><UserPlus size={18} /> 注册</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? "还没有账号？" : "已有账号？"}{' '}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 font-medium hover:underline"
          >
            {isLogin ? "立即注册" : "去登录"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
