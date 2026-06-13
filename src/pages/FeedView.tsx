import { useState, useEffect, useRef } from 'react';
import { Image, BookOpen, BarChart2, MessageSquare, Heart, Bookmark, Sparkles, TrendingUp, Download } from 'lucide-react';
import { postsApi, resourcesApi, aiApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

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
  post_type?: 'text' | 'image' | 'resource' | 'poll';
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

const initialPosts: PostItem[] = [
  {
    id: 'pst_1',
    authorInitials: 'SV',
    authorName: 'Dr. Sarah Vogel',
    authorTitle: 'Assistant Professor',
    timeAgo: '2h ago',
    content: 'Excited to share our new findings on neural plasticity in adult neurogenesis. The implications for cognitive recovery are promising!',
    likesCount: 248,
    commentsCount: 42,
    isLiked: false,
    isBookmarked: false
  },
  {
    id: 'pst_2',
    authorInitials: 'MK',
    authorName: 'Marcus Knight',
    authorTitle: 'Graduate Researcher',
    timeAgo: '5h ago',
    content: 'Looking for collaborators for a project on sustainable carbon capture using synthetic biology. DM if interested!',
    likesCount: 89,
    commentsCount: 12,
    isLiked: false,
    isBookmarked: false
  },
  {
    id: 'pst_3',
    authorInitials: 'JL',
    authorName: 'Jenny Liu',
    authorTitle: 'Undergrad Assistant',
    timeAgo: '1d ago',
    content: 'Just finished my comprehensive guide to Quantum Computing. Hope this helps everyone for the upcoming finals!',
    likesCount: 512,
    commentsCount: 104,
    isLiked: false,
    isBookmarked: false
  }
];

export default function FeedView() {
  const { user } = useAuthStore();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const resourceInputRef = useRef<HTMLInputElement | null>(null);
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [inputText, setInputText] = useState('');
  const [composerMode, setComposerMode] = useState<'text' | 'image' | 'resource' | 'poll'>('text');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedResourceFile, setSelectedResourceFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedResourceName, setSelectedResourceName] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [isPosting, setIsPosting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    // Attempt backend loading
    const loadFeed = async () => {
      try {
        const response = await postsApi.feed(1);
        if (response.data && response.data.items && response.data.items.length > 0) {
          const mapped: PostItem[] = response.data.items.map((p: any, idx: number) => ({
            id: p.id || `feed_${idx}`,
            authorInitials: p.author_name ? p.author_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'AR',
            authorName: p.author_name || 'Collaborator',
            authorTitle: p.author_role || 'Researcher',
            timeAgo: 'Just now',
            content: p.content || p.poll_question || '',
            post_type: p.post_type || 'text',
            media_url: p.media_url,
            resource_id: p.resource_id,
            poll_question: p.poll_question,
            poll_options: p.poll_options || [],
            pollVotes: (p.poll_options || []).map(() => 0),
            selectedPollOption: undefined,
            comments: [],
            commentDraft: '',
            showComments: false,
          }));

          // Merge with initial posts avoiding duplicates
          const merged = [...initialPosts];
          mapped.forEach(mp => {
            if (!merged.some(ep => ep.content === mp.content)) {
              merged.unshift(mp);
            }
          });
          setPosts(merged);
        }
      } catch (err) {
        console.log("Backend offline or empty feed, using mock feed items.", err);
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

  const clearComposer = () => {
    setComposerMode('text');
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
    setSelectedResourceFile(null);
    setSelectedResourceName(null);
    setPollOptions(['', '']);
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
    setComposerMode('image');
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
    setComposerMode('resource');
    setSelectedResourceName(file?.name ?? null);
  };

  const handleAddPollOption = () => {
    setPollOptions((current) => [...current, '']);
    setComposerMode('poll');
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
    if (!inputText.trim() && composerMode === 'text') return;
    if (composerMode === 'image' && !selectedImageFile) return;
    if (composerMode === 'resource' && !selectedResourceFile) return;
    if (composerMode === 'poll' && pollOptions.filter(Boolean).length < 2) return;

    setIsPosting(true);
    const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : 'JD';
    const newPost: PostItem = {
      id: `pst_${Date.now()}`,
      authorInitials: initials,
      authorName: user ? `${user.first_name} ${user.last_name}` : 'Julian Drax',
      authorTitle: user?.role === 'teacher' ? 'Senior Researcher' : 'PhD Candidate',
      timeAgo: 'Just now',
      content: inputText || (composerMode === 'poll' ? 'New poll' : ''),
      post_type: composerMode,
      media_url: selectedImagePreview || undefined,
      resource_id: composerMode === 'resource' ? selectedResourceName ?? undefined : undefined,
      poll_question: composerMode === 'poll' ? inputText : undefined,
      poll_options: composerMode === 'poll' ? pollOptions.filter(Boolean) : undefined,
      pollVotes: composerMode === 'poll' ? pollOptions.filter(Boolean).map(() => 0) : [],
      selectedPollOption: undefined,
      comments: [],
      commentDraft: '',
      showComments: false,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isBookmarked: false
    };

    try {
      let postPayload: any = {
        department: user?.department || 'General',
        tags: ['academic', 'share']
      };

      if (composerMode === 'image' && selectedImageFile) {
        const formData = new FormData();
        formData.append('title', selectedImageFile.name);
        formData.append('description', inputText || 'Attached image');
        formData.append('course', '');
        formData.append('department', user?.department || 'General');
        formData.append('tags', 'image,post');
        formData.append('file', selectedImageFile, selectedImageFile.name);
        const resourceResponse = await resourcesApi.upload(formData);
        postPayload = {
          ...postPayload,
          content: inputText || 'Image post',
          post_type: 'image',
          media_url: resourceResponse.data.file_url,
          resource_id: resourceResponse.data.id
        };
      } else if (composerMode === 'resource' && selectedResourceFile) {
        const formData = new FormData();
        formData.append('title', selectedResourceFile.name);
        formData.append('description', inputText || 'Attached resource');
        formData.append('course', '');
        formData.append('department', user?.department || 'General');
        formData.append('tags', 'resource,post');
        formData.append('file', selectedResourceFile, selectedResourceFile.name);
        const resourceResponse = await resourcesApi.upload(formData);
        postPayload = {
          ...postPayload,
          content: inputText || 'Resource post',
          post_type: 'resource',
          resource_id: resourceResponse.data.id
        };
      } else if (composerMode === 'poll') {
        postPayload = {
          ...postPayload,
          content: inputText || 'Poll',
          post_type: 'poll',
          poll_question: inputText,
          poll_options: pollOptions.filter(Boolean)
        };
      } else {
        postPayload = {
          ...postPayload,
          content: inputText,
          post_type: 'text'
        };
      }

      await postsApi.create(postPayload);
    } catch (error) {
      console.log('Backend error creating post, using local preview.', error);
    } finally {
      setIsPosting(false);
    }

    setPosts([newPost, ...posts]);
    setInputText('');
    clearComposer();
  };

  const handleLike = async (postId: string) => {
    setPosts((currentPosts) => currentPosts.map(p => {
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

  const handleToggleComments = (postId: string) => {
    setPosts((currentPosts) => currentPosts.map(p => {
      if (p.id === postId) {
        return { ...p, showComments: !p.showComments };
      }
      return p;
    }));
  };

  const handleCommentChange = (postId: string, value: string) => {
    setPosts((currentPosts) => currentPosts.map(p => {
      if (p.id === postId) {
        return { ...p, commentDraft: value };
      }
      return p;
    }));
  };

  const handleCommentSubmit = async (postId: string) => {
    const draftText = posts.find((p) => p.id === postId)?.commentDraft?.trim();
    if (!draftText) return;

    setPosts((currentPosts) => currentPosts.map(p => {
      if (p.id !== postId) return p;

      const newComment = {
        id: `comment_${Date.now()}`,
        author: user ? `${user.first_name} ${user.last_name}` : 'You',
        content: draftText
      };

      return {
        ...p,
        comments: [...(p.comments || []), newComment],
        commentsCount: (p.commentsCount || 0) + 1,
        commentDraft: '',
        showComments: true
      };
    }));

    try {
      await postsApi.comment(postId, draftText);
    } catch (e) {
      console.log('Backend offline, comment stored locally', e);
    }
  };

  const handleBookmark = async (postId: string) => {
    setPosts((currentPosts) => currentPosts.map(p => {
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

  const handleSelectPollOption = (postId: string, optionIndex: number) => {
    setPosts((currentPosts) => currentPosts.map(p => {
      if (p.id !== postId || p.post_type !== 'poll') return p;

      const currentSelection = p.selectedPollOption;
      const votes = p.pollVotes ? [...p.pollVotes] : (p.poll_options || []).map(() => 0);
      if (currentSelection === optionIndex) {
        return p;
      }

      if (currentSelection !== undefined && votes[currentSelection] !== undefined) {
        votes[currentSelection] = Math.max(0, votes[currentSelection] - 1);
      }
      votes[optionIndex] = (votes[optionIndex] ?? 0) + 1;

      return {
        ...p,
        selectedPollOption: optionIndex,
        pollVotes: votes
      };
    }));
  };

  const triggerAiSummary = async () => {
    setIsAiGenerating(true);
    try {
      // call backend summary AI
      await (aiApi as any).moderate("Neural Plasticity Summary Request"); // or mock moderate as placeholder
      // For high fidelity, generate mock text from Claude client
      setTimeout(() => {
        setAiSummary(
          "Neural plasticity, or brain plasticity, refers to the brain's ability to adapt and change both structurally and functionally in response to learning, experience, or following injury. The latest research indicates that adult neurogenesis continues to play a pivotal role in memory formation, spatial awareness, and cognitive recovery, suggesting promising new avenues for treating neurodegenerative disorders."
        );
        setIsAiGenerating(false);
      }, 1000);
    } catch (e) {
      setTimeout(() => {
        setAiSummary(
          "Neural plasticity, or brain plasticity, refers to the brain's ability to adapt and change both structurally and functionally in response to learning, experience, or following injury. The latest research indicates that adult neurogenesis continues to play a pivotal role in memory formation, spatial awareness, and cognitive recovery, suggesting promising new avenues for treating neurodegenerative disorders."
        );
        setIsAiGenerating(false);
      }, 1000);
    }
  };

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : 'AR';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Columns - Composer and Feed */}
      <div className="lg:col-span-2 space-y-5">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Academic Feed</h1>
          <p className="text-gray-400 text-sm mt-1">Stay updated with your network's latest discoveries.</p>
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
                onChange={e => setInputText(e.target.value)}
                rows={2}
                className="w-full bg-transparent border-0 text-white placeholder:text-gray-500 py-1.5 focus:outline-hidden resize-none text-sm leading-relaxed"
              />
            </div>
            
            <div className="flex flex-col gap-3">
              {selectedImagePreview && (
                <div className="rounded-2xl overflow-hidden border border-gray-800 bg-[#141615]">
                  <img src={selectedImagePreview} alt="Selected" className="w-full object-cover max-h-72" />
                </div>
              )}
              {selectedResourceName && (
                <div className="rounded-2xl border border-gray-800 bg-[#141615] p-3 text-sm text-gray-300">
                  <p className="font-semibold">Resource ready to upload</p>
                  <p className="truncate">{selectedResourceName}</p>
                </div>
              )}
              {composerMode === 'poll' && (
                <div className="rounded-2xl border border-gray-800 bg-[#141615] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.15em] text-emerald-300">Poll Options</p>
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
                        onChange={(e) => handlePollOptionChange(index, e.target.value)}
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
                    setComposerMode('image');
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
                    setComposerMode('resource');
                  }}
                  className="bg-[#202221] hover:bg-[#2e3230] border border-gray-800 text-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <BookOpen size={14} className="text-[#e1be94]" />
                  Resource
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setComposerMode('poll');
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
                disabled={isPosting || (composerMode === 'text' ? !inputText.trim() : composerMode === 'image' ? !selectedImageFile : composerMode === 'resource' ? !selectedResourceFile : pollOptions.filter(Boolean).length < 2)}
                className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isPosting && (composerMode === 'text' ? inputText.trim() : composerMode === 'image' ? selectedImageFile : composerMode === 'resource' ? selectedResourceFile : pollOptions.filter(Boolean).length >= 2)
                    ? 'bg-primary-400 hover:bg-primary-300 text-dark-bg font-bold'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isPosting ? 'Posting...' : 'Post'}
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
          {posts.map(post => (
            <div key={post.id} className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5 space-y-4">
              {/* Post Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#202221] flex items-center justify-center text-primary-400 font-bold border border-gray-900 select-none">
                    {post.authorInitials}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm tracking-wide">{post.authorName}</h3>
                    <p className="text-gray-500 text-[10px] font-medium mt-0.5">{post.authorTitle} • {post.timeAgo}</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-white transition-colors cursor-pointer text-sm font-black">
                  •••
                </button>
              </div>

              {/* Content */}
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                {post.post_type === 'poll' ? post.poll_question || post.content : post.content}
              </p>

              {post.post_type === 'image' && post.media_url && (
                <div className="rounded-2xl overflow-hidden border border-gray-800 bg-[#141615]">
                  <img src={post.media_url} alt="Post attachment" className="w-full object-cover max-h-72" />
                </div>
              )}

              {post.post_type === 'resource' && post.resource_id && (
                <div className="rounded-2xl border border-gray-800 bg-[#141615] p-4 text-sm text-gray-300">
                  <p className="font-semibold">Resource attached</p>
                  <p className="truncate">ID: {post.resource_id}</p>
                </div>
              )}

              {post.post_type === 'poll' && post.poll_options && post.poll_options.length > 0 && (
                <div className="space-y-3 rounded-2xl border border-gray-800 bg-[#141615] p-4">
                  <p className="text-sm text-gray-300 font-semibold">Poll options</p>
                  <div className="space-y-2">
                    {post.poll_options.map((option, index) => {
                      const isSelected = post.selectedPollOption === index;
                      const voteCount = post.pollVotes?.[index] ?? 0;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectPollOption(post.id, index)}
                          className={`w-full rounded-xl border px-3 py-2 text-sm text-left transition ${
                            isSelected
                              ? 'border-primary-400 bg-[#162017] text-white'
                              : 'border-gray-800 bg-[#101210] text-gray-200 hover:border-primary-400'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-3">
                            <span>{option}</span>
                            <span className="text-[11px] text-gray-400">{voteCount} vote{voteCount === 1 ? '' : 's'}</span>
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
                    post.isLiked ? 'text-rose-500 scale-105' : 'text-gray-400 hover:text-rose-400'
                  }`}
                >
                  <Heart size={15} fill={post.isLiked ? 'currentColor' : 'none'} />
                  <span>{post.likesCount}</span>
                </button>
                <button
                  onClick={() => handleToggleComments(post.id)}
                  className={`flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                    post.showComments ? 'text-primary-400' : 'text-gray-400 hover:text-primary-400'
                  }`}
                >
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

              {post.showComments && (
                <div className="space-y-3 pt-3 border-t border-gray-900/30">
                  <div className="space-y-2">
                    {(post.comments || []).map((comment) => (
                      <div key={comment.id} className="rounded-2xl border border-gray-800 bg-[#141615] p-3 text-sm text-gray-200">
                        <p className="font-semibold text-xs text-white">{comment.author}</p>
                        <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={post.commentDraft ?? ''}
                      onChange={(e) => handleCommentChange(post.id, e.target.value)}
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
            3 new papers match your interest in 'Neural Plasticity'. Would you like a summary?
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
              'Generate Summary'
            )}
          </button>

          {aiSummary && (
            <div className="bg-dark-bg text-gray-200 border border-gray-900 rounded-xl p-3.5 mt-3 text-xs leading-relaxed relative animate-fadeIn">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-primary-400 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <Sparkles size={10} />
                  Claude Summary
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
          <h3 className="text-white font-bold text-sm tracking-wide mb-4">Trending Topics</h3>
          <div className="space-y-4">
            {[
              { topic: 'Neural Plasticity', posts: '1.2k posts today' },
              { topic: 'Carbon Capture', posts: '850 posts today' },
              { topic: 'Quantum ML', posts: '620 posts today' },
              { topic: 'Ethical AI', posts: '3.4k posts today' }
            ].map(t => (
              <div key={t.topic} className="flex justify-between items-center cursor-pointer group">
                <div>
                  <h4 className="text-gray-200 text-xs font-bold group-hover:text-primary-400 transition-colors">
                    {t.topic}
                  </h4>
                  <p className="text-gray-500 text-[10px] mt-0.5">{t.posts}</p>
                </div>
                <TrendingUp size={14} className="text-gray-600 group-hover:text-primary-400 transition-all" />
              </div>
            ))}
          </div>
          <button className="w-full text-center text-primary-400 hover:text-primary-300 text-xs font-bold pt-4 mt-4 border-t border-gray-900/30 transition-colors cursor-pointer">
            View All
          </button>
        </div>

        {/* Your Activity */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5">
          <h3 className="text-white font-bold text-sm tracking-wide mb-4">Your Activity</h3>
          <div className="bg-[#202221] border border-gray-800 rounded-xl p-3.5 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
            <Download className="text-amber-400 shrink-0 mt-0.5" size={16} />
            <div>
              <h4 className="text-white font-bold text-xs">Resource Downloaded</h4>
              <p className="text-gray-400 text-[10px] mt-1 font-mono">Quantum_Intro_v2.pdf</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
