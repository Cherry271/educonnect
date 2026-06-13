export interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  department: string;
  faculty: string;
  bio: string;
  profile_picture: string;
  cover_photo: string;
  skills: string[];
  interests: string[];
  followers_count: number;
  following_count: number;
  posts_count: number;
  resources_count: number;
  achievements: { title: string }[];
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  post_type: string;
  media_url: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  is_edited: boolean;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  course: string;
  department: string;
  tags: string[];
  file_url: string;
  file_type: string;
  uploader_name: string;
  downloads: number;
  views: number;
  avg_rating: number;
  ai_summary: string;
  ai_key_concepts: string[];
  ai_difficulty: string;
  created_at: string;
}

export interface Discussion {
  id: string;
  author_name: string;
  title: string;
  content: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_pinned: boolean;
  trending_score: number;
  views: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  author_name: string;
  title: string;
  content: string;
  announcement_type: string;
  priority: string;
  department: string;
  created_at: string;
}

export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AIResponse {
  response: string;
  confidence_score: number;
  model_used: string;
  response_time_ms: number;
  tokens_used: number;
  suggested_resources?: string[];
  suggested_discussions?: string[];
  performance?: {
    database_query_time_ms: number;
    embedding_time_ms: number;
    ai_processing_time_ms: number;
    total_response_time_ms: number;
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}
