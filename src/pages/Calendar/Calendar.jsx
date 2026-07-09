import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Repeat } from 'lucide-react';
import './Calendar.css';

const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
const COLORS = ['bg-primary', 'bg-warning', 'bg-success', 'bg-purple'];
const DAYS_OF_WEEK = [
  { id: 0, label: 'D' }, { id: 1, label: 'S' }, { id: 2, label: 'T' }, 
  { id: 3, label: 'Q' }, { id: 4, label: 'Q' }, { id: 5, label: 'S' }, { id: 6, label: 'S' }
];

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
  const [classForm, setClassForm] = useState({ 
    student_email: '', date: '', startHour: '08', startMinute: '00', duration: 60, status: 'Scheduled',
    isRecurring: false, repeatDays: [], repeatUntil: ''
  });

  // Current Time Indicator
  const [now, setNow] = useState(new Date());

  // Resizing State
  const [resizingClass, setResizingClass] = useState(null); // { id, initialHeight, startY }

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // --- Date Helpers ---
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getStartOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

  const getVisibleRange = () => {
    let start, end;
    if (currentView === 'month') {
      const startOfMonth = getStartOfMonth(currentDate);
      start = getStartOfWeek(startOfMonth);
      end = new Date(start);
      end.setDate(end.getDate() + 41);
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

    if (!isTeacher) query = query.eq('student_email', user.email);

    const { data: classesData, error: classesError } = await query;
    if (classesData) setClasses(classesData);
    else console.error('Erro ao buscar aulas:', classesError);

    if (isTeacher && students.length === 0) {
      const { data: studentsData } = await supabase.from('Students').select('email, name');
      if (studentsData) setStudents(studentsData);
    }

    setLoading(false);
  };

  useEffect(() => { fetchClassesAndStudents(); }, [currentDate, currentView, user]);

  // --- Navigation ---
  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') newDate.setMonth(newDate.getMonth() + direction);
    else if (currentView === 'week') newDate.setDate(newDate.getDate() + direction * 7);
    else newDate.setDate(newDate.getDate() + direction);
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

  // --- Drag and Drop Logic ---
  const handleDragStart = (e, cls) => {
    if (!isTeacher) { e.preventDefault(); return; }
    e.dataTransfer.setData('classId', cls.id);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    document.querySelectorAll('.calendar-day-col').forEach(el => el.classList.remove('drag-over'));
  };

  const handleDragOver = (e) => {
    if (!isTeacher) return;
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e, targetDay) => {
    if (!isTeacher) return;
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const classId = e.dataTransfer.getData('classId');
    if (!classId) return;

    // Calcular nova hora baseada na posição Y do mouse relativa à coluna
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let newHour = Math.floor(y / 60) + START_HOUR;
    let newMinute = Math.floor((y % 60) / 15) * 15; // snap to 15 mins

    if (newHour < START_HOUR) newHour = START_HOUR;
    if (newHour > END_HOUR) newHour = END_HOUR;

    // Buscar aula na state local
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;

    // Atualiza estado local optimisticamente
    const newScheduledAt = new Date(targetDay);
    newScheduledAt.setHours(newHour, newMinute, 0, 0);

    setClasses(prev => prev.map(c => c.id === classId ? { ...c, scheduled_at: newScheduledAt.toISOString() } : c));

    // Salva no banco
    const { error } = await supabase.from('Classes').update({ scheduled_at: newScheduledAt.toISOString() }).eq('id', classId);
    if (error) {
      console.error(error);
      fetchClassesAndStudents(); // reverter
    }
  };

  // --- Resizing Logic ---
  const startResizing = (e, cls) => {
    if (!isTeacher) return;
    e.stopPropagation();
    e.preventDefault();
    setResizingClass({ id: cls.id, initialDuration: cls.duration || 60, startY: e.clientY });
  };

  useEffect(() => {
    if (!resizingClass) return;

    const handleMouseMove = (e) => {
      const deltaY = e.clientY - resizingClass.startY;
      let newDuration = resizingClass.initialDuration + deltaY;
      // Snap to 15 min intervals (min 15)
      newDuration = Math.max(15, Math.round(newDuration / 15) * 15);
      
      setClasses(prev => prev.map(c => c.id === resizingClass.id ? { ...c, duration: newDuration } : c));
    };

    const handleMouseUp = async (e) => {
      const deltaY = e.clientY - resizingClass.startY;
      let newDuration = resizingClass.initialDuration + deltaY;
      newDuration = Math.max(15, Math.round(newDuration / 15) * 15);

      setResizingClass(null);

      // Save to Supabase
      const { error } = await supabase.from('Classes').update({ duration: newDuration }).eq('id', resizingClass.id);
      if (error) {
        console.error(error);
        fetchClassesAndStudents(); // reverter se erro
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingClass]);

  // --- Form Handlers ---
  const openNewClassModal = (dateStr = '', startHour = '08', startMinute = '00') => {
    setEditMode(false);
    setSelectedClassId(null);
    setClassForm({ 
      student_email: '', date: dateStr, startHour, startMinute, duration: 60, status: 'Scheduled',
      isRecurring: false, repeatDays: [], repeatUntil: ''
    });
    setIsModalOpen(true);
  };

  const openEditClassModal = (cls) => {
    if (!isTeacher) return; 
    const d = new Date(cls.scheduled_at);
    const dateStr = d.toISOString().split('T')[0];
    const hourStr = d.getHours().toString().padStart(2, '0');
    const minStr = d.getMinutes().toString().padStart(2, '0');

    setEditMode(true);
    setSelectedClassId(cls.id);
    setClassForm({ 
      student_email: cls.student_email, date: dateStr, startHour: hourStr, startMinute: minStr, 
      duration: cls.duration, status: cls.status,
      isRecurring: false, repeatDays: [], repeatUntil: ''
    });
    setIsModalOpen(true);
  };

  const toggleRepeatDay = (dayId) => {
    setClassForm(prev => {
      if (prev.repeatDays.includes(dayId)) return { ...prev, repeatDays: prev.repeatDays.filter(d => d !== dayId) };
      return { ...prev, repeatDays: [...prev.repeatDays, dayId] };
    });
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let baseDate = new Date(`${classForm.date}T${classForm.startHour}:${classForm.startMinute}:00`);

    const classData = { 
      student_email: classForm.student_email,
      scheduled_at: baseDate.toISOString(),
      duration: parseInt(classForm.duration),
      status: classForm.status
    };

    let error;
    if (editMode) {
      const { error: updateError } = await supabase.from('Classes').update(classData).eq('id', selectedClassId);
      error = updateError;
    } else {
      // Logic for new class (single or recurring)
      if (classForm.isRecurring && classForm.repeatUntil && classForm.repeatDays.length > 0) {
        const untilDate = new Date(classForm.repeatUntil + "T23:59:59");
        let currentDateIter = new Date(baseDate);
        const classesToInsert = [];

        // Preenche até o limite (ou max 50 para proteção)
        let loops = 0;
        while (currentDateIter <= untilDate && loops < 50) {
          if (classForm.repeatDays.includes(currentDateIter.getDay())) {
            classesToInsert.push({ ...classData, scheduled_at: new Date(currentDateIter).toISOString() });
          }
          currentDateIter.setDate(currentDateIter.getDate() + 1);
          loops++;
        }
        
        if (classesToInsert.length > 0) {
          const { error: insertError } = await supabase.from('Classes').insert(classesToInsert);
          error = insertError;
        }
      } else {
        const { error: insertError } = await supabase.from('Classes').insert([classData]);
        error = insertError;
      }
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
    if (!window.confirm("Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita e removerá a cobrança do aluno.")) return;
    
    setIsSubmitting(true);
    const { error } = await supabase.from('Classes').delete().eq('id', selectedClassId);
    
    if (error) alert("Erro ao excluir.");
    else { await fetchClassesAndStudents(); setIsModalOpen(false); }
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

    const isDragging = resizingClass?.id === cls.id;

    return (
      <div 
        key={cls.id} 
        draggable={isTeacher}
        onDragStart={(e) => handleDragStart(e, cls)}
        onDragEnd={handleDragEnd}
        className={`weekly-event ${colorClass} ${isDragging ? 'resizing' : ''}`}
        style={{ top: `${topPosition}px`, height: `${height}px` }}
        onClick={(e) => { e.stopPropagation(); openEditClassModal(cls); }}
      >
        <div className="event-time">{hour.toString().padStart(2,'0')}:{minutes.toString().padStart(2,'0')}</div>
        <div className="event-title">{getStudentName(cls.student_email)}</div>
        
        {isTeacher && (
          <div className="resize-handle" onMouseDown={(e) => startResizing(e, cls)} />
        )}
      </div>
    );
  };

  // Views rendering omitted for brevity (similar to previous)
  const renderMonthView = () => {
    const startDate = getStartOfWeek(getStartOfMonth(currentDate));
    const days = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="calendar-month-grid">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} className="calendar-month-day-header">{d}</div>)}
        {days.map((day, i) => {
          const isToday = new Date().toDateString() === day.toDateString();
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const dayClasses = classes.filter(c => new Date(c.scheduled_at).toDateString() === day.toDateString());

          return (
            <div key={i} className={`month-cell ${!isCurrentMonth ? 'different-month' : ''} ${isToday ? 'today' : ''}`}
                 onClick={() => { if(isTeacher) openNewClassModal(day.toISOString().split('T')[0]); }}>
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
          {days.map((day, i) => (
            <div key={i} className={`calendar-day-header ${new Date().toDateString() === day.toDateString() ? 'today' : ''}`}>
              {day.toLocaleString('pt-BR', { weekday: 'short' })} <span className="date-number">{day.getDate()}</span>
            </div>
          ))}
        </div>

        <div className={`calendar-weekly-grid ${viewClass} flex-1 overflow-y-auto`}>
          <div className="calendar-time-col">
            {HOURS.map(hour => <div key={hour} className="time-slot">{hour.toString().padStart(2, '0')}:00</div>)}
          </div>

          {days.map((day, dayIndex) => {
            const isToday = new Date().toDateString() === day.toDateString();
            const dayClasses = classes.filter(c => new Date(c.scheduled_at).toDateString() === day.toDateString());

            return (
              <div 
                key={dayIndex} 
                className="calendar-day-col" 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                onClick={(e) => {
                  if(!isTeacher) return;
                  const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                  const hourClicked = Math.floor(y / 60) + START_HOUR;
                  openNewClassModal(day.toISOString().split('T')[0], hourClicked.toString().padStart(2,'0'), '00');
                }}
              >
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
          <p>{isTeacher ? 'Arraste as aulas para alterar horários ou clique nas bordas para mudar a duração.' : 'Visualize os horários das suas aulas.'}</p>
        </div>
        {isTeacher && (
          <button className="btn btn-primary" onClick={() => openNewClassModal()}>
            <Plus size={18} /> Agendar Aula
          </button>
        )}
      </div>

      <div className="card glass flex-1 flex flex-col p-0 overflow-hidden relative">
        <div className="p-4 flex justify-between items-center" style={{backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)'}}>
          <div className="flex gap-2 items-center">
            <button className="btn btn-outline" style={{padding: '0.5rem'}} onClick={() => navigate(-1)}><ChevronLeft size={16}/></button>
            <button className="btn btn-outline" style={{padding: '0.5rem'}} onClick={() => navigate(1)}><ChevronRight size={16}/></button>
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
        <div className="modal-overlay flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div className="card glass w-full" style={{maxWidth: '450px', backgroundColor: 'var(--surface)', margin: '1rem'}}>
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

              <div className="input-group">
                <label>Data de Início</label>
                <input type="date" className="input w-full" required value={classForm.date} onChange={(e) => setClassForm({...classForm, date: e.target.value})} />
              </div>
              
              <div className="grid-cols-2" style={{marginBottom: '1rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Hora</label>
                  <select className="input w-full" required value={classForm.startHour} onChange={(e) => setClassForm({...classForm, startHour: e.target.value})}>
                    {HOURS.map(h => <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Minutos</label>
                  <select className="input w-full" required value={classForm.startMinute} onChange={(e) => setClassForm({...classForm, startMinute: e.target.value})}>
                    {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid-cols-2" style={{marginBottom: editMode ? '0' : '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Duração</label>
                  <select className="input w-full" required value={classForm.duration} onChange={(e) => setClassForm({...classForm, duration: parseInt(e.target.value)})}>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1h 30m</option>
                    <option value={120}>2 horas</option>
                  </select>
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

              {!editMode && (
                <div className="mt-4 p-4 border rounded-lg bg-bg">
                  <label className="flex items-center gap-2 cursor-pointer mb-2 font-medium">
                    <input type="checkbox" checked={classForm.isRecurring} onChange={(e) => setClassForm({...classForm, isRecurring: e.target.checked})} />
                    <Repeat size={16} /> Repetir Semanalmente
                  </label>
                  
                  {classForm.isRecurring && (
                    <div className="mt-3">
                      <label className="text-sm text-muted mb-2 block">Dias da semana:</label>
                      <div className="day-selector">
                        {DAYS_OF_WEEK.map(d => (
                          <div key={d.id} className={`day-btn ${classForm.repeatDays.includes(d.id) ? 'selected' : ''}`} onClick={() => toggleRepeatDay(d.id)}>
                            {d.label}
                          </div>
                        ))}
                      </div>
                      <div className="input-group mt-3" style={{marginBottom: 0}}>
                        <label className="text-sm">Repetir até:</label>
                        <input type="date" className="input w-full" required={classForm.isRecurring} value={classForm.repeatUntil} onChange={(e) => setClassForm({...classForm, repeatUntil: e.target.value})} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center mt-6">
                {editMode ? (
                  <button type="button" className="btn btn-outline text-red-500 hover:bg-red-50" onClick={handleDeleteClass} disabled={isSubmitting} style={{borderColor: 'transparent', padding: '0.5rem'}}>
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
