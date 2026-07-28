import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshBusiness = useCallback(async () => {
    if (!getToken()) {
      setBusiness(null);
      setLoading(false);
      return;
    }
    try {
      const { business } = await api.getBusiness();
      setBusiness(business);
    } catch {
      setToken(null);
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBusiness();
  }, [refreshBusiness]);

  const login = async (email, password) => {
    const { token, business } = await api.login({ email, password });
    setToken(token);
    setBusiness(business);
  };

  const register = async (email, password, businessName) => {
    const { token, business } = await api.register({ email, password, businessName });
    setToken(token);
    setBusiness(business);
  };

  const logout = () => {
    setToken(null);
    setBusiness(null);
  };

  return (
    <AuthContext.Provider value={{ business, setBusiness, loading, login, register, logout, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
