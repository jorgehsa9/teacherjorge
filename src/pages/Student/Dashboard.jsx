import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Play, Download, Book, Award, Calendar } from 'lucide-react';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  
  const [studentData, setStudentData] = useState(null);
  const [nextClass, setNextClass] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.email) return;

      try {
        // 1. Fetch Student Progress & Meet Link
        const { data: sData } = await supabase
          .from('Students')
          .select('*')
          .eq('email', user.email)
          .single();
          
        if (sData) setStudentData(sData);

        // 2. Fetch Next Class
        const { data: cData } = await supabase
          .from('Classes')
          .select('*')
          .eq('student_email', user.email)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(1)
          .single();
          
        if (cData) setNextClass(cData);

        // 3. Fetch Materials
        const { data: mData } = await supabase
          .from('Materials')
          .select('*')
          .eq('student_email', user.email)
          .order('created_at', { ascending: false });
          
        if (mData) setMaterials(mData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Calculate if class is active (within 10 mins before, or during the 60 min duration)
  const isClassActive = () => {
    if (!nextClass) return false;
    const now = new Date();
    const classTime = new Date(nextClass.scheduled_at);
    const timeDiffMinutes = (classTime - now) / (1000 * 60);
    // Active if now is 10 mins before class, or up to 60 mins after class starts
    return timeDiffMinutes <= 10 && timeDiffMinutes >= -60;
  };

  const active = isClassActive();

  const handleJoinClass = () => {
    if (studentData?.meet_link) {
      window.open(studentData.meet_link, '_blank');
    } else {
      alert("No Google Meet link has been assigned to you yet. Please contact your teacher.");
    }
  };

  // Formatting date
  const formatClassDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatShortDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper flex justify-center items-center h-full">
        <p className="text-muted text-lg">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      
      {/* Welcome Hero */}
      <div className="hero-section card glass mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="mb-2 text-primary">Hello, {user?.name?.split(' ')[0] || 'Student'}! 🌟</h1>
            <p className="text-lg text-muted">Ready to improve your English today?</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted mb-1">Next Class</p>
            {nextClass ? (
              <p className="font-semibold text-lg flex items-center gap-2">
                <Calendar size={18} className="text-primary"/> {formatClassDate(nextClass.scheduled_at)}
              </p>
            ) : (
              <p className="font-semibold text-muted text-md">No upcoming classes</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid-cols-3">
        
        {/* Main Column */}
        <div className="main-col" style={{ gridColumn: 'span 2' }}>
          
          {/* Join Class Action */}
          <div className={`card mb-6 flex flex-col items-center justify-center text-center p-8 ${active ? 'active-class-card' : 'glass'}`}>
            <div className={`status-indicator ${active ? 'active' : ''} mb-4`}>
              <div className="pulse-dot"></div>
              <span>{active ? 'Teacher is Online' : (nextClass ? 'Scheduled' : 'Offline')}</span>
            </div>
            
            <h2 className="mb-2">{active ? 'Your class is ready!' : (nextClass ? 'Upcoming Session' : 'No classes scheduled')}</h2>
            <p className="mb-6 text-muted">
              {active 
                ? 'Join the Google Meet session to start your lesson.' 
                : (nextClass ? `Your next class is scheduled for ${formatClassDate(nextClass.scheduled_at)}.` : 'Enjoy your free time and don\'t forget to study!')}
            </p>
            
            <button 
              className={`btn btn-lg ${active ? 'btn-primary pulse-btn' : 'btn-outline'}`} 
              disabled={!active && !studentData?.meet_link}
              onClick={handleJoinClass}
            >
              <Play size={20} fill="currentColor" />
              {active ? 'Enter Live Class' : 'Enter Meeting Room'}
            </button>
          </div>

          {/* Progress Tracker */}
          <div className="card glass mb-6">
            <h2 className="mb-4 flex items-center gap-2"><Award className="text-primary"/> My Progress</h2>
            
            <div className="progress-section mb-4">
              <div className="flex justify-between text-sm mb-2 font-semibold">
                <span>{studentData?.current_module || 'Welcome Module'}</span>
                <span className="text-primary">{studentData?.module_progress || 0}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{width: `${studentData?.module_progress || 0}%`}}></div>
              </div>
            </div>

            <div className="grid-cols-3 mt-6">
              <div className="text-center p-4 border rounded-md bg-bg-color">
                <div className="text-2xl font-bold text-primary mb-1">{studentData?.hours_studied || 0}</div>
                <div className="text-xs text-muted uppercase">Hours Studied</div>
              </div>
              <div className="text-center p-4 border rounded-md bg-bg-color">
                <div className="text-2xl font-bold text-success mb-1">{studentData?.level || 'Beginner'}</div>
                <div className="text-xs text-muted uppercase">Current Level</div>
              </div>
              <div className="text-center p-4 border rounded-md bg-bg-color">
                <div className="text-2xl font-bold text-warning mb-1">{studentData?.badges_earned || 0}</div>
                <div className="text-xs text-muted uppercase">Badges Earned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Column - Materials */}
        <div className="side-col">
          <div className="card glass h-full">
            <h3 className="mb-4 flex items-center gap-2"><Book className="text-primary" /> My Materials</h3>
            
            <div className="materials-grid">
              {materials.length > 0 ? materials.map((mat) => (
                <div key={mat.id} className="student-material-item">
                  <div className="material-icon">
                    <Book size={20} className="text-primary" />
                  </div>
                  <div className="material-info flex-1">
                    <div className="font-semibold text-sm truncate">{mat.title}</div>
                    <div className="text-xs text-muted">{mat.file_type} • {formatShortDate(mat.created_at)}</div>
                  </div>
                  <button className="btn-icon" onClick={() => window.open(mat.file_url, '_blank')} title="Download / Open">
                    <Download size={18} className="text-muted hover:text-primary" />
                  </button>
                </div>
              )) : (
                <div className="text-center text-muted p-4 text-sm">
                  No materials available yet.
                </div>
              )}
            </div>
            {materials.length > 0 && (
              <button className="btn btn-outline w-full mt-4 text-sm">View All Materials</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
