import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Calendar, DollarSign, LogOut, LayoutDashboard, Users, Moon, Sun, Folder } from 'lucide-react';
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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTheme, setActiveTheme] = useState(themes[0]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', activeTheme.hex);
    document.documentElement.style.setProperty('--primary-glow', activeTheme.glow);
  }, [activeTheme]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: `/dashboard/${user?.role}`, icon: LayoutDashboard },
    ...(user?.role === 'teacher' ? [{ name: 'Students', path: '/dashboard/students', icon: Users }] : []),
    ...(user?.role === 'teacher' ? [{ name: 'Materials', path: '/dashboard/materials', icon: Folder }] : []),
    ...(user?.role === 'student' ? [{ name: 'Materials', path: '/dashboard/student/materials', icon: Folder }] : []),
    { name: 'Calendar', path: '/dashboard/calendar', icon: Calendar },
    { name: 'Financial', path: '/dashboard/financial', icon: DollarSign },
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

        <div className="user-profile">
          <div className="avatar bg-primary text-white flex items-center justify-center rounded-full" style={{ width: '32px', height: '32px', flexShrink: 0, fontWeight: 'bold' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role badge primary" style={{ marginLeft: '0.5rem' }}>{user?.role}</span>
          </div>
        </div>

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
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={handleLogout} className="nav-item w-full text-left logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
