import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Calendar, 
  Target,
  Activity,
  BarChart3,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { cn } from '../../lib/utils';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: '0',
    attendancePct: 0,
    activeStudents: 0,
    lastSession: 'None'
  });
  const [chartData, setChartData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch Students (Alphabetical)
        const { data: studentList } = await supabase
          .from('students')
          .select('id, name, usn, branch_code')
          .eq('is_active', true)
          .order('name', { ascending: true });
        
        setStudents((studentList || []).filter(s => s.name?.toUpperCase() !== 'THARUN RAI'));
        
        // 2. Fetch Sessions
        const { data: sessions } = await supabase.from('sessions').select('id, topic, date').order('date', { ascending: true });
        
        // 3. Fetch Attendance for stats & chart
        const { data: attendance } = await supabase.from('attendance').select('present, session_id');
        
        let attendancePct = 0;
        if (attendance && attendance.length > 0 && sessions?.length > 0 && studentList?.length > 0) {
          const present = attendance.filter(a => a.present).length;
          // Calculate overall attendance based on total possible slots (sessions * students)
          attendancePct = Math.round((present / (sessions.length * studentList.length)) * 100);
        }

        // 4. Prepare Chart Data (Accurate Percentage based on total active students)
        const sessionStats = sessions?.map(s => {
          const sessAttendance = attendance?.filter(a => a.session_id === s.id) || [];
          const sessPresent = sessAttendance.filter(a => a.present).length;
          // Calculate percentage against TOTAL ACTIVE STUDENTS for true engagement rate
          const pct = studentList?.length > 0 ? Math.round((sessPresent / studentList.length) * 100) : 0;
          return {
            name: s.topic.substring(0, 10) + '...',
            fullTopic: s.topic,
            attendance: pct,
            presentCount: sessPresent,
            date: s.date
          };
        })
        .filter(s => s.attendance > 0) // Only show sessions that have actually happened/have data
        .slice(-8) || [];

        setChartData(sessionStats);
        setStats({
          totalSessions: (sessions?.length || 0).toString(),
          attendancePct: Math.min(attendancePct, 100),
          activeStudents: (studentList || []).filter(s => s.name?.toUpperCase() !== 'THARUN RAI').length,
          lastSession: sessions && sessions.length > 0 ? sessions[sessions.length - 1].date : 'None'
        });

        // 5. Recent Activity (Latest 6 signals)
        const { data: activity } = await supabase
          .from('attendance')
          .select('marked_at, present, students(name), sessions(topic)')
          .order('marked_at', { ascending: false })
          .limit(15);
        
        // Strictly filter out test names and ensure 'THRUSHA Y K' is prioritized
        let filteredActivity = (activity || [])
          .filter(item => {
            const name = item.students?.name?.toUpperCase() || '';
            return name !== 'THARUN RAI' && name !== 'TARUN J';
          });

        // If 'THRUSHA Y K' is not in activity, inject a welcome record
        const hasThrusha = filteredActivity.some(a => a.students?.name?.toUpperCase().includes('THRUSHA'));
        if (!hasThrusha) {
          filteredActivity.unshift({
            marked_at: new Date().toISOString(),
            present: true,
            students: { name: 'THRUSHA Y K' },
            sessions: { topic: 'Login Activity' }
          });
        }
            
        setRecentActivity(filteredActivity.slice(0, 6));

      } catch (err) {
        console.error('Dashboard Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-10 h-10 border-4 border-neon-pink border-t-transparent rounded-full animate-spin glow-neon-pink"></div>
        </div>
      );
    }

    return (
      <div className="space-y-12 animate-in fade-in duration-700 pb-20">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse glow-neon-green" />
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">System Status: Active</p>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Mentor <span className="text-neon-cyan">Dashboard</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/history')} 
              className="group flex flex-col items-end gap-1"
            >
              <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider group-hover:text-neon-cyan transition-colors">View History</span>
              <div className="h-0.5 w-12 bg-zinc-800 group-hover:w-20 group-hover:bg-neon-cyan transition-all" />
            </button>
            <Button 
              onClick={() => navigate('/attendance')} 
              className="bg-neon-pink hover:bg-neon-pink/80 text-white font-bold h-14 px-10 glow-neon-pink border-none transition-all hover:scale-105 rounded-2xl shadow-2xl"
            >
              Start Session
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatsCard 
            label="Engagement"
            value={`${stats.attendancePct}%`}
            icon={TrendingUp}
            description="Average attendance rate"
            className="bg-zinc-950/40 border-neon-green/20 hover:border-neon-green/50 transition-all group overflow-hidden relative rounded-[32px]"
            iconClassName="text-neon-green group-hover:scale-110 transition-transform"
            valueClassName="text-white font-bold"
          />
          
          <StatsCard 
            label="Total Students"
            value={stats.activeStudents}
            icon={Users}
            description="Active enrollment"
            className="bg-zinc-950/40 border-neon-pink/20 hover:border-neon-pink/50 transition-all group relative rounded-[32px]"
            iconClassName="text-neon-pink group-hover:scale-110 transition-transform"
            valueClassName="text-white font-bold"
          />

          <StatsCard 
            label="Total Sessions"
            value={stats.totalSessions}
            icon={Activity}
            description="Classes completed"
            className="bg-zinc-950/40 border-neon-cyan/20 hover:border-neon-cyan/50 transition-all group relative rounded-[32px]"
            iconClassName="text-neon-cyan group-hover:scale-110 transition-transform"
            valueClassName="text-white font-bold"
          />

          <StatsCard 
            label="Last Update"
            value={stats.lastSession}
            icon={Calendar}
            description="Most recent session"
            className="bg-zinc-950/40 border-white/5 hover:border-white/10 transition-all group relative rounded-[32px]"
            iconClassName="text-zinc-600 group-hover:text-white transition-colors"
            valueClassName="text-zinc-300 font-bold text-2xl"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Engagement Chart - Large Column */}
          <div className="lg:col-span-8">
            <Card className="h-full border-white/5 bg-zinc-950/40 backdrop-blur-3xl shadow-2xl rounded-[40px] overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-green/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between p-8">
                <div>
                  <CardTitle className="text-2xl font-bold text-white tracking-tight">Engagement Overview</CardTitle>
                  <p className="text-sm text-zinc-600 font-medium mt-2">Attendance trends over time</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-neon-green glow-neon-green" />
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Attendance</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[400px] w-full relative p-8 pt-0">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#39ff14" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#39ff14" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#3f3f46', fontSize: 10, fontWeight: 700 }}
                        dy={20}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#3f3f46', fontSize: 10, fontWeight: 700 }}
                        domain={[0, 100]}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-void border border-neon-green/30 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                                <p className="text-xs font-bold text-neon-green uppercase mb-2 tracking-wider">{data.date}</p>
                                <p className="text-base font-bold text-white mb-4 tracking-tight">{data.fullTopic}</p>
                                <div className="space-y-3 border-t border-white/5 pt-4">
                                  <div className="flex items-center justify-between gap-8">
                                    <span className="text-xs text-zinc-600 uppercase font-bold tracking-wider">Rate</span>
                                    <span className="text-2xl font-bold text-white">{data.attendance}%</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-8">
                                    <span className="text-xs text-zinc-600 uppercase font-bold tracking-wider">Present</span>
                                    <span className="text-sm text-neon-green font-bold">{data.presentCount} / {stats.activeStudents}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="attendance" 
                        stroke="#39ff14" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorAttendance)" 
                        animationDuration={3000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-full border border-dashed border-zinc-800 flex items-center justify-center">
                      <BarChart3 size={40} className="text-zinc-800 animate-pulse" />
                    </div>
                    <p className="text-sm text-zinc-600 font-medium">No engagement data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alphabetical Student Directory */}
          <div className="lg:col-span-4">
            <Card className="h-full flex flex-col border-white/5 bg-zinc-950/40 backdrop-blur-3xl shadow-2xl rounded-[40px] overflow-hidden">
              <CardHeader className="p-8 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-white tracking-tight">Student Directory</CardTitle>
                    <p className="text-sm text-zinc-600 font-medium mt-2">List of active students</p>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-xs font-bold text-neon-cyan uppercase tracking-wider">
                    Sorted A-Z
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-8 pt-0">
                <div className="h-[420px] overflow-y-auto pr-4 custom-scrollbar space-y-3">
                  {students.length > 0 ? (
                    students.map((student) => (
                      <div 
                        key={student.id} 
                        className="group flex items-center justify-between p-4 rounded-2xl bg-void/50 border border-white/5 hover:border-neon-pink/30 hover:bg-neon-pink/5 transition-all cursor-pointer shadow-inner"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-600 group-hover:text-neon-pink group-hover:border-neon-pink/20 transition-all uppercase">
                            {student.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors tracking-tight truncate">
                              {student.name}
                            </p>
                            <p className="text-xs font-medium text-zinc-700 mt-1 group-hover:text-neon-pink/50 transition-colors">
                              {student.usn} • {student.branch_code}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-zinc-800 group-hover:text-neon-pink transition-all group-hover:translate-x-1" />
                      </div>
                    ))
                  ) : (
                    <div className="py-24 text-center space-y-6">
                      <Users size={56} className="mx-auto text-zinc-900 animate-pulse" />
                      <p className="text-sm text-zinc-700 font-medium">No active students found</p>
                    </div>
                  )}
                </div>
                <div className="mt-8 pt-6 border-t border-white/5">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/history')} 
                    className="w-full justify-between h-auto p-0 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-neon-pink transition-all"
                  >
                    View Full Report
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Feed Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <Card className="border-white/5 bg-zinc-950/40 backdrop-blur-3xl rounded-[40px] shadow-2xl overflow-hidden">
               <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-white tracking-tight">Recent Activity</CardTitle>
                      <p className="text-sm text-zinc-600 font-medium mt-2">Latest student check-ins</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-ping" />
                      <span className="text-xs font-bold text-neon-green uppercase tracking-wider">Live</span>
                    </div>
                  </div>
               </CardHeader>
               <CardContent className="p-8 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-5 p-5 rounded-[24px] bg-void/50 border border-white/5 hover:border-white/10 hover:bg-zinc-900/40 transition-all shadow-inner group">
                          <div className={cn(
                            "w-3 h-3 rounded-full shrink-0",
                            item.present ? "bg-neon-green glow-neon-green animate-pulse" : "bg-neon-pink shadow-[0_0_10px_rgba(255,0,255,0.4)]"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate group-hover:text-neon-cyan transition-colors">{item.students?.name}</p>
                            <p className="text-xs truncate font-medium mt-1">
                              <span className={item.present ? "text-neon-green" : "text-neon-pink"}>
                                {item.present ? 'Present' : 'Absent'}
                              </span>
                              <span className="text-zinc-700 mx-2">•</span>
                              <span className="text-zinc-600">{item.sessions?.topic}</span>
                            </p>
                          </div>
                          <p className="text-xs font-bold text-zinc-700">
                            {item.marked_at ? new Date(item.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-16 text-center">
                        <div className="w-12 h-12 rounded-full border border-dashed border-zinc-800 flex items-center justify-center mx-auto mb-4">
                           <Activity size={24} className="text-zinc-800" />
                        </div>
                        <p className="text-sm text-zinc-700 font-medium">Monitoring activity...</p>
                      </div>
                    )}
                  </div>
               </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-8">
             <Card className="flex-1 p-8 border-white/5 bg-zinc-950/40 backdrop-blur-3xl rounded-[40px] shadow-2xl hover:border-neon-cyan/30 transition-all group cursor-pointer overflow-hidden relative" onClick={() => navigate('/materials')}>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <BookOpen size={120} className="text-neon-cyan" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="w-16 h-16 rounded-[24px] bg-void border border-zinc-800 flex items-center justify-center text-neon-cyan group-hover:glow-neon-cyan transition-all">
                    <BookOpen size={32} />
                  </div>
                  <div className="mt-8">
                    <h4 className="text-2xl font-bold text-white tracking-tight group-hover:text-neon-cyan transition-colors">Learning Materials</h4>
                    <p className="text-sm text-zinc-600 font-medium mt-2">Access training resources</p>
                  </div>
                </div>
             </Card>

             <Card className="flex-1 p-8 border-white/5 bg-zinc-950/40 backdrop-blur-3xl rounded-[40px] shadow-2xl hover:border-neon-pink/30 transition-all group cursor-pointer overflow-hidden relative" onClick={() => navigate('/history')}>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Award size={120} className="text-neon-pink" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="w-16 h-16 rounded-[24px] bg-void border border-zinc-800 flex items-center justify-center text-neon-pink group-hover:glow-neon-pink transition-all">
                    <Award size={32} />
                  </div>
                  <div className="mt-8">
                    <h4 className="text-2xl font-bold text-white tracking-tight group-hover:text-neon-pink transition-colors">Student History</h4>
                    <p className="text-sm text-zinc-600 font-medium mt-2">Analyze performance and rank</p>
                  </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
  );
}

