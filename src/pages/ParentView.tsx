import { useState, useEffect } from "react";
import { Users, Plus, Shield, CheckCircle, BarChart3, GraduationCap } from "lucide-react";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

interface ChildProfile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  department: string;
  faculty: string;
  profile_picture: string;
}

interface ProgressAnalytics {
  followers_growth: number;
  posts_this_month: number;
  resources_uploaded: number;
  discussions_joined: number;
  engagement_rate: number;
  average_quiz_score: number;
  resources_accessed: number;
  study_time_hours: number;
  rank: string;
  rank_change: string;
  quiz_change: string;
  resources_change: string;
  study_change: string;
}

export default function ParentView() {
  const { user } = useAuthStore();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [childProgress, setChildProgress] = useState<ProgressAnalytics | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Link child form
  const [childIdentifier, setChildIdentifier] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const loadChildren = async () => {
    try {
      const response = await api.get("/parent/children");
      const list = response.data || [];
      setChildren(list);
      if (list.length > 0 && !selectedChild) {
        setSelectedChild(list[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadProgress = async (childId: string) => {
    setIsLoadingProgress(true);
    try {
      const response = await api.get(`/parent/children/${childId}/progress`);
      setChildProgress(response.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load progress details for this child");
      setChildProgress(null);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  useEffect(() => {
    if (user?.role === "parent") {
      loadChildren();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      loadProgress(selectedChild.id);
    }
  }, [selectedChild]);

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childIdentifier.trim()) {
      toast.error("Please enter a username or email");
      return;
    }

    setIsLinking(true);
    try {
      const response = await api.post(`/parent/children?child_username_or_email=${encodeURIComponent(childIdentifier.trim())}`);
      toast.success("Child account linked successfully!");
      setChildIdentifier("");
      loadChildren();
      if (response.data?.child) {
        setSelectedChild(response.data.child);
      }
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to link child account. Ensure email/username is correct.";
      toast.error(detail);
    } finally {
      setIsLinking(false);
    }
  };

  if (user?.role !== "parent") {
    return (
      <div className="bg-[#161616] border border-gray-900 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 my-12 animate-fadeIn">
        <Shield size={48} className="text-rose-500 mx-auto" />
        <h2 className="text-white font-black text-lg">Access Prohibited</h2>
        <p className="text-gray-400 text-xs leading-relaxed">
          The parent portal is only accessible to users registered with the "Parent" user role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-900/50 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Users size={24} className="text-primary-400" />
            Parent Portal
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Monitor academic progress, access event notifications, and collaborate with educators.
          </p>
        </div>
        
        {/* Link Child Form */}
        <form onSubmit={handleLinkChild} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Child's email or username"
            value={childIdentifier}
            onChange={(e) => setChildIdentifier(e.target.value)}
            className="bg-[#1a1d1b] border border-gray-900 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-primary-400/50 transition-all font-semibold flex-1 min-w-[200px]"
            required
          />
          <button
            type="submit"
            disabled={isLinking}
            className="bg-primary-400 hover:bg-primary-300 text-dark-bg font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-lg"
          >
            <Plus size={14} />
            Link Child
          </button>
        </form>
      </div>

      {children.length === 0 ? (
        <div className="bg-[#161616] border border-gray-900 rounded-3xl p-10 text-center max-w-xl mx-auto space-y-4">
          <GraduationCap size={44} className="text-gray-600 mx-auto" />
          <h3 className="text-white font-bold text-sm">No linked students</h3>
          <p className="text-gray-500 text-xs leading-relaxed max-w-md mx-auto">
            You haven't linked any student profiles to your parent account yet. 
            Enter your child's institutional username or email in the input above to begin monitoring progress.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Children Tab Switcher */}
          <div className="flex flex-wrap gap-2.5 select-none border-b border-gray-950 pb-3">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedChild?.id === child.id
                    ? "bg-[#1a1d1b] border-primary-400 text-primary-400 shadow-md"
                    : "bg-dark-card/40 border-gray-900 text-gray-400 hover:text-white"
                }`}
              >
                {child.profile_picture ? (
                  <img
                    src={child.profile_picture}
                    alt="child avatar"
                    className="w-5 h-5 rounded-full object-cover border border-emerald-900"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-950 flex items-center justify-center text-[8px] font-black border border-emerald-900">
                    {child.first_name[0]}{child.last_name[0]}
                  </div>
                )}
                {child.first_name} {child.last_name}
              </button>
            ))}
          </div>

          {/* Child Details & Analytics Dashboard */}
          {selectedChild && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Student summary */}
              <div className="bg-[#161616] border border-gray-900 rounded-2xl p-5 space-y-4 h-fit">
                <div className="flex items-center gap-4 border-b border-gray-900/40 pb-4">
                  {selectedChild.profile_picture ? (
                    <img
                      src={selectedChild.profile_picture}
                      alt="avatar"
                      className="w-14 h-14 rounded-2xl object-cover border border-emerald-900 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-primary-400 flex items-center justify-center font-bold text-lg border border-emerald-900">
                      {selectedChild.first_name[0]}{selectedChild.last_name[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-bold text-sm tracking-wide">
                      {selectedChild.first_name} {selectedChild.last_name}
                    </h3>
                    <p className="text-gray-400 text-[10px] mt-0.5 font-bold">
                      Student @ {selectedChild.faculty || "Faculty"}
                    </p>
                    <p className="text-gray-500 text-[10px] font-semibold mt-1">
                      {selectedChild.department || "General Department"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-gray-400 font-semibold">
                  <div className="flex justify-between py-1 border-b border-gray-900/20">
                    <span>Username</span>
                    <span className="text-white font-mono">@{selectedChild.username}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-900/20">
                    <span>Email Address</span>
                    <span className="text-white">{selectedChild.email}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Academic Status</span>
                    <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-bold">
                      <CheckCircle size={11} /> Active / Enrolled
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Progress Metrics (Col Span 2) */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5">
                  <BarChart3 size={16} className="text-primary-400" />
                  Academic Progress Dashboard
                </h3>

                {isLoadingProgress ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-24 bg-[#161616] border border-gray-900 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : childProgress ? (
                  <div className="space-y-6">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {/* Study hours */}
                      <div className="bg-[#161616] border border-gray-900 rounded-2xl p-4.5 space-y-2">
                        <div className="flex items-center justify-between text-gray-500 text-[9px] font-black uppercase tracking-wider">
                          <span>Study Time</span>
                          <span className="text-emerald-400">{childProgress.study_change}</span>
                        </div>
                        <p className="text-2xl font-black text-white leading-none">
                          {childProgress.study_time_hours} hrs
                        </p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          Total study assistant time.
                        </p>
                      </div>

                      {/* Quiz score */}
                      <div className="bg-[#161616] border border-gray-900 rounded-2xl p-4.5 space-y-2">
                        <div className="flex items-center justify-between text-gray-500 text-[9px] font-black uppercase tracking-wider">
                          <span>Quiz Avg</span>
                          <span className="text-emerald-400">{childProgress.quiz_change}</span>
                        </div>
                        <p className="text-2xl font-black text-white leading-none">
                          {childProgress.average_quiz_score}%
                        </p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          Weighted quiz score.
                        </p>
                      </div>

                      {/* Class rank */}
                      <div className="bg-[#161616] border border-gray-900 rounded-2xl p-4.5 space-y-2">
                        <div className="flex items-center justify-between text-gray-500 text-[9px] font-black uppercase tracking-wider">
                          <span>Percentile</span>
                          <span className="text-gray-400">{childProgress.rank_change}</span>
                        </div>
                        <p className="text-2xl font-black text-white leading-none">
                          {childProgress.rank}
                        </p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          Class standing.
                        </p>
                      </div>

                      {/* Resources accessed */}
                      <div className="bg-[#161616] border border-gray-900 rounded-2xl p-4.5 space-y-2">
                        <div className="flex items-center justify-between text-gray-500 text-[9px] font-black uppercase tracking-wider">
                          <span>Resources</span>
                          <span className="text-emerald-400">{childProgress.resources_change}</span>
                        </div>
                        <p className="text-2xl font-black text-white leading-none">
                          {childProgress.resources_accessed}
                        </p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          Study material download.
                        </p>
                      </div>

                      {/* Forums / Discussions joined */}
                      <div className="bg-[#161616] border border-gray-900 rounded-2xl p-4.5 space-y-2">
                        <span className="text-gray-500 text-[9px] font-black uppercase tracking-wider block">
                          Discussions Joined
                        </span>
                        <p className="text-2xl font-black text-white leading-none">
                          {childProgress.discussions_joined}
                        </p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          Forum interactions.
                        </p>
                      </div>

                      {/* Engagement Rate */}
                      <div className="bg-[#161616] border border-gray-900 rounded-2xl p-4.5 space-y-2">
                        <span className="text-gray-500 text-[9px] font-black uppercase tracking-wider block">
                          Engagement
                        </span>
                        <p className="text-2xl font-black text-white leading-none">
                          {childProgress.engagement_rate}%
                        </p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          Daily active score.
                        </p>
                      </div>
                    </div>

                    {/* Progress representation */}
                    <div className="bg-[#161616] border border-gray-900 rounded-2xl p-5 space-y-4">
                      <h4 className="text-white font-bold text-xs">
                        Goal Completion Breakdown
                      </h4>
                      
                      <div className="space-y-3.5 text-xs font-semibold">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-gray-400">
                            <span>Quizzes & Knowledge Checks</span>
                            <span className="text-white">{childProgress.average_quiz_score}%</span>
                          </div>
                          <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${childProgress.average_quiz_score}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-gray-400">
                            <span>Resource Center Engagement</span>
                            <span className="text-white">
                              {Math.min(100, Math.round((childProgress.resources_accessed / 20) * 100))}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-400 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.round((childProgress.resources_accessed / 20) * 100))}%`
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-gray-400">
                            <span>Weekly Study Time Target (8 hrs)</span>
                            <span className="text-white">
                              {Math.min(100, Math.round((childProgress.study_time_hours / 8) * 100))}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-purple-400 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.round((childProgress.study_time_hours / 8) * 100))}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 py-6">Select a child to view analytics.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
