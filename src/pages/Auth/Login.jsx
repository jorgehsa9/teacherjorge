import React, { useState, useEffect } from 'react';
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
  
  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

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

        <div className="text-center my-4 text-muted text-sm">
          OU
        </div>
        
        <button 
          type="button" 
          className="btn w-full flex items-center justify-center gap-2" 
          style={{backgroundColor: 'white', color: '#333', border: '1px solid #ddd'}}
          onClick={async () => {
            try {
              setIsLoading(true);
              await loginWithGoogle();
            } catch(e) {
              setError("Falha ao entrar com Google");
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Entrar com Google
        </button>

      </div>
    </div>
  );
};

export default Login;
