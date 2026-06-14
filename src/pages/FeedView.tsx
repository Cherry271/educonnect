import { useState, useEffect, useRef } from "react";
import {
  Image,
  BookOpen,
  BarChart2,
  MessageSquare,
  Heart,
  Bookmark,
  Sparkles,
  TrendingUp,
  Download,
} from "lucide-react";
import {
  postsApi,
  resourcesApi,
  aiApi,
  discussionsApi,
  notificationsApi,
} from "../api/client";
import { useAuthStore } from "../store/authStore";

interface CommentItem {
  id: string;
  author: string;
  content: string;
}

interface PostItem {
  id: string;
  authorInitials: string;
  authorName: string;
  authorTitle: string;
  timeAgo: string;
  content: string;
  post_type?: "text" | "image" | "resource" | "poll";
  media_url?: string;
  resource_id?: string;
  poll_question?: string;
  poll_options?: string[];
  pollVotes?: number[];
  selectedPollOption?: number;
  comments?: CommentItem[];
  commentDraft?: string;
  showComments?: boolean;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  tags?: string[];
}

// Feed is loaded from the backend and only displays live posts from the database.

function timeAgo(dateStr: string): string {
  if (!dateStr) return "Just now";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function FeedView() {
  const { user } = useAuthStore();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const resourceInputRef = useRef<HTMLInputElement | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [composerMode, setComposerMode] = useState<
    "text" | "image" | "resource" | "poll"
  >("text");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedResourceFile, setSelectedResourceFile] = useState<File | null>(
    null,
  );
  const [selectedImagePreview, setSelectedImagePreview] = useState<
    string | null
  >(null);
  const [selectedResourceName, setSelectedResourceName] = useState<
    string | null
  >(null);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [isPosting, setIsPosting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<
    Array<{ id: string; title: string; comments_count: number; tags: string[] }>
  >([]);
  const [recentNotifications, setRecentNotifications] = useState<
    Array<{ id: string; title: string; message: string; created_at: string }>
  >([]);
  const [isLoadingWidgets, setIsLoadingWidgets] = useState(true);

  useEffect(() => {
    // Attempt backend loading
    const loadFeed = async () => {
      try {
        const response = await postsApi.feed(1);
        if (
          response.data &&
          response.data.items &&
          response.data.items.length > 0
        ) {
          const mapped: PostItem[] = response.data.items.map(
            (p: any, idx: number) => ({
              id: p.id || `feed_${idx}`,
              authorInitials: p.author_name
                ? p.author_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : "AR",
              authorName: p.author_name || "Member",
              authorTitle:
                p.author_role || p.author_department || user?.department || "",
              timeAgo: timeAgo(p.created_at),
              content: p.content || p.poll_question || "",
              post_type: p.post_type || "text",
              media_url: p.media_url,
              resource_id: p.resource_id,
              poll_question: p.poll_question,
              poll_options: p.poll_options || [],
              pollVotes: (p.poll_options || []).map(() => 0),
              selectedPollOption: undefined,
              likesCount: p.likes_count ?? 0,
              commentsCount: p.comments_count ?? 0,
              isLiked: p.is_liked || false,
              isBookmarked: p.is_bookmarked || false,
              comments: (p.comments || []).map((c: any) => ({
                id: c.id || `${idx}_comment`,
                author: c.author_name || "Anonymous",
                content: c.content || "",
              })),
              commentDraft: "",
              showComments: false,
              tags: p.tags || [],
            }),
          );

          setPosts(mapped);
        }
      } catch (err) {
        console.error("Failed to load feed items.", err);
      }
    };
    loadFeed();
  }, []);

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  useEffect(() => {
    const loadWidgets = async () => {
      setIsLoadingWidgets(true);
      try {
        const [trendingRes, notifRes] = await Promise.allSettled([
          discussionsApi.trending(),
          notificationsApi.list(1),
        ]);
        if (trendingRes.status === "fulfilled") {
          setTrendingTopics((trendingRes.value.data || []).slice(0, 4));
        }
        if (notifRes.status === "fulfilled") {
          setRecentNotifications(
            (notifRes.value.data?.items || []).slice(0, 3),
          );
        }
      } finally {
        setIsLoadingWidgets(false);
      }
    };
    loadWidgets();
  }, []);

  const clearComposer = () => {
    setComposerMode("text");
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
    setSelectedResourceFile(null);
    setSelectedResourceName(null);
    setPollOptions(["", ""]);
  };

  const handleImageClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedImageFile(file);
    setSelectedResourceFile(null);
    setSelectedResourceName(null);
    setComposerMode("image");
    if (file) {
      setSelectedImagePreview(URL.createObjectURL(file));
    } else {
      setSelectedImagePreview(null);
    }
  };

  const handleResourceClick = () => {
    if (resourceInputRef.current) {
      resourceInputRef.current.click();
    }
  };

  const handleResourceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedResourceFile(file);
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
    setComposerMode("resource");
    setSelectedResourceName(file?.name ?? null);
  };

  const handleAddPollOption = () => {
    setPollOptions((current) => [...current, ""]);
    setComposerMode("poll");
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
    setSelectedResourceFile(null);
    setSelectedResourceName(null);
  };

  const handlePollOptionChange = (index: number, value: string) => {
    setPollOptions((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const handleRemovePollOption = (index: number) => {
    setPollOptions((current) => current.filter((_, i) => i !== index));
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && composerMode === "text") return;
    if (composerMode === "image" && !selectedImageFile) return;
    if (composerMode === "resource" && !selectedResourceFile) return;
    if (composerMode === "poll" && pollOptions.filter(Boolean).length < 2)
      return;

    setIsPosting(true);

    try {
      let postPayload: any = {
        department: user?.department || "General",
        tags: ["academic", "share"],
      };

      if (composerMode === "image" && selectedImageFile) {
        const formData = new FormData();
        formData.append("title", selectedImageFile.name);
        formData.append("description", inputText || "Attached image");
        formData.append("course", "");
        formData.append("department", user?.department || "General");
        formData.append("tags", "image,post");
        formData.append("file", selectedImageFile, selectedImageFile.name);
        const resourceResponse = await resourcesApi.upload(formData);
        postPayload = {
          ...postPayload,
          content: inputText || "Image post",
          post_type: "image",
          media_url: resourceResponse.data.file_url,
          resource_id: resourceResponse.data.id,
        };
      } else if (composerMode === "resource" && selectedResourceFile) {
        const formData = new FormData();
        formData.append("title", selectedResourceFile.name);
        formData.append("description", inputText || "Attached resource");
        formData.append("course", "");
        formData.append("department", user?.department || "General");
        formData.append("tags", "resource,post");
        formData.append(
          "file",
          selectedResourceFile,
          selectedResourceFile.name,
        );
        const resourceResponse = await resourcesApi.upload(formData);
        postPayload = {
          ...postPayload,
          content: inputText || "Resource post",
          post_type: "resource",
          resource_id: resourceResponse.data.id,
        };
      } else if (composerMode === "poll") {
        postPayload = {
          ...postPayload,
          content: inputText || "Poll",
          post_type: "poll",
          poll_question: inputText,
          poll_options: pollOptions.filter(Boolean),
        };
      } else {
        postPayload = {
          ...postPayload,
          content: inputText,
          post_type: "text",
        };
      }

      const response = await postsApi.create(postPayload);
      const created = response.data;
      const mappedPost: PostItem = {
        id: created.id,
        authorInitials: created.author_name
          ? created.author_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
          : "AR",
        authorName:
          created.author_name ||
          (user ? `${user.first_name} ${user.last_name}` : "You"),
        authorTitle:
          created.author_role || created.author_department || user?.role || "",
        timeAgo: timeAgo(created.created_at),
        content: created.content || created.poll_question || "",
        post_type: created.post_type || "text",
        media_url: created.media_url,
        resource_id: created.resource_id,
        poll_question: created.poll_question,
        poll_options: created.poll_options || [],
        pollVotes: (created.poll_options || []).map(() => 0),
        selectedPollOption: undefined,
        comments: [],
        commentDraft: "",
        showComments: false,
        likesCount: created.likes_count ?? 0,
        commentsCount: created.comments_count ?? 0,
        isLiked: created.is_liked || false,
        isBookmarked: created.is_bookmarked || false,
        tags: created.tags || [],
      };

      setPosts([mappedPost, ...posts]);
      setInputText("");
      clearComposer();
    } catch (error) {
      console.error("Error creating post.", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await postsApi.like(postId);
      const { liked, likes_count } = response.data;
      setPosts((currentPosts) =>
        currentPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: liked,
              likesCount: likes_count,
            };
          }
          return p;
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

  const handleToggleComments = (postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.map((p) => {
        if (p.id === postId) {
          return { ...p, showComments: !p.showComments };
        }
        return p;
      }),
    );
  };

  const handleCommentChange = (postId: string, value: string) => {
    setPosts((currentPosts) =>
      currentPosts.map((p) => {
        if (p.id === postId) {
          return { ...p, commentDraft: value };
        }
        return p;
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
      console.error("Error adding comment.", e);
    }
  };

  const handleBookmark = async (postId: string) => {
    const currentPost = posts.find((p) => p.id === postId);
    if (!currentPost) return;
    const nextState = !currentPost.isBookmarked;
    setPosts((currentPosts) =>
      currentPosts.map((p) => {
        if (p.id === postId) {
          return { ...p, isBookmarked: nextState };
        }
        return p;
      }),
    );

    try {
      await postsApi.bookmark(postId);
    } catch (e) {
      console.error("Bookmark update failed.", e);
      setPosts((currentPosts) =>
        currentPosts.map((p) => {
          if (p.id === postId) {
            return { ...p, isBookmarked: currentPost.isBookmarked };
          }
          return p;
        }),
      );
    }
  };

  const handleSelectPollOption = (postId: string, optionIndex: number) => {
    setPosts((currentPosts) =>
      currentPosts.map((p) => {
        if (p.id !== postId || p.post_type !== "poll") return p;

        const currentSelection = p.selectedPollOption;
        const votes = p.pollVotes
          ? [...p.pollVotes]
          : (p.poll_options || []).map(() => 0);
        if (currentSelection === optionIndex) {
          return p;
        }

        if (
          currentSelection !== undefined &&
          votes[currentSelection] !== undefined
        ) {
          votes[currentSelection] = Math.max(0, votes[currentSelection] - 1);
        }
        votes[optionIndex] = (votes[optionIndex] ?? 0) + 1;

        return {
          ...p,
          selectedPollOption: optionIndex,
          pollVotes: votes,
        };
      }),
    );
  };

  const triggerAiSummary = async () => {
    setIsAiGenerating(true);
    try {
      const response = await aiApi.chat(
        "Summarize the latest academic feed posts and highlight three study takeaways.",
        [],
      );
      setAiSummary(
        response.data?.response ||
          response.data?.answer ||
          response.data?.text ||
          "Unable to generate a summary from the AI service at this time.",
      );
    } catch (e) {
      console.error("AI summary request failed.", e);
      setAiSummary(
        "AI summary service is unavailable. Please try again later.",
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : "AR";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Columns - Composer and Feed */}
      <div className="lg:col-span-2 space-y-5">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Academic Feed
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Stay updated with your network's latest discoveries.
          </p>
        </div>

        {/* Post Composer */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5">
          <form onSubmit={handlePostSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-950 flex items-center justify-center text-primary-400 font-bold border border-emerald-900 shrink-0 select-none">
                {initials}
              </div>
              <textarea
                placeholder="Share a discovery..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={2}
                className="w-full bg-transparent border-0 text-white placeholder:text-gray-500 py-1.5 focus:outline-hidden resize-none text-sm leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-3">
              {selectedImagePreview && (
                <div className="rounded-2xl overflow-hidden border border-gray-800 bg-[#141615]">
                  <img
                    src={selectedImagePreview}
                    alt="Selected"
                    className="w-full object-cover max-h-72"
                  />
                </div>
              )}
              {selectedResourceName && (
                <div className="rounded-2xl border border-gray-800 bg-[#141615] p-3 text-sm text-gray-300">
                  <p className="font-semibold">Resource ready to upload</p>
                  <p className="truncate">{selectedResourceName}</p>
                </div>
              )}
              {composerMode === "poll" && (
                <div className="rounded-2xl border border-gray-800 bg-[#141615] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.15em] text-emerald-300">
                      Poll Options
                    </p>
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="text-[11px] text-gray-300 hover:text-white transition-colors"
                    >
                      + Add option
                    </button>
                  </div>
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={option}
                        onChange={(e) =>
                          handlePollOptionChange(index, e.target.value)
                        }
                        placeholder={`Option ${index + 1}`}
                        className="w-full rounded-xl border border-gray-800 bg-[#101210] px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(index)}
                          className="text-xs text-rose-400 hover:text-rose-200 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-900/50">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleImageClick();
                    setComposerMode("image");
                  }}
                  className="bg-[#202221] hover:bg-[#2e3230] border border-gray-800 text-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Image size={14} className="text-emerald-400" />
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleResourceClick();
                    setComposerMode("resource");
                  }}
                  className="bg-[#202221] hover:bg-[#2e3230] border border-gray-800 text-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <BookOpen size={14} className="text-[#e1be94]" />
                  Resource
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setComposerMode("poll");
                    setSelectedImageFile(null);
                    setSelectedImagePreview(null);
                    setSelectedResourceFile(null);
                    setSelectedResourceName(null);
                  }}
                  className="bg-[#202221] hover:bg-[#2e3230] border border-gray-800 text-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <BarChart2 size={14} className="text-sky-400" />
                  Poll
                </button>
              </div>

              <button
                type="submit"
                disabled={
                  isPosting ||
                  (composerMode === "text"
                    ? !inputText.trim()
                    : composerMode === "image"
                      ? !selectedImageFile
                      : composerMode === "resource"
                        ? !selectedResourceFile
                        : pollOptions.filter(Boolean).length < 2)
                }
                className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isPosting &&
                  (composerMode === "text"
                    ? inputText.trim()
                    : composerMode === "image"
                      ? selectedImageFile
                      : composerMode === "resource"
                        ? selectedResourceFile
                        : pollOptions.filter(Boolean).length >= 2)
                    ? "bg-primary-400 hover:bg-primary-300 text-dark-bg font-bold"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isPosting ? "Posting..." : "Post"}
              </button>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <input
              ref={resourceInputRef}
              type="file"
              className="hidden"
              onChange={handleResourceChange}
            />
          </form>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5 space-y-4"
            >
              {/* Post Header */}
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

              {/* Content */}
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                {post.post_type === "poll"
                  ? post.poll_question || post.content
                  : post.content}
              </p>

              {post.post_type === "image" && post.media_url && (
                <div className="rounded-2xl overflow-hidden border border-gray-800 bg-[#141615]">
                  <img
                    src={post.media_url}
                    alt="Post attachment"
                    className="w-full object-cover max-h-72"
                  />
                </div>
              )}

              {post.post_type === "resource" && post.resource_id && (
                <div className="rounded-2xl border border-gray-800 bg-[#141615] p-4 text-sm text-gray-300">
                  <p className="font-semibold">Resource attached</p>
                  <p className="truncate">ID: {post.resource_id}</p>
                </div>
              )}

              {post.post_type === "poll" &&
                post.poll_options &&
                post.poll_options.length > 0 && (
                  <div className="space-y-3 rounded-2xl border border-gray-800 bg-[#141615] p-4">
                    <p className="text-sm text-gray-300 font-semibold">
                      Poll options
                    </p>
                    <div className="space-y-2">
                      {post.poll_options.map((option, index) => {
                        const isSelected = post.selectedPollOption === index;
                        const voteCount = post.pollVotes?.[index] ?? 0;
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() =>
                              handleSelectPollOption(post.id, index)
                            }
                            className={`w-full rounded-xl border px-3 py-2 text-sm text-left transition ${
                              isSelected
                                ? "border-primary-400 bg-[#162017] text-white"
                                : "border-gray-800 bg-[#101210] text-gray-200 hover:border-primary-400"
                            }`}
                          >
                            <div className="flex justify-between items-center gap-3">
                              <span>{option}</span>
                              <span className="text-[11px] text-gray-400">
                                {voteCount} vote{voteCount === 1 ? "" : "s"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
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

      {/* Right Column - Side Widgets */}
      <div className="space-y-5">
        {/* AI Insights banner */}
        <div className="bg-[#3ddc97] text-dark-bg rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sparkles size={16} />
            AI Insights
          </div>
          <p className="text-dark-bg/90 text-xs leading-relaxed font-semibold">
            {user?.interests?.[0]
              ? `Explore topics related to ${user.interests[0]}. Ask the AI for a summary or quiz.`
              : "Get AI-powered summaries, quizzes, and study plans from your feed."}
          </p>
          <button
            onClick={triggerAiSummary}
            disabled={isAiGenerating}
            className="w-full bg-[#dfc39f] hover:bg-[#d0b490] text-dark-bg font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isAiGenerating ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-dark-bg rounded-full animate-ping" />
                Generating...
              </span>
            ) : (
              "Generate Summary"
            )}
          </button>

          {aiSummary && (
            <div className="bg-dark-bg text-gray-200 border border-gray-900 rounded-xl p-3.5 mt-3 text-xs leading-relaxed relative animate-fadeIn">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-primary-400 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <Sparkles size={10} />
                  Groq AI Summary
                </span>
                <button
                  onClick={() => setAiSummary(null)}
                  className="text-gray-500 hover:text-white text-[9px] font-bold"
                >
                  Close
                </button>
              </div>
              {aiSummary}
            </div>
          )}
        </div>

        {/* Trending Topics */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5">
          <h3 className="text-white font-bold text-sm tracking-wide mb-4">
            Trending Topics
          </h3>
          {isLoadingWidgets ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-[#202221] rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : trendingTopics.length > 0 ? (
            <div className="space-y-4">
              {trendingTopics.map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between items-center cursor-pointer group"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-gray-200 text-xs font-bold group-hover:text-primary-400 transition-colors truncate">
                      {d.title}
                    </h4>
                    <p className="text-gray-500 text-[10px] mt-0.5">
                      {d.comments_count} replies
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
            <p className="text-gray-500 text-xs">No trending topics yet.</p>
          )}
          <button className="w-full text-center text-primary-400 hover:text-primary-300 text-xs font-bold pt-4 mt-4 border-t border-gray-900/30 transition-colors cursor-pointer">
            View All
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5">
          <h3 className="text-white font-bold text-sm tracking-wide mb-4">
            Recent Activity
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
          ) : recentNotifications.length > 0 ? (
            <div className="space-y-3">
              {recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className="bg-[#202221] border border-gray-800 rounded-xl p-3 flex items-start gap-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
                  <Download
                    className="text-amber-400 shrink-0 mt-0.5"
                    size={16}
                  />
                  <div className="min-w-0">
                    <h4 className="text-white font-bold text-xs truncate">
                      {n.title}
                    </h4>
                    <p className="text-gray-400 text-[10px] mt-1 line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-xs">No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
}
