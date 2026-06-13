import { useState } from 'react';
import { Home, MessageSquare, Users, BarChart3, Sparkles, GraduationCap, ChevronDown, Search, LogOut, Bell } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { Toaster } from 'react-hot-toast';

// Views
import DashboardView from './pages/DashboardView';
import FeedView from './pages/FeedView';
import GroupsView from './pages/GroupsView';
import AnalyticsView from './pages/AnalyticsView';
import AITutorView from './pages/AITutorView';
import LoginView from './pages/LoginView';
import RegisterView from './pages/RegisterView';

export default function App() {
  const { user, switchUser, logout } = useAuthStore();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'feed' | 'groups' | 'analytics' | 'ai-tutor'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Custom states for notifications
  const [notificationsCount, setNotificationsCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleUser = () => {
    if (user?.username === 'juliandrax') {
      switchUser('alexrivera');
    } else {
      switchUser('juliandrax');
    }
    setShowProfileMenu(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    alert(`Searching for: "${searchQuery}"`);
  };

  const getInitials = (firstName = '', lastName = '') => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (!user) {
    return (
      <>
        {authView === 'login' ? (
          <LoginView onNavigateToRegister={() => setAuthView('register')} />
        ) : (
          <RegisterView onNavigateToLogin={() => setAuthView('login')} />
        )}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#161616',
              color: '#fff',
              border: '1px solid #202221'
            }
          }}
        />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#121413] text-gray-100 font-sans">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#161616] border-r border-gray-900/60 flex flex-col fixed inset-y-0 left-0 z-30 select-none">
        
        {/* Logo Section */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-900/40">
          <div className="w-9 h-9 rounded-xl bg-primary-400 flex items-center justify-center text-dark-bg">
            <GraduationCap size={22} className="stroke-[2.5]" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">EduConnect</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3.5 px-4.5 py-3 w-full rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#1a1d1b] text-primary-400 font-bold border border-gray-900/50'
                : 'text-gray-400 hover:bg-[#1a1d1b]/40 hover:text-gray-200'
            }`}
          >
            <Home size={18} />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-3.5 px-4.5 py-3 w-full rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-[#1a1d1b] text-primary-400 font-bold border border-gray-900/50'
                : 'text-gray-400 hover:bg-[#1a1d1b]/40 hover:text-gray-200'
            }`}
          >
            <MessageSquare size={18} />
            Social Feed
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-3.5 px-4.5 py-3 w-full rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-[#1a1d1b] text-primary-400 font-bold border border-gray-900/50'
                : 'text-gray-400 hover:bg-[#1a1d1b]/40 hover:text-gray-200'
            }`}
          >
            <Users size={18} />
            Academic Groups
          </button>

          <button
            onClick={() => setActiveTab('ai-tutor')}
            className={`flex items-center gap-3.5 px-4.5 py-3 w-full rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'ai-tutor'
                ? 'bg-[#1a1d1b] text-primary-400 font-bold border border-gray-900/50'
                : 'text-gray-400 hover:bg-[#1a1d1b]/40 hover:text-gray-200'
            }`}
          >
            <Sparkles size={18} />
            AI Tutor
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3.5 px-4.5 py-3 w-full rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#1a1d1b] text-primary-400 font-bold border border-gray-900/50'
                : 'text-gray-400 hover:bg-[#1a1d1b]/40 hover:text-gray-200'
            }`}
          >
            <BarChart3 size={18} />
            Analytics & Progress
          </button>
        </nav>

        {/* Contextual AI Insight Widget (Only shown on Analytics page) */}
        {activeTab === 'analytics' && (
          <div className="mx-4 mb-4 bg-primary-400 text-dark-bg p-4 rounded-xl space-y-3 relative animate-fadeIn shadow-lg">
            <div className="flex items-start gap-2 text-xs font-bold leading-normal">
              <Sparkles size={16} className="shrink-0 mt-0.5" />
              <span>AI Insight</span>
            </div>
            <p className="text-[11px] font-semibold leading-relaxed text-dark-bg/90">
              Your focus on 'Quantum Physics' is 15% higher this week. Ready for a quiz?
            </p>
            <button
              onClick={() => setActiveTab('ai-tutor')}
              className="w-full bg-[#dfc39f] hover:bg-[#d0b490] text-dark-bg font-bold py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer"
            >
              Generate Quiz
            </button>
          </div>
        )}

        {/* Profile Card Footer */}
        <div className="p-4 border-t border-gray-900/40 relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 px-3.5 py-2.5 bg-[#1a1d1b]/60 border border-gray-900 rounded-xl cursor-pointer hover:bg-[#1a1d1b] hover:border-gray-800 transition-all select-none"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-950 flex items-center justify-center text-primary-400 font-bold text-xs border border-emerald-900 select-none">
              {getInitials(user?.first_name, user?.last_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5 capitalize font-medium">
                {user?.username === 'juliandrax' ? 'Senior Researcher' : 'PhD Candidate'}
              </p>
            </div>
            <ChevronDown size={14} className="text-gray-500" />
          </div>

          {/* User Switch dropdown menu */}
          {showProfileMenu && (
            <div className="absolute bottom-20 left-4 right-4 bg-[#161616] border border-gray-800 rounded-xl p-2.5 shadow-2xl z-40 space-y-1.5 animate-fadeIn">
              <p className="text-[10px] text-gray-500 uppercase font-black px-2 tracking-wider">
                Switch User Context
              </p>
              <button
                onClick={toggleUser}
                className="w-full text-left px-2 py-2 rounded-lg text-xs hover:bg-[#1a1d1b] transition-colors flex items-center justify-between"
              >
                <span>Switch to {user?.username === 'juliandrax' ? 'Alex Rivera' : 'Julian Drax'}</span>
                <span className="text-[9px] bg-primary-400/15 text-primary-400 font-bold px-1.5 py-0.5 rounded-sm uppercase">
                  Role Swap
                </span>
              </button>
              <div className="h-px bg-gray-900/60 my-1" />
              <button
                onClick={() => { logout(); toast.success('Logged out successfully'); }}
                className="w-full text-left px-2 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/20 transition-colors flex items-center gap-2"
              >
                <LogOut size={13} />
                Logout Session
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        
        {/* Top Header bar with Search and Notifications */}
        <header className="bg-[#121413] border-b border-gray-900/30 h-16 px-6 flex items-center justify-between sticky top-0 z-20">
          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="w-full max-w-lg relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search for topics, resources, or peers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1d1b] border border-gray-900/60 hover:border-gray-800/80 focus:border-primary-400/40 rounded-xl py-2 pl-11 pr-4 text-xs text-white focus:outline-hidden placeholder:text-gray-500 transition-all font-medium"
              />
            </div>
          </form>

          {/* Right Header items */}
          <div className="flex items-center gap-3.5 select-none">
            {/* Notification bell button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setNotificationsCount(0);
                }}
                className="w-9 h-9 bg-[#1a1d1b] hover:bg-[#202221] border border-gray-900/60 rounded-xl flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer relative"
              >
                <Bell size={16} />
                {notificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary-400 text-dark-bg font-black text-[9px] rounded-full flex items-center justify-center border border-[#121413]">
                    {notificationsCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-[#161616] border border-gray-800 rounded-xl p-3 shadow-2xl z-40 space-y-2.5 animate-fadeIn">
                  <h4 className="text-white font-bold text-xs border-b border-gray-900/80 pb-2">
                    Recent Updates
                  </h4>
                  <div className="space-y-2 text-[11px] leading-relaxed text-gray-300">
                    <div className="p-2 bg-[#1a1d1b] rounded-lg border border-gray-900">
                      <p>
                        <span className="font-bold text-white">Dr. Sarah Vogel</span> liked your post.
                      </p>
                      <span className="text-[9px] text-gray-500 block mt-1">2 hours ago</span>
                    </div>
                    <div className="p-2 bg-[#1a1d1b] rounded-lg border border-gray-900">
                      <p>
                        New discussion started in <span className="font-bold text-white">Ethical AI Collective</span>.
                      </p>
                      <span className="text-[9px] text-gray-500 block mt-1">5 hours ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile widget dropdown */}
            <div className="flex items-center gap-2.5 bg-[#1a1d1b] border border-gray-900/60 px-3 py-1.5 rounded-xl cursor-pointer hover:border-gray-800/80 transition-all select-none">
              <div className="w-6 h-6 rounded-full bg-emerald-950 flex items-center justify-center text-primary-400 font-bold text-[10px] border border-emerald-900 select-none">
                {getInitials(user?.first_name, user?.last_name)}
              </div>
              <span className="text-xs font-semibold text-white">
                {user?.first_name} {user?.last_name}
              </span>
              <ChevronDown size={12} className="text-gray-500" />
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView onNavigateToAiTutor={() => setActiveTab('ai-tutor')} />
          )}
          {activeTab === 'feed' && <FeedView />}
          {activeTab === 'groups' && <GroupsView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'ai-tutor' && <AITutorView />}
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161616',
            color: '#fff',
            border: '1px solid #202221'
          }
        }}
      />
    </div>
  );
}
