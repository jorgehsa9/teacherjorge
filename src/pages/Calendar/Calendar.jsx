import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Repeat, Calendar as CalendarIcon, Clock } from 'lucide-react';
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

  const [currentView, setCurrentView] = useState(window.innerWidth <= 768 ? 'month' : 'week'); // 'month', 'week', 'agenda'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setIsMobileScreen(isMobile);
      if (isMobile) setCurrentView('month');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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

    if (!isTeacher) query = query.ilike('student_email', user.email);

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
    if (currentView === 'agenda') opts.day = 'numeric';
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
      student_email: isTeacher ? '' : user.email, 
      date: dateStr, 
      startHour, 
      startMinute, 
      duration: 60, 
      status: isTeacher ? 'Scheduled' : 'Requested', 
      type: isTeacher ? 'Aula' : 'Solicitação de Aula',
      isRecurring: false, repeatDays: [], repeatUntil: '', feedback: ''
    });
    setIsModalOpen(true);
  };

  const openEditClassModal = (cls) => {
    if (!isTeacher && cls.student_email !== user.email) return; 
    const d = new Date(cls.scheduled_at);
    const dateStr = d.toISOString().split('T')[0];
    const hourStr = d.getHours().toString().padStart(2, '0');
    const minStr = d.getMinutes().toString().padStart(2, '0');

    setEditMode(true);
    setSelectedClassId(cls.id);
    setClassForm({ 
      student_email: cls.student_email, date: dateStr, startHour: hourStr, startMinute: minStr, 
      duration: cls.duration, status: cls.status, type: cls.type || 'Aula',
      isRecurring: false, repeatDays: [], repeatUntil: '', feedback: ''
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
      status: classForm.status,
      type: classForm.type
    };

    let error;
    if (editMode) {
      const { error: updateError } = await supabase.from('Classes').update(classData).eq('id', selectedClassId);
      error = updateError;
      
      // Save feedback if class is completed and feedback is provided
      if (!updateError && classForm.status === 'Completed' && classForm.feedback?.trim() !== '') {
        const { error: fbError } = await supabase.from('Materials').insert([{
          student_email: classForm.student_email,
          title: `Diário de Aula (${new Date(classForm.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })})`,
          file_type: 'Feedback',
          file_url: classForm.feedback
        }]);
        if (fbError) console.error("Error saving feedback:", fbError);
      }
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
    const isMobile = window.innerWidth <= 768;

    return (
      <div className="flex flex-col h-full w-full">
        <div className="calendar-month-grid">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} className="calendar-month-day-header">{d}</div>)}
          {days.map((day, i) => {
            const isToday = new Date().toDateString() === day.toDateString();
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const dayClasses = classes.filter(c => new Date(c.scheduled_at).toDateString() === day.toDateString());

            return (
              <div key={i} className={`month-cell ${!isCurrentMonth ? 'different-month' : ''} ${isToday ? 'today' : ''}`}
                   onClick={() => { openNewClassModal(day.toISOString().split('T')[0]); }}>
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

  const renderAgendaEventsList = () => {
    const selectedDateStr = currentDate.toDateString();
    const dayClasses = classes
      .filter(c => new Date(c.scheduled_at).toDateString() === selectedDateStr)
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

    return (
      <div className="agenda-events-list flex flex-col p-4 md:p-8 flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="flex flex-col mb-6 border-b pb-4" style={{ borderColor: 'var(--border-light)' }}>
          <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--text-muted)', letterSpacing: '2px' }}>
            {currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
          </h3>
          <h2 className="text-2xl md:text-3xl font-black mt-1" style={{ color: 'var(--text-main)' }}>
            {currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
          </h2>
        </div>
        
        {dayClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center opacity-80" style={{ padding: '4rem 0' }}>
            <div className="flex items-center justify-center mb-6" style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <CalendarIcon size={32} style={{ opacity: 0.6 }} />
            </div>
            <p className="font-extrabold text-lg" style={{ color: 'var(--text-main)' }}>Nenhuma aula agendada</p>
            <p className="text-sm mt-2 text-center max-w-xs font-semibold" style={{ color: '#64748b' }}>Aproveite o tempo livre para preparar materiais ou descansar!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dayClasses.map((cls, index) => {
              const classTime = new Date(cls.scheduled_at);
              const colorClass = COLORS[cls.student_email.length % COLORS.length];
              const dotColor = colorClass === 'bg-primary' ? 'var(--primary)' : 
                               colorClass === 'bg-warning' ? 'var(--warning)' : 
                               colorClass === 'bg-success' ? 'var(--success)' : 
                               '#8b5cf6'; // purple

              return (
                <div key={cls.id} className="ios-event-card flex gap-4 w-full cursor-pointer p-4" style={{ borderLeftColor: dotColor }} onClick={() => openEditClassModal(cls)}>
                  {/* Left Column: Time */}
                  <div className="flex flex-col items-end justify-start w-12 flex-shrink-0">
                    <span className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
                      {classTime.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <span className="text-xs font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>
                      {cls.duration}m
                    </span>
                  </div>

                  {/* Right Column: Event Details */}
                  <div className="flex-1 flex flex-col justify-center border-l pl-4" style={{ borderColor: 'var(--border-light)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-base" style={{ color: 'var(--text-main)' }}>
                        {getStudentName(cls.student_email)}
                      </span>
                      {cls.type === 'Reunião' && <span>🤝</span>}
                      {!cls.type || cls.type === 'Aula' ? <span>📚</span> : null}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      {cls.status === 'Completed' ? '✅ Concluída' : cls.status === 'Cancelled' ? '❌ Cancelada' : cls.status === 'Requested' ? '⏳ Pendente' : '📍 Online / Local'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderAgendaView = () => {
    const stripDays = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 3 + i);
      return d;
    });

    const selectedDateStr = currentDate.toDateString();

    return (
      <div className="agenda-view flex flex-col h-full w-full bg-bg">
        {/* Horizontal Date Strip */}
        <div className="agenda-date-strip flex justify-between md:justify-center md:gap-8 items-center px-4 py-6 md:px-8 border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {stripDays.slice(0, 7).map((day, i) => {
            const isSelected = day.toDateString() === selectedDateStr;
            const dayLetter = day.toLocaleString('pt-BR', { weekday: 'narrow' }).toUpperCase();
            const dateNumber = day.getDate();
            const dayClasses = classes.filter(c => new Date(c.scheduled_at).toDateString() === day.toDateString());
            const hasEvent = dayClasses.length > 0;
            
            return (
              <div 
                key={i} 
                className="flex flex-col items-center justify-center cursor-pointer transition-all duration-300 flex-shrink-0"
                style={{
                  width: '44px',
                  height: '54px',
                  borderRadius: '22px',
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? '#fff' : 'var(--text-muted)',
                  border: isSelected ? 'none' : '1px solid transparent',
                  margin: '0 2px'
                }}
                onClick={() => setCurrentDate(day)}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>{dayLetter}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '900', marginTop: '-2px' }}>{dateNumber}</span>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: isSelected ? '#fff' : hasEvent ? 'var(--primary)' : 'transparent', marginTop: '2px' }} />
              </div>
            );
          })}
        </div>

        {renderAgendaEventsList()}
      </div>
    );
  };
  return (
    <div className="dashboard-wrapper flex flex-col h-full p-2 md:p-4 animate-fade-in-up">
      
      {/* HEADER */}
      <div className="card glass mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 md:p-6" style={{ borderLeft: '6px solid var(--primary)', borderRadius: '20px' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-black m-0 tracking-tight" style={{ background: 'linear-gradient(90deg, var(--primary) 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Agenda
          </h1>
          <p className="text-xs md:text-sm m-0 mt-1 font-semibold" style={{ color: '#64748b' }}>
            {isTeacher ? 'Arraste horários ou clique nas aulas.' : 'Solicite aulas ou acompanhe seu cronograma.'}
          </p>
        </div>
        <button 
          className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2 transition-all duration-300 text-sm py-2 px-4" 
          style={{ borderRadius: '12px', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)', fontWeight: 'bold' }} 
          onClick={() => openNewClassModal()}
        >
          <Plus size={16} strokeWidth={3} /> {isTeacher ? 'Nova Aula' : 'Novo Evento'}
        </button>
      </div>

      <div className="card glass flex-1 flex flex-col p-0 overflow-hidden relative shadow-lg" style={{ borderRadius: '20px', borderColor: 'var(--border)' }}>
        
        {/* CONTROLS */}
        <div className="flex flex-col gap-4 p-3 md:p-5" style={{ background: 'linear-gradient(180deg, rgba(var(--surface-rgb), 0.9) 0%, rgba(var(--surface-rgb), 0.5) 100%)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex w-full p-1" style={{ borderRadius: '14px', backgroundColor: 'rgba(0,0,0,0.04)', border: '1px solid var(--border)' }}>
              <button 
                className="flex-1 text-xs md:text-sm font-extrabold transition-all duration-300 py-2 px-2 md:px-5"
                style={{
                  borderRadius: '10px',
                  backgroundColor: currentView === 'month' ? 'var(--surface)' : 'transparent',
                  color: currentView === 'month' ? 'var(--text-main)' : 'var(--text-muted)',
                  boxShadow: currentView === 'month' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  border: 'none'
                }}
                onClick={() => setCurrentView('month')}
              >
                Mês
              </button>
              <button 
                className="flex-1 text-xs md:text-sm font-extrabold transition-all duration-300 py-2 px-2 md:px-5"
                style={{
                  borderRadius: '10px',
                  backgroundColor: currentView === 'week' ? 'var(--surface)' : 'transparent',
                  color: currentView === 'week' ? 'var(--text-main)' : 'var(--text-muted)',
                  boxShadow: currentView === 'week' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  border: 'none'
                }}
                onClick={() => setCurrentView('week')}
              >
                Semana
              </button>
              <button 
                className="flex-1 text-xs md:text-sm font-extrabold transition-all duration-300 py-2 px-2 md:px-5"
                style={{
                  borderRadius: '10px',
                  backgroundColor: currentView === 'agenda' ? 'var(--surface)' : 'transparent',
                  color: currentView === 'agenda' ? 'var(--text-main)' : 'var(--text-muted)',
                  boxShadow: currentView === 'agenda' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  border: 'none'
                }}
                onClick={() => setCurrentView('agenda')}
              >
                Agenda
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 w-full">
              <span className="font-extrabold text-lg md:text-2xl capitalize tracking-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: 'var(--text-main)' }}>
                {getHeaderTitle()}
              </span>
              <div className="flex items-center gap-1 p-1 flex-shrink-0" style={{ borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)' }}>
                <button className="flex items-center justify-center transition-all duration-200" style={{ width: '32px', height: '32px', borderRadius: '8px', color: 'var(--text-main)', border: 'none', background: 'transparent' }} onClick={() => navigate(-1)}><ChevronLeft size={18}/></button>
                <button className="font-black text-xs md:text-sm transition-all duration-200 px-2 py-1" style={{ borderRadius: '8px', color: 'var(--text-main)', border: 'none', background: 'transparent' }} onClick={goToToday}>HOJE</button>
                <button className="flex items-center justify-center transition-all duration-200" style={{ width: '32px', height: '32px', borderRadius: '8px', color: 'var(--text-main)', border: 'none', background: 'transparent' }} onClick={() => navigate(1)}><ChevronRight size={18}/></button>
              </div>
            </div>
          </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center text-muted">Carregando agenda...</div>
        ) : (
          <div className="calendar-wrapper">
            {currentView === 'month' ? renderMonthView() : currentView === 'agenda' ? renderAgendaView() : renderWeekOrDayView()}
          </div>
        )}
      </div>

      {/* Modal Adicionar/Editar Aula */}
      {isModalOpen && (
        <div className="modal-overlay flex items-center justify-center bottom-sheet-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div className="card glass w-full" style={{maxWidth: '450px', backgroundColor: 'var(--surface)', margin: '1rem'}}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{margin: 0}}>{editMode ? (isTeacher ? 'Editar Aula' : 'Detalhes do Evento') : (isTeacher ? 'Agendar Aula' : 'Novo Evento')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveClass}>
              {editMode && classForm.status === 'Requested' && classForm.type === 'Solicitação de Aula' && isTeacher && (
                <div className="mb-4 p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid var(--warning)' }}>
                   <div>
                     <p className="font-bold text-warning m-0">Solicitação de Aula</p>
                     <p className="text-sm text-muted m-0">O aluno solicitou este horário. Confirme para agendar e faturar.</p>
                   </div>
                   <button 
                     type="button" 
                     className="btn btn-sm" 
                     style={{ backgroundColor: 'var(--warning)', color: 'white', fontWeight: 'bold' }}
                     onClick={() => setClassForm({...classForm, status: 'Scheduled', type: 'Aula'})}
                   >
                     Confirmar Aula
                   </button>
                </div>
              )}
              {isTeacher && (
                <div className="input-group">
                  <label>Aluno</label>
                  <select className="input w-full" required value={classForm.student_email} onChange={(e) => setClassForm({...classForm, student_email: e.target.value})}>
                    <option value="">Selecione um aluno...</option>
                    {students.map(s => <option key={s.email} value={s.email}>{s.name} ({s.email})</option>)}
                  </select>
                </div>
              )}

              <div className="input-group">
                <label>Tipo de Evento</label>
                {isTeacher ? (
                  <select className="input w-full" required value={classForm.type} onChange={(e) => setClassForm({...classForm, type: e.target.value})}>
                    {classForm.type === 'Solicitação de Aula' && <option value="Solicitação de Aula">Solicitação de Aula (Pendente)</option>}
                    <option value="Aula">Aula (Será cobrada)</option>
                    <option value="Reunião">Reunião / Outro (Não será cobrado)</option>
                  </select>
                ) : (
                  <select className="input w-full" required value={classForm.type} onChange={(e) => {
                    const t = e.target.value;
                    setClassForm({...classForm, type: t, status: t === 'Evento Particular' ? 'Scheduled' : 'Requested'});
                  }}>
                    <option value="Solicitação de Aula">Solicitar Aula com o Professor</option>
                    <option value="Evento Particular">Evento Particular (Apenas Lembrete)</option>
                  </select>
                )}
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
                      {classForm.status === 'Requested' && <option value="Requested">Pendente (Solicitada)</option>}
                      <option value="Scheduled">Agendada</option>
                      <option value="Completed">Concluída</option>
                      <option value="Cancelled">Cancelada</option>
                    </select>
                  </div>
                )}
              </div>

              {editMode && classForm.status === 'Completed' && classForm.type === 'Aula' && isTeacher && (
                <div className="input-group mt-4 animate-fade-in-up">
                  <label className="text-primary font-bold flex items-center gap-2 mb-2">Diário de Aula & Feedback</label>
                  <textarea 
                    className="input w-full" 
                    rows="3" 
                    placeholder="O que foi ensinado, vocabulário novo, pontos de melhoria..."
                    value={classForm.feedback}
                    onChange={(e) => setClassForm({...classForm, feedback: e.target.value})}
                    style={{ borderRadius: '12px', resize: 'vertical' }}
                  ></textarea>
                  <p className="text-xs text-muted mt-1">Este feedback ficará salvo no Histórico do aluno.</p>
                </div>
              )}

              {!editMode && isTeacher && (
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
