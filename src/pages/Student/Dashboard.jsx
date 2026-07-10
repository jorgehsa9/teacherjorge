import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Play, Download, Book, Award, Calendar } from 'lucide-react';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
          
        if (sData) {
          // Ensure completed_lessons is an array
          if (!sData.completed_lessons) {
            sData.completed_lessons = [];
          }
          setStudentData(sData);
        }

        // 2. Fetch Next Class
        const { data: cData } = await supabase
          .from('Classes')
          .select('*')
          .ilike('student_email', user.email)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(1)
          .single();
          
        if (cData) setNextClass(cData);

        // 3. Fetch Materials
        const { data: mData } = await supabase
          .from('Materials')
          .select('*')
          .ilike('student_email', user.email)
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

  const handleToggleLesson = async (lessonNumber) => {
    if (!studentData) return;
    
    const currentLessons = studentData.completed_lessons || [];
    let newLessons;
    
    if (currentLessons.includes(lessonNumber)) {
      newLessons = currentLessons.filter(l => l !== lessonNumber);
    } else {
      newLessons = [...currentLessons, lessonNumber];
    }
    
    // Calculate new progress (out of 12)
    const newProgress = Math.round((newLessons.length / 12) * 100);
    
    // Optimistic update
    setStudentData({
      ...studentData,
      completed_lessons: newLessons,
      module_progress: newProgress
    });
    
    // DB Update
    try {
      const { error } = await supabase
        .from('Students')
        .update({ 
          completed_lessons: newLessons,
          module_progress: newProgress
        })
        .eq('email', user.email);
        
      if (error) throw error;
    } catch (err) {
      console.error("Error updating checklist", err);
      alert("Erro ao salvar progresso.");
    }
  };

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
      alert("Nenhum link do Google Meet foi atribuído a você ainda. Por favor, contate seu professor.");
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
        <p className="text-muted text-lg">Carregando seu painel...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      
      {/* Welcome Hero */}
      <div className="hero-section card glass mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="mb-2 text-primary">Olá, {user?.name?.split(' ')[0] || 'Aluno'}!</h1>
            <p className="text-lg text-muted">Pronto para melhorar seu inglês hoje?</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted mb-1">Próxima Aula</p>
            {nextClass ? (
              <p className="font-semibold text-lg flex items-center gap-2">
                <Calendar size={18} className="text-primary"/> {formatClassDate(nextClass.scheduled_at)}
              </p>
            ) : (
              <p className="font-semibold text-muted text-md">Nenhuma aula agendada</p>
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
              <span>{active ? 'Professor Online' : (nextClass ? 'Agendada' : 'Offline')}</span>
            </div>
            
            <h2 className="mb-2">{active ? 'Sua aula está pronta!' : (nextClass ? 'Próxima Sessão' : 'Nenhuma aula agendada')}</h2>
            <p className="mb-6 text-muted">
              {active 
                ? 'Entre na sessão do Google Meet para iniciar sua aula.' 
                : (nextClass ? `Sua próxima aula está agendada para ${formatClassDate(nextClass.scheduled_at)}.` : 'Aproveite seu tempo livre e não esqueça de estudar!')}
            </p>
            
            <button 
              className={`btn btn-lg ${active ? 'btn-primary pulse-btn' : 'btn-outline'}`} 
              disabled={!active && !studentData?.meet_link}
              onClick={handleJoinClass}
            >
              <Play size={20} fill="currentColor" />
              {active ? 'Entrar na Aula Ao Vivo' : 'Sala de Reunião'}
            </button>
          </div>

          {/* Gamification Progress Tracker */}
          <div className="card glass mb-6">
            <h2 className="mb-4 flex items-center gap-2"><Award className="text-primary"/> Jornada do Aluno</h2>
            
            <div className="progress-elegant-container">
              <div className="flex justify-between text-sm mb-2 font-semibold">
                <span className="text-muted">{studentData?.current_module || 'Módulo de Boas-vindas'}</span>
                <span className="text-primary">{studentData?.module_progress || 0}% Concluído</span>
              </div>
              <div className="progress-elegant-track">
                <div className="progress-elegant-fill" style={{ width: `${studentData?.module_progress || 0}%` }}></div>
              </div>
            </div>

            <div className="grid-cols-3 mt-6 gap-4">
              <div className="level-badge-elegant">
                <div className="badge-icon-elegant">
                  <Play size={24} className="text-primary" />
                </div>
                <div className="badge-value-elegant">{studentData?.hours_studied || 0}</div>
                <div className="text-xs text-muted uppercase font-medium">Horas Estudadas</div>
              </div>
              
              <div className="level-badge-elegant">
                <div className="badge-icon-elegant" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <Award size={24} className="text-success" />
                </div>
                <div className="badge-value-elegant" style={{ color: 'var(--success)' }}>
                  {studentData?.level?.split(' ')[0] || 'A1'}
                </div>
                <div className="text-xs text-muted uppercase font-medium">Nível Atual</div>
              </div>
              
              <div className="level-badge-elegant">
                <div className="badge-icon-elegant" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                  <Book size={24} className="text-warning" />
                </div>
                <div className="badge-value-elegant" style={{ color: 'var(--warning)' }}>
                  {studentData?.badges_earned || 0}
                </div>
                <div className="text-xs text-muted uppercase font-medium">Medalhas</div>
              </div>
            </div>

            {/* Lessons Checklist */}
            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-md font-semibold mb-4 text-main">Checklist de Lições</h3>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {[
                  "Simple Present", "Present Continuous", "Simple Past", "Past Continuous",
                  "Present Perfect Simple", "Present Perfect Continuous", "Past Perfect Simple",
                  "Past Perfect Continuous", "Simple Future", "Future Continuous",
                  "Future Perfect Simple", "Future Perfect Continuous"
                ].map((lessonTitle, index) => {
                  const lessonNumber = index + 1;
                  const isChecked = studentData?.completed_lessons?.includes(lessonNumber) || false;
                  
                  return (
                    <label 
                      key={lessonNumber} 
                      className="flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors"
                      style={{ 
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--primary)' : 'var(--border)', 
                        backgroundColor: isChecked ? 'rgba(79, 70, 229, 0.1)' : 'var(--bg-color)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        className="mt-1"
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                        checked={isChecked}
                        onChange={() => handleToggleLesson(lessonNumber)}
                      />
                      <div className="flex-1">
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isChecked ? 'var(--primary)' : 'var(--text-main)' }}>Lição {lessonNumber}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lessonTitle}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Side Column - Materials */}
        <div className="side-col">
          <div className="card glass h-full">
            <h3 className="mb-4 flex items-center gap-2"><Book className="text-primary" /> Meus Materiais</h3>
            
            <div className="materials-grid">
              {materials.length > 0 ? materials.map((mat) => (
                <a 
                  key={mat.id} 
                  href={mat.file_url.startsWith('http') ? mat.file_url : `https://${mat.file_url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="student-material-item cursor-pointer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="material-icon">
                    <Book size={20} className="text-primary" />
                  </div>
                  <div className="material-info flex-1">
                    <div className="font-semibold text-sm truncate">{mat.title}</div>
                    <div className="text-xs text-muted">{mat.file_type} • {formatShortDate(mat.created_at)}</div>
                  </div>
                </a>
              )) : (
                <div className="text-center text-muted p-4 text-sm">
                  Nenhum material disponível ainda.
                </div>
              )}
            </div>
            {materials.length > 0 && (
              <button className="btn btn-outline w-full mt-4 text-sm" onClick={() => navigate('/dashboard/student/materials')}>Ver Todos os Materiais</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
