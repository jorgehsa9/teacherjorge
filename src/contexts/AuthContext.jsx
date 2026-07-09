import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const determineRoleAndSetUser = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    // Verifica se o email pertence a um aluno cadastrado
    const { data: student } = await supabase
      .from('Students')
      .select('email, name')
      .eq('email', authUser.email)
      .maybeSingle();

    if (student) {
      // É um aluno! Usa o nome real do banco de dados
      setUser({ ...authUser, role: 'student', name: student.name });
    } else {
      // Se não está na tabela Students, consideramos o Teacher
      setUser({ ...authUser, role: 'teacher', name: 'Teacher' });
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await determineRoleAndSetUser(session?.user);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      determineRoleAndSetUser(session?.user);
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
