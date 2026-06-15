import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes("/auth/refresh")) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await api.post("/auth/refresh", {
            refresh_token: refreshToken,
          });
          useAuthStore
            .getState()
            .setTokens(data.access_token, data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// Auth
export const authApi = {
  register: (data: Record<string, unknown>) => api.post("/auth/register", data),
  login: (identifier: string, password: string) =>
    api.post("/auth/login/json", { identifier, password }),
  refresh: (refresh_token: string) =>
    api.post("/auth/refresh", { refresh_token }),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post("/auth/reset-password", { token, new_password }),
  verifyEmail: (token: string) => api.post("/auth/verify-email", { token }),
};

// Users
export const usersApi = {
  me: () => api.get("/users/me"),
  get: (id: string) => api.get(`/users/${id}`),
  update: (data: Record<string, unknown>) => api.patch("/users/me", data),
  follow: (id: string) => api.post(`/users/${id}/follow`),
  unfollow: (id: string) => api.delete(`/users/${id}/follow`),
  analytics: () => api.get("/users/me/analytics"),
};

// Posts
export const postsApi = {
  feed: (page = 1) => api.get("/posts/feed", { params: { page } }),
  create: (data: Record<string, unknown>) => api.post("/posts", data),
  like: (id: string) => api.post(`/posts/${id}/like`),
  comment: (id: string, content: string) =>
    api.post(`/posts/${id}/comments`, { content }),
  bookmark: (id: string) => api.post(`/posts/${id}/bookmark`),
  delete: (id: string) => api.delete(`/posts/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/posts/${id}`, data),
  share: (id: string) => api.post(`/posts/${id}/share`),
  report: (id: string, reason: string) => api.post(`/posts/${id}/report`, { reason }),
};

// Resources
export const resourcesApi = {
  list: (page = 1) => api.get("/resources", { params: { page } }),
  get: (id: string) => api.get(`/resources/${id}`),
  upload: (formData: FormData) =>
    api.post("/resources", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  download: (id: string) => api.get(`/resources/${id}/download`),
  rate: (id: string, rating: number, review = "") =>
    api.post(`/resources/${id}/rate`, { rating, review }),
  bookmark: (id: string) => api.post(`/resources/${id}/bookmark`),
};

// Discussions
export const discussionsApi = {
  list: (page = 1) => api.get("/discussions", { params: { page } }),
  trending: () => api.get("/discussions/trending"),
  create: (data: Record<string, unknown>) => api.post("/discussions", data),
  get: (id: string) => api.get(`/discussions/${id}`),
  like: (id: string) => api.post(`/discussions/${id}/like`),
  comment: (id: string, content: string) =>
    api.post(`/discussions/${id}/comments`, { content }),
  pin: (id: string, pinned = true) => api.post(`/discussions/${id}/pin?pinned=${pinned}`),
  delete: (id: string) => api.delete(`/discussions/${id}`),
};

// Announcements
export const announcementsApi = {
  list: (page = 1) => api.get("/announcements", { params: { page } }),
  create: (data: Record<string, unknown>) => api.post("/announcements", data),
  summarize: (id: string) => api.post(`/announcements/${id}/summarize`),
};

// Groups
export const groupsApi = {
  list: (page = 1) => api.get("/groups", { params: { page } }),
  create: (data: Record<string, unknown>) => api.post("/groups", data),
  join: (id: string) => api.post(`/groups/${id}/join`),
  leave: (id: string) => api.post(`/groups/${id}/leave`),
  invite: (id: string, user_ids: string[]) =>
    api.post(`/groups/${id}/invite`, { user_ids }),
};

// Messages
export const messagesApi = {
  conversations: () => api.get("/conversations"),
  createConversation: (data: Record<string, unknown>) =>
    api.post("/conversations", data),
  getMessages: (id: string, page = 1) =>
    api.get(`/conversations/${id}/messages`, { params: { page } }),
  send: (id: string, content: string) =>
    api.post(`/conversations/${id}/messages`, { content }),
  sendPayload: (id: string, payload: { content: string; file_url?: string; voice_url?: string; message_type?: string }) =>
    api.post(`/conversations/${id}/messages`, payload),
  edit: (messageId: string, content: string) =>
    api.patch(`/conversations/messages/${messageId}`, { content }),
  delete: (messageId: string) =>
    api.delete(`/conversations/messages/${messageId}`),
  uploadFile: (formData: FormData) =>
    api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// Notifications
export const notificationsApi = {
  list: (page = 1) => api.get("/notifications", { params: { page } }),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/read-all"),
};

// Search
export const searchApi = {
  search: (q: string, type?: string) =>
    api.get("/search", { params: { q, type } }),
};

// AI
export const aiApi = {
  chat: (message: string, resource_ids: string[] = []) =>
    api.post("/ai/chat", { message, resource_ids }),
  quiz: (topic: string, num_questions = 5) =>
    api.post("/ai/quiz", { topic, num_questions }),
  flashcards: (topic: string, num_cards = 10) =>
    api.post("/ai/flashcards", { topic, num_cards }),
  studyPlan: (subject: string, duration_days = 7) =>
    api.post("/ai/study-plan", { subject, duration_days }),
  recommendations: () => api.get("/ai/recommendations"),
  moderate: (content: string) =>
    api.post("/ai/moderate", null, { params: { content } }),
};

// Settings
export const settingsApi = {
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post("/users/me/password", data),
  uploadAvatar: (formData: FormData) =>
    api.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getNotificationSettings: () => api.get("/users/me/notification-settings"),
  updateNotificationSettings: (data: Record<string, boolean>) =>
    api.patch("/users/me/notification-settings", data),
};

// Admin
export const adminApi = {
  analytics: () => api.get("/admin/analytics"),
  users: (page = 1) => api.get("/admin/users", { params: { page } }),
};

// Events
export const eventsApi = {
  list: (page = 1) => api.get("/events", { params: { page } }),
  upcoming: (limit = 10) => api.get("/events/upcoming", { params: { limit } }),
  create: (data: Record<string, unknown>) => api.post("/events", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
};

// Schools
export const schoolsApi = {
  list: (page = 1) => api.get("/schools", { params: { page } }),
  get: (id: string) => api.get(`/schools/${id}`),
  create: (data: Record<string, unknown>) => api.post("/schools", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/schools/${id}`, data),
  delete: (id: string) => api.delete(`/schools/${id}`),
};

// Assignments
export const assignmentsApi = {
  list: (course_id?: string, page = 1) => api.get("/assignments", { params: { course_id, page } }),
  get: (id: string) => api.get(`/assignments/${id}`),
  create: (data: Record<string, unknown>) => api.post("/assignments", data),
  submit: (assignment_id: string, data: Record<string, unknown>) =>
    api.post(`/assignments/${assignment_id}/submissions`, data),
  listSubmissions: (assignment_id: string, page = 1) =>
    api.get(`/assignments/${assignment_id}/submissions`, { params: { page } }),
  listMySubmissions: () => api.get("/submissions/my"),
  grade: (submission_id: string, data: Record<string, unknown>) =>
    api.post(`/submissions/${submission_id}/grade`, data),
};

// Parent Portal
export const parentApi = {
  getChildren: () => api.get("/parent/children"),
  addChild: (child_username_or_email: string) =>
    api.post(`/parent/children?child_username_or_email=${encodeURIComponent(child_username_or_email)}`),
  getChildProgress: (child_id: string) => api.get(`/parent/children/${child_id}/progress`),
};

export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const backendBase = "http://localhost:8000";
  return `${backendBase}${path}`;
};
