import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Play, Download, Book, Award, Calendar, MessageSquare, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [studentData, setStudentData] = useState(null);
  const [nextClass, setNextClass] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [requestingTeacher, setRequestingTeacher] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.email) return;

      try {
        // 1. Fetch Student Progress & Meet Link
        const { data: sData, error: sError } = await supabase
          .from('Students')
          .select('*')
          .ilike('email', user.email)
          .single();
          
        if (sData) {
          // Ensure completed_lessons is an array
          if (!sData.completed_lessons) {
            sData.completed_lessons = [];
          }
          setStudentData(sData);

          if (sData.status === 'Pending' || !sData.teacher_email) {
            const { data: tData } = await supabase.from('Teachers').select('email, name').eq('status', 'Active');
            if (tData) setTeachers(tData);
          }
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
        .ilike('email', user.email);
        
      if (error) throw error;
      
      // Gamification: Trigger confetti when reaching 100% or completing milestones (every 4 lessons)
      if (newLessons.length > currentLessons.length) {
        if (newProgress === 100) {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        } else if (newLessons.length % 4 === 0) {
          confetti({ particleCount: 80, spread: 50, origin: { y: 0.7 } });
        }
      }
      
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

  if (studentData && (studentData.status === 'Pending' || !studentData.teacher_email)) {
    return (
      <div className="dashboard-wrapper flex justify-center items-center h-full animate-fade-in-up">
        <div className="card glass text-center" style={{maxWidth: '500px', width: '100%', padding: '2rem'}}>
          <h2 className="mb-2">Bem-vindo(a), {user?.name?.split(' ')[0] || 'Aluno'}!</h2>
          <p className="text-muted mb-6">Para iniciar sua jornada, você precisa escolher um professor.</p>
          
          {studentData.teacher_email ? (
            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)' }}>
              <Clock size={32} className="mx-auto text-warning mb-2" />
              <h3 className="text-warning mb-1">Solicitação Pendente</h3>
              <p className="text-sm">Você solicitou ingressar nas turmas deste professor. Aguarde a aprovação.</p>
            </div>
          ) : (
            <div className="text-left">
              <label className="block mb-2 font-medium">Selecione um Professor Disponível</label>
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto mb-4 p-2">
                {teachers.map(t => (
                  <button 
                    key={t.email}
                    onClick={async () => {
                      if (!window.confirm(`Deseja solicitar aulas com ${t.name}?`)) return;
                      setRequestingTeacher(true);
                      await supabase.from('Students').update({ teacher_email: t.email }).eq('email', user.email);
                      window.location.reload();
                    }}
                    disabled={requestingTeacher}
                    className="btn btn-outline text-left justify-start hover:bg-primary hover:text-white transition-colors"
                  >
                    <div className="avatar bg-primary-light text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      {t.name.charAt(0)}
                    </div>
                    {t.name}
                  </button>
                ))}
                {teachers.length === 0 && <p className="text-muted text-sm">Nenhum professor disponível no momento.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const getBadgeInfo = () => {
    const lessons = studentData?.completed_lessons?.length || 0;
    if (lessons >= 12) return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', label: 'Mestre (Ouro)' };
    if (lessons >= 6) return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', label: 'Avançado (Prata)' };
    if (lessons >= 1) return { color: '#b45309', bg: 'rgba(180, 83, 9, 0.1)', label: 'Iniciante (Bronze)' };
    return { color: 'var(--text-muted)', bg: 'rgba(0,0,0,0.05)', label: 'Nenhuma' };
  };
  const badgeInfo = getBadgeInfo();

  const standardMaterials = materials.filter(m => m.file_type !== 'Feedback');
  const classFeedbacks = materials.filter(m => m.file_type === 'Feedback');

  return (
    <div className="dashboard-wrapper">
      
      {/* Welcome Hero */}
      <div className="dashboard-welcome-hero card glass mb-6">
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
                <div className="badge-icon-elegant" style={{ backgroundColor: badgeInfo.bg }}>
                  <Award size={24} color={badgeInfo.color} />
                </div>
                <div className="badge-value-elegant" style={{ color: badgeInfo.color, fontSize: '1.25rem' }}>
                  {badgeInfo.label}
                </div>
                <div className="text-xs text-muted uppercase font-medium">Medalha</div>
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
              {standardMaterials.length > 0 ? standardMaterials.slice(0, 3).map((mat) => (
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
            {standardMaterials.length > 0 && (
              <button className="btn btn-outline w-full mt-4 text-sm" onClick={() => navigate('/dashboard/student/materials')}>Ver Todos os Materiais</button>
            )}

            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <h3 className="mb-4 flex items-center gap-2"><MessageSquare className="text-primary" /> Histórico de Aulas</h3>
              <div className="flex flex-col gap-3">
                {classFeedbacks.length > 0 ? classFeedbacks.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid var(--border)' }}>
                    <div className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{log.title}</div>
                    <div className="text-xs text-muted mt-1 whitespace-pre-line">{log.file_url}</div>
                    <div className="text-xs text-muted mt-2 opacity-60 text-right">{formatShortDate(log.created_at)}</div>
                  </div>
                )) : (
                  <div className="text-center text-muted p-4 text-sm">
                    Nenhum diário de aula registrado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
