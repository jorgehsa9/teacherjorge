import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/Layout/DashboardLayout';
import Login from './pages/Auth/Login';
import TeacherDashboard from './pages/Teacher/Dashboard';
import StudentDashboard from './pages/Student/Dashboard';
import StudentMaterials from './pages/Student/Materials';
import StudentsList from './pages/Teacher/StudentsList';
import TeachersList from './pages/Teacher/TeachersList';
import Materials from './pages/Teacher/Materials';
import Financial from './pages/Financial/Financial';
import Calendar from './pages/Calendar/Calendar';
import Profile from './pages/Profile/Profile';
import Landing from './pages/Landing/Landing';
import Apply from './pages/Landing/Apply';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  return children;
};

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/dashboard/${user.role}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            } />
            <Route 
              path="profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="teacher" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="student" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="student/materials" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentMaterials />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="students" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <StudentsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="equipe" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeachersList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="materials" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <Materials />
                </ProtectedRoute>
              } 
            />
            <Route path="financial" element={<ProtectedRoute><Financial /></ProtectedRoute>} />
            <Route path="calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          </Route>

          <Route path="/" element={<Landing />} />
          <Route path="/apply" element={<Apply />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
