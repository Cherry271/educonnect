import { Link, useLocation } from 'react-router-dom';
import {
  Home, BookOpen, MessageSquare, Users, Bell, Settings,
  Sparkles, Megaphone, LayoutDashboard, LogOut, Search,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/feed', icon: Home, label: 'Feed' },
  { to: '/resources', icon: BookOpen, label: 'Resources' },
  { to: '/discussions', icon: MessageSquare, label: 'Discussions' },
  { to: '/groups', icon: Users, label: 'Groups' },
  { to: '/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/ai', icon: Sparkles, label: 'AI Assistant' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-40">
      <div className="p-6 border-b border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary-800">EduConnect</h1>
            <p className="text-xs text-gray-500">Collaborative Learning</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === to
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/admin'
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard size={20} />
            Admin
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link to={`/profile/${user?.username}`} className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 w-full text-sm text-red-600 hover:bg-red-50 rounded-lg"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
