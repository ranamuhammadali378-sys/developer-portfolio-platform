'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { clientAuth } from '@/lib/firebase';
import { API_BASE_URL, apiFetch } from '@/lib/api';

interface AdminAuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  adminFetch: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          await apiFetch('/auth/verify', {
            method: 'POST',
            headers: { Authorization: `Bearer ${idToken}` },
          });
          setUser(firebaseUser);
          setToken(idToken);
        } catch {
          await signOut(clientAuth);
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(clientAuth, email, password);
    const idToken = await cred.user.getIdToken(true);
    await apiFetch('/auth/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    setUser(cred.user);
    setToken(idToken);
  };

  const logout = async () => {
    await signOut(clientAuth);
    setUser(null);
    setToken(null);
  };

  const adminFetch = async <T,>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const freshToken = clientAuth.currentUser
      ? await clientAuth.currentUser.getIdToken()
      : token;

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${freshToken || ''}`,
        ...(options.headers || {}),
      },
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || `Admin request failed (${res.status})`);
    }
    return json.data as T;
  };

  return (
    <AdminAuthContext.Provider
      value={{ user, token, loading, login, logout, adminFetch }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  }
  return ctx;
}