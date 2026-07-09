import React, { useState, useEffect } from 'react';
import { Users, Video, Clock, DollarSign, UploadCloud, Play, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
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
            <span className="stat-value">{students.length}</span>
            <span className="stat-label">Alunos Ativos</span>
          </div>
        </div>
        <div className="card stat-card glass">
          <div className="stat-icon bg-success-light">
            <Video size={24} className="text-success" />
          </div>
          <div className="stat-info">
            <span className="stat-value">12</span>
            <span className="stat-label">Aulas este Mês</span>
          </div>
        </div>
        <div className="card stat-card glass">
          <div className="stat-icon bg-warning-light">
            <DollarSign size={24} className="text-warning" />
          </div>
          <div className="stat-info">
            <span className="stat-value">4</span>
            <span className="stat-label">Pagamentos Pendentes</span>
          </div>
        </div>
        <div className="card stat-card glass">
          <div className="stat-icon bg-danger-light">
            <Clock size={24} className="text-danger" />
          </div>
          <div className="stat-info">
            <span className="stat-value">45m</span>
            <span className="stat-label">Próxima Aula</span>
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
                <h2>Controle de Aula ao Vivo</h2>
                <p>Gerencie sua sessão ativa do Google Meet</p>
              </div>
              <button className="btn btn-primary start-class-btn">
                <Play size={18} fill="currentColor" />
                Iniciar Aula Agora
              </button>
            </div>
            <div className="input-group">
              <label>Link Fixo do Google Meet</label>
              <div className="flex gap-2">
                <input type="text" className="input w-full" defaultValue="https://meet.google.com/abc-defg-hij" />
                <button className="btn btn-outline">Atualizar</button>
              </div>
            </div>
          </div>

          {/* Student Roster */}
          <div className="card glass mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2>Lista de Alunos</h2>
              <button className="btn btn-outline btn-sm">Ver Todos</button>
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
                  <button className="btn btn-outline">Perfil</button>
                </div>
              )) : (
                <p className="text-muted text-sm p-4 text-center">Nenhum aluno encontrado.</p>
              )}
            </div>
          </div>
        </div>

        {/* Side Column - Materials */}
        <div className="side-col">
          <div className="card glass upload-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="flex items-center gap-2"><CheckCircle className="text-success"/> Tarefas Rápidas</h2>
              <p className="text-muted">Ações comuns</p>
            </div>
            
            <div className="quick-actions-grid mt-4">
              <button className="btn btn-outline flex-col py-4 h-auto">
                <UploadCloud size={24} className="mb-2 text-primary" />
                Compartilhar Material
              </button>
              <button className="btn btn-outline flex-col py-4 h-auto">
                <Clock size={24} className="mb-2 text-primary" />
                Agendar Reposição
              </button>
            </div>
          </div>
          
          <div className="card glass mt-6">
            <h3 className="mb-4 flex items-center gap-2"><Users className="text-primary"/> Alunos Recentes</h3>
            <div className="recent-students-list">
              {students.slice(0, 3).map((student) => (
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
                  <button className="btn btn-outline btn-sm">Ver</button>
                </div>
              ))}
              <div className="text-center mt-4">
                <button className="btn-link text-sm text-primary font-medium hover:underline">Ver Todos os Alunos →</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
