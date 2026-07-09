import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
import './Calendar.css';

const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
const COLORS = ['bg-primary', 'bg-warning', 'bg-success', 'bg-purple'];

const Calendar = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [currentView, setCurrentView] = useState('week'); // 'month', 'week', 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classForm, setClassForm] = useState({ student_email: '', date: '', time: '', duration: 60, status: 'Scheduled' });

  // Current Time Indicator
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  // --- Date Helpers ---
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getStartOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getVisibleRange = () => {
    let start, end;
    if (currentView === 'month') {
      const startOfMonth = getStartOfMonth(currentDate);
      start = getStartOfWeek(startOfMonth); // Pode começar no mês anterior
      end = new Date(start);
      end.setDate(end.getDate() + 41); // 6 semanas para cobrir o mês
      end.setHours(23, 59, 59, 999);
    } else if (currentView === 'week') {
      start = getStartOfWeek(currentDate);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  };

  // --- Fetch Data ---
  const fetchClassesAndStudents = async () => {
    if (!user?.email) return;
    setLoading(true);

    const { start, end } = getVisibleRange();

    let query = supabase
      .from('Classes')
      .select('*')
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString());

    if (!isTeacher) {
      query = query.eq('student_email', user.email);
    }

    const { data: classesData, error: classesError } = await query;
    if (classesData) setClasses(classesData);
    else console.error('Erro ao buscar aulas:', classesError);

    if (isTeacher && students.length === 0) {
      const { data: studentsData } = await supabase.from('Students').select('email, name');
      if (studentsData) setStudents(studentsData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchClassesAndStudents();
  }, [currentDate, currentView, user]);

  // --- Navigation ---
  const navigate = (direction) => { // -1 or 1
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getHeaderTitle = () => {
    const opts = { month: 'long', year: 'numeric' };
    if (currentView === 'day') opts.day = 'numeric';
    return currentDate.toLocaleString('pt-BR', opts).replace(/^\w/, c => c.toUpperCase());
  };

  const getStudentName = (email) => {
    if (!isTeacher) return 'Sua Aula';
    return students.find(s => s.email === email)?.name || email;
  };

  // --- Form Handlers ---
  const openNewClassModal = (dateStr = '', timeStr = '') => {
    setEditMode(false);
    setSelectedClassId(null);
    setClassForm({ student_email: '', date: dateStr, time: timeStr, duration: 60, status: 'Scheduled' });
    setIsModalOpen(true);
  };

  const openEditClassModal = (cls) => {
    if (!isTeacher) return; // Aluno não edita
    const d = new Date(cls.scheduled_at);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().substring(0, 5);

    setEditMode(true);
    setSelectedClassId(cls.id);
    setClassForm({ 
      student_email: cls.student_email, 
      date: dateStr, 
      time: timeStr, 
      duration: cls.duration,
      status: cls.status
    });
    setIsModalOpen(true);
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const scheduledAt = new Date(`${classForm.date}T${classForm.time}`).toISOString();
    const classData = { 
      student_email: classForm.student_email,
      scheduled_at: scheduledAt,
      duration: parseInt(classForm.duration),
      status: classForm.status
    };

    let error;
    if (editMode) {
      const { error: updateError } = await supabase.from('Classes').update(classData).eq('id', selectedClassId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('Classes').insert([classData]);
      error = insertError;
    }

    if (error) {
      console.error('Error saving class:', error);
      alert('Falha ao salvar aula.');
    } else {
      await fetchClassesAndStudents();
      setIsModalOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteClass = async () => {
    if (!window.confirm("Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.")) return;
    
    setIsSubmitting(true);
    const { error } = await supabase.from('Classes').delete().eq('id', selectedClassId);
    
    if (error) {
      alert("Erro ao excluir.");
    } else {
      await fetchClassesAndStudents();
      setIsModalOpen(false);
    }
    setIsSubmitting(false);
  };

  // --- Render Helpers ---
  const renderTimeIndicator = () => {
    const currentHour = now.getHours();
    if (currentHour < START_HOUR || currentHour > END_HOUR) return null;
    const top = (currentHour - START_HOUR) * 60 + now.getMinutes();
    return <div className="current-time-indicator" style={{ top: `${top}px` }} />;
  };

  const renderWeeklyOrDayEvent = (cls) => {
    const classTime = new Date(cls.scheduled_at);
    const hour = classTime.getHours();
    const minutes = classTime.getMinutes();
    
    if (hour < START_HOUR) return null;

    const topPosition = (hour - START_HOUR) * 60 + minutes;
    const height = cls.duration || 60;
    const colorClass = COLORS[cls.student_email.length % COLORS.length];

    return (
      <div 
        key={cls.id} 
        className={`weekly-event ${colorClass}`}
        style={{ top: `${topPosition}px`, height: `${height}px` }}
        onClick={() => openEditClassModal(cls)}
      >
        <div className="event-time">
          {hour.toString().padStart(2,'0')}:{minutes.toString().padStart(2,'0')}
        </div>
        <div className="event-title">{getStudentName(cls.student_email)}</div>
      </div>
    );
  };

  const renderMonthView = () => {
    const startDate = getStartOfWeek(getStartOfMonth(currentDate));
    const days = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="calendar-month-grid">
        {/* Headers: Dom a Sáb */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="calendar-month-day-header">{d}</div>
        ))}
        
        {days.map((day, i) => {
          const isToday = new Date().toDateString() === day.toDateString();
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const dayClasses = classes.filter(c => new Date(c.scheduled_at).toDateString() === day.toDateString());

          return (
            <div key={i} className={`month-cell ${!isCurrentMonth ? 'different-month' : ''} ${isToday ? 'today' : ''}`}
                 onClick={() => { if(isTeacher) openNewClassModal(day.toISOString().split('T')[0], '08:00'); }}>
              <div className="month-date">{day.getDate()}</div>
              {dayClasses.map(cls => {
                const colorClass = COLORS[cls.student_email.length % COLORS.length];
                const timeStr = new Date(cls.scheduled_at).toTimeString().substring(0,5);
                return (
                  <div key={cls.id} className={`month-event ${colorClass}`} onClick={(e) => { e.stopPropagation(); openEditClassModal(cls); }}>
                    {timeStr} {getStudentName(cls.student_email)}
                  </div>
                )
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekOrDayView = () => {
    const days = currentView === 'week' ? 
      Array.from({ length: 7 }, (_, i) => { const d = new Date(getStartOfWeek(currentDate)); d.setDate(d.getDate() + i); return d; }) 
      : [currentDate];
    
    const viewClass = currentView === 'week' ? 'week-view' : 'day-view';

    return (
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className={`calendar-header-row ${viewClass}`}>
          <div className="calendar-day-header border-none" style={{padding: 0}}></div>
          {days.map((day, i) => {
            const isToday = new Date().toDateString() === day.toDateString();
            return (
              <div key={i} className={`calendar-day-header ${isToday ? 'today' : ''}`}>
                {day.toLocaleString('pt-BR', { weekday: 'short' })}
                <span className="date-number">{day.getDate()}</span>
              </div>
            );
          })}
        </div>

        <div className={`calendar-weekly-grid ${viewClass} flex-1 overflow-y-auto`}>
          <div className="calendar-time-col">
            {HOURS.map(hour => (
              <div key={hour} className="time-slot">{hour.toString().padStart(2, '0')}:00</div>
            ))}
          </div>

          {days.map((day, dayIndex) => {
            const isToday = new Date().toDateString() === day.toDateString();
            const dayClasses = classes.filter(c => new Date(c.scheduled_at).toDateString() === day.toDateString());

            return (
              <div key={dayIndex} className="calendar-day-col" onClick={(e) => {
                if(!isTeacher) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const hourClicked = Math.floor(y / 60) + START_HOUR;
                const dateStr = day.toISOString().split('T')[0];
                openNewClassModal(dateStr, `${hourClicked.toString().padStart(2,'0')}:00`);
              }}>
                {HOURS.map(hour => <div key={hour} className="grid-line"></div>)}
                {isToday && renderTimeIndicator()}
                {dayClasses.map(cls => renderWeeklyOrDayEvent(cls))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-wrapper flex flex-col h-full">
      <div className="dashboard-header mb-6 flex justify-between items-center">
        <div>
          <h1>Agenda</h1>
          <p>{isTeacher ? 'Gerencie seus horários (Clique no grid para agendar ou nos eventos para editar).' : 'Visualize os horários das suas aulas.'}</p>
        </div>
        {isTeacher && (
          <button className="btn btn-primary" onClick={() => openNewClassModal()}>
            <Plus size={18} /> Agendar Aula
          </button>
        )}
      </div>

      <div className="card glass flex-1 flex flex-col p-0 overflow-hidden relative">
        {/* Navigation Bar */}
        <div className="p-4 flex justify-between items-center" style={{backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)'}}>
          <div className="flex gap-2 items-center">
            <button className="btn btn-outline" style={{padding: '0.5rem'}} onClick={() => navigate(-1)}>
              <ChevronLeft size={16}/>
            </button>
            <button className="btn btn-outline" style={{padding: '0.5rem'}} onClick={() => navigate(1)}>
              <ChevronRight size={16}/>
            </button>
            <button className="btn btn-outline ml-2 text-sm" onClick={goToToday}>Hoje</button>
            <span className="font-bold text-lg ml-4">{getHeaderTitle()}</span>
          </div>

          <div className="view-tabs">
            <button className={currentView === 'month' ? 'active' : ''} onClick={() => setCurrentView('month')}>Mês</button>
            <button className={currentView === 'week' ? 'active' : ''} onClick={() => setCurrentView('week')}>Semana</button>
            <button className={currentView === 'day' ? 'active' : ''} onClick={() => setCurrentView('day')}>Dia</button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center text-muted">Carregando agenda...</div>
        ) : (
          <div className="calendar-wrapper">
            {currentView === 'month' ? renderMonthView() : renderWeekOrDayView()}
          </div>
        )}
      </div>

      {/* Modal Adicionar/Editar Aula */}
      {isModalOpen && isTeacher && (
        <div className="modal-overlay flex items-center justify-center" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass w-full" style={{maxWidth: '400px', backgroundColor: 'var(--surface)', margin: '1rem'}}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{margin: 0}}>{editMode ? 'Editar Aula' : 'Agendar Aula'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveClass}>
              <div className="input-group">
                <label>Aluno</label>
                <select className="input w-full" required value={classForm.student_email} onChange={(e) => setClassForm({...classForm, student_email: e.target.value})}>
                  <option value="">Selecione um aluno...</option>
                  {students.map(s => <option key={s.email} value={s.email}>{s.name} ({s.email})</option>)}
                </select>
              </div>

              <div className="grid-cols-2" style={{marginBottom: '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Data</label>
                  <input type="date" className="input w-full" required value={classForm.date} onChange={(e) => setClassForm({...classForm, date: e.target.value})} />
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Horário</label>
                  <input type="time" className="input w-full" required value={classForm.time} onChange={(e) => setClassForm({...classForm, time: e.target.value})} />
                </div>
              </div>
              
              <div className="grid-cols-2" style={{marginBottom: '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Duração (mins)</label>
                  <input type="number" className="input w-full" min="15" step="15" required value={classForm.duration} onChange={(e) => setClassForm({...classForm, duration: parseInt(e.target.value)})} />
                </div>
                {editMode && (
                  <div className="input-group" style={{marginBottom: 0}}>
                    <label>Status</label>
                    <select className="input w-full" value={classForm.status} onChange={(e) => setClassForm({...classForm, status: e.target.value})}>
                      <option value="Scheduled">Agendada</option>
                      <option value="Completed">Concluída</option>
                      <option value="Cancelled">Cancelada</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-6">
                {editMode ? (
                  <button type="button" className="btn btn-outline text-red-500 hover:bg-red-50" onClick={handleDeleteClass} disabled={isSubmitting} style={{borderColor: 'transparent'}}>
                    <Trash2 size={18} /> Excluir
                  </button>
                ) : <div></div>}
                <div className="flex gap-2">
                  <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
