import { createContext, useState, useCallback, useRef } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Read user from localStorage on first mount only
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Use a ref to prevent duplicate logout calls
  const loggingOut = useRef(false);

  // Wrapped setUser that also syncs localStorage
  const login = useCallback((userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    if (loggingOut.current) return;
    loggingOut.current = true;
    try {
      await api.post('/auth/logout');
    } catch {
      // Always clear local state even if server call fails
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      loggingOut.current = false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser: login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
