import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Video, Clock, DollarSign, UploadCloud, Play, FileText, CheckCircle, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      // 1. Fetch Students
      const { data: studentsData } = await supabase.from('Students').select('*');
      if (studentsData) setStudents(studentsData);

      // 2. Fetch Classes for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const { data: monthClasses } = await supabase
        .from('Classes')
        .select('*')
        .gte('scheduled_at', startOfMonth.toISOString())
        .lte('scheduled_at', endOfMonth.toISOString());
      
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
      const { data: nextClassData } = await supabase
        .from('Classes')
        .select('*')
        .gte('scheduled_at', now)
        .order('scheduled_at', { ascending: true })
        .limit(1);

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
      const { data: pendingData } = await supabase
        .from('Classes')
        .select('*')
        .eq('status', 'Requested')
        .eq('type', 'Solicitação de Aula')
        .order('scheduled_at', { ascending: true });
        
      if (pendingData) {
        setPendingRequests(pendingData);
      }

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
  }, [nextClass]);

  return (
    <div className="dashboard-wrapper animate-fade-in-up">
      <div className="dashboard-header mb-8 flex justify-between items-end">
        <div>
          <h1 style={{fontSize: '3.5rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.25rem', lineHeight: 1.1}}>
            Bom dia,
            <br/>
            <span style={{
              background: 'linear-gradient(to right, var(--primary), #4F46E5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 15px var(--primary-glow))',
              fontWeight: 800
            }}>Jorge</span>
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
        <div className="stat-card card glass animate-fade-in-up delay-100">
          <div className="stat-icon bg-primary-light">
            <Users size={24} className="text-primary" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '-' : students.length}</span>
            <span className="stat-label">Alunos Ativos</span>
          </div>
        </div>
        <div className="card stat-card glass">
          <div className="stat-icon bg-success-light">
            <Video size={24} className="text-success" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '-' : classesThisMonth}</span>
            <span className="stat-label">Aulas este Mês</span>
          </div>
        </div>
        <div className="card stat-card glass">
          <div className="stat-icon bg-warning-light">
            <DollarSign size={24} className="text-warning" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '-' : pendingPayments}</span>
            <span className="stat-label">Pagamentos Pendentes</span>
          </div>
        </div>
        <div className="card stat-card glass">
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
      <div className="card glass mb-6 animate-fade-in-up delay-200">
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

      <div className="grid-cols-3">
        {/* Main Column - Roster & Materials */}
        <div className="main-col" style={{ gridColumn: 'span 2' }}>
          
          {/* Class Control Center */}
          <div className="card mb-6 control-center glass border-primary">
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
                  className="btn btn-primary start-class-btn" 
                  disabled={!meetLink}
                  onClick={() => window.open(meetLink, '_blank')}
                >
                  <Play size={18} fill="currentColor" />
                  Iniciar Aula
                </button>
                <button 
                  className="btn btn-outline" 
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
          <div className="card glass mb-6">
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
                  <button className="btn btn-outline" onClick={() => navigate('/dashboard/students')}>Perfil</button>
                </div>
              )) : (
                <p className="text-muted text-sm p-4 text-center">Nenhum aluno encontrado.</p>
              )}
            </div>
          </div>
        </div>

        {/* Side Column - Materials */}
        <div className="side-col">
          
          {/* Pending Requests Widget */}
          <div className="card glass mb-6" style={{ borderTop: '4px solid var(--warning)' }}>
            <h3 className="mb-4 flex items-center gap-2"><Clock className="text-warning"/> Solicitações Pendentes</h3>
            <div className="flex flex-col gap-3">
              {pendingRequests.length > 0 ? pendingRequests.map(req => {
                const studentName = students.find(s => s.email === req.student_email)?.name || req.student_email;
                const date = new Date(req.scheduled_at);
                return (
                  <div key={req.id} className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div className="font-semibold mb-1">{studentName}</div>
                    <div className="text-xs text-muted mb-3 flex items-center gap-1">
                      <Calendar size={12} /> {date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({req.duration}m)
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-sm w-full flex justify-center items-center gap-1" style={{ backgroundColor: 'var(--success)', color: 'white' }} onClick={() => handleAcceptRequest(req.id)}>
                        <CheckCircle size={14} /> Aceitar
                      </button>
                      <button className="btn btn-sm btn-outline w-full hover:text-danger hover:border-danger flex justify-center items-center" onClick={() => handleRejectRequest(req.id)}>
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

          <div className="card glass upload-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="flex items-center gap-2"><CheckCircle className="text-success"/> Tarefas Rápidas</h2>
              <p className="text-muted">Ações comuns</p>
            </div>
            
            <div className="quick-actions-grid mt-4">
              <button className="btn btn-outline flex-col py-4 h-auto" onClick={() => navigate('/dashboard/materials')}>
                <UploadCloud size={24} className="mb-2 text-primary" />
                Compartilhar Material
              </button>
              <button className="btn btn-outline flex-col py-4 h-auto" onClick={() => navigate('/dashboard/calendar')}>
                <Clock size={24} className="mb-2 text-primary" />
                Agendar Reposição
              </button>
            </div>
          </div>
          
          <div className="card glass mt-6">
            <h3 className="mb-4 flex items-center gap-2"><Users className="text-primary"/> Alunos Recentes</h3>
            <div className="recent-students-list">
              {loading ? (
                <p className="text-muted text-sm p-4 text-center">Carregando...</p>
              ) : students.length > 0 ? students.slice(0, 3).map((student) => (
                <div key={student.id} className="student-list-item flex items-center justify-between p-3 border-b border-border hover:bg-surface transition-colors rounded">
                  <div className="flex items-center gap-3">
                    <div className="avatar bg-primary-light text-primary font-bold rounded-full w-10 h-10 flex items-center justify-center">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{student.name}</div>
                      <div className="text-xs text-muted">{student.level}</div>
                    </div>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard/students')}>Ver</button>
                </div>
              )) : (
                <p className="text-muted text-sm text-center pt-2">Nenhum aluno.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
