import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      let loginEmail = email.trim();
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail}@teacherjorge.com`;
      }
      
      await login(loginEmail, password);

      // Record login history
      try {
        const { data: student } = await supabase
          .from('Students')
          .select('login_history')
          .ilike('email', loginEmail)
          .single();
          
        if (student) {
          const currentHistory = Array.isArray(student.login_history) ? student.login_history : [];
          const now = new Date().toISOString();
          const newHistory = [{ loginAt: now, lastSeenAt: now }, ...currentHistory].slice(0, 50); // Keep last 50 logins
          await supabase
            .from('Students')
            .update({ login_history: newHistory })
            .ilike('email', loginEmail);
        }
      } catch (historyErr) {
        console.error("Error updating login history:", historyErr);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Falha ao entrar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card glass">
        <div className="auth-header text-center mb-6">
          <div className="auth-logo justify-center flex items-center gap-2 mb-4">
            <BookOpen className="brand-icon" size={32} />
            <h1 className="brand-name">Teacher Jorge</h1>
          </div>
          <p>Entre na sua conta</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded text-sm text-center" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>ID do Aluno ou E-mail</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Ex: jorge ou you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Senha</label>
            <input 
              type="password" 
              className="input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
            <LogIn size={18} />
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
