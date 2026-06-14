import { useState, useEffect } from "react";
import {
  Image,
  BookOpen,
  BarChart2,
  Heart,
  MessageSquare,
  Bookmark,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  postsApi,
  discussionsApi,
  groupsApi,
  notificationsApi,
} from "../api/client";
import { useAuthStore } from "../store/authStore";

interface CommentItem {
  id: string;
  author: string;
  content: string;
}

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
  comments?: CommentItem[];
  commentDraft?: string;
  showComments?: boolean;
}

// Dashboard feed is loaded from the live backend feed endpoint.

function timeAgo(dateStr: string): string {
  if (!dateStr) return "Just now";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

interface DashboardViewProps {
  onNavigateToAiTutor: () => void;
}

export default function DashboardView({
  onNavigateToAiTutor,
}: DashboardViewProps) {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [inputText, setInputText] = useState("");
  const [trendingDiscussions, setTrendingDiscussions] = useState<
    Array<{
      id: string;
      title: string;
      comments_count: number;
      likes_count: number;
      tags: string[];
    }>
  >([]);
  const [userGroups, setUserGroups] = useState<
    Array<{
      id: string;
      name: string;
      members_count: number;
      is_member: boolean;
      department: string;
    }>
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingWidgets, setIsLoadingWidgets] = useState(true);

  useEffect(() => {
    // Attempt backend loading
    const loadDashboardFeed = async () => {
      try {
        const response = await postsApi.feed(1);
        if (
          response.data &&
          response.data.items &&
          response.data.items.length > 0
        ) {
          const mapped: DashboardPost[] = response.data.items.map(
            (p: any, idx: number) => ({
              id: p.id || `db_${idx}`,
              authorInitials: p.author_name
                ? p.author_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : "AR",
              authorName: p.author_name || "Member",
              authorTitle: p.author_role || p.author_department || "",
              timeAgo: timeAgo(p.created_at),
              content: p.content,
              likesCount: p.likes_count ?? 0,
              commentsCount: p.comments_count ?? 0,
              isLiked: p.is_liked || false,
              isBookmarked: p.is_bookmarked || false,
              tags: p.tags || [],
              comments: (p.comments || []).map((c: any) => ({
                id: c.id || `${idx}_comment`,
                author: c.author_name || "Anonymous",
                content: c.content || "",
              })),
              commentDraft: "",
              showComments: false,
            }),
          );

          setPosts(mapped);
        }
      } catch (err) {
        console.error("Failed to load dashboard feed.", err);
      }
    };
    loadDashboardFeed();
  }, []);

  useEffect(() => {
    const loadWidgets = async () => {
      setIsLoadingWidgets(true);
      try {
        const [trendingRes, groupsRes, notifRes] = await Promise.allSettled([
          discussionsApi.trending(),
          groupsApi.list(1),
          notificationsApi.list(1),
        ]);

        if (trendingRes.status === "fulfilled") {
          setTrendingDiscussions((trendingRes.value.data || []).slice(0, 4));
        }
        if (groupsRes.status === "fulfilled") {
          const allGroups = groupsRes.value.data?.items || [];
          setUserGroups(allGroups.filter((g: any) => g.is_member).slice(0, 3));
        }
        if (notifRes.status === "fulfilled") {
          const items = notifRes.value.data?.items || [];
          setUnreadCount(items.filter((n: any) => !n.is_read).length);
        }
      } finally {
        setIsLoadingWidgets(false);
      }
    };
    loadWidgets();
  }, []);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const response = await postsApi.create({
        content: inputText,
        post_type: "text",
        department: user?.department || "Quantum Physics",
        tags: ["academic"],
      });

      const created = response.data;
      const mappedPost: DashboardPost = {
        id: created.id,
        authorInitials: created.author_name
          ? created.author_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
          : user
            ? `${user.first_name[0]}${user.last_name[0]}`
            : "JD",
        authorName:
          created.author_name ||
          (user ? `${user.first_name} ${user.last_name}` : "You"),
        authorTitle:
          created.author_role || created.author_department || user?.role || "",
        timeAgo: timeAgo(created.created_at),
        content: created.content,
        likesCount: created.likes_count ?? 0,
        commentsCount: created.comments_count ?? 0,
        isLiked: created.is_liked || false,
        isBookmarked: created.is_bookmarked || false,
        tags: created.tags || ["Discussion"],
        comments: [],
        commentDraft: "",
        showComments: false,
      };

      setPosts([mappedPost, ...posts]);
      setInputText("");
    } catch (e) {
      console.error("Error creating dashboard post.", e);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await postsApi.like(postId);
      const { liked, likes_count } = response.data;
      setPosts((currentPosts) =>
        currentPosts.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            isLiked: liked,
            likesCount: likes_count,
          };
        }),
      );
    } catch (e) {
      console.log("Backend like failed, applying optimistic like state", e);
      setPosts((currentPosts) =>
        currentPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
            };
          }
          return p;
        }),
      );
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const response = await postsApi.bookmark(postId);
      const bookmarked = response.data?.bookmarked;
      setPosts((currentPosts) =>
        currentPosts.map((p) => {
          if (p.id !== postId) return p;
          return { ...p, isBookmarked: bookmarked };
        }),
      );
    } catch (e) {
      console.log("Backend bookmark failed, applying optimistic state", e);
      setPosts((currentPosts) =>
        currentPosts.map((p) => {
          if (p.id === postId) {
            return { ...p, isBookmarked: !p.isBookmarked };
          }
          return p;
        }),
      );
    }
  };

  const handleToggleComments = (postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.map((p) => {
        if (p.id !== postId) return p;
        return { ...p, showComments: !p.showComments };
      }),
    );
  };

  const handleCommentChange = (postId: string, value: string) => {
    setPosts((currentPosts) =>
      currentPosts.map((p) => {
        if (p.id !== postId) return p;
        return { ...p, commentDraft: value };
      }),
    );
  };

  const handleCommentSubmit = async (postId: string) => {
    const draftText = posts.find((p) => p.id === postId)?.commentDraft?.trim();
    if (!draftText) return;

    try {
      const response = await postsApi.comment(postId, draftText);
      const updated = response.data;
      setPosts((currentPosts) =>
        currentPosts.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            commentsCount: updated.comments_count ?? p.commentsCount,
            comments: (updated.comments || []).map((c: any) => ({
              id: c.id,
              author: c.author_name || "Anonymous",
              content: c.content || "",
            })),
            commentDraft: "",
            showComments: true,
          };
        }),
      );
    } catch (e) {
      console.log("Backend comment failed, storing locally", e);
      setPosts((currentPosts) =>
        currentPosts.map((p) => {
          if (p.id !== postId) return p;
          const newComment = {
            id: `comment_${Date.now()}`,
            author: user ? `${user.first_name} ${user.last_name}` : "You",
            content: draftText,
          };
          return {
            ...p,
            comments: [...(p.comments || []), newComment],
            commentsCount: (p.commentsCount || 0) + 1,
            commentDraft: "",
            showComments: true,
          };
        }),
      );
    }
  };

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : "JD";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Composer and Posts */}
      <div className="lg:col-span-2 space-y-5">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, {user?.first_name || "there"}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
              : "Your academic feed is up to date."}
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
                onChange={(e) => setInputText(e.target.value)}
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
                    ? "bg-primary-400 hover:bg-primary-300 text-dark-bg"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                Post
              </button>
            </div>
          </form>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#202221] flex items-center justify-center text-primary-400 font-bold border border-gray-900 select-none">
                    {post.authorInitials}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm tracking-wide">
                      {post.authorName}
                    </h3>
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
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
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
                    post.isLiked
                      ? "text-rose-500 scale-105"
                      : "text-gray-400 hover:text-rose-400"
                  }`}
                >
                  <Heart
                    size={15}
                    fill={post.isLiked ? "currentColor" : "none"}
                  />
                  <span>{post.likesCount}</span>
                </button>
                <button
                  onClick={() => handleToggleComments(post.id)}
                  className={`flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                    post.showComments
                      ? "text-primary-400"
                      : "text-gray-400 hover:text-primary-400"
                  }`}
                >
                  <MessageSquare size={15} />
                  <span>{post.commentsCount}</span>
                </button>
                <button
                  onClick={() => handleBookmark(post.id)}
                  className={`ml-auto flex items-center text-xs font-semibold transition-all cursor-pointer ${
                    post.isBookmarked
                      ? "text-primary-400 scale-105"
                      : "text-gray-500 hover:text-white"
                  }`}
                  title={post.isBookmarked ? "Bookmarked" : "Bookmark post"}
                >
                  <Bookmark
                    size={15}
                    fill={post.isBookmarked ? "currentColor" : "none"}
                  />
                </button>
              </div>

              {post.showComments && (
                <div className="space-y-3 pt-3 border-t border-gray-900/30">
                  <div className="space-y-2">
                    {(post.comments || []).map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-2xl border border-gray-800 bg-[#141615] p-3 text-sm text-gray-200"
                      >
                        <p className="font-semibold text-xs text-white">
                          {comment.author}
                        </p>
                        <p className="text-gray-300 text-sm mt-1">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={post.commentDraft ?? ""}
                      onChange={(e) =>
                        handleCommentChange(post.id, e.target.value)
                      }
                      placeholder="Write a comment..."
                      className="w-full rounded-2xl border border-gray-800 bg-[#101210] px-3 py-2 text-sm text-white focus:outline-none"
                      rows={2}
                    />
                    <button
                      type="button"
                      onClick={() => handleCommentSubmit(post.id)}
                      className="self-end rounded-lg bg-primary-400 px-4 py-2 text-xs font-bold text-dark-bg transition hover:bg-primary-300"
                    >
                      Submit Comment
                    </button>
                  </div>
                </div>
              )}
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
          <h3 className="text-white font-bold text-sm tracking-wide mb-4">
            Trending Discussions
          </h3>
          {isLoadingWidgets ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-[#202221] rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : trendingDiscussions.length > 0 ? (
            <div className="space-y-4">
              {trendingDiscussions.map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between items-center cursor-pointer group"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-gray-200 text-xs font-bold group-hover:text-primary-400 transition-colors truncate">
                      {d.title}
                    </h4>
                    <p className="text-gray-500 text-[10px] mt-0.5">
                      {d.comments_count} replies · {d.likes_count} likes
                    </p>
                  </div>
                  <TrendingUp
                    size={14}
                    className="text-gray-600 group-hover:text-primary-400 transition-all shrink-0"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-xs">
              No trending discussions yet.
            </p>
          )}
          <button className="w-full text-center text-primary-400 hover:text-primary-300 text-xs font-bold pt-4 mt-4 border-t border-gray-900/30 transition-colors cursor-pointer">
            View All Trends
          </button>
        </div>

        {/* My Groups */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5">
          <h3 className="text-white font-bold text-sm tracking-wide mb-4">
            My Groups
          </h3>
          {isLoadingWidgets ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-[#202221] rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : userGroups.length > 0 ? (
            <div className="space-y-3">
              {userGroups.map((g) => (
                <div
                  key={g.id}
                  className="bg-[#202221] border border-gray-800 rounded-xl p-3 flex items-start gap-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary-400" />
                  <Users
                    className="text-primary-400 shrink-0 mt-0.5"
                    size={16}
                  />
                  <div>
                    <h4 className="text-white font-bold text-xs truncate">
                      {g.name}
                    </h4>
                    <p className="text-gray-400 text-[10px] mt-1 font-medium">
                      {g.members_count} member{g.members_count !== 1 ? "s" : ""}
                      {g.department ? ` · ${g.department}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-xs">
              You haven't joined any groups yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
