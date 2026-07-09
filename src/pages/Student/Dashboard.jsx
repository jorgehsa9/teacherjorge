import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Play, Download, Book, Award, Calendar } from 'lucide-react';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();

  // Mock data for UI state
  const isClassActive = true; 

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
            <p className="font-semibold text-lg flex items-center gap-2">
              <Calendar size={18} className="text-primary"/> Today, 14:00 
            </p>
          </div>
        </div>
      </div>

      <div className="grid-cols-3">
        
        {/* Main Column */}
        <div className="main-col" style={{ gridColumn: 'span 2' }}>
          
          {/* Join Class Action */}
          <div className={`card mb-6 flex flex-col items-center justify-center text-center p-8 ${isClassActive ? 'active-class-card' : 'glass'}`}>
            <div className={`status-indicator ${isClassActive ? 'active' : ''} mb-4`}>
              <div className="pulse-dot"></div>
              <span>{isClassActive ? 'Teacher is Online' : 'Teacher is Offline'}</span>
            </div>
            
            <h2 className="mb-2">Your class is ready!</h2>
            <p className="mb-6 text-muted">Join the Google Meet session to start your lesson.</p>
            
            <button className={`btn btn-lg ${isClassActive ? 'btn-primary pulse-btn' : 'btn-outline'}`} disabled={!isClassActive}>
              <Play size={20} fill="currentColor" />
              {isClassActive ? 'Enter Live Class' : 'Waiting for Teacher...'}
            </button>
          </div>

          {/* Progress Tracker */}
          <div className="card glass mb-6">
            <h2 className="mb-4 flex items-center gap-2"><Award className="text-primary"/> My Progress</h2>
            
            <div className="progress-section mb-4">
              <div className="flex justify-between text-sm mb-2 font-semibold">
                <span>Module 3: Business Phrasal Verbs</span>
                <span className="text-primary">75%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{width: '75%'}}></div>
              </div>
            </div>

            <div className="grid-cols-3 mt-6">
              <div className="text-center p-4 border rounded-md bg-bg-color">
                <div className="text-2xl font-bold text-primary mb-1">24</div>
                <div className="text-xs text-muted uppercase">Hours Studied</div>
              </div>
              <div className="text-center p-4 border rounded-md bg-bg-color">
                <div className="text-2xl font-bold text-success mb-1">B2</div>
                <div className="text-xs text-muted uppercase">Current Level</div>
              </div>
              <div className="text-center p-4 border rounded-md bg-bg-color">
                <div className="text-2xl font-bold text-warning mb-1">8</div>
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
              {[
                { name: 'Phrasal Verbs List', type: 'PDF', date: 'Today' },
                { name: 'Audio Listening Ex.', type: 'MP3', date: 'Yesterday' },
                { name: 'Module 2 Notes', type: 'DOC', date: 'Last Week' },
              ].map((mat, i) => (
                <div key={i} className="student-material-item">
                  <div className="material-icon">
                    <Book size={20} className="text-primary" />
                  </div>
                  <div className="material-info flex-1">
                    <div className="font-semibold text-sm truncate">{mat.name}</div>
                    <div className="text-xs text-muted">{mat.type} • {mat.date}</div>
                  </div>
                  <button className="btn-icon">
                    <Download size={18} className="text-muted hover:text-primary" />
                  </button>
                </div>
              ))}
            </div>
            <button className="btn btn-outline w-full mt-4 text-sm">View All Materials</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
