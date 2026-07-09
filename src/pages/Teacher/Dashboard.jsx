import React, { useState, useEffect } from 'react';
import { Users, Video, Clock, DollarSign, UploadCloud, Play, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      // Assumes your table is named 'Students'
      const { data, error } = await supabase.from('Students').select('*');
      if (data) setStudents(data);
      else console.error('Error fetching students:', error);
    };
    fetchStudents();
  }, []);

  return (
    <div className="dashboard-wrapper animate-fade-in-up">
      <div className="dashboard-header mb-8 flex justify-between items-end">
        <div>
          <h1 style={{fontSize: '3.5rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.25rem', lineHeight: 1.1}}>
            Good Morning,
            <br/>
            <span style={{
              background: 'linear-gradient(to right, var(--primary), #4F46E5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 15px var(--primary-glow))',
              fontWeight: 800
            }}>Jorge</span>
          </h1>
          <p className="text-muted mt-4">Focus • Plan • Execute • Succeed</p>
        </div>
        <div className="text-right">
          <div style={{fontSize: '4rem', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.03em'}}>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).split(' ')[0]} <span style={{fontSize: '1.25rem', fontWeight: 600}}>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).split(' ')[1]}</span>
          </div>
          <div className="text-muted mt-2">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-cols-4 mb-6">
        <div className="stat-card card glass animate-fade-in-up delay-100">
          <div className="stat-icon bg-primary-light">
            <Users size={24} className="text-primary" />
          </div>
          <div className="stat-info">
            <span className="stat-value">24</span>
            <span className="stat-label">Active Students</span>
          </div>
        </div>
        <div className="card stat-card glass">
          <div className="stat-icon bg-success-light">
            <Video size={24} className="text-success" />
          </div>
          <div className="stat-info">
            <span className="stat-value">12</span>
            <span className="stat-label">Classes This Month</span>
          </div>
        </div>
        <div className="card stat-card glass">
          <div className="stat-icon bg-warning-light">
            <DollarSign size={24} className="text-warning" />
          </div>
          <div className="stat-info">
            <span className="stat-value">4</span>
            <span className="stat-label">Pending Payments</span>
          </div>
        </div>
        <div className="card stat-card glass">
          <div className="stat-icon bg-danger-light">
            <Clock size={24} className="text-danger" />
          </div>
          <div className="stat-info">
            <span className="stat-value">45m</span>
            <span className="stat-label">Next Class Starts</span>
          </div>
        </div>
      </div>

      <div className="grid-cols-3">
        {/* Main Column - Roster & Materials */}
        <div className="main-col" style={{ gridColumn: 'span 2' }}>
          
          {/* Class Control Center */}
          <div className="card mb-6 control-center glass border-primary">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2>Live Class Control</h2>
                <p>Manage your active Google Meet session</p>
              </div>
              <button className="btn btn-primary start-class-btn">
                <Play size={18} fill="currentColor" />
                Start Class Now
              </button>
            </div>
            <div className="input-group">
              <label>Google Meet Link</label>
              <div className="flex gap-2">
                <input type="text" className="input w-full" defaultValue="https://meet.google.com/abc-defg-hij" />
                <button className="btn btn-outline">Update</button>
              </div>
            </div>
          </div>

          {/* Student Roster */}
          <div className="card glass mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2>Student Roster</h2>
              <button className="btn btn-outline btn-sm">View All</button>
            </div>
            <div className="roster-list">
              {students.length > 0 ? students.map((student, i) => (
                <div key={i} className="roster-item" style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                  <div className="flex items-center">
                    <div>
                      <div className="font-semibold" style={{fontSize: '1.05rem'}}>{student.name}</div>
                      <div className="text-sm text-muted mt-2">
                        <span style={{color: 'var(--primary)'}}>{student.level}</span> • {student.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted">{student.email}</div>
                  <button className="btn btn-outline">Profile</button>
                </div>
              )) : (
                <p className="text-muted text-sm p-4 text-center">No students found. Check your Supabase 'students' table.</p>
              )}
            </div>
          </div>
        </div>

        {/* Side Column - Materials */}
        <div className="side-col">
          <div className="card glass upload-card">
            <h3 className="mb-2">Material Manager</h3>
            <p className="mb-4 text-sm text-muted">Upload PDFs, homework, or links.</p>
            
            <div className="upload-dropzone mb-4">
              <UploadCloud size={32} className="text-muted mb-2" />
              <span className="text-sm text-muted">Drag & drop files or click to browse</span>
            </div>

            <div className="input-group">
              <label>Assign to Student</label>
              <select className="input">
                <option>All Students</option>
                <option>Lucas Silva</option>
                <option>Maria Santos</option>
              </select>
            </div>
            <button className="btn btn-primary w-full justify-center">Upload Material</button>

            <div className="recent-materials mt-6">
              <h4 className="text-sm font-semibold mb-3 text-muted uppercase">Recent Uploads</h4>
              <div className="material-item">
                <FileText size={16} className="text-primary" />
                <span className="text-sm flex-1 truncate">Phrasal Verbs List.pdf</span>
                <CheckCircle size={14} className="text-success" />
              </div>
              <div className="material-item">
                <FileText size={16} className="text-primary" />
                <span className="text-sm flex-1 truncate">Module 3 Homework.pdf</span>
                <CheckCircle size={14} className="text-success" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
