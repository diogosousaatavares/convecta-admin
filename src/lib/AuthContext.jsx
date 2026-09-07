import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '@/lib/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    return authService.subscribe(() => setUser(authService.getCurrentUser()));
  }, []);

  const logout = () => { authService.logout(); };
  const navigateToLogin = () => { window.location.href = '/entrar'; };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoadingAuth: false,
      isLoadingPublicSettings: false,
      authError: null,
      authChecked: true,
      logout,
      navigateToLogin,
      checkUserAuth: async () => {},
      checkAppState: async () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
