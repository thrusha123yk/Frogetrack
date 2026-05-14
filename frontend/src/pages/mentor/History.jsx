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
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Student <span className="text-neon-pink">History</span> <span className="text-neon-cyan">&</span> <span className="text-neon-green">Metrics</span>
        </h1>
        <p className="text-sm text-zinc-500 font-medium">Analyze student attendance and performance trends</p>
      </div>

      {/* Search Header */}
      <div className="relative z-20 max-w-2xl">
        <div className="relative group">
          <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-neon-cyan transition-all group-focus-within:scale-110" />
          <input
            id="student-search"
            name="student-search"
            type="text"
            className="w-full h-16 pl-14 pr-6 rounded-2xl bg-zinc-950/40 border border-white/5 text-white placeholder:text-zinc-700 focus:border-neon-cyan/50 focus:ring-4 focus:ring-neon-cyan/10 transition-all shadow-2xl backdrop-blur-xl font-bold tracking-wide"
            placeholder="Search by name or USN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute inset-0 rounded-2xl bg-neon-cyan/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
        </div>
        
        {search !== '' && filteredStudents.length > 0 && (
          <div className="absolute top-full left-0 mt-4 w-full bg-zinc-950 border border-white/5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-top-4 duration-300 backdrop-blur-3xl">
            {filteredStudents.map(s => (
              <button
                key={s.id}
                className="w-full text-left px-8 py-5 hover:bg-white/5 border-b border-white/5 last:border-0 flex justify-between items-center transition-all group"
                onClick={() => {
                  setSelectedStudent(s);
                  setSearch('');
                }}
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-neon-cyan group-hover:border-neon-cyan/30 transition-all">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white group-hover:text-neon-cyan transition-colors">{s.name}</p>
                    <p className="text-xs text-zinc-600 mt-1">{s.usn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold bg-void border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-500 uppercase tracking-widest">
                    {s.branch_code}
                  </span>
                  <ArrowRight size={18} className="text-zinc-800 group-hover:text-neon-cyan transition-all group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedStudent ? (
        <Card className="py-32 flex flex-col items-center justify-center text-center bg-zinc-950/20 border-dashed border-zinc-800 rounded-[40px]">
          <div className="w-24 h-24 rounded-[30px] bg-void border border-zinc-800 flex items-center justify-center text-zinc-800 mb-10 shadow-inner">
            <Search size={48} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-3">Select a Student</h2>
          <p className="text-sm text-zinc-600 font-medium max-w-sm leading-relaxed">
            Search for a student to view their attendance history and performance metrics.
          </p>
        </Card>
      ) : loading ? (
        <div className="space-y-8">
           <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto glow-neon-cyan"></div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Profile & Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Student Info Card */}
            <Card className="relative overflow-hidden group border-white/5 bg-zinc-950/40 backdrop-blur-xl">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-cyan/5 rounded-full blur-[80px] group-hover:bg-neon-cyan/10 transition-all duration-1000" />
              
              <div className="space-y-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-neon-cyan to-blue-600 flex items-center justify-center text-void text-4xl font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">{selectedStudent.name}</h2>
                    <div className="flex gap-2">
                      <div className="px-3 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-xs font-bold text-neon-green uppercase tracking-widest">
                        ACTIVE
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-void/50 border border-white/5 rounded-2xl p-4">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">Branch</p>
                    <p className="text-sm font-bold text-white">{selectedStudent.branch_code}</p>
                  </div>
                  <div className="bg-void/50 border border-white/5 rounded-2xl p-4">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">Batch</p>
                    <p className="text-sm font-bold text-white">{selectedStudent.batch}</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Attendance Rate</p>
                    <p className={cn("text-4xl font-bold tracking-tight", 
                      pct >= 75 ? "text-neon-green drop-shadow-[0_0_8px_rgba(57,255,20,0.4)]" : 
                      pct >= 60 ? "text-neon-cyan drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]" : 
                      "text-neon-pink drop-shadow-[0_0_8px_rgba(255,0,255,0.4)]"
                    )}>{pct}%</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-current opacity-10 blur-xl rounded-full" />
                    <ProgressRing 
                      percentage={pct} 
                      size={80} 
                      strokeWidth={8} 
                      color={pct >= 75 ? '#39ff14' : pct >= 60 ? '#00ffff' : '#ff00ff'} 
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Heatmap & Streak Analytics */}
            <Card className="lg:col-span-2 flex flex-col justify-between border-white/5 bg-zinc-950/40 backdrop-blur-xl">
              <div>
                <div className="flex justify-between items-center mb-10">
                  <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    <Activity size={18} className="text-neon-pink" /> Attendance History
                  </span>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-neon-green glow-neon-green" />
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-neon-pink glow-neon-pink" />
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Absent</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {tableRows.map((r, i) => (
                    <div 
                      key={i} 
                      title={`${r.date}: ${r.topic} - ${r.status}`}
                      className={cn(
                        "w-10 h-10 rounded-xl border transition-all duration-500 hover:scale-125 cursor-help flex items-center justify-center shadow-lg",
                        r.status === 'present' ? "bg-neon-green/10 border-neon-green/20 text-neon-green glow-neon-green" :
                        r.status === 'absent' ? "bg-neon-pink/10 border-neon-pink/30 text-neon-pink glow-neon-pink" :
                        "bg-void border-zinc-800 text-zinc-800"
                      )}
                    >
                      {r.status === 'present' ? <CheckCircle2 size={18} strokeWidth={3} /> : 
                       r.status === 'absent' ? <XCircle size={18} strokeWidth={3} /> : 
                       <div className="w-2 h-2 rounded-full bg-zinc-900" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-12 mt-12 border-t border-white/5">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} /> Total Present
                  </p>
                  <p className="text-3xl font-bold text-white tracking-tight">{presentCount} <span className="text-sm font-bold text-zinc-700 uppercase">/ {activeSessionsCount}</span></p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-neon-pink uppercase tracking-widest flex items-center gap-2">
                    <Flame size={14} /> Current Streak
                  </p>
                  <p className="text-3xl font-bold text-white tracking-tight">{currentStreak} <span className="text-xs font-bold text-zinc-700 uppercase">Days</span></p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-neon-cyan uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} /> Longest Streak
                  </p>
                  <p className="text-3xl font-bold text-white tracking-tight">{longestStreak} <span className="text-xs font-bold text-zinc-700 uppercase">Days</span></p>
                </div>
              </div>
            </Card>
          </div>

          {/* Detailed Logs Table */}
          <Card className="p-0 overflow-hidden border-white/5 bg-zinc-950/40 backdrop-blur-xl">
            <div className="p-8 border-b border-white/5 bg-zinc-900/30">
              <h3 className="text-xl font-bold text-white tracking-tight">Attendance Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pl-8 py-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                    <th className="py-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Topic</th>
                    <th className="py-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                    <th className="py-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Marked By</th>
                    <th className="pr-8 py-5 text-right text-xs font-bold text-zinc-500 uppercase tracking-widest">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tableRows.slice().reverse().map((r, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-all group">
                      <td className="pl-8 py-6 text-neon-cyan font-mono text-xs font-bold">{r.date}</td>
                      <td className="py-6 font-bold text-zinc-200 group-hover:text-white transition-colors">{r.topic}</td>
                      <td className="py-6">
                        {r.status === 'present' ? (
                          <div className="inline-flex px-3 py-1 rounded bg-neon-green/10 border border-neon-green/20 text-xs font-bold text-neon-green uppercase tracking-widest">
                            Present
                          </div>
                        ) : r.status === 'absent' ? (
                          <div className="inline-flex px-3 py-1 rounded bg-neon-pink/10 border border-neon-pink/20 text-xs font-bold text-neon-pink uppercase tracking-widest">
                            Absent
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-zinc-800 uppercase tracking-widest px-3 py-1 rounded border border-zinc-900 bg-void">No Record</span>
                        )}
                      </td>
                      <td className="py-6 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                        {attendanceData.find(a => a.session_id === r.id)?.marked_by || '—'}
                      </td>
                      <td className="pr-8 py-6 text-right font-mono text-zinc-600 font-bold">{r.duration_hours || '2.0'}h</td>
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
