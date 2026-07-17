import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Video, Clock, DollarSign, UploadCloud, Play, FileText, CheckCircle, Calendar, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../../components/UserAvatar';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [classesThisMonth, setClassesThisMonth] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [nextClass, setNextClass] = useState(null);
  const [timeToNextClass, setTimeToNextClass] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      // 1. Fetch Students
      let studentsQuery = supabase.from('Students').select('*');
      if (!user?.is_admin) {
        studentsQuery = studentsQuery.eq('teacher_email', user?.email);
      }
      const { data: studentsData } = await studentsQuery;
      if (studentsData) setStudents(studentsData);
      
      const teacherStudentEmails = studentsData ? studentsData.map(s => s.email) : [];

      // 2. Fetch Classes for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      let classesQuery = supabase
        .from('Classes')
        .select('*')
        .gte('scheduled_at', startOfMonth.toISOString())
        .lte('scheduled_at', endOfMonth.toISOString());
        
      if (!user?.is_admin) {
        if (teacherStudentEmails.length > 0) {
          classesQuery = classesQuery.in('student_email', teacherStudentEmails);
        } else {
          // If no students, impossible to have classes
          classesQuery = classesQuery.eq('student_email', 'nobody@nowhere.com');
        }
      }

      const { data: monthClasses } = await classesQuery;
      
      if (monthClasses) {
        const actualClasses = monthClasses.filter(c => !c.type || c.type === 'Aula');
        setClassesThisMonth(actualClasses.length);
        
        // Calculate pending payments (assume all classes are pending for now, until Payments table is added)
        // Only count distinct students
        const distinctStudentsWithClasses = new Set(monthClasses.map(c => c.student_email));
        setPendingPayments(distinctStudentsWithClasses.size);

        // Prepare chart data (classes per day for the current month)
        const daysInMonth = new Date(endOfMonth).getDate();
        const data = Array.from({length: daysInMonth}, (_, i) => ({
           day: String(i + 1).padStart(2, '0'),
           Aulas: 0
        }));
        
        actualClasses.forEach(c => {
           const d = new Date(c.scheduled_at);
           const dayIdx = d.getDate() - 1;
           if (data[dayIdx]) data[dayIdx].Aulas += 1;
        });
        setChartData(data);
      }

      // 3. Fetch Next Class
      const now = new Date().toISOString();
      let nextClassQuery = supabase
        .from('Classes')
        .select('*')
        .gte('scheduled_at', now)
        .order('scheduled_at', { ascending: true })
        .limit(1);
        
      if (!user?.is_admin) {
        if (teacherStudentEmails.length > 0) {
          nextClassQuery = nextClassQuery.in('student_email', teacherStudentEmails);
        } else {
          nextClassQuery = nextClassQuery.eq('student_email', 'nobody@nowhere.com');
        }
      }

      const { data: nextClassData } = await nextClassQuery;

      if (nextClassData && nextClassData.length > 0) {
        const upcoming = nextClassData[0];
        setNextClass(upcoming);
        
        // Find student meet link
        if (studentsData) {
          const studentInfo = studentsData.find(s => s.email === upcoming.student_email);
          if (studentInfo && studentInfo.meet_link) {
            setMeetLink(studentInfo.meet_link);
          }
        }
      }

      // 4. Fetch Pending Requests
      let pendingQuery = supabase
        .from('Classes')
        .select('*')
        .eq('status', 'Requested')
        .eq('type', 'Solicitação de Aula')
        .order('scheduled_at', { ascending: true });
        
      if (!user?.is_admin) {
        if (teacherStudentEmails.length > 0) {
          pendingQuery = pendingQuery.in('student_email', teacherStudentEmails);
        } else {
          pendingQuery = pendingQuery.eq('student_email', 'nobody@nowhere.com');
        }
      }
        
      const { data: pendingData } = await pendingQuery;
        
      if (pendingData) {
        setPendingRequests(pendingData);
      }

      // 5. Fetch Leads
      const { data: leadsData } = await supabase.from('Leads').select('*').order('created_at', { ascending: false });
      if (leadsData) setLeads(leadsData);

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const handleAcceptRequest = async (id) => {
    setLoading(true);
    const { error } = await supabase.from('Classes').update({ status: 'Scheduled', type: 'Aula' }).eq('id', id);
    if (!error) {
      window.location.reload();
    } else {
      setLoading(false);
      alert('Erro ao aceitar solicitação.');
    }
  };

  const handleRejectRequest = async (id) => {
    if (!window.confirm('Recusar esta solicitação? Ela será excluída.')) return;
    setLoading(true);
    const { error } = await supabase.from('Classes').delete().eq('id', id);
    if (!error) {
      window.location.reload();
    } else {
      setLoading(false);
      alert('Erro ao recusar solicitação.');
    }
  };

  const handleLeadStatusChange = async (leadId, newStatus) => {
    setLoading(true);
    const { error } = await supabase.from('Leads').update({ status: newStatus }).eq('id', leadId);
    if (!error) {
      setLeads(prevLeads => prevLeads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    } else {
      alert('Erro ao atualizar lead.');
    }
    setLoading(false);
  };

  // Update time to next class every minute
  useEffect(() => {
    if (!nextClass) return;

    const updateTimer = () => {
      const now = new Date();
      const scheduledAt = new Date(nextClass.scheduled_at);
      const diffMs = scheduledAt - now;
      
      if (diffMs <= 0) {
        setTimeToNextClass('Agora');
        return;
      }

      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) {
        setTimeToNextClass(`${diffMins}m`);
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setTimeToNextClass(`${hours}h ${mins}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [nextClass, user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia,';
    if (hour < 18) return 'Boa tarde,';
    return 'Boa noite,';
  };

  const pendingStudents = students.filter(s => s.status === 'Pending');

  const recentLogins = [];
  if (students && students.length > 0) {
    students.forEach(student => {
      if (student.login_history && Array.isArray(student.login_history) && student.login_history.length > 0) {
        const latest = student.login_history[0];
        const isObject = typeof latest === 'object' && latest !== null;
        const loginDateStr = isObject ? latest.loginAt : latest;
        
        if (loginDateStr) {
           recentLogins.push({
             student,
             date: new Date(loginDateStr)
           });
        }
      }
    });
    recentLogins.sort((a, b) => b.date - a.date);
  }

  const formatTimeAgo = (date) => {
    const diffMins = Math.floor((new Date() - date) / 60000);
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ontem';
    return `Há ${diffDays} dias`;
  };

  return (
    <div className="dashboard-wrapper animate-fade-in-up">
      <div className="dashboard-header mb-8 flex justify-between items-end">
        <div>
          <h1 style={{fontSize: '3.5rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.25rem', lineHeight: 1.1}}>
            {getGreeting()}
            <br/>
            <span style={{
              background: 'linear-gradient(to right, var(--primary), #4F46E5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 15px var(--primary-glow))',
              fontWeight: 800
            }}>{user?.name?.split(' ')[0] || 'Professor'}</span>
          </h1>
          <p className="text-muted mt-4">Foco • Planejamento • Execução • Sucesso</p>
        </div>
        <div className="text-right">
          <div style={{fontSize: '4rem', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.03em'}}>
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
          </div>
          <div className="text-muted mt-2">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-cols-4 mb-6">
        <div className="card stat-card liquid-glass accent-blue animate-fade-in-up delay-100">
          <div className="stat-icon bg-primary-light">
            <Users size={24} className="text-primary" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '-' : students.length}</span>
            <span className="stat-label">Alunos Ativos</span>
          </div>
        </div>
        <div className="card stat-card liquid-glass accent-green animate-fade-in-up delay-200">
          <div className="stat-icon bg-success-light">
            <Video size={24} className="text-success" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '-' : classesThisMonth}</span>
            <span className="stat-label">Aulas este Mês</span>
          </div>
        </div>
        <div className="card stat-card liquid-glass accent-yellow animate-fade-in-up delay-300">
          <div className="stat-icon bg-warning-light">
            <DollarSign size={24} className="text-warning" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '-' : pendingPayments}</span>
            <span className="stat-label">Pagamentos Pendentes</span>
          </div>
        </div>
        <div className="card stat-card liquid-glass accent-red animate-fade-in-up delay-400">
          <div className="stat-icon bg-danger-light">
            <Clock size={24} className="text-danger" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '-' : (nextClass ? timeToNextClass : '--')}</span>
            <span className="stat-label">Próxima Aula</span>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="card liquid-glass accent-primary mb-6 animate-fade-in-up delay-200">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="text-primary"/> Frequência de Aulas (Mês Atual)</h2>
        <div style={{ height: '220px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-main)' }}
                itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                labelStyle={{ color: 'var(--text-muted)' }}
                formatter={(value) => [`${value} Aulas`, '']}
                labelFormatter={(label) => `Dia ${label}`}
              />
              <Line type="monotone" dataKey="Aulas" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3, fill: 'var(--primary)' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leads Kanban Board */}
      <div className="card liquid-glass mb-6 animate-fade-in-up delay-300">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Target className="text-primary"/> Pipeline de Leads</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Novos (Applied) */}
          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
            <h3 className="font-semibold mb-4 flex justify-between items-center text-muted">
              <span>Novos Leads</span>
              <span className="bg-surface px-2 py-1 rounded-md text-xs">{leads.filter(l => l.status === 'Applied').length}</span>
            </h3>
            <div className="flex flex-col gap-3">
              {leads.filter(l => l.status === 'Applied').map(lead => (
                <div key={lead.id} className="card glass-3d" style={{ padding: '1.25rem' }}>
                  <div className="font-semibold">{lead.name}</div>
                  <div className="text-xs text-muted mb-3">{lead.email}</div>
                  <div className="text-xs mb-3" style={{ color: 'var(--primary)' }}>Obj: {lead.goals.substring(0, 50)}{lead.goals.length > 50 ? '...' : ''}</div>
                  <button className="btn btn-sm w-full btn-primary btn-glass" onClick={() => handleLeadStatusChange(lead.id, 'Trial Scheduled')}>
                    Agendar Aula Teste
                  </button>
                </div>
              ))}
              {leads.filter(l => l.status === 'Applied').length === 0 && (
                <div className="text-sm text-muted text-center py-4">Nenhum lead novo.</div>
              )}
            </div>
          </div>

          {/* Column 2: Aula Teste (Trial Scheduled) */}
          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
            <h3 className="font-semibold mb-4 flex justify-between items-center text-muted">
              <span>Aula Teste</span>
              <span className="bg-surface px-2 py-1 rounded-md text-xs">{leads.filter(l => l.status === 'Trial Scheduled').length}</span>
            </h3>
            <div className="flex flex-col gap-3">
              {leads.filter(l => l.status === 'Trial Scheduled').map(lead => (
                <div key={lead.id} className="card glass-3d" style={{ padding: '1.25rem' }}>
                  <div className="font-semibold">{lead.name}</div>
                  <div className="text-xs text-muted mb-3">{lead.email}</div>
                  <button className="btn btn-sm w-full btn-outline btn-glass hover:text-success hover:border-success" onClick={() => handleLeadStatusChange(lead.id, 'Enrolled')}>
                    Matricular
                  </button>
                </div>
              ))}
              {leads.filter(l => l.status === 'Trial Scheduled').length === 0 && (
                <div className="text-sm text-muted text-center py-4">Nenhuma aula teste.</div>
              )}
            </div>
          </div>

          {/* Column 3: Matriculados (Enrolled) */}
          <div style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
            <h3 className="font-semibold mb-4 flex justify-between items-center text-muted">
              <span>Matriculados</span>
              <span className="bg-surface px-2 py-1 rounded-md text-xs">{leads.filter(l => l.status === 'Enrolled').length}</span>
            </h3>
            <div className="flex flex-col gap-3">
              {leads.filter(l => l.status === 'Enrolled').map(lead => (
                <div key={lead.id} className="card glass-3d opacity-75" style={{ padding: '1.25rem' }}>
                  <div className="font-semibold flex items-center gap-2">
                    <CheckCircle size={14} className="text-success"/> {lead.name}
                  </div>
                  <div className="text-xs text-muted">{lead.email}</div>
                </div>
              ))}
              {leads.filter(l => l.status === 'Enrolled').length === 0 && (
                <div className="text-sm text-muted text-center py-4">Nenhum aluno matriculado via leads.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-cols-3">
        {/* Main Column - Roster & Materials */}
        <div className="main-col" style={{ gridColumn: 'span 2' }}>
          
          {/* Class Control Center */}
          <div className="card mb-6 control-center liquid-glass accent-primary">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2>Controle de Aula ao Vivo</h2>
                <p>Gerencie sua sessão ativa do Google Meet</p>
                {nextClass && (
                  <p className="text-sm mt-2 font-medium text-primary">
                    Próxima: {students.find(s => s.email === nextClass.student_email)?.name || nextClass.student_email}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  className="btn btn-primary btn-glass start-class-btn" 
                  disabled={!meetLink}
                  onClick={() => window.open(meetLink, '_blank')}
                >
                  <Play size={18} fill="currentColor" />
                  Iniciar Aula
                </button>
                <button 
                  className="btn btn-outline btn-glass" 
                  style={{borderColor: 'var(--success)', color: 'var(--success)'}}
                  disabled={!nextClass}
                  onClick={async () => {
                    if (!window.confirm('Marcar esta aula como concluída? O aluno ganhará 1 hora de estudo no perfil.')) return;
                    setLoading(true);
                    
                    // 1. Mark class as Completed
                    await supabase.from('Classes').update({ status: 'Completed' }).eq('id', nextClass.id);
                    
                    // 2. Increment student's hours_studied
                    const student = students.find(s => s.email === nextClass.student_email);
                    if (student) {
                      await supabase.from('Students').update({
                        hours_studied: (student.hours_studied || 0) + 1
                      }).eq('email', student.email);
                    }
                    
                    // 3. Reload dashboard
                    window.location.reload();
                  }}
                >
                  <CheckCircle size={18} />
                  Finalizar Aula
                </button>
              </div>
            </div>
            <div className="input-group">
              <label>Link Fixo do Google Meet do Aluno</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="input w-full" 
                  value={meetLink} 
                  readOnly 
                  placeholder={nextClass ? "Aluno não possui link do Meet configurado" : "Nenhuma aula programada"} 
                />
              </div>
            </div>
          </div>

          {/* Student Roster */}
          <div className="card liquid-glass mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2>Lista de Alunos</h2>
            </div>
            <div className="roster-list">
              {loading ? (
                <p className="text-muted text-sm p-4 text-center">Carregando...</p>
              ) : students.length > 0 ? students.map((student, i) => (
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
                  <button className="btn btn-outline btn-glass" onClick={() => navigate('/dashboard/students')}>Perfil</button>
                </div>
              )) : (
                <p className="text-muted text-sm p-4 text-center">Nenhum aluno encontrado.</p>
              )}
            </div>
          </div>
        </div>

        {/* Side Column - Materials */}
        <div className="side-col">
          
          {/* Pending Students Widget */}
          {pendingStudents.length > 0 && (
            <div className="card liquid-glass accent-primary mb-6">
              <h3 className="mb-4 flex items-center gap-2"><Users className="text-primary"/> Matrículas Pendentes</h3>
              <div className="flex flex-col gap-3">
                {pendingStudents.map(student => (
                  <div key={student.id} style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                    <div className="font-semibold mb-1">{student.name}</div>
                    <div className="text-xs text-muted mb-3 flex items-center gap-1">
                      {student.email}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-sm w-full flex justify-center items-center gap-1 btn-glass btn-primary" 
                        style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }} 
                        onClick={async () => {
                          if(!window.confirm(`Aprovar a matrícula de ${student.name}?`)) return;
                          setLoading(true);
                          await supabase.from('Students').update({ status: 'Active' }).eq('email', student.email);
                          window.location.reload();
                        }}
                      >
                        <CheckCircle size={14} /> Aprovar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Requests Widget */}
          <div className="card liquid-glass accent-yellow mb-6">
            <h3 className="mb-4 flex items-center gap-2"><Clock className="text-warning"/> Solicitações Pendentes</h3>
            <div className="flex flex-col gap-3">
              {pendingRequests.length > 0 ? pendingRequests.map(req => {
                const studentName = students.find(s => s.email === req.student_email)?.name || req.student_email;
                const date = new Date(req.scheduled_at);
                return (
                  <div key={req.id} style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div className="font-semibold mb-1">{studentName}</div>
                    <div className="text-xs text-muted mb-3 flex items-center gap-1">
                      <Calendar size={12} /> {date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({req.duration}m)
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-sm w-full flex justify-center items-center gap-1 btn-glass btn-primary" style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => handleAcceptRequest(req.id)}>
                        <CheckCircle size={14} /> Aceitar
                      </button>
                      <button className="btn btn-sm btn-outline btn-glass w-full hover:text-danger hover:border-danger flex justify-center items-center" onClick={() => handleRejectRequest(req.id)}>
                        Recusar
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-muted text-sm text-center py-2">Nenhuma solicitação no momento.</p>
              )}
            </div>
          </div>

          <div className="card liquid-glass upload-card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="flex items-center gap-2"><CheckCircle className="text-success"/> Tarefas Rápidas</h2>
              <p className="text-muted">Ações comuns</p>
            </div>
            
            <div className="quick-actions-grid mt-4">
              <button className="btn btn-outline btn-glass flex-col py-4 h-auto" onClick={() => navigate('/dashboard/materials')}>
                <UploadCloud size={24} className="mb-2 text-primary" />
                Compartilhar Material
              </button>
              <button className="btn btn-outline btn-glass flex-col py-4 h-auto" onClick={() => navigate('/dashboard/calendar')}>
                <Clock size={24} className="mb-2 text-primary" />
                Agendar Reposição
              </button>
            </div>
          </div>
          
          <div className="card liquid-glass mt-6">
            <h3 className="mb-4 flex items-center gap-2"><Users className="text-primary"/> Últimos Logins</h3>
            <div className="recent-students-list">
              {loading ? (
                <p className="text-muted text-sm p-4 text-center">Carregando...</p>
              ) : recentLogins.length > 0 ? recentLogins.slice(0, 4).map(({student, date}, idx) => (
                <div key={idx} className="student-list-item flex items-center justify-between p-3 border-b border-border hover:bg-surface transition-colors rounded">
                  <div className="flex items-center gap-3">
                    <div className="avatar bg-surface border border-border flex items-center justify-center w-10 h-10" style={{ borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                      <UserAvatar avatarId={student.avatar} name={student.name} size={20} />
                    </div>
                    <div>
                      <div className="font-semibold">{student.name}</div>
                      <div className="text-xs text-muted flex items-center gap-1">
                        <Clock size={12} /> {formatTimeAgo(date)}
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-outline btn-glass btn-sm" onClick={() => navigate('/dashboard/students')}>Ver</button>
                </div>
              )) : (
                <p className="text-muted text-sm text-center pt-2">Nenhum login registrado.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
