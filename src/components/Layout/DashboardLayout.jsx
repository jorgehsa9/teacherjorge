import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Calendar, DollarSign, LogOut, LayoutDashboard, Users, Moon, Sun, Folder, Menu, X } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
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
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [activeTheme, setActiveTheme] = useState(() => {
    const saved = localStorage.getItem('activeTheme');
    return saved ? JSON.parse(saved) : themes[0];
  });
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: `/dashboard/${user?.role}`, icon: LayoutDashboard },
    ...(user?.role === 'teacher' ? [{ name: 'Alunos', path: '/dashboard/students', icon: Users }] : []),
    ...(user?.role === 'teacher' ? [{ name: 'Materiais', path: '/dashboard/materials', icon: Folder }] : []),
    ...(user?.role === 'student' ? [{ name: 'Materiais', path: '/dashboard/student/materials', icon: Folder }] : []),
    { name: 'Calendário', path: '/dashboard/calendar', icon: Calendar },
    { name: 'Financeiro', path: '/dashboard/financial', icon: DollarSign },
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
          <div className="avatar bg-primary text-white flex items-center justify-center rounded-full" style={{ width: '32px', height: '32px', flexShrink: 0, fontWeight: 'bold' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role badge primary" style={{ marginLeft: '0.5rem' }}>{user?.role}</span>
          </div>
        </NavLink>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={item.name} 
                to={item.path} 
                className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}
                end={item.path === `/dashboard/${user?.role}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
          
          <button className="nav-item mobile-only" onClick={() => setShowMobileMenu(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <Menu size={20} />
            <span>Menu</span>
          </button>
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

      {/* Mobile Overlay Menu */}
      {showMobileMenu && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', flexDirection: 'column', padding: '1rem', justifyContent: 'flex-end' }}>
          <div className="card glass animate-fade-in-up" style={{ width: '100%', borderRadius: '24px', padding: '1.5rem', marginBottom: '70px' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Opções</h2>
              <button onClick={() => setShowMobileMenu(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            <NavLink to="/dashboard/profile" className="user-profile mb-6" onClick={() => setShowMobileMenu(false)} style={{ display: 'flex' }}>
              <div className="avatar bg-primary text-white flex items-center justify-center rounded-full" style={{ width: '40px', height: '40px', fontWeight: 'bold' }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="user-info ml-3 flex flex-col justify-center" style={{ opacity: 1, whiteSpace: 'normal' }}>
                <span className="user-name" style={{ fontSize: '1rem' }}>{user?.name}</span>
                <span className="text-muted text-xs uppercase tracking-wider">{user?.role}</span>
              </div>
            </NavLink>

            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Aparência</h3>
            <div className="flex gap-2 mb-6 justify-between px-2">
              {themes.map(t => (
                <button 
                  key={t.name}
                  onClick={() => setActiveTheme(t)}
                  className={`theme-dot ${activeTheme.name === t.name ? 'active' : ''}`}
                  style={{ backgroundColor: t.hex, width: '28px', height: '28px', opacity: 1, pointerEvents: 'auto' }}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="btn w-full flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                {isDarkMode ? 'Mudar para Claro' : 'Mudar para Escuro'}
              </button>
              
              <button onClick={handleLogout} className="btn w-full flex items-center justify-center gap-2 mt-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }}>
                <LogOut size={20} /> Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
