import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rb_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('rb_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      api
        .get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('rb_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async ({ email, password, portal = 'user' }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password, portal });
      localStorage.setItem('rb_token', data.token);
      localStorage.setItem('rb_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', payload);
      localStorage.setItem('rb_token', data.token);
      localStorage.setItem('rb_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', formData);
      localStorage.setItem('rb_token', data.token);
      localStorage.setItem('rb_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const updateUserState = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('rb_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('rb_token');
    localStorage.removeItem('rb_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        login,
        googleLogin,
        register,
        logout,
        updateUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
