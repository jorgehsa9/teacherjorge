import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BookOpen, Calendar, DollarSign, LogOut, LayoutDashboard, Users, Moon, Sun, Folder, User, Shield, GraduationCap } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import UserAvatar from '../UserAvatar';
import './Layout.css';


const themes = [
  { name: 'Purple', hex: '#A855F7', glow: 'rgba(168, 85, 247, 0.5)' },
  { name: 'Blue', hex: '#3B82F6', glow: 'rgba(59, 130, 246, 0.5)' },
  { name: 'Emerald', hex: '#10B981', glow: 'rgba(16, 185, 129, 0.5)' },
  { name: 'Rose', hex: '#F43F5E', glow: 'rgba(244, 63, 94, 0.5)' },
  { name: 'Amber', hex: '#F59E0B', glow: 'rgba(245, 158, 11, 0.5)' }
];

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (user?.isDarkMode !== undefined) return user.isDarkMode;
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [activeTheme, setActiveTheme] = useState(() => {
    if (user?.theme) {
      const foundTheme = themes.find(t => t.name === user.theme);
      if (foundTheme) return foundTheme;
    }
    const saved = localStorage.getItem('activeTheme');
    return saved ? JSON.parse(saved) : themes[0];
  });

  // Sync preferences with database
  useEffect(() => {
    const syncPreferences = async () => {
      if (!user) return;
      const needsUpdate = user.isDarkMode !== isDarkMode || user.theme !== activeTheme.name;
      if (needsUpdate) {
        // Save to Supabase auth metadata
        await supabase.auth.updateUser({
          data: { 
            isDarkMode, 
            theme: activeTheme.name 
          }
        });
      }
    };
    syncPreferences();
  }, [isDarkMode, activeTheme, user]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', activeTheme.hex);
    document.documentElement.style.setProperty('--primary-glow', activeTheme.glow);
    localStorage.setItem('activeTheme', JSON.stringify(activeTheme));
  }, [activeTheme]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
    }
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Session duration heartbeat
  useEffect(() => {
    if (user?.role !== 'student' || !user?.email) return;

    const heartbeat = async () => {
      try {
        const { data: student } = await supabase
          .from('Students')
          .select('login_history')
          .ilike('email', user.email)
          .single();

        if (student && student.login_history && Array.isArray(student.login_history) && student.login_history.length > 0) {
          const currentHistory = [...student.login_history];
          const latestEntry = currentHistory[0];
          
          if (typeof latestEntry === 'object' && latestEntry.loginAt) {
            latestEntry.lastSeenAt = new Date().toISOString();
            currentHistory[0] = latestEntry;
            
            await supabase
              .from('Students')
              .update({ login_history: currentHistory })
              .ilike('email', user.email);
          }
        }
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    };

    const intervalId = setInterval(heartbeat, 60000); // 1 minute

    return () => clearInterval(intervalId);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: `/dashboard/${user?.role}`, icon: LayoutDashboard },
    ...(user?.role === 'teacher' ? [{ name: 'Alunos', path: '/dashboard/students', icon: Users }] : []),
    ...(user?.is_admin ? [{ name: 'Equipe', path: '/dashboard/equipe', icon: GraduationCap }] : []),
    ...(user?.role === 'teacher' ? [{ name: 'Materiais', path: '/dashboard/materials', icon: Folder }] : []),
    ...(user?.role === 'student' ? [{ name: 'Materiais', path: '/dashboard/student/materials', icon: Folder }] : []),
    { name: 'Calendário', path: '/dashboard/calendar', icon: Calendar },
    { name: 'Financeiro', path: '/dashboard/financial', icon: DollarSign },
    { name: 'Perfil', path: '/dashboard/profile', icon: User, className: 'mobile-only' },
  ];

  return (
    <div className="app-container">
      <AnimatedBackground themeColor={activeTheme} />
      {/* Sidebar */}
      <nav className="sidebar glass animate-fade-in-up delay-100">
        <div className="brand">
          <BookOpen className="brand-icon" size={28} style={{ flexShrink: 0 }} />
          <h2>Teacher Jorge</h2>
        </div>

        <NavLink to="/dashboard/profile" className="user-profile">
          <div className="avatar bg-surface border border-border flex items-center justify-center" style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '50%', overflow: 'hidden' }}>
            <UserAvatar avatarId={user?.avatar} name={user?.name} size={18} />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="user-role badge primary">{user?.role}</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 'bold', opacity: 0.6 }}>v{__APP_VERSION__}</span>
            </div>
          </div>
        </NavLink>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={item.name} 
                to={item.path} 
                className={({isActive}) => `nav-item ${isActive ? 'active' : ''} ${item.className || ''}`}
                end={item.path === `/dashboard/${user?.role}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto w-full">
          <div className="theme-picker">
            {themes.map(t => (
              <button 
                key={t.name}
                onClick={() => setActiveTheme(t)}
                className={`theme-dot ${activeTheme.name === t.name ? 'active' : ''}`}
                style={{ backgroundColor: t.hex }}
                title={t.name}
              />
            ))}
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="nav-item w-full text-left logout-btn mb-2">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
          <button onClick={handleLogout} className="nav-item w-full text-left logout-btn">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet context={{ isDarkMode, setIsDarkMode, activeTheme, setActiveTheme, themes }} />
      </main>
    </div>
  );
};

export default DashboardLayout;
