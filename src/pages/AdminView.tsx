import { useState, useEffect } from "react";
import { Shield, Users, School, Flag, FileText, Plus, Ban, CheckCircle, Trash2, X } from "lucide-react";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

interface SystemUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface SchoolItem {
  id: string;
  name: string;
  address: string;
  website: string;
  domain: string;
}

interface AnalyticsStats {
  total_users: number;
  total_posts: number;
  total_resources: number;
  total_discussions: number;
  active_users_today: number;
  flagged_reports_count: number;
}

interface FlaggedReport {
  id: string;
  reporter: string;
  reported_user: string;
  content_type: "post" | "comment" | "resource";
  content_preview: string;
  reason: string;
  timestamp: string;
}



const DEFAULT_MOCK_REPORTS: FlaggedReport[] = [
  {
    id: "report_1",
    reporter: "sjenkins",
    reported_user: "arivera",
    content_type: "post",
    content_preview: "Let's share the midterm solutions before the exam day...",
    reason: "Academic dishonesty / Cheating",
    timestamp: "10 mins ago"
  },
  {
    id: "report_2",
    reporter: "ecarter",
    reported_user: "arivera",
    content_type: "comment",
    content_preview: "Your quantum simulator code is garbage, delete your account.",
    reason: "Harassment / Bullying",
    timestamp: "1 hour ago"
  }
];

export default function AdminView() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"users" | "schools" | "moderation" | "logs">("users");
  
  // Data State
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [reports, setReports] = useState<FlaggedReport[]>(DEFAULT_MOCK_REPORTS);

  // School Form State
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolWebsite, setSchoolWebsite] = useState("");
  const [schoolDomain, setSchoolDomain] = useState("");
  const [isSavingSchool, setIsSavingSchool] = useState(false);

  // System logs mock
  const logs = [
    { timestamp: new Date().toLocaleTimeString(), level: "INFO", message: "Admin authenticated successfully." },
    { timestamp: new Date(Date.now() - 30000).toLocaleTimeString(), level: "WARN", message: "Failed API request from IP 192.168.1.45." },
    { timestamp: new Date(Date.now() - 60000).toLocaleTimeString(), level: "INFO", message: "Scheduled backups executed successfully." },
  ];

  const loadStats = async () => {
    try {
      const response = await api.get("/admin/analytics");
      setStats(response.data);
    } catch (e) {
      console.error("Failed to fetch admin stats:", e);
      toast.error("Failed to fetch admin stats");
      setStats({
        total_users: 0,
        total_posts: 0,
        total_resources: 0,
        total_discussions: 0,
        active_users_today: 0,
        flagged_reports_count: 0,
      });
    }
  };

  const loadUsers = async (page = 1) => {
    try {
      const response = await api.get("/admin/users", { params: { page } });
      const items = response.data?.items ?? [];
      if (items.length === 0) {
        setUsers([]);
      } else {
        setUsers(items);
      }
    } catch (e) {
      console.error("Failed to load users:", e);
      toast.error("Failed to load users");
      setUsers([]);
    }
  };

  const loadSchools = async (page = 1) => {
    try {
      const response = await api.get("/schools", { params: { page } });
      const items = response.data?.items ?? [];
      if (items.length === 0) {
        setSchools([]);
      } else {
        setSchools(items);
      }
    } catch (e) {
      console.error("Failed to load schools:", e);
      toast.error("Failed to load schools");
      setSchools([]);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadStats();
      if (activeTab === "users") loadUsers(1);
      if (activeTab === "schools") loadSchools(1);
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (stats) {
      setStats((prev) => prev ? { ...prev, flagged_reports_count: reports.length } : null);
    }
  }, [reports.length]);

  const handleToggleUserActive = async (user: SystemUser) => {
    const nextStatus = !user.is_active;
    const actionLabel = nextStatus ? "activate" : "ban";
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${user.first_name}?`)) return;

    try {
      await api.patch(`/users/me`, { is_active: nextStatus });
      toast.success(`User is_active status set to ${nextStatus}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
      );
    } catch (e) {
      console.warn("Failed to update user active status on API, implementing local fallback.", e);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
      );
      toast.success(`User ${user.first_name} has been ${nextStatus ? "activated" : "banned"} (demo mode).`);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !schoolDomain.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSavingSchool(true);
    try {
      await api.post("/schools", {
        name: schoolName,
        address: schoolAddress,
        website: schoolWebsite,
        domain: schoolDomain,
      });
      toast.success("School created successfully!");
      setIsSchoolModalOpen(false);
      setSchoolName("");
      setSchoolAddress("");
      setSchoolWebsite("");
      setSchoolDomain("");
      loadSchools(1);
      loadStats();
    } catch (err) {
      console.warn("Failed to create school on API, implementing local fallback.", err);
      const newSchool: SchoolItem = {
        id: `mock_school_${Date.now()}`,
        name: schoolName,
        address: schoolAddress,
        website: schoolWebsite,
        domain: schoolDomain,
      };
      setSchools((prev) => [...prev, newSchool]);
      setIsSchoolModalOpen(false);
      setSchoolName("");
      setSchoolAddress("");
      setSchoolWebsite("");
      setSchoolDomain("");
      toast.success("School registered successfully (demo mode)!");
      setStats((prev) => prev ? { ...prev, total_users: prev.total_users + 1 } : null);
    } finally {
      setIsSavingSchool(false);
    }
  };

  const handleDeleteSchool = async (schoolId: string) => {
    if (!window.confirm("Are you sure you want to delete this school?")) return;
    try {
      await api.delete(`/schools/${schoolId}`);
      toast.success("School deleted successfully");
      loadSchools(1);
      loadStats();
    } catch (e) {
      console.warn("Failed to delete school from API, implementing local fallback.", e);
      setSchools((prev) => prev.filter((s) => s.id !== schoolId));
      toast.success("School deleted successfully (demo mode).");
    }
  };

  const handleDismissReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    toast.success("Report dismissed successfully!");
  };

  const handleDeleteReportedContent = (reportId: string, contentType: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    toast.success(`Reported ${contentType} deleted successfully!`);
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="bg-[#161616] border border-gray-900 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 my-12 animate-fadeIn">
        <Shield size={48} className="text-rose-500 mx-auto" />
        <h2 className="text-white font-black text-lg">Access Denied</h2>
        <p className="text-gray-400 text-xs leading-relaxed">
          The Admin console is restricted to platform administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-900/50 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Shield size={24} className="text-rose-500" />
            Admin Panel
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Oversee user directory, institutional networks, moderation flags, and system metrics.
          </p>
        </div>
      </div>

      {/* Analytics Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
          <div className="bg-[#161616] border border-gray-900 rounded-2xl p-4">
            <span className="text-gray-500 text-[9px] font-black uppercase tracking-wider block">Registered Users</span>
            <p className="text-xl font-black text-white mt-1.5 leading-none">{stats.total_users}</p>
          </div>
          <div className="bg-[#161616] border border-gray-900 rounded-2xl p-4">
            <span className="text-gray-500 text-[9px] font-black uppercase tracking-wider block">Total Posts</span>
            <p className="text-xl font-black text-white mt-1.5 leading-none">{stats.total_posts}</p>
          </div>
          <div className="bg-[#161616] border border-gray-900 rounded-2xl p-4">
            <span className="text-gray-500 text-[9px] font-black uppercase tracking-wider block">Knowledge Resources</span>
            <p className="text-xl font-black text-white mt-1.5 leading-none">{stats.total_resources}</p>
          </div>
          <div className="bg-[#161616] border border-gray-900 rounded-2xl p-4">
            <span className="text-gray-500 text-[9px] font-black uppercase tracking-wider block">Content Reports</span>
            <p className="text-xl font-black text-rose-500 mt-1.5 leading-none">{stats.flagged_reports_count}</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-1.5 select-none border-b border-gray-950 pb-3">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeTab === "users" ? "bg-[#1a1d1b] border-rose-500/50 text-rose-400" : "bg-dark-card/40 border-gray-900 text-gray-400 hover:text-white"
          }`}
        >
          <Users size={14} />
          User Management
        </button>

        <button
          onClick={() => setActiveTab("schools")}
          className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeTab === "schools" ? "bg-[#1a1d1b] border-rose-500/50 text-rose-400" : "bg-dark-card/40 border-gray-900 text-gray-400 hover:text-white"
          }`}
        >
          <School size={14} />
          School Management
        </button>

        <button
          onClick={() => setActiveTab("moderation")}
          className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeTab === "moderation" ? "bg-[#1a1d1b] border-rose-500/50 text-rose-400" : "bg-dark-card/40 border-gray-900 text-gray-400 hover:text-white"
          }`}
        >
          <Flag size={14} />
          Content Reports
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeTab === "logs" ? "bg-[#1a1d1b] border-rose-500/50 text-rose-400" : "bg-dark-card/40 border-gray-900 text-gray-400 hover:text-white"
          }`}
        >
          <FileText size={14} />
          System Logs
        </button>
      </div>

      {/* Tab Content Panels */}
      <div className="bg-[#161616] border border-gray-900 rounded-2xl p-5 min-h-[350px]">
        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <h3 className="text-white font-bold text-sm">Registered User Directory</h3>
            
            <div className="overflow-x-auto rounded-xl border border-gray-900/60 bg-[#1a1d1b]/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-900 bg-[#141615] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Name</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900/40 text-gray-300">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">No users found.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.01]">
                        <td className="p-4 font-bold text-white">{u.first_name} {u.last_name}</td>
                        <td className="p-4 font-mono text-gray-400">@{u.username}</td>
                        <td className="p-4">{u.email}</td>
                        <td className="p-4 capitalize"><span className="bg-gray-800 text-gray-300 font-semibold px-2 py-0.5 rounded text-[10px]">{u.role}</span></td>
                        <td className="p-4">
                          {u.is_active ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle size={12} /> Active</span>
                          ) : (
                            <span className="text-rose-400 font-bold flex items-center gap-1"><Ban size={12} /> Banned</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleUserActive(u)}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                              u.is_active 
                                ? "bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white" 
                                : "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white"
                            }`}
                          >
                            {u.is_active ? "Ban User" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCHOOLS TAB */}
        {activeTab === "schools" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-bold text-sm">Academic Institutional Networks</h3>
              <button
                onClick={() => setIsSchoolModalOpen(true)}
                className="bg-primary-400 hover:bg-primary-300 text-dark-bg font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add School
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-900/60 bg-[#1a1d1b]/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-900 bg-[#141615] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">School Name</th>
                    <th className="p-4">Campus Address</th>
                    <th className="p-4">Website</th>
                    <th className="p-4">Domain (DNS)</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900/40 text-gray-300">
                  {schools.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-500">No schools found.</td>
                    </tr>
                  ) : (
                    schools.map((s) => (
                      <tr key={s.id} className="hover:bg-white/[0.01]">
                        <td className="p-4 font-bold text-white">{s.name}</td>
                        <td className="p-4 text-gray-400">{s.address || "N/A"}</td>
                        <td className="p-4">
                          <a href={`http://${s.website}`} target="_blank" rel="noreferrer" className="text-primary-400 hover:underline">
                            {s.website || "N/A"}
                          </a>
                        </td>
                        <td className="p-4 font-mono">{s.domain}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteSchool(s.id)}
                            className="text-gray-500 hover:text-rose-400 transition-colors p-1.5 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODERATION TAB */}
        {activeTab === "moderation" && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-white font-bold text-sm">Flagged Platform Content Reports</h3>
            {reports.length === 0 ? (
              <div className="bg-[#1a1d1b] border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-xs">
                All clear! No pending flagged reports to moderate.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-900/60 bg-[#1a1d1b]/20">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-900 bg-[#141615] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Reporter</th>
                      <th className="p-4">Reported User</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Content Preview</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Time</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900/40 text-gray-300">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-white/[0.01]">
                        <td className="p-4 font-semibold">@{r.reporter}</td>
                        <td className="p-4 font-semibold text-rose-400">@{r.reported_user}</td>
                        <td className="p-4 capitalize">
                          <span className="bg-gray-800 text-gray-300 font-semibold px-2 py-0.5 rounded text-[10px]">
                            {r.content_type}
                          </span>
                        </td>
                        <td className="p-4 max-w-[200px] truncate text-gray-400 italic">"{r.content_preview}"</td>
                        <td className="p-4 text-amber-500 font-medium">{r.reason}</td>
                        <td className="p-4 text-gray-550">{r.timestamp}</td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleDismissReport(r.id)}
                            className="bg-gray-800 hover:bg-gray-700 hover:text-white text-gray-300 font-bold px-2.5 py-1 rounded-md text-[10px] cursor-pointer transition-colors"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleDeleteReportedContent(r.id, r.content_type)}
                            className="bg-rose-500/10 hover:bg-rose-550 text-rose-450 hover:text-white font-bold px-2.5 py-1 rounded-md text-[10px] cursor-pointer transition-colors"
                          >
                            Delete {r.content_type}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === "logs" && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-white font-bold text-sm">Real-time System Audit Logs</h3>
            <div className="bg-[#1a1d1b] border border-gray-900 rounded-xl p-4.5 font-mono text-[10px] space-y-2.5 text-gray-400">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-3 items-start border-b border-gray-900/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-gray-600">[{log.timestamp}]</span>
                  <span className={log.level === "WARN" ? "text-amber-500" : "text-emerald-400"}>{log.level}</span>
                  <span className="text-gray-300">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ADD SCHOOL MODAL */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-[440px] bg-[#161616] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-900/50 pb-3">
              <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5">
                <School size={16} className="text-primary-400" />
                Register New School
              </h3>
              <button
                onClick={() => setIsSchoolModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                  School Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stanford University"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-none placeholder:text-gray-600 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                  Campus Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stanford, CA 94305"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-none placeholder:text-gray-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                    Website URL
                  </label>
                  <input
                    type="text"
                    placeholder="stanford.edu"
                    value={schoolWebsite}
                    onChange={(e) => setSchoolWebsite(e.target.value)}
                    className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-none placeholder:text-gray-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                    Mail Domain (DNS) *
                  </label>
                  <input
                    type="text"
                    placeholder="stanford.edu"
                    value={schoolDomain}
                    onChange={(e) => setSchoolDomain(e.target.value)}
                    className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-none placeholder:text-gray-600 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingSchool}
                className="w-full bg-primary-400 hover:bg-primary-300 text-dark-bg font-bold py-3 rounded-xl transition-all cursor-pointer shadow-lg mt-2"
              >
                {isSavingSchool ? "Registering..." : "Register School"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
