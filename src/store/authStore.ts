import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

export const mockUsers: Record<string, User> = {
  juliandrax: {
    id: 'user_julian_drax_id',
    first_name: 'Julian',
    last_name: 'Drax',
    username: 'juliandrax',
    email: 'julian.drax@educonnect.edu',
    role: 'teacher',
    department: 'Quantum Physics',
    faculty: 'Science',
    bio: 'Senior Researcher in Quantum Computing and AI Systems. Passionate about exploring superconductivity and teaching advanced mechanics.',
    profile_picture: '',
    cover_photo: '',
    skills: ['Quantum Mechanics', 'Superconductivity', 'Neural Networks'],
    interests: ['AI Research', 'Quantum ML', 'Pedagogy'],
    followers_count: 1240,
    following_count: 350,
    posts_count: 87,
    resources_count: 24,
    achievements: [{ title: 'Senior Researcher' }, { title: 'Premium Plan' }],
    created_at: new Date().toISOString(),
  },
  alexrivera: {
    id: 'user_alex_rivera_id',
    first_name: 'Alex',
    last_name: 'Rivera',
    username: 'alexrivera',
    email: 'alex.rivera@educonnect.edu',
    role: 'student',
    department: 'Bio-Engineering',
    faculty: 'Engineering',
    bio: 'PhD Candidate in Bio-Engineering. Focusing on neural plasticity and brain-machine interfaces. Always open to collaborating on cross-disciplinary research.',
    profile_picture: '',
    cover_photo: '',
    skills: ['Bio-Engineering', 'Neural Plasticity', 'Python'],
    interests: ['Machine Learning', 'Cognitive Science'],
    followers_count: 512,
    following_count: 184,
    posts_count: 32,
    resources_count: 8,
    achievements: [{ title: 'PhD Candidate' }],
    created_at: new Date().toISOString(),
  }
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  switchUser: (username: 'juliandrax' | 'alexrivera') => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      isAuthenticated: () => !!get().accessToken,
      switchUser: (username) => {
        const selectedUser = mockUsers[username];
        if (selectedUser) {
          set({ user: selectedUser });
        }
      }
    }),
    { name: 'educonnect-auth-v2' }
  )
);
