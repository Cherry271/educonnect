import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import type { Post } from '../../types';
import { postsApi } from '../../api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => postsApi.like(post.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => postsApi.bookmark(post.id),
    onSuccess: () => {
      toast.success('Bookmark updated');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold">
            {post.author_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{post.author_name}</p>
            <p className="text-xs text-gray-500">
              {new Date(post.created_at).toLocaleDateString()}
              {post.is_edited && ' · Edited'}
            </p>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded-lg"><MoreHorizontal size={18} /></button>
        </div>

        <p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.content}</p>

        {post.media_url && (
          <img src={post.media_url} alt="" className="rounded-lg w-full max-h-96 object-cover mb-3" />
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
          <button
            onClick={() => likeMutation.mutate()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              post.is_liked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Heart size={18} fill={post.is_liked ? 'currentColor' : 'none'} />
            {post.likes_count}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <MessageCircle size={18} />
            {post.comments_count}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Share2 size={18} />
            {post.shares_count}
          </button>
          <button
            onClick={() => bookmarkMutation.mutate()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ml-auto transition-colors ${
              post.is_bookmarked ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Bookmark size={18} fill={post.is_bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
