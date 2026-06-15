import { useState, useEffect, useRef } from "react";
import {
  Home,
  MessageSquare,
  Users,
  BarChart3,
  Sparkles,
  GraduationCap,
  ChevronDown,
  Search,
  LogOut,
  Bell,
  BookOpen,
  Settings,
  X,
  Calendar,
  ClipboardList,
  Shield,
} from "lucide-react";
import { useAuthStore } from "./store/authStore";
import { Toaster, toast } from "react-hot-toast";
import { notificationsApi, searchApi } from "./api/client";

// Views
import DashboardView from "./pages/DashboardView";
import FeedView from "./pages/FeedView";
import GroupsView from "./pages/GroupsView";
import AnalyticsView from "./pages/AnalyticsView";
import AITutorView from "./pages/AITutorView";
import MessagesView from "./pages/MessagesView";
import LoginView from "./pages/LoginView";
import RegisterView from "./pages/RegisterView";
import SettingsView from "./pages/SettingsView";
import CalendarView from "./pages/CalendarView";
import AssignmentsView from "./pages/AssignmentsView";
import ParentView from "./pages/ParentView";
import AdminView from "./pages/AdminView";

type ActiveTab =
  | "dashboard"
  | "feed"
  | "groups"
  | "messages"
  | "analytics"
  | "ai-tutor"
  | "settings"
  | "calendar"
  | "assignments"
  | "parent"
  | "admin";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  snippet: string;
  metadata: { username?: string };
}

export default function App() {
  const { user, logout, setUser, accessToken } = useAuthStore();
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >(undefined);

  const getNavItems = () => {
    if (!user) return [];
    
    switch (user.role) {
      case "student":
        return [
          { tab: "dashboard" as ActiveTab, icon: <Home size={18} />, label: "Dashboard" },
          { tab: "feed" as ActiveTab, icon: <BookOpen size={18} />, label: "Social Feed" },
          { tab: "messages" as ActiveTab, icon: <MessageSquare size={18} />, label: "Chat" },
          { tab: "groups" as ActiveTab, icon: <Users size={18} />, label: "Academic Groups" },
          { tab: "assignments" as ActiveTab, icon: <ClipboardList size={18} />, label: "Assignments" },
          { tab: "calendar" as ActiveTab, icon: <Calendar size={18} />, label: "Calendar" },
          { tab: "ai-tutor" as ActiveTab, icon: <Sparkles size={18} />, label: "AI Tutor" },
          { tab: "analytics" as ActiveTab, icon: <BarChart3 size={18} />, label: "Analytics & Progress" },
          { tab: "settings" as ActiveTab, icon: <Settings size={18} />, label: "Settings" },
        ];
      case "teacher":
        return [
          { tab: "dashboard" as ActiveTab, icon: <Home size={18} />, label: "Dashboard" },
          { tab: "feed" as ActiveTab, icon: <BookOpen size={18} />, label: "Social Feed" },
          { tab: "messages" as ActiveTab, icon: <MessageSquare size={18} />, label: "Chat" },
          { tab: "groups" as ActiveTab, icon: <Users size={18} />, label: "Academic Groups" },
          { tab: "assignments" as ActiveTab, icon: <ClipboardList size={18} />, label: "Assignments Hub" },
          { tab: "calendar" as ActiveTab, icon: <Calendar size={18} />, label: "Calendar" },
          { tab: "ai-tutor" as ActiveTab, icon: <Sparkles size={18} />, label: "AI Tutor" },
          { tab: "settings" as ActiveTab, icon: <Settings size={18} />, label: "Settings" },
        ];
      case "parent":
        return [
          { tab: "parent" as ActiveTab, icon: <Users size={18} />, label: "Parent Portal" },
          { tab: "messages" as ActiveTab, icon: <MessageSquare size={18} />, label: "Chat" },
          { tab: "calendar" as ActiveTab, icon: <Calendar size={18} />, label: "Calendar" },
          { tab: "ai-tutor" as ActiveTab, icon: <Sparkles size={18} />, label: "AI Tutor" },
          { tab: "settings" as ActiveTab, icon: <Settings size={18} />, label: "Settings" },
        ];
      case "admin":
        return [
          { tab: "admin" as ActiveTab, icon: <Shield size={18} />, label: "Admin Console" },
          { tab: "messages" as ActiveTab, icon: <MessageSquare size={18} />, label: "Chat" },
          { tab: "ai-tutor" as ActiveTab, icon: <Sparkles size={18} />, label: "AI Tutor" },
          { tab: "settings" as ActiveTab, icon: <Settings size={18} />, label: "Settings" },
        ];
      default:
        return [
          { tab: "ai-tutor" as ActiveTab, icon: <Sparkles size={18} />, label: "AI Tutor" },
          { tab: "settings" as ActiveTab, icon: <Settings size={18} />, label: "Settings" },
        ];
    }
  };

  // Auto-restore user profile if we have a token but no user (e.g. after page refresh with stale store)
  useEffect(() => {
    if (accessToken && !user) {
      import("./api/client").then(({ usersApi }) => {
        usersApi
          .me()
          .then((res) => setUser(res.data))
          .catch(() => logout());
      });
    }
  }, [accessToken, user]);

  // Redirect to first available tab on login / role change
  useEffect(() => {
    if (user) {
      const allowedItems = getNavItems();
      if (allowedItems.length > 0) {
        const isCurrentTabAllowed = allowedItems.some(item => item.tab === activeTab);
        if (!isCurrentTabAllowed) {
          setActiveTab(allowedItems[0].tab as ActiveTab);
        }
      }
    }
  }, [user, activeTab]);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Profile menu
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // ─── Close dropdowns on outside click ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Fetch notifications ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await notificationsApi.list(1);
        setNotifications(res.data?.items ?? []);
      } catch {
        // silently fail — notifications are non-critical
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ─── Mark all notifications read ─────────────────────────────────────────────
  const handleOpenNotifications = async () => {
    setShowNotifications((v) => !v);
    if (!showNotifications && unreadCount > 0) {
      try {
        await notificationsApi.markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      } catch {
        // ignore
      }
    }
  };

  // ─── Search ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchApi.search(searchQuery.trim());
        setSearchResults(res.data ?? []);
        setShowSearchResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) setShowSearchResults(true);
  };

  // ─── Navigation helpers ───────────────────────────────────────────────────────
  const handleOpenGroupChat = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setActiveTab("messages");
  };

  const getInitials = (firstName = "", lastName = "") =>
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  const navItems = getNavItems();

  // ─── Auth gate ───────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        {authView === "login" ? (
          <LoginView onNavigateToRegister={() => setAuthView("register")} />
        ) : (
          <RegisterView onNavigateToLogin={() => setAuthView("login")} />
        )}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#161616",
              color: "#fff",
              border: "1px solid #202221",
            },
          }}
        />
      </>
    );
  }

  const isTabAllowed = navItems.some((item) => item.tab === activeTab);

  // ─── Main app ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#121413] text-gray-100 font-sans">
      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-[#161616] border-r border-gray-900/60 flex flex-col fixed inset-y-0 left-0 z-30 select-none">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-900/40">
          <div className="w-9 h-9 rounded-xl bg-primary-400 flex items-center justify-center text-dark-bg">
            <GraduationCap size={22} className="stroke-[2.5]" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">
            EduConnect
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-3.5 px-4 py-3 w-full rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-[#1a1d1b] text-primary-400 font-bold border border-gray-900/50"
                  : "text-gray-400 hover:bg-[#1a1d1b]/40 hover:text-gray-200"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {/* AI Insight widget (Analytics page) */}
        {activeTab === "analytics" && (
          <div className="mx-4 mb-4 bg-primary-400 text-dark-bg p-4 rounded-xl space-y-3 relative animate-fadeIn shadow-lg">
            <div className="flex items-start gap-2 text-xs font-bold leading-normal">
              <Sparkles size={16} className="shrink-0 mt-0.5" />
              <span>AI Insight</span>
            </div>
            <p className="text-[11px] font-semibold leading-relaxed text-dark-bg/90">
              {user?.department
                ? `Keep up your work in ${user.department}. Try an AI quiz to test your knowledge.`
                : "Use the AI Tutor to generate quizzes, summaries, and study plans."}
            </p>
            <button
              onClick={() => setActiveTab("ai-tutor")}
              className="w-full bg-[#dfc39f] hover:bg-[#d0b490] text-dark-bg font-bold py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer"
            >
              Generate Quiz
            </button>
          </div>
        )}

        {/* Profile footer */}
        <div
          className="p-4 border-t border-gray-900/40 relative"
          ref={profileRef}
        >
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 px-3.5 py-2.5 bg-[#1a1d1b]/60 border border-gray-900 rounded-xl cursor-pointer hover:bg-[#1a1d1b] hover:border-gray-800 transition-all select-none"
          >
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover border border-emerald-900"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-950 flex items-center justify-center text-primary-400 font-bold text-xs border border-emerald-900 select-none">
                {getInitials(user?.first_name, user?.last_name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5 capitalize font-medium">
                {user?.role}
              </p>
            </div>
            <ChevronDown size={14} className="text-gray-500" />
          </div>

          {showProfileMenu && (
            <div className="absolute bottom-20 left-4 right-4 bg-[#161616] border border-gray-800 rounded-xl p-2.5 shadow-2xl z-40 space-y-1.5 animate-fadeIn">
              <button
                onClick={() => {
                  setActiveTab("settings");
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-2 py-2 rounded-lg text-xs hover:bg-[#1a1d1b] transition-colors flex items-center gap-2"
              >
                <Settings size={13} className="text-gray-400" />
                Account Settings
              </button>
              <div className="h-px bg-gray-900/60 my-1" />
              <button
                onClick={() => {
                  logout();
                  toast.success("Logged out successfully");
                }}
                className="w-full text-left px-2 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/20 transition-colors flex items-center gap-2"
              >
                <LogOut size={13} />
                Logout Session
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-[#121413] border-b border-gray-900/30 h-16 px-6 flex items-center justify-between sticky top-0 z-20">
          {/* Search */}
          <div className="w-full max-w-lg relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search for topics, resources, or peers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() =>
                    searchResults.length > 0 && setShowSearchResults(true)
                  }
                  className="w-full bg-[#1a1d1b] border border-gray-900/60 hover:border-gray-800/80 focus:border-primary-400/40 rounded-xl py-2 pl-11 pr-10 text-xs text-white focus:outline-none placeholder:text-gray-500 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </form>

            {/* Search results dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-[#161616] border border-gray-800 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto">
                {isSearching && (
                  <p className="text-xs text-gray-400 px-4 py-2">Searching…</p>
                )}
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery("");
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#1a1d1b] transition-colors border-b border-gray-900/40 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white">
                        {result.title}
                      </p>
                      <span className="text-[10px] text-gray-500 bg-[#202221] px-1.5 py-0.5 rounded-md capitalize">
                        {result.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                      {result.snippet}
                    </p>
                  </button>
                ))}
              </div>
            )}
            {showSearchResults && isSearching && searchResults.length === 0 && (
              <div className="absolute top-full mt-2 w-full bg-[#161616] border border-gray-800 rounded-xl shadow-2xl z-50 px-4 py-3">
                <p className="text-xs text-gray-400">Searching…</p>
              </div>
            )}
          </div>

          {/* Right header items */}
          <div className="flex items-center gap-3.5 select-none ml-4">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleOpenNotifications}
                className="w-9 h-9 bg-[#1a1d1b] hover:bg-[#202221] border border-gray-900/60 rounded-xl flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer relative"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-400 text-dark-bg font-black text-[9px] rounded-full flex items-center justify-center border border-[#121413]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-[#161616] border border-gray-800 rounded-xl p-3 shadow-2xl z-40 animate-fadeIn">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-bold text-xs">
                      Notifications
                    </h4>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-lg border transition-colors ${
                            n.is_read
                              ? "bg-[#1a1d1b] border-gray-900"
                              : "bg-[#1f2623] border-primary-400/20"
                          }`}
                        >
                          <p className="text-xs text-white font-semibold">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-gray-500 block mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile chip */}
            <div
              onClick={() => setActiveTab("settings")}
              className="flex items-center gap-2.5 bg-[#1a1d1b] border border-gray-900/60 px-3 py-1.5 rounded-xl cursor-pointer hover:border-gray-800/80 transition-all select-none"
            >
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="avatar"
                  className="w-6 h-6 rounded-full object-cover border border-emerald-900"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-950 flex items-center justify-center text-primary-400 font-bold text-[10px] border border-emerald-900 select-none">
                  {getInitials(user?.first_name, user?.last_name)}
                </div>
              )}
              <span className="text-xs font-semibold text-white">
                {user?.first_name} {user?.last_name}
              </span>
              <ChevronDown size={12} className="text-gray-500" />
            </div>
          </div>
        </header>

        {/* Main View */}
        <main className="flex-1 p-6 overflow-y-auto">
          {isTabAllowed && activeTab === "dashboard" && (
            <DashboardView
              onNavigateToAiTutor={() => setActiveTab("ai-tutor")}
            />
          )}
          {isTabAllowed && activeTab === "feed" && <FeedView />}
          {isTabAllowed && activeTab === "messages" && (
            <div className="h-full">
              <MessagesView initialConversationId={activeConversationId} />
            </div>
          )}
          {isTabAllowed && activeTab === "groups" && (
            <div className="h-full">
              <GroupsView onOpenMessages={handleOpenGroupChat} />
            </div>
          )}
          {isTabAllowed && activeTab === "analytics" && <AnalyticsView />}
          {isTabAllowed && activeTab === "ai-tutor" && <AITutorView />}
          {isTabAllowed && activeTab === "settings" && <SettingsView />}
          {isTabAllowed && activeTab === "calendar" && <CalendarView />}
          {isTabAllowed && activeTab === "assignments" && <AssignmentsView />}
          {isTabAllowed && activeTab === "parent" && <ParentView />}
          {isTabAllowed && activeTab === "admin" && <AdminView />}
          {!isTabAllowed && (
            <div className="bg-[#161616] border border-gray-900 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 my-12 animate-fadeIn">
              <Shield size={48} className="text-rose-500 mx-auto" />
              <h2 className="text-white font-black text-lg">Access Prohibited</h2>
              <p className="text-gray-400 text-xs leading-relaxed">
                This page is not accessible under your current account role.
              </p>
            </div>
          )}
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#161616",
            color: "#fff",
            border: "1px solid #202221",
          },
        }}
      />
    </div>
  );
}
