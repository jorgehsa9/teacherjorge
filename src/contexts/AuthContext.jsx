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
    const processSession = async (session) => {
      if (session?.user) {
        let role = 'student';
        let defaultName = session.user.email.split('@')[0];
        
        try {
          const { data: teacher } = await supabase
            .from('Teachers')
            .select('name')
            .ilike('email', session.user.email)
            .maybeSingle();
            
          if (teacher) {
            role = 'teacher';
            defaultName = teacher.name || 'Professor';
          }
        } catch (err) {
          console.error("Erro ao checar permissões:", err);
        }

        const displayName = session.user.user_metadata?.name || defaultName;
        const theme = session.user.user_metadata?.theme;
        const isDarkMode = session.user.user_metadata?.isDarkMode;
        
        setUser({ ...session.user, role, name: displayName, theme, isDarkMode });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await processSession(session);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      processSession(session);
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
    isTeacher: user?.role === 'teacher',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
