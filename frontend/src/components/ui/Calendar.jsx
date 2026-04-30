import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Calendar({ onDateSelect, selectedDate, sessionDates = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const calendarDays = [];
  // Empty slots for previous month's end
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  // Current month's days
  for (let i = 1; i <= days; i++) {
    calendarDays.push(new Date(year, month, i));
  }

  const isToday = (date) => {
    const today = new Date();
    return date && date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    const sel = new Date(selectedDate);
    return date.getDate() === sel.getDate() &&
           date.getMonth() === sel.getMonth() &&
           date.getFullYear() === sel.getFullYear();
  };

  const hasSession = (date) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return sessionDates.includes(dateStr);
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-premium">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors border border-zinc-800/50"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors border border-zinc-800/50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, idx) => (
          <div key={idx} className="aspect-square relative">
            {date ? (
              <button
                onClick={() => onDateSelect(date.toISOString().split('T')[0])}
                className={cn(
                  "w-full h-full rounded-xl border flex flex-col items-center justify-center transition-all duration-200 group",
                  isSelected(date) 
                    ? "bg-accent text-white border-accent shadow-premium" 
                    : isToday(date)
                      ? "bg-zinc-800/50 border-zinc-700 text-zinc-100"
                      : "bg-zinc-950/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                )}
              >
                <span className="text-sm font-semibold">{date.getDate()}</span>
                {hasSession(date) && (
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1",
                    isSelected(date) ? "bg-white" : "bg-accent"
                  )} />
                )}
              </button>
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
