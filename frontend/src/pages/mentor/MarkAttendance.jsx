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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Schedule & Attendance</h1>
          <p className="text-zinc-500 font-medium">Select a date to manage sessions and track student participation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Calendar Column */}
        <div className="lg:col-span-5 space-y-6">
          <CalendarComponent 
            selectedDate={selectedDate} 
            onDateSelect={setSelectedDate}
            sessionDates={sessionDates}
          />
          
          <Card className="bg-accent/5 border-accent/20">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
                <Info size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Quick Tip</h4>
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  Dates with a <span className="text-accent font-bold">dot</span> already have a session scheduled. Click any date to view details or create a new session.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Contextual Column */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="h-[400px] flex items-center justify-center bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : session ? (
            <div className="space-y-6">
              {/* Session Overview Card */}
              <Card className="border-accent/20 bg-accent/5">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-accent">
                      <CalendarIcon size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">{selectedDate}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-100">{session.topic}</h2>
                  </div>
                  <StatusPill status="success">Active Session</StatusPill>
                </div>
                
                <div className="flex gap-6 mt-6 pt-6 border-t border-zinc-800/50">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Duration</p>
                    <p className="text-sm font-medium text-zinc-200">{session.duration_hours} Hours</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Type</p>
                    <p className="text-sm font-medium text-zinc-200 capitalize">{session.session_type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Attendance</p>
                    <p className="text-sm font-medium text-zinc-200">{presentCount} / {students.length} Present</p>
                  </div>
                </div>
              </Card>

              {/* Student Attendance List */}
              <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/30">
                  <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Student List</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => markAll(true)} className="text-xs h-8 px-3">Mark All Present</Button>
                    <Button variant="ghost" onClick={() => markAll(false)} className="text-xs h-8 px-3">Mark All Absent</Button>
                  </div>
                </div>
                
                <div className="divide-y divide-zinc-800/50 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {students.map(s => (
                    <label 
                      key={s.id} 
                      className={cn(
                        "flex items-center p-4 hover:bg-zinc-800/30 cursor-pointer transition-colors group",
                        attendanceState[s.id] && "bg-accent/5"
                      )}
                    >
                      <div className="mr-4">
                        <div className={cn(
                          "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                          attendanceState[s.id] 
                            ? "bg-accent border-accent text-white" 
                            : "bg-zinc-950 border-zinc-700 text-transparent"
                        )}>
                          <CheckCircle2 size={14} strokeWidth={3} />
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={!!attendanceState[s.id]}
                          onChange={() => toggleStudent(s.id)}
                        />
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-100">{s.name}</p>
                          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{s.usn}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-zinc-500 uppercase tracking-widest">
                          {s.branch_code}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="p-6 bg-zinc-900/30 border-t border-zinc-800/50 flex justify-end">
                  <Button 
                    onClick={executeSave} 
                    disabled={saving || !hasChanges}
                    className="gap-2"
                  >
                    {saving ? 'Saving...' : 'Save Changes'} <ArrowRight size={16} />
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            /* Create Session Empty State */
            <Card className="h-full border-dashed border-zinc-800 bg-zinc-950/40 flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-6">
                <Plus size={32} />
              </div>
              <h2 className="text-xl font-bold text-zinc-100 mb-2">No Session Scheduled</h2>
              <p className="text-sm text-zinc-500 max-w-xs mb-8">
                There is no session recorded for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Create one to begin.
              </p>
              
              <form onSubmit={handleCreateSession} className="w-full max-w-sm space-y-4 text-left">
                <Input 
                  label="Session Topic" 
                  value={newTopic} 
                  onChange={e => setNewTopic(e.target.value)} 
                  placeholder="e.g. Introduction to React"
                  required 
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Duration (Hours)" 
                    type="number" 
                    step="0.5" 
                    value={newDuration} 
                    onChange={e => setNewDuration(e.target.value)} 
                  />
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-zinc-400 block px-0.5">Session Type</label>
                    <select 
                      className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 transition-all duration-200"
                      value={newType}
                      onChange={e => setNewType(e.target.value)}
                    >
                      <option value="offline">Offline</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full mt-4 h-11">Create Session & Start</Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
