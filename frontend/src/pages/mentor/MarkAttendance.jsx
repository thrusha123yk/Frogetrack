import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusPill } from '../../components/ui/StatusPill';
import { Calendar as CalendarComponent } from '../../components/ui/Calendar';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Clock, 
  Users, 
  X, 
  AlertTriangle,
  Plus,
  ArrowRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function MarkAttendance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [originalState, setOriginalState] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionDates, setSessionDates] = useState([]);

  // New Session Form State
  const [newTopic, setNewTopic] = useState('');
  const [newDuration, setNewDuration] = useState('2.0');
  const [newType, setNewType] = useState('offline');

  useEffect(() => {
    fetchSessionDates();
  }, []);

  useEffect(() => {
    fetchDataForDate(selectedDate);
  }, [selectedDate]);

  async function fetchSessionDates() {
    const { data } = await supabase.from('sessions').select('date');
    if (data) {
      setSessionDates(data.map(d => d.date));
    }
  }

  async function fetchDataForDate(date) {
    setLoading(true);
    setSession(null);
    setAttendanceState({});
    setOriginalState({});

    try {
      // 1. Fetch active students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      setStudents(studentsData || []);

      // 2. Fetch session
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      if (sessionData) {
        setSession(sessionData);
        
        // 3. Fetch existing attendance
        const { data: attData } = await supabase
          .from('attendance')
          .select('student_id, present')
          .eq('session_id', sessionData.id);

        if (attData && attData.length > 0) {
          const stateMap = {};
          attData.forEach(a => {
            stateMap[a.student_id] = a.present;
          });
          setAttendanceState(stateMap);
          setOriginalState(stateMap);
        } else {
          const emptyMap = {};
          studentsData?.forEach(s => { emptyMap[s.id] = false; });
          setAttendanceState(emptyMap);
        }
      } else {
        const emptyMap = {};
        studentsData?.forEach(s => { emptyMap[s.id] = false; });
        setAttendanceState(emptyMap);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newTopic) return;
    
    const month = new Date(selectedDate).getMonth() + 1;
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        date: selectedDate,
        topic: newTopic,
        duration_hours: parseFloat(newDuration),
        session_type: newType,
        month_number: month
      })
      .select()
      .maybeSingle();
      
    if (!error && data) {
      setSession(data);
      setSessionDates([...sessionDates, selectedDate]);
    }
  };

  const toggleStudent = (id) => {
    setAttendanceState(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const markAll = (present) => {
    const newState = {};
    students.forEach(s => { newState[s.id] = present; });
    setAttendanceState(newState);
  };

  const executeSave = async () => {
    setSaving(true);
    try {
      const inserts = students.map(s => ({
        student_id: s.id,
        session_id: session.id,
        present: !!attendanceState[s.id],
        marked_by: user?.display_name || 'System'
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(inserts, { onConflict: 'student_id,session_id' });

      if (error) throw error;
      
      setOriginalState({ ...attendanceState });
      alert('Attendance saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceState).filter(Boolean).length;
  const hasChanges = JSON.stringify(attendanceState) !== JSON.stringify(originalState);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Mark <span className="text-neon-pink">Attendance</span>
          </h1>
          <p className="text-sm text-zinc-500 font-medium">Manage daily student attendance and sessions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Calendar Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-4 bg-zinc-950/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl">
            <CalendarComponent 
              selectedDate={selectedDate} 
              onDateSelect={setSelectedDate}
              sessionDates={sessionDates}
            />
          </div>
          
          <Card className="bg-neon-cyan/5 border-neon-cyan/20 glow-neon-cyan">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 flex items-center justify-center text-neon-cyan shrink-0">
                <Info size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Tip</h4>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                  Dates with a <span className="text-neon-cyan font-bold">dot</span> have scheduled sessions.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Contextual Column */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="h-[400px] flex items-center justify-center bg-zinc-900/10 rounded-3xl border border-dashed border-zinc-800 animate-pulse">
              <div className="w-10 h-10 border-4 border-neon-pink border-t-transparent rounded-full animate-spin glow-neon-pink"></div>
            </div>
          ) : session ? (
            <div className="space-y-6">
              {/* Session Overview Card */}
              <Card className="border-neon-green/20 bg-neon-green/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <CalendarIcon size={120} />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-neon-green">
                      <Clock size={16} className="animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider">{selectedDate}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{session.topic}</h2>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-xs font-bold text-neon-green uppercase tracking-widest">
                    ACTIVE SESSION
                  </div>
                </div>
                
                <div className="flex gap-8 mt-8 pt-8 border-t border-white/5 relative z-10">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Duration</p>
                    <p className="text-sm font-bold text-zinc-200">{session.duration_hours} HRS</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Type</p>
                    <p className="text-sm font-bold text-neon-cyan uppercase">{session.session_type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Progress</p>
                    <p className="text-sm font-bold text-neon-green">{presentCount} / {students.length} Present</p>
                  </div>
                </div>
              </Card>

              {/* Student Attendance List */}
              <Card className="p-0 overflow-hidden border-white/5 bg-zinc-950/40 backdrop-blur-xl shadow-2xl">
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900/20">
                  <h3 className="text-lg font-bold text-white tracking-tight">Student List</h3>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => markAll(true)} className="text-xs font-bold uppercase tracking-wider h-8 px-4 border border-zinc-800 hover:border-neon-green/30 hover:text-neon-green">Mark All Present</Button>
                    <Button variant="ghost" onClick={() => markAll(false)} className="text-xs font-bold uppercase tracking-wider h-8 px-4 border border-zinc-800 hover:border-neon-pink/30 hover:text-neon-pink">Mark All Absent</Button>
                  </div>
                </div>
                
                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {students.length > 0 ? (
                    students.map(s => (
                      <label 
                        key={s.id} 
                        className={cn(
                          "flex items-center p-5 hover:bg-white/5 cursor-pointer transition-all group",
                          attendanceState[s.id] && "bg-neon-green/5"
                        )}
                      >
                        <div className="mr-5">
                          <div className={cn(
                            "w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-lg",
                            attendanceState[s.id] 
                              ? "bg-neon-green border-neon-green text-void shadow-[0_0_15px_rgba(57,255,20,0.4)]" 
                              : "bg-void border-zinc-800 text-transparent"
                          )}>
                            <CheckCircle2 size={16} strokeWidth={3} className={attendanceState[s.id] ? "scale-100" : "scale-0 transition-transform"} />
                          </div>
                          <input 
                            id={`attendance-check-${s.id}`}
                            name={`attendance-check-${s.id}`}
                            type="checkbox" 
                            className="hidden"
                            checked={!!attendanceState[s.id]}
                            onChange={() => toggleStudent(s.id)}
                          />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">{s.name}</p>
                            <p className="text-xs text-zinc-600 mt-0.5">{s.usn} | {s.branch_code}</p>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded text-xs font-bold tracking-wider uppercase transition-all",
                            attendanceState[s.id] 
                              ? "bg-neon-green/10 text-neon-green border border-neon-green/20" 
                              : "bg-zinc-900 text-zinc-700 border border-zinc-800"
                          )}>
                            {attendanceState[s.id] ? 'Present' : 'Absent'}
                          </div>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="p-20 text-center space-y-4">
                      <Users size={48} className="mx-auto text-zinc-800" />
                      <p className="text-sm text-zinc-600 font-bold uppercase tracking-widest">No Students Found</p>
                    </div>
                  )}
                </div>

                <div className="p-8 bg-zinc-900/40 border-t border-white/5 flex justify-end">
                  <Button 
                    onClick={executeSave} 
                    disabled={saving || !hasChanges}
                    className={cn(
                      "gap-3 h-12 px-8 font-bold uppercase tracking-widest transition-all glow-neon-pink border-none",
                      hasChanges ? "bg-neon-pink hover:bg-neon-pink/80 text-white" : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {saving ? 'Saving...' : 'Save Attendance'} <ArrowRight size={18} />
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            /* Create Session Empty State */
            <Card className="h-full border-dashed border-zinc-800 bg-zinc-950/40 flex flex-col items-center justify-center text-center p-16 rounded-[40px]">
              <div className="w-20 h-20 rounded-[30px] bg-void border border-zinc-800 flex items-center justify-center text-zinc-700 mb-8 shadow-inner group-hover:border-neon-cyan transition-all">
                <Plus size={40} className="text-zinc-800 group-hover:text-neon-cyan transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Create Session</h2>
              <p className="text-sm text-zinc-600 font-medium max-w-xs mb-10 leading-relaxed">
                No session scheduled for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Create a new session to begin.
              </p>
              
              <form onSubmit={handleCreateSession} className="w-full max-w-sm space-y-6 text-left">
                <Input 
                  label="Topic" 
                  value={newTopic} 
                  onChange={e => setNewTopic(e.target.value)} 
                  placeholder="e.g. System Design Analysis"
                  required 
                  className="bg-void/50 border-zinc-800 focus:border-neon-cyan h-12 font-bold text-sm tracking-tight"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Duration (HRS)" 
                    type="number" 
                    step="0.5" 
                    value={newDuration} 
                    onChange={e => setNewDuration(e.target.value)} 
                    className="bg-void/50 border-zinc-800 focus:border-neon-cyan h-12"
                  />
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest block px-1">Session Type</label>
                    <select 
                      id="new-session-type"
                      name="new-session-type"
                      className="flex h-12 w-full rounded-2xl border border-zinc-800 bg-void px-4 py-2 text-xs font-bold uppercase tracking-widest text-white focus:border-neon-cyan focus-visible:outline-none transition-all duration-300"
                      value={newType}
                      onChange={e => setNewType(e.target.value)}
                    >
                      <option value="offline">Offline</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full mt-6 h-14 bg-neon-cyan hover:bg-neon-cyan/80 text-void font-bold uppercase tracking-widest glow-neon-cyan border-none">
                  Create Session
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
