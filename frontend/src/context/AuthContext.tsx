import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

interface User {
  id: number;
  username: string;
  role: string;
  status?: string;
  first_name?: string;
  last_name?: string;
  grade?: string;
  gender?: string;
  phone_number?: string;
  birthday?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('edutrack_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setUser(data.data.user);
        } else {
          // Token is invalid/expired
          localStorage.removeItem('edutrack_token');
        }
      } catch (error) {
        console.error('Failed to verify authentication', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('edutrack_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('edutrack_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
