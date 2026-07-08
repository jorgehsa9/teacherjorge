import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import LoginScreen from './components/LoginScreen';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { UserRole } from './types';

export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Restore active session on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('sms_session_role') as UserRole | null;
    const savedStudentId = localStorage.getItem('sms_session_student_id');
    const savedEmail = localStorage.getItem('sms_session_email') || '';

    if (savedRole && savedEmail) {
      setRole(savedRole);
      setStudentId(savedStudentId);
      setUserEmail(savedEmail);
    }

    // Monitor Supabase Auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          const email = session.user.email || '';
          setUserEmail(email);
          localStorage.setItem('sms_session_email', email);

          // Get metadata if possible
          const roleFromMetadata = session.user.user_metadata?.role as UserRole | undefined;
          const nameFromMetadata = session.user.user_metadata?.name || email.split('@')[0];

          if (roleFromMetadata) {
            setRole(roleFromMetadata);
            localStorage.setItem('sms_session_role', roleFromMetadata);
            if (roleFromMetadata === 'student') {
              setStudentId(nameFromMetadata);
              localStorage.setItem('sms_session_student_id', nameFromMetadata);
            }
          }
        } else {
          // If signed out, clear session
          clearSession();
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (
    selectedRole: UserRole,
    associatedStudentId: string | null,
    email: string
  ) => {
    setRole(selectedRole);
    setStudentId(associatedStudentId);
    setUserEmail(email);

    // Save session in localStorage
    localStorage.setItem('sms_session_role', selectedRole);
    localStorage.setItem('sms_session_student_id', associatedStudentId || '');
    localStorage.setItem('sms_session_email', email);
  };

  const clearSession = () => {
    setRole(null);
    setStudentId(null);
    setUserEmail('');
    localStorage.removeItem('sms_session_role');
    localStorage.removeItem('sms_session_student_id');
    localStorage.removeItem('sms_session_email');
  };

  const handleSignOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error('Supabase sign out error:', e);
    }
    clearSession();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 font-semibold">Iniciando Espaço de Trabalho do Teacher Jorge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" id="classroom-app-root">
      {role === 'teacher' ? (
        <TeacherDashboard 
          userEmail={userEmail} 
          onSignOut={handleSignOut} 
        />
      ) : role === 'student' ? (
        <StudentDashboard 
          studentId={studentId || 'student-alice'} 
          userEmail={userEmail} 
          onSignOut={handleSignOut} 
        />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}
