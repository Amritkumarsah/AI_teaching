import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: 'STUDENT' | 'ADMIN';
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  profile: any | null;
  setProfile: (profile: any) => void;
  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; verificationToken?: string }>;
  loginWithGoogle: (payload: { credential?: string; email?: string; name?: string; googleId?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const TOKEN_KEY = 'ai_teacher_token';
const USER_KEY = 'ai_teacher_user';

// Safely load initial persisted token
const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
const storedUserJson = typeof window !== 'undefined' ? localStorage.getItem(USER_KEY) : null;
let initialUser: User | null = null;
if (storedUserJson) {
  try {
    initialUser = JSON.parse(storedUserJson);
  } catch {
    initialUser = null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  token: storedToken,
  // Authenticated ONLY if both valid token and user exist
  isAuthenticated: Boolean(storedToken && initialUser),
  // Only loading if token exists but user needs to be hydrated from backend
  isLoading: Boolean(storedToken && !initialUser),
  error: null,
  profile: null,
  setProfile: (profile: any) => set({ profile }),

  setAuth: (user: User, token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true, isLoading: false, error: null });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    // Notify server of logout in background
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: get().token ? { Authorization: `Bearer ${get().token}` } : {},
    }).catch(() => null);

    set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
  },

  checkAuth: async () => {
    const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (data.success && data.data?.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
        }
        set({ user: data.data.user, isAuthenticated: true, isLoading: false, error: null });
        return true;
      } else {
        // Token invalid or expired
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return false;
      }
    } catch {
      // If network times out or fails, keep cached session if available
      const cachedUser = get().user;
      set({ isLoading: false, isAuthenticated: Boolean(cachedUser) });
      return Boolean(cachedUser);
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        get().setAuth(json.data.user, json.data.token);
        return { success: true };
      } else {
        const errorMsg = json.error?.message || 'Invalid email or password.';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }
    } catch {
      const errorMsg = 'Unable to connect to authentication server. Please check your connection.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  signup: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        get().setAuth(json.data.user, json.data.token);
        return { success: true, verificationToken: json.data.verificationToken };
      } else {
        const errorMsg = json.error?.message || 'Signup failed. Please try again.';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }
    } catch {
      const errorMsg = 'Network error during registration. Please retry.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  loginWithGoogle: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success && json.data) {
        get().setAuth(json.data.user, json.data.token);
        return { success: true };
      } else {
        const errorMsg = json.error?.message || 'Google sign-in failed.';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }
    } catch {
      const errorMsg = 'Network error during Google authentication.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  verifyEmail: async (token) => {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();

      if (json.success) {
        // Refetch fresh user state
        await get().checkAuth();
        return { success: true, message: json.data?.message || 'Email verified successfully.' };
      } else {
        return { success: false, error: json.error?.message || 'Verification token is invalid or has expired.' };
      }
    } catch {
      return { success: false, error: 'Network error verifying email.' };
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) {
        return {
          success: true,
          message: json.data?.message || 'Password reset instructions have been sent.',
        };
      }
      return { success: false, error: json.error?.message || 'Failed to request password reset.' };
    } catch {
      return { success: false, error: 'Network error sending reset instructions.' };
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        return { success: true, message: json.data?.message || 'Password reset successfully.' };
      }
      return { success: false, error: json.error?.message || 'Password reset failed.' };
    } catch {
      return { success: false, error: 'Network error resetting password.' };
    }
  },
}));
