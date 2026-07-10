import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const role = session.user.email === 'teacher@email.com' ? 'teacher' : 'student';
        const displayName = session.user.user_metadata?.name || (session.user.email === 'teacher@email.com' ? 'Jorge' : session.user.email.split('@')[0]);
        const theme = session.user.user_metadata?.theme;
        const isDarkMode = session.user.user_metadata?.isDarkMode;
        setUser({ ...session.user, role, name: displayName, theme, isDarkMode });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role = session.user.email === 'teacher@email.com' ? 'teacher' : 'student';
        const displayName = session.user.user_metadata?.name || (session.user.email === 'teacher@email.com' ? 'Jorge' : session.user.email.split('@')[0]);
        const theme = session.user.user_metadata?.theme;
        const isDarkMode = session.user.user_metadata?.isDarkMode;
        setUser({ ...session.user, role, name: displayName, theme, isDarkMode });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
