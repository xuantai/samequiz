import { PlayerProfile } from '../types/game';
import { saveProfile } from './storageService';

const TOKEN_KEY = 'samequiz_auth_token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const authService = {
  async register(params: {
    username: string;
    password: string;
    avatar?: string;
    country?: string;
  }): Promise<{ success: boolean; user?: PlayerProfile; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Đăng ký thất bại.' };
      }

      if (data.token && data.user) {
        setAuthToken(data.token);
        saveProfile(data.user);
      }

      return { success: true, user: data.user, message: data.message };
    } catch (err: any) {
      return { success: false, error: 'Không thể kết nối máy chủ.' };
    }
  },

  async login(params: {
    username: string;
    password: string;
  }): Promise<{ success: boolean; user?: PlayerProfile; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Đăng nhập thất bại.' };
      }

      if (data.token && data.user) {
        setAuthToken(data.token);
        saveProfile(data.user);
      }

      return { success: true, user: data.user, message: data.message };
    } catch (err: any) {
      return { success: false, error: 'Không thể kết nối máy chủ.' };
    }
  },

  async fetchCurrentUser(): Promise<PlayerProfile | null> {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        clearAuthToken();
        return null;
      }
      const data = await res.json();
      if (data.success && data.user) {
        saveProfile(data.user);
        return data.user;
      }
      return null;
    } catch (err) {
      return null;
    }
  },

  async syncProfile(profile: PlayerProfile): Promise<boolean> {
    const token = getAuthToken();
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ profile })
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  },

  logout() {
    clearAuthToken();
  }
};
