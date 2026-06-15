import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, GraduationCap, Globe, Users } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { authApi, usersApi } from "../api/client";
import toast from "react-hot-toast";

interface LoginViewProps {
  onNavigateToRegister: () => void;
}

export default function LoginView({ onNavigateToRegister }: LoginViewProps) {
  const { setTokens, setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot / Reset Password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [isSendingForgot, setIsSendingForgot] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Email verification state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleDemoLogin = async (role: "student" | "teacher" | "parent" | "admin") => {
    let demoEmail = "";
    let demoPassword = "";

    if (role === "student") {
      demoEmail = "alex@educonnect.edu";
      demoPassword = "Student123!";
    } else if (role === "teacher") {
      demoEmail = "sarah@educonnect.edu";
      demoPassword = "Teacher123!";
    } else if (role === "parent") {
      demoEmail = "admin@police.gov.cm";
      demoPassword = "Parent123!";
    } else if (role === "admin") {
      demoEmail = "admin@educonnect.edu";
      demoPassword = "Admin123!";
    }

    setEmail(demoEmail);
    setPassword(demoPassword);

    setIsLoading(true);
    try {
      const response = await authApi.login(demoEmail, demoPassword);
      const { access_token, refresh_token } = response.data;
      setTokens(access_token, refresh_token);

      try {
        const userRes = await usersApi.me();
        setUser(userRes.data);
      } catch (userErr) {
        console.error("Failed to fetch user after demo login:", userErr);
      }

      toast.success(`Logged in successfully as ${role}!`);
    } catch (err: any) {
      console.error("Demo login error:", err);
      if (!err?.response) {
        toast.error("Cannot reach the server. Make sure the backend is running on port 8000.");
      } else {
        const detail = err.response?.data?.detail;
        const status = err.response?.status;
        toast.error(detail || `Demo login failed (${status})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      const { access_token, refresh_token } = response.data;
      setTokens(access_token, refresh_token);

      try {
        const userRes = await usersApi.me();
        setUser(userRes.data);
      } catch {
        // tokens saved; user data will be re-fetched on next request
      }

      toast.success("Logged in successfully!");
    } catch (err: any) {
      console.error("Login error:", err);
      if (!err?.response) {
        toast.error(
          "Cannot reach the server. Make sure the backend is running on port 8000.",
        );
      } else {
        const detail = err.response?.data?.detail;
        const status = err.response?.status;
        if (status === 401) {
          toast.error(detail || "Incorrect email or password.");
        } else if (status === 503) {
          toast.error(
            "Database unavailable. Please start MongoDB and restart the backend.",
          );
        } else if (status === 422) {
          toast.error(
            "Validation error. Check that your password is at least 8 characters.",
          );
        } else {
          toast.error(detail || `Login failed (${status}). Please try again.`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setIsSendingForgot(true);
    try {
      const res = await authApi.forgotPassword(forgotEmail.trim());
      const token = res.data?.reset_token;
      if (token) {
        setGeneratedToken(token);
        setResetToken(token); // pre-fill reset token
        toast.success("Reset token generated! Copy it below to reset password.");
      } else {
        toast.success("If the email exists, a reset link/token was generated.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to generate reset token");
    } finally {
      setIsSendingForgot(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim() || !newPassword.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsResetting(true);
    try {
      await authApi.resetPassword(resetToken.trim(), newPassword.trim());
      toast.success("Password reset successfully! You can now sign in.");
      setShowForgotModal(false);
      // Reset state
      setForgotEmail("");
      setResetToken("");
      setNewPassword("");
      setGeneratedToken("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyToken.trim()) {
      toast.error("Please enter your verification token");
      return;
    }
    setIsVerifying(true);
    try {
      await authApi.verifyEmail(verifyToken.trim());
      toast.success("Email verified successfully! You can now login.");
      setShowVerifyModal(false);
      setVerifyToken("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to verify email");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121413] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Speckled Textures / Gradients */}
      <div className="absolute inset-0 bg-radial-at-t from-[#1b4332]/20 via-[#121413]/50 to-[#121413] pointer-events-none" />
      <div className="absolute top-6 left-6 flex gap-4 text-gray-500 text-sm">
        <button className="hover:text-white transition-colors cursor-pointer font-semibold">
          A/文
        </button>
        <button className="hover:text-white transition-colors cursor-pointer">
          🌙
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[420px] bg-[#1a1d1b] border border-gray-900 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#3ddc97] flex items-center justify-center text-dark-bg shadow-lg shadow-emerald-500/10">
            <GraduationCap size={26} className="stroke-[2.5]" />
          </div>
          <h1 className="text-white font-black text-2xl tracking-wide mt-4">
            EduConnect
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Empowering the next generation of learners
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 px-0.5">
              Institutional Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                size={16}
              />
              <input
                type="email"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[#3ddc97] hover:text-[#33c384] text-[10px] font-bold transition-colors cursor-pointer bg-transparent border-0"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                size={16}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {isLoading ? "Signing In..." : "Sign In"}
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
            onClick={() => toast.success("Google login clicked")}
            className="border border-gray-900 hover:border-gray-800 hover:bg-white/[0.01] rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs text-gray-300 font-semibold transition-all cursor-pointer"
          >
            <Globe size={14} className="text-gray-400" />
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => toast.success("Microsoft login clicked")}
            className="border border-gray-900 hover:border-gray-800 hover:bg-white/[0.01] rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs text-gray-300 font-semibold transition-all cursor-pointer"
          >
            <span className="w-3.5 h-3.5 bg-gray-600 rounded-xs flex items-center justify-center text-[8px] font-black text-dark-bg shrink-0">
              田
            </span>
            <span>Microsoft</span>
          </button>
        </div>

        {/* Separator for Demo Login */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-900" />
          </div>
          <span className="relative bg-[#1a1d1b] px-3 text-[9px] text-[#3ddc97]/80 font-bold uppercase tracking-widest">
            Demo Quick Access
          </span>
        </div>

        {/* Demo Roles Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleDemoLogin("student")}
            className="border border-emerald-950/60 hover:border-emerald-500/30 hover:bg-[#1a2d21]/20 rounded-xl py-2 px-3 flex items-center gap-2 text-xs text-gray-300 font-semibold transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-900/40 flex items-center justify-center text-[#3ddc97] shrink-0">
              <GraduationCap size={13} />
            </div>
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin("teacher")}
            className="border border-emerald-950/60 hover:border-emerald-500/30 hover:bg-[#1a2d21]/20 rounded-xl py-2 px-3 flex items-center gap-2 text-xs text-gray-300 font-semibold transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-900/40 flex items-center justify-center text-amber-400 shrink-0">
              <Globe size={13} />
            </div>
            <span>Teacher</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin("parent")}
            className="border border-emerald-950/60 hover:border-emerald-500/30 hover:bg-[#1a2d21]/20 rounded-xl py-2 px-3 flex items-center gap-2 text-xs text-gray-300 font-semibold transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-900/40 flex items-center justify-center text-blue-400 shrink-0">
              <Users size={13} />
            </div>
            <span>Parent</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin("admin")}
            className="border border-emerald-950/60 hover:border-emerald-500/30 hover:bg-[#1a2d21]/20 rounded-xl py-2 px-3 flex items-center gap-2 text-xs text-gray-300 font-semibold transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-rose-900/40 flex items-center justify-center text-rose-400 shrink-0">
              <Lock size={13} />
            </div>
            <span>Admin</span>
          </button>
        </div>

        {/* Footer Link */}
        <div className="text-center mt-8 text-xs text-gray-500 flex flex-col gap-2">
          <div>
            <span>Don't have an account? </span>
            <button
              onClick={onNavigateToRegister}
              className="text-[#3ddc97] hover:text-[#33c384] font-bold hover:underline transition-colors cursor-pointer bg-transparent border-0"
            >
              Create Account
            </button>
          </div>
          <div>
            <span>Need to verify email? </span>
            <button
              onClick={() => setShowVerifyModal(true)}
              className="text-[#3ddc97] hover:text-[#33c384] font-bold hover:underline transition-colors cursor-pointer bg-transparent border-0"
            >
              Verify Now
            </button>
          </div>
        </div>

        {/* Privacy footer links */}
        <div className="flex justify-center gap-4 text-[10px] text-gray-600 mt-6 pt-4 border-t border-gray-900/40">
          <a href="#privacy" className="hover:text-gray-400 transition-colors">
            Privacy Policy
          </a>
          <a href="#terms" className="hover:text-gray-400 transition-colors">
            Terms of Service
          </a>
          <a href="#help" className="hover:text-gray-400 transition-colors">
            Help Center
          </a>
        </div>
      </div>

      {/* FORGOT & RESET PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-[420px] bg-[#1a1d1b] border border-gray-900 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-gray-900/50 pb-3">
              <h3 className="text-white font-bold text-sm tracking-wide">
                Password Recovery
              </h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setGeneratedToken("");
                }}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer bg-transparent border-0"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: Generate Token */}
            <form onSubmit={handleForgotPassword} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                  Enter Registered Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="name@university.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-hidden placeholder:text-gray-600 transition-all flex-1"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSendingForgot}
                    className="bg-[#3ddc97] hover:bg-[#33c384] text-dark-bg font-bold px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/5 text-xs"
                  >
                    {isSendingForgot ? "Sending..." : "Get OTP"}
                  </button>
                </div>
              </div>
            </form>

            {/* OTP Token generated display for developers/users (since mock backend outputs token) */}
            {generatedToken && (
              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3 text-center space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                  Generated Reset Token
                </span>
                <p className="text-white font-mono text-[11px] font-bold select-all bg-[#121413]/50 py-1.5 rounded-lg border border-gray-900">
                  {generatedToken}
                </p>
                <p className="text-gray-500 text-[8px]">
                  Copied automatically. Enter below to reset your password.
                </p>
              </div>
            )}

            {/* STEP 2: Input Token and Reset Password */}
            <form onSubmit={handleResetPassword} className="space-y-3.5 border-t border-gray-900/40 pt-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                  Reset Token (OTP)
                </label>
                <input
                  type="text"
                  placeholder="Paste reset token here"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-hidden placeholder:text-gray-600 transition-all font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-hidden placeholder:text-gray-600 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full bg-[#3ddc97] hover:bg-[#33c384] text-dark-bg font-bold py-3 rounded-xl transition-all cursor-pointer shadow-lg mt-2 text-xs"
              >
                {isResetting ? "Resetting Password..." : "Submit Reset"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EMAIL VERIFICATION MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-[420px] bg-[#1a1d1b] border border-gray-900 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-gray-900/50 pb-3">
              <h3 className="text-white font-bold text-sm tracking-wide">
                Verify Academic Email
              </h3>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer bg-transparent border-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyEmail} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                  Verification Token / Code
                </label>
                <input
                  type="text"
                  placeholder="verify_..."
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-hidden placeholder:text-gray-600 transition-all font-mono"
                  required
                />
                <p className="text-gray-500 text-[9px] mt-1.5 leading-relaxed px-0.5">
                  Enter the verification token generated for your profile to activate all social and academic features.
                </p>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-[#3ddc97] hover:bg-[#33c384] text-dark-bg font-bold py-3 rounded-xl transition-all cursor-pointer shadow-lg text-xs"
              >
                {isVerifying ? "Verifying..." : "Verify Email Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
