import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import './Calendar.css';

const Calendar = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const gridCells = Array.from({ length: 35 });

  return (
    <div className="dashboard-wrapper flex flex-col h-full">
      <div className="dashboard-header mb-6 flex justify-between items-center">
        <div>
          <h1>Schedule</h1>
          <p>Manage your class bookings.</p>
        </div>
        {isTeacher && (
          <button className="btn btn-primary">
            <Plus size={18} /> Add Class
          </button>
        )}
      </div>

      <div className="card glass flex-1 flex flex-col p-0 overflow-hidden" style={{padding: 0}}>
        {/* Calendar Header */}
        <div className="calendar-header p-4 flex justify-between items-center" style={{backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)'}}>
          <div className="flex gap-2 items-center">
            <button className="btn btn-outline" style={{padding: '0.5rem'}}><ChevronLeft size={16}/></button>
            <button className="btn btn-outline" style={{padding: '0.5rem'}}><ChevronRight size={16}/></button>
            <span className="font-bold text-lg ml-2">October 2023</span>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary">Month</button>
            <button className="btn btn-outline">Week</button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid flex-1">
          {days.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {gridCells.map((_, i) => (
            <div key={i} className={`calendar-cell ${i === 12 ? 'today' : ''} ${i < 3 ? 'text-muted' : ''}`}>
              <span className="date-number">{i < 3 ? 30 - 2 + i : i - 2}</span>
              {i === 12 && (
                <div className="event bg-primary text-white">14:00 - Lucas S.</div>
              )}
              {i === 14 && (
                <div className="event bg-warning">10:00 - Maria (Reschedule)</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
