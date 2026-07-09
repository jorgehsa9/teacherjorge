import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import './Calendar.css';

const START_HOUR = 7;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

// Helper para obter o domingo da semana atual
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
};

const Calendar = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newClass, setNewClass] = useState({ student_email: '', date: '', time: '', duration: 60 });

  // Pega os 7 dias da semana selecionada
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const fetchClassesAndStudents = async () => {
    if (!user?.email) return;
    setLoading(true);

    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    let query = supabase
      .from('Classes')
      .select('*, Students(name)')
      .gte('scheduled_at', currentWeekStart.toISOString())
      .lte('scheduled_at', endOfWeek.toISOString());

    if (!isTeacher) {
      query = query.eq('student_email', user.email);
    }

    const { data: classesData, error: classesError } = await query;
    if (classesData) setClasses(classesData);
    else console.error('Erro ao buscar aulas:', classesError);

    if (isTeacher) {
      const { data: studentsData } = await supabase.from('Students').select('email, name');
      if (studentsData) setStudents(studentsData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchClassesAndStudents();
  }, [currentWeekStart, user]);

  const changeWeek = (offset) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + offset * 7);
    setCurrentWeekStart(newStart);
  };

  const formatMonthYear = () => {
    return currentWeekStart.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase());
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const scheduledAt = new Date(`${newClass.date}T${newClass.time}`).toISOString();

    const { error } = await supabase.from('Classes').insert([
      { 
        student_email: newClass.student_email,
        scheduled_at: scheduledAt,
        duration: parseInt(newClass.duration),
        status: 'Scheduled'
      }
    ]);

    if (error) {
      console.error('Error adding class:', error);
      alert('Falha ao agendar aula.');
    } else {
      await fetchClassesAndStudents();
      setIsModalOpen(false);
      setNewClass({ student_email: '', date: '', time: '', duration: 60 });
    }
    setIsSubmitting(false);
  };

  // Cores dinâmicas para aulas
  const colors = ['bg-primary', 'bg-warning', 'bg-success', 'bg-purple'];
  
  return (
    <div className="dashboard-wrapper flex flex-col h-full">
      <div className="dashboard-header mb-6 flex justify-between items-center">
        <div>
          <h1>Agenda Semanal</h1>
          <p>{isTeacher ? 'Visualize e gerencie os horários das suas aulas.' : 'Visualize os horários das suas aulas.'}</p>
        </div>
        {isTeacher && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Agendar Aula
          </button>
        )}
      </div>

      <div className="card glass flex-1 flex flex-col p-0 overflow-hidden relative">
        {/* Calendar Navigation */}
        <div className="p-4 flex justify-between items-center" style={{backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)'}}>
          <div className="flex gap-2 items-center">
            <button className="btn btn-outline" style={{padding: '0.5rem'}} onClick={() => changeWeek(-1)}>
              <ChevronLeft size={16}/>
            </button>
            <button className="btn btn-outline" style={{padding: '0.5rem'}} onClick={() => changeWeek(1)}>
              <ChevronRight size={16}/>
            </button>
            <button className="btn btn-outline ml-2 text-sm" onClick={() => setCurrentWeekStart(getStartOfWeek(new Date()))}>
              Hoje
            </button>
            <span className="font-bold text-lg ml-4">{formatMonthYear()}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center text-muted">Carregando agenda...</div>
        ) : (
          <div className="calendar-wrapper flex-1">
            {/* Header com Dias da Semana */}
            <div className="calendar-header-row">
              <div className="calendar-day-header border-none"></div> {/* Canto superior esquerdo vazio */}
              {weekDays.map((day, i) => {
                const isToday = new Date().toDateString() === day.toDateString();
                const dayName = day.toLocaleString('pt-BR', { weekday: 'short' });
                return (
                  <div key={i} className={`calendar-day-header ${isToday ? 'today' : ''}`}>
                    {dayName}
                    <span className="date-number">{day.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {/* Grid Principal Semanal */}
            <div className="calendar-weekly-grid flex-1">
              {/* Coluna de Horas */}
              <div className="calendar-time-col">
                {HOURS.map(hour => (
                  <div key={hour} className="time-slot">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Colunas dos Dias */}
              {weekDays.map((day, dayIndex) => {
                // Aulas deste dia específico
                const dayClasses = classes.filter(c => {
                  const classDate = new Date(c.scheduled_at);
                  return classDate.toDateString() === day.toDateString();
                });

                return (
                  <div key={dayIndex} className="calendar-day-col">
                    {/* Linhas de Grade de fundo */}
                    {HOURS.map(hour => (
                      <div key={hour} className="grid-line"></div>
                    ))}

                    {/* Renderização das Aulas */}
                    {dayClasses.map((cls, idx) => {
                      const classTime = new Date(cls.scheduled_at);
                      const hour = classTime.getHours();
                      const minutes = classTime.getMinutes();
                      
                      // Não desenhar se a aula começa antes do calendário (ex: antes das 7h)
                      if (hour < START_HOUR) return null;

                      // Topo em pixels: 1 min = 1px, portanto (Hora da aula - Hora de Inicio) * 60 + minutos
                      const topPosition = (hour - START_HOUR) * 60 + minutes;
                      const height = cls.duration || 60; // Duração em pixels (60 mins = 60px)
                      const colorClass = colors[(cls.student_email.length) % colors.length];

                      return (
                        <div 
                          key={cls.id} 
                          className={`weekly-event ${colorClass}`}
                          style={{ top: `${topPosition}px`, height: `${height}px` }}
                          title={`${cls.Students?.name || 'Aula'} - ${hour.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')} (${height} min)`}
                        >
                          <div className="event-time">
                            {hour.toString().padStart(2,'0')}:{minutes.toString().padStart(2,'0')}
                          </div>
                          <div className="event-title">
                            {isTeacher ? cls.Students?.name || cls.student_email : 'Sua Aula'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal Adicionar Aula */}
      {isModalOpen && isTeacher && (
        <div className="modal-overlay flex items-center justify-center" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass w-full" style={{maxWidth: '400px', backgroundColor: 'var(--surface)', margin: '1rem'}}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{margin: 0}}>Agendar Aula</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddClass}>
              <div className="input-group">
                <label>Aluno</label>
                <select 
                  className="input w-full" 
                  required 
                  value={newClass.student_email} 
                  onChange={(e) => setNewClass({...newClass, student_email: e.target.value})}
                >
                  <option value="">Selecione um aluno...</option>
                  {students.map(s => (
                    <option key={s.email} value={s.email}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Data</label>
                <input type="date" className="input w-full" required
                  value={newClass.date} onChange={(e) => setNewClass({...newClass, date: e.target.value})}
                />
              </div>
              
              <div className="grid-cols-2" style={{marginBottom: '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Horário</label>
                  <input type="time" className="input w-full" required
                    value={newClass.time} onChange={(e) => setNewClass({...newClass, time: e.target.value})}
                  />
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Duração (mins)</label>
                  <input type="number" className="input w-full" min="15" step="15" required
                    value={newClass.duration} onChange={(e) => setNewClass({...newClass, duration: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Agendando...' : 'Agendar Aula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Calendar;
