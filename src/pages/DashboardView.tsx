import { useState, useEffect } from 'react';
import { Image, BookOpen, BarChart2, Heart, MessageSquare, Bookmark, Sparkles, TrendingUp, Users, Calendar } from 'lucide-react';
import { postsApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

interface DashboardPost {
  id: string;
  authorInitials: string;
  authorName: string;
  authorTitle: string;
  timeAgo: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  tags: string[];
}

const initialDashboardPosts: DashboardPost[] = [
  {
    id: 'db_pst_1',
    authorInitials: 'AR',
    authorName: 'Dr. Elena Vance',
    authorTitle: 'Professor of Physics',
    timeAgo: '2h ago',
    content: 'Just published a new paper on quantum entanglement in macroscopic systems. Would love to hear thoughts from the community!',
    likesCount: 124,
    commentsCount: 18,
    isLiked: false,
    isBookmarked: false,
    tags: ['Physics', 'Quantum', 'Research']
  },
  {
    id: 'db_pst_2',
    authorInitials: 'AR',
    authorName: 'Marcus Thorne',
    authorTitle: 'Graduate Student',
    timeAgo: '5h ago',
    content: 'Does anyone have a comprehensive reading list for Advanced Algorithmic Game Theory? Looking for recent breakthroughs.',
    likesCount: 124,
    commentsCount: 18,
    isLiked: false,
    isBookmarked: false,
    tags: ['ComputerScience', 'Algorithms']
  },
  {
    id: 'db_pst_3',
    authorInitials: 'AR',
    authorName: 'Sarah Chen',
    authorTitle: 'AI Researcher',
    timeAgo: '1d ago',
    content: "The new LLM benchmarks are out. It's fascinating to see how reasoning capabilities are scaling with parameter efficiency.",
    likesCount: 124,
    commentsCount: 18,
    isLiked: false,
    isBookmarked: false,
    tags: ['AI', 'Benchmarks']
  }
];

interface DashboardViewProps {
  onNavigateToAiTutor: () => void;
}

export default function DashboardView({ onNavigateToAiTutor }: DashboardViewProps) {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<DashboardPost[]>(initialDashboardPosts);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    // Attempt backend loading
    const loadDashboardFeed = async () => {
      try {
        const response = await postsApi.feed(1);
        if (response.data && response.data.items && response.data.items.length > 0) {
          const mapped: DashboardPost[] = response.data.items.map((p: any, idx: number) => ({
            id: p.id || `db_${idx}`,
            authorInitials: 'AR',
            authorName: p.author_name || 'Dr. Elena Vance',
            authorTitle: p.author_role || 'Faculty Member',
            timeAgo: 'Just now',
            content: p.content,
            likesCount: p.likes_count || 124,
            commentsCount: p.comments_count || 18,
            isLiked: p.is_liked || false,
            isBookmarked: p.is_bookmarked || false,
            tags: p.tags || ['Research']
          }));

          const merged = [...initialDashboardPosts];
          mapped.forEach(mp => {
            if (!merged.some(ep => ep.content === mp.content)) {
              merged.unshift(mp);
            }
          });
          setPosts(merged);
        }
      } catch (err) {
        console.log("Backend offline or empty dashboard feed, using mock items.", err);
      }
    };
    loadDashboardFeed();
  }, []);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : 'JD';
    const newPost: DashboardPost = {
      id: `db_pst_${Date.now()}`,
      authorInitials: initials,
      authorName: user ? `${user.first_name} ${user.last_name}` : 'Julian Drax',
      authorTitle: user?.role === 'teacher' ? 'Senior Researcher' : 'PhD Candidate',
      timeAgo: 'Just now',
      content: inputText,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isBookmarked: false,
      tags: ['Discussion']
    };

    try {
      await postsApi.create({
        content: inputText,
        post_type: 'text',
        department: user?.department || 'Quantum Physics',
        tags: ['academic', 'welcome']
      });
    } catch (e) {
      console.log("Backend offline, saving post locally", e);
    }

    setPosts([newPost, ...posts]);
    setInputText('');
  };

  const handleLike = async (postId: string) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1
        };
      }
      return p;
    }));

    try {
      await postsApi.like(postId);
    } catch (e) {
      console.log("Backend offline, processed like state client-side", e);
    }
  };

  const handleBookmark = async (postId: string) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, isBookmarked: !p.isBookmarked };
      }
      return p;
    }));

    try {
      await postsApi.bookmark(postId);
    } catch (e) {
      console.log("Backend offline, processed bookmark state client-side", e);
    }
  };

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : 'JD';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Composer and Posts */}
      <div className="lg:col-span-2 space-y-5">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, {user?.first_name || 'Julian'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            You have 3 new research updates in your followed groups.
          </p>
        </div>

        {/* Composer */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5">
          <form onSubmit={handlePostSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-950 flex items-center justify-center text-primary-400 font-bold border border-emerald-900 shrink-0 select-none">
                {initials}
              </div>
              <textarea
                placeholder="Share a discovery or ask a question..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                rows={2}
                className="w-full bg-transparent border-0 text-white placeholder:text-gray-500 py-1.5 focus:outline-hidden resize-none text-sm leading-relaxed"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-900/50">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="bg-[#202221] hover:bg-[#2e3230] border border-gray-800 text-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Image size={14} className="text-emerald-400" />
                  Image
                </button>
                <button
                  type="button"
                  className="bg-[#202221] hover:bg-[#2e3230] border border-gray-800 text-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BookOpen size={14} className="text-[#e1be94]" />
                  Resource
                </button>
                <button
                  type="button"
                  className="bg-[#202221] hover:bg-[#2e3230] border border-gray-800 text-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BarChart2 size={14} className="text-blue-400" />
                  Poll
                </button>
              </div>

              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inputText.trim()
                    ? 'bg-primary-400 hover:bg-primary-300 text-dark-bg'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                Post
              </button>
            </div>
          </form>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5 space-y-4">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#202221] flex items-center justify-center text-primary-400 font-bold border border-gray-900 select-none">
                    {post.authorInitials}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm tracking-wide">{post.authorName}</h3>
                    <p className="text-gray-500 text-[10px] font-medium mt-0.5">
                      {post.authorTitle} • {post.timeAgo}
                    </p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-white transition-colors cursor-pointer text-sm font-black">
                  •••
                </button>
              </div>

              {/* Body */}
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-primary-400 hover:text-primary-300 text-[11px] font-medium cursor-pointer transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center gap-6 pt-3 border-t border-gray-900/30">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                    post.isLiked ? 'text-rose-500 scale-105' : 'text-gray-400 hover:text-rose-400'
                  }`}
                >
                  <Heart size={15} fill={post.isLiked ? 'currentColor' : 'none'} />
                  <span>{post.likesCount}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-400 hover:text-primary-400 text-xs font-semibold transition-colors cursor-pointer">
                  <MessageSquare size={15} />
                  <span>{post.commentsCount}</span>
                </button>
                <button
                  onClick={() => handleBookmark(post.id)}
                  className={`ml-auto flex items-center text-xs font-semibold transition-all cursor-pointer ${
                    post.isBookmarked ? 'text-primary-400 scale-105' : 'text-gray-500 hover:text-white'
                  }`}
                  title={post.isBookmarked ? 'Bookmarked' : 'Bookmark post'}
                >
                  <Bookmark size={15} fill={post.isBookmarked ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Widgets */}
      <div className="space-y-5">
        {/* AI Tutor Card */}
        <div className="bg-[#3ddc97] text-dark-bg rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sparkles size={16} />
            AI Tutor
          </div>
          <p className="text-dark-bg/90 text-xs leading-relaxed font-semibold">
            Need a summary of today's feed or help with a research paper?
          </p>
          <button
            onClick={onNavigateToAiTutor}
            className="w-full bg-[#dfc39f] hover:bg-[#d0b490] text-dark-bg font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Ask Assistant
          </button>
        </div>

        {/* Trending Academic Topics */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5">
          <h3 className="text-white font-bold text-sm tracking-wide mb-4">Trending Academic Topics</h3>
          <div className="space-y-4">
            {[
              { topic: 'Bio-Engineering', count: '1.2k discussions' },
              { topic: 'Carbon Capture', count: '850 discussions' },
              { topic: 'Ethical AI', count: '3.4k discussions' },
              { topic: 'Neuroplasticity', count: '620 discussions' }
            ].map(t => (
              <div key={t.topic} className="flex justify-between items-center cursor-pointer group">
                <div>
                  <h4 className="text-gray-200 text-xs font-bold group-hover:text-primary-400 transition-colors">
                    {t.topic}
                  </h4>
                  <p className="text-gray-500 text-[10px] mt-0.5">{t.count}</p>
                </div>
                <TrendingUp size={14} className="text-gray-600 group-hover:text-primary-400 transition-all" />
              </div>
            ))}
          </div>
          <button className="w-full text-center text-primary-400 hover:text-primary-300 text-xs font-bold pt-4 mt-4 border-t border-gray-900/30 transition-colors cursor-pointer">
            View All Trends
          </button>
        </div>

        {/* Study Groups Today */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5">
          <h3 className="text-white font-bold text-sm tracking-wide mb-4 font-bold">Study Groups Today</h3>
          <div className="bg-[#202221] border border-gray-800 rounded-xl p-3.5 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
            <Users className="text-amber-400 shrink-0 mt-0.5" size={16} />
            <div>
              <h4 className="text-white font-bold text-xs">Quantum Computing 101</h4>
              <p className="text-gray-400 text-[10px] mt-1 font-medium flex items-center gap-1.5">
                <Calendar size={10} />
                14:00 - 15:30 • 12 active
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
