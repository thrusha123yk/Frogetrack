import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { 
  Search, 
  MapPin, 
  Hash, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  User,
  Info,
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function History() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [attendanceData, setAttendanceData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      const { data } = await supabase.from('students').select('*').order('name');
      if (data) setStudents(data);
    }
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;
    
    async function fetchHistory() {
      setLoading(true);
      const { data: allSessions } = await supabase.from('sessions').select('*').order('date', { ascending: true });
      const { data: att } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', selectedStudent.id);

      setSessions(allSessions || []);
      setAttendanceData(att || []);
      setLoading(false);
    }
    fetchHistory();
  }, [selectedStudent]);

  const filteredStudents = search === '' 
    ? [] 
    : students.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.usn.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5);

  const getPercentageColor = (pct) => {
    if (pct >= 75) return 'text-success-fg';
    if (pct >= 60) return 'text-warning-fg';
    return 'text-danger-fg';
  };

  let presentCount = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const tableRows = sessions.map(session => {
    const record = attendanceData.find(a => a.session_id === session.id);
    let status = 'no_record';
    
    if (record) {
      if (record.present) {
        status = 'present';
        presentCount++;
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        status = 'absent';
        tempStreak = 0;
      }
    } else {
      tempStreak = 0;
    }
    
    return { ...session, status };
  });

  for (let i = tableRows.length - 1; i >= 0; i--) {
    if (tableRows[i].status === 'present') currentStreak++;
    else if (tableRows[i].status === 'absent') break;
    // skip no_record for current streak calculation if desired, but here we break
  }

  const activeSessionsCount = tableRows.filter(r => r.status !== 'no_record').length;
  const pct = activeSessionsCount > 0 ? Math.round((presentCount / activeSessionsCount) * 100) : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Student History</h1>
        <p className="text-zinc-500 font-medium">Search and analyze individual attendance patterns and engagement metrics.</p>
      </div>

      {/* Search Header */}
      <div className="relative z-20 max-w-2xl">
        <div className="relative group">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            className="input pl-12 w-full h-14 text-base bg-zinc-900/40 border-zinc-800 focus:border-accent/50 focus:ring-accent/20 rounded-2xl transition-all shadow-premium"
            placeholder="Search by name or USN (e.g. 4SH24CS...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {search !== '' && filteredStudents.length > 0 && (
          <div className="absolute top-full left-0 mt-3 w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-premium-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
            {filteredStudents.map(s => (
              <button
                key={s.id}
                className="w-full text-left px-6 py-4 hover:bg-zinc-800/50 border-b border-zinc-800/50 last:border-0 flex justify-between items-center transition-colors group"
                onClick={() => {
                  setSelectedStudent(s);
                  setSearch('');
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-accent transition-colors">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-100 group-hover:text-accent transition-colors">{s.name}</p>
                    <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase mt-0.5">{s.usn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-zinc-400 uppercase tracking-widest">
                    {s.branch_code}
                  </span>
                  <ArrowRight size={14} className="text-zinc-600 group-hover:text-accent transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedStudent ? (
        <Card className="py-24 flex flex-col items-center justify-center text-center bg-zinc-900/10 border-dashed">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 mb-8">
            <Search size={40} />
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">No Student Selected</h2>
          <p className="text-zinc-500 max-w-sm">
            Use the search bar above to look up a student and view their detailed participation history.
          </p>
        </Card>
      ) : loading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="h-64 bg-zinc-900/50"></Card>
            <Card className="lg:col-span-2 h-64 bg-zinc-900/50"></Card>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Profile & Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Student Info Card */}
            <Card className="relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-all duration-700" />
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-2xl font-bold">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-zinc-100">{selectedStudent.name}</h2>
                    <div className="flex gap-2">
                      <StatusPill status="success">Active</StatusPill>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Branch</p>
                    <p className="text-sm font-semibold text-zinc-200">{selectedStudent.branch_code}</p>
                  </div>
                  <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Batch</p>
                    <p className="text-sm font-semibold text-zinc-200">{selectedStudent.batch}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-800/50 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Attendance</p>
                    <p className={cn("text-3xl font-bold tracking-tight", getPercentageColor(pct))}>{pct}%</p>
                  </div>
                  <ProgressRing percentage={pct} size={64} strokeWidth={6} color={pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#f43f5e'} />
                </div>
              </div>
            </Card>

            {/* Heatmap & Streak Analytics */}
            <Card className="lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-accent" /> Attendance Heatmap
                  </span>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-success-fg" />
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">Present</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-danger-fg" />
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">Absent</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  {tableRows.map((r, i) => (
                    <div 
                      key={i} 
                      title={`${r.date}: ${r.topic} - ${r.status}`}
                      className={cn(
                        "w-9 h-9 rounded-xl border transition-all duration-300 hover:scale-110 cursor-help flex items-center justify-center",
                        r.status === 'present' ? "bg-success-bg border-success-border text-success-fg" :
                        r.status === 'absent' ? "bg-danger-bg border-danger-border text-danger-fg" :
                        "bg-zinc-950/50 border-zinc-800/50 text-zinc-700"
                      )}
                    >
                      {r.status === 'present' ? <CheckCircle2 size={16} /> : 
                       r.status === 'absent' ? <XCircle size={16} /> : 
                       <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-10 mt-10 border-t border-zinc-800/50">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={12} /> Conducted
                  </p>
                  <p className="text-2xl font-bold text-zinc-100">{presentCount} <span className="text-sm font-normal text-zinc-500">/ {activeSessionsCount}</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 text-warning-fg">
                    <Flame size={12} /> Current Streak
                  </p>
                  <p className="text-2xl font-bold text-zinc-100">{currentStreak} Sessions</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 text-accent">
                    <TrendingUp size={12} /> Longest
                  </p>
                  <p className="text-2xl font-bold text-zinc-100">{longestStreak} Sessions</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Detailed Logs Table */}
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/20">
              <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Full Attendance Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="pl-6">Session Date</th>
                    <th>Topic</th>
                    <th>Status</th>
                    <th>Marked By</th>
                    <th className="pr-6 text-right">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {tableRows.slice().reverse().map((r, i) => (
                    <tr key={i} className="hover:bg-zinc-800/20 transition-colors group">
                      <td className="pl-6 text-zinc-400 font-mono text-xs">{r.date}</td>
                      <td className="font-semibold text-zinc-100">{r.topic}</td>
                      <td>
                        {r.status === 'present' ? <StatusPill status="success">Present</StatusPill> :
                         r.status === 'absent' ? <StatusPill status="danger">Absent</StatusPill> :
                         <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2 py-1 rounded border border-zinc-800 bg-zinc-950/50">No Record</span>}
                      </td>
                      <td className="text-zinc-500 text-sm">Nischay B K</td>
                      <td className="pr-6 text-right font-mono text-zinc-400">{r.duration_hours || '2.0'}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
