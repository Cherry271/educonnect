import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, GraduationCap, Globe } from 'lucide-react';
import { useAuthStore, mockUsers } from '../store/authStore';
import { authApi, usersApi } from '../api/client';
import toast from 'react-hot-toast';

interface LoginViewProps {
  onNavigateToRegister: () => void;
}

export default function LoginView({ onNavigateToRegister }: LoginViewProps) {
  const { setTokens, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Call backend API
      const response = await authApi.login(email, password);
      const { access_token, refresh_token } = response.data;
      
      setTokens(access_token, refresh_token);
      
      // Fetch user details
      const userRes = await usersApi.me();
      setUser(userRes.data);
      toast.success('Successfully logged in!');
    } catch (err) {
      console.log('Backend auth failed, trying offline mock credentials...', err);
      
      // Offline fallback
      setTimeout(() => {
        const lowerEmail = email.toLowerCase();
        let targetUser = mockUsers.juliandrax; // default fallback

        if (lowerEmail.includes('alex') || lowerEmail.includes('student')) {
          targetUser = mockUsers.alexrivera;
        }

        // Simulating login from seed data credentials
        if (
          (lowerEmail === 'admin@educonnect.edu' && password === 'Admin123!') ||
          (lowerEmail === 'sarah@educonnect.edu' && password === 'Teacher123!') ||
          (lowerEmail === 'alex@educonnect.edu' && password === 'Student123!') ||
          // Also allow quick testing for any input
          (email.length > 3 && password.length >= 4)
        ) {
          setTokens('mock-access-token', 'mock-refresh-token');
          setUser(targetUser);
          toast.success(`Logged in as ${targetUser.first_name} (Offline Mode)`);
        } else {
          toast.error('Invalid credentials. (Hint: use alex@educonnect.edu / Student123!)');
        }
        setIsLoading(false);
      }, 1000);
      return;
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#121413] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Background Speckled Textures / Gradients */}
      <div className="absolute inset-0 bg-radial-at-t from-[#1b4332]/20 via-[#121413]/50 to-[#121413] pointer-events-none" />
      <div className="absolute top-6 left-6 flex gap-4 text-gray-500 text-sm">
        <button className="hover:text-white transition-colors cursor-pointer font-semibold">A/文</button>
        <button className="hover:text-white transition-colors cursor-pointer">🌙</button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[420px] bg-[#1a1d1b] border border-gray-900 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#3ddc97] flex items-center justify-center text-dark-bg shadow-lg shadow-emerald-500/10">
            <GraduationCap size={26} className="stroke-[2.5]" />
          </div>
          <h1 className="text-white font-black text-2xl tracking-wide mt-4">EduConnect</h1>
          <p className="text-gray-500 text-xs mt-1">Empowering the next generation of learners</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 px-0.5">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input
                type="email"
                placeholder="name@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#202221] border border-gray-900 rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:outline-hidden focus:border-[#3ddc97]/50 placeholder:text-gray-600 transition-all font-medium"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 px-0.5">
              <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                Password
              </label>
              <a href="#forgot" className="text-[#3ddc97] hover:text-[#33c384] text-[10px] font-bold transition-colors">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#202221] border border-gray-900 rounded-xl py-3 pl-11 pr-11 text-xs text-white focus:outline-hidden focus:border-[#3ddc97]/50 placeholder:text-gray-600 transition-all font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#3ddc97] hover:bg-[#33c384] text-dark-bg font-bold py-3.5 rounded-xl text-xs transition-colors mt-2 cursor-pointer shadow-lg shadow-emerald-500/5"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-900" />
          </div>
          <span className="relative bg-[#1a1d1b] px-3 text-[9px] text-gray-600 font-bold uppercase tracking-widest">
            or continue with
          </span>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => toast.success('Google login clicked')}
            className="border border-gray-900 hover:border-gray-800 hover:bg-white/[0.01] rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs text-gray-300 font-semibold transition-all cursor-pointer"
          >
            <Globe size={14} className="text-gray-400" />
            <span>Google</span>
          </button>
          
          <button
            type="button"
            onClick={() => toast.success('Microsoft login clicked')}
            className="border border-gray-900 hover:border-gray-800 hover:bg-white/[0.01] rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs text-gray-300 font-semibold transition-all cursor-pointer"
          >
            <span className="w-3.5 h-3.5 bg-gray-600 rounded-xs flex items-center justify-center text-[8px] font-black text-dark-bg shrink-0">田</span>
            <span>Microsoft</span>
          </button>
        </div>

        {/* Footer Link */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <span>Don't have an account? </span>
          <button
            onClick={onNavigateToRegister}
            className="text-[#3ddc97] hover:text-[#33c384] font-bold hover:underline transition-colors cursor-pointer"
          >
            Create Account
          </button>
        </div>

        {/* Privacy footer links */}
        <div className="flex justify-center gap-4 text-[10px] text-gray-600 mt-6 pt-4 border-t border-gray-900/40">
          <a href="#privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
          <a href="#terms" className="hover:text-gray-400 transition-colors">Terms of Service</a>
          <a href="#help" className="hover:text-gray-400 transition-colors">Help Center</a>
        </div>

      </div>
    </div>
  );
}
