import React, { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  User,
  Shield,
  Check,
  Globe,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import api, { authApi, usersApi } from "../api/client";
import toast from "react-hot-toast";

interface RegisterViewProps {
  onNavigateToLogin: () => void;
}

export default function RegisterView({ onNavigateToLogin }: RegisterViewProps) {
  const { setTokens, setUser } = useAuthStore();
  const [role, setRole] = useState<"student" | "teacher" | "parent">("student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTOS, setAgreeTOS] = useState(true);
  const [subscribeNews, setSubscribeNews] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolsList, setSchoolsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");

  React.useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await api.get("/schools");
        setSchoolsList(response.data?.items ?? []);
      } catch (e) {
        console.error("Failed to load schools", e);
      }
    };
    fetchSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!agreeTOS) {
      toast.error("You must agree to the Terms of Service");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const registerData = {
        first_name: firstName,
        last_name: lastName,
        username: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
        email: email,
        password: password,
        role: role,
        school: selectedSchool,
        department: "",
        faculty: "",
      };

      const response = await authApi.register(registerData);
      const { access_token, refresh_token } = response.data;
      setTokens(access_token, refresh_token);

      try {
        const userRes = await usersApi.me();
        setUser(userRes.data);
      } catch {
        // tokens saved; profile loaded on next request
      }

      toast.success("Account created successfully!");
    } catch (err: any) {
      console.error("Registration error:", err);
      if (!err?.response) {
        toast.error(
          "Cannot reach the server. Make sure the backend is running on port 8000.",
        );
      } else {
        const detail = err.response?.data?.detail;
        const status = err.response?.status;
        if (status === 400) {
          toast.error(detail || "This email or username is already in use.");
        } else if (status === 503) {
          toast.error(
            "Database unavailable. Please start MongoDB and restart the backend.",
          );
        } else if (status === 422) {
          // Pydantic validation error — extract the first message
          const errors = err.response?.data?.detail;
          if (Array.isArray(errors) && errors.length > 0) {
            toast.error(
              errors[0]?.msg || "Validation error. Please check your input.",
            );
          } else {
            toast.error("Validation error. Check all fields and try again.");
          }
        } else {
          toast.error(
            detail || `Registration failed (${status}). Please try again.`,
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#121413] select-none text-gray-100 font-sans">
      {/* LEFT PANEL: Teal Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#3ddc97] text-dark-bg relative overflow-hidden select-none">
        {/* Glow */}
        <div className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] bg-white/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-dark-bg flex items-center justify-center text-primary-400">
            <GraduationCap size={24} className="stroke-[2.5]" />
          </div>
          <span className="font-bold text-xl tracking-wide text-dark-bg">
            EduConnect
          </span>
        </div>

        {/* Hero message */}
        <div className="max-w-md my-auto space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-dark-bg/5 flex items-center justify-center text-dark-bg mb-6">
            <GraduationCap size={48} className="stroke-[1.5]" />
          </div>
          <h2 className="text-4xl font-black leading-tight tracking-tight text-dark-bg">
            Join EduConnect
          </h2>
          <p className="text-dark-bg/80 text-base font-semibold leading-relaxed">
            The global hub for students and educators to collaborate, share, and
            grow together.
          </p>
        </div>

        {/* Bottom outlined chat icon */}
        <div className="w-28 h-20 rounded-2xl border-3 border-dark-bg/40 flex items-center justify-center text-dark-bg/40 relative">
          <MessageSquare size={36} className="stroke-[2.5]" />
          <div className="absolute -bottom-2.5 left-8 border-[10px] border-transparent border-t-dark-bg/40" />
        </div>
      </div>

      {/* RIGHT PANEL: Form Inputs */}
      <div className="flex flex-col justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-[440px] mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">
              Create Account
            </h1>
            <p className="text-gray-500 text-xs mt-1.5">
              Already have an account?{" "}
              <button
                onClick={onNavigateToLogin}
                className="text-[#3ddc97] hover:text-[#33c384] font-bold hover:underline transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Picker */}
            <div>
              <span className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                I am a...
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                    role === "student"
                      ? "bg-dark-card border-[#3ddc97] text-white font-bold shadow-lg shadow-emerald-500/5"
                      : "bg-dark-card/50 border-gray-900 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <User
                    size={13}
                    className={
                      role === "student" ? "text-[#3ddc97]" : "text-gray-500"
                    }
                  />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                    role === "teacher"
                      ? "bg-dark-card border-[#3ddc97] text-white font-bold shadow-lg shadow-emerald-500/5"
                      : "bg-dark-card/50 border-gray-900 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Shield
                    size={13}
                    className={
                      role === "teacher" ? "text-[#3ddc97]" : "text-gray-500"
                    }
                  />
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setRole("parent")}
                  className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                    role === "parent"
                      ? "bg-dark-card border-[#3ddc97] text-white font-bold shadow-lg shadow-emerald-500/5"
                      : "bg-dark-card/50 border-gray-900 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <User
                    size={13}
                    className={
                      role === "parent" ? "text-[#3ddc97]" : "text-gray-500"
                    }
                  />
                  Parent
                </button>
              </div>
            </div>

            {/* First & Last Name side-by-side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="Alex"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#202221] border border-gray-900 rounded-xl py-3.5 pl-9 pr-3 text-xs text-white focus:outline-hidden focus:border-[#3ddc97]/50 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Last Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="Rivera"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#202221] border border-gray-900 rounded-xl py-3.5 pl-9 pr-3 text-xs text-white focus:outline-hidden focus:border-[#3ddc97]/50 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Academic Email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-bold font-mono">
                  @
                </span>
                <input
                  type="email"
                  placeholder="alex.r@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#202221] border border-gray-900 rounded-xl py-3.5 pl-9 pr-4 text-xs text-white focus:outline-hidden focus:border-[#3ddc97]/50 placeholder:text-gray-600 transition-all font-medium"
                  required
                />
              </div>
              <span className="block text-[10px] text-gray-600 mt-1.5 px-0.5">
                Use your institutional email for verification
              </span>
            </div>

            {/* School Dropdown */}
            {role !== "parent" && (
              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Institution / School
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full bg-[#202221] border border-gray-900 rounded-xl py-3.5 px-3 text-xs text-white focus:outline-hidden focus:border-[#3ddc97]/50 placeholder:text-gray-600 transition-all font-semibold cursor-pointer"
                >
                  <option value="">No School / Independent</option>
                  {schoolsList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                  size={14}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#202221] border border-gray-900 rounded-xl py-3.5 pl-9 pr-11 text-xs text-white focus:outline-hidden focus:border-[#3ddc97]/50 placeholder:text-gray-600 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Checkbox 1: TOS */}
            <div className="flex items-start gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAgreeTOS(!agreeTOS)}
                className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  agreeTOS
                    ? "bg-[#3ddc97] border-[#3ddc97] text-dark-bg"
                    : "border-gray-800 hover:border-gray-600"
                }`}
              >
                {agreeTOS && <Check size={12} className="stroke-[3]" />}
              </button>
              <div className="text-[11px] leading-relaxed text-gray-400">
                <span className="text-gray-200 font-semibold">
                  I agree to the Terms of Service
                </span>
                <p className="text-[10px] text-gray-500">
                  Read our privacy policy regarding data usage
                </p>
              </div>
            </div>

            {/* Checkbox 2: Newsletter */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setSubscribeNews(!subscribeNews)}
                className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  subscribeNews
                    ? "bg-[#3ddc97] border-[#3ddc97] text-dark-bg"
                    : "border-gray-800 hover:border-gray-600"
                }`}
              >
                {subscribeNews && <Check size={12} className="stroke-[3]" />}
              </button>
              <div className="text-[11px] leading-relaxed text-gray-400">
                <span className="text-gray-200 font-semibold">
                  Subscribe to newsletter
                </span>
                <p className="text-[10px] text-gray-500">
                  Occasional updates on new features and resources
                </p>
              </div>
            </div>

            {/* Create Account button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3ddc97] hover:bg-[#33c384] text-dark-bg font-bold py-3.5 rounded-xl text-xs transition-colors mt-2 cursor-pointer shadow-lg shadow-emerald-500/5"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-900" />
            </div>
            <span className="relative bg-[#121413] px-3 text-[9px] text-gray-600 font-bold uppercase tracking-widest">
              or
            </span>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => toast.success("Google registration clicked")}
              className="border border-gray-900 hover:border-gray-800 hover:bg-white/[0.01] rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs text-gray-300 font-semibold transition-all cursor-pointer"
            >
              <Globe size={14} className="text-gray-400" />
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => toast.success("Microsoft registration clicked")}
              className="border border-gray-900 hover:border-gray-800 hover:bg-white/[0.01] rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs text-gray-300 font-semibold transition-all cursor-pointer"
            >
              <span className="w-3.5 h-3.5 bg-gray-600 rounded-xs flex items-center justify-center text-[8px] font-black text-dark-bg shrink-0">
                田
              </span>
              <span>Microsoft</span>
            </button>
          </div>

          {/* Verification indicator */}
          <div className="flex justify-center items-center gap-2 text-[10px] text-gray-500 pt-2 font-medium">
            <span className="w-4 h-4 rounded-full bg-emerald-950/40 border border-emerald-900/40 flex items-center justify-center text-primary-400 text-[8px] font-black shrink-0">
              ✓
            </span>
            <span>Your data is encrypted and securely stored.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
