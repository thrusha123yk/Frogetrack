import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowRight,
  AlertCircle,
  Activity,
  BarChart3,
  BookOpen,
  TrendingUp,
  Target
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
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

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch Student Count
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true);
        
        // 2. Fetch Sessions
        const { data: sessions } = await supabase.from('sessions').select('id, topic, date').order('date', { ascending: true });
        
        // 3. Fetch Attendance for stats & chart
        const { data: attendance } = await supabase.from('attendance').select('present, session_id');
        
        let attendancePct = 0;
        if (attendance && attendance.length > 0) {
          const present = attendance.filter(a => a.present).length;
          attendancePct = Math.round((present / attendance.length) * 100);
        }

        // 4. Prepare Chart Data (Attendance % per session)
        const sessionStats = sessions?.map(s => {
          const sessAttendance = attendance?.filter(a => a.session_id === s.id) || [];
          const sessPresent = sessAttendance.filter(a => a.present).length;
          const pct = sessAttendance.length > 0 ? Math.round((sessPresent / sessAttendance.length) * 100) : 0;
          return {
            name: s.topic.substring(0, 10) + '...',
            fullTopic: s.topic,
            attendance: pct
          };
        }).slice(-7) || []; // Last 7 sessions

        setChartData(sessionStats);
        setStats({
          totalSessions: sessions?.length?.toString() || '0',
          attendancePct,
          activeStudents: studentCount || 0,
          lastSession: sessions && sessions.length > 0 ? sessions[sessions.length - 1].date : 'None'
        });

        // 5. Recent Activity
        const { data: activity } = await supabase
          .from('attendance')
          .select('marked_at, present, students(name), sessions(topic)')
          .order('marked_at', { ascending: false })
          .limit(6);
        setRecentActivity(activity || []);

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
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">System Overview</h1>
          <p className="text-zinc-500 font-medium">Hello {user?.display_name?.split(' ')[0]}, here is the current engagement status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/history')} className="h-11">
            History
          </Button>
          <Button onClick={() => navigate('/attendance')} className="flex items-center gap-2 h-11 px-6">
            <Calendar size={18} /> Schedule Session
          </Button>
        </div>
      </div>

      {/* Metric Rings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-6 p-6 border-accent/20 bg-accent/5">
          <ProgressRing percentage={stats.attendancePct} size={80} strokeWidth={8} color="#6366f1" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Attendance Rate</p>
            <p className="text-2xl font-bold text-zinc-100 tracking-tight">Cohort Average</p>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <TrendingUp size={12} className="text-success-fg" /> +2% from last week
            </p>
          </div>
        </Card>
        
        <Card className="flex items-center gap-6 p-6">
          <div className="w-[80px] h-[80px] rounded-full border-8 border-zinc-800 flex items-center justify-center">
            <span className="text-lg font-bold text-zinc-100">{stats.activeStudents}</span>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Active Enrollment</p>
            <p className="text-2xl font-bold text-zinc-100 tracking-tight">Total Students</p>
            <p className="text-xs text-zinc-500">All registered in current batch</p>
          </div>
        </Card>

        <Card className="flex items-center gap-6 p-6">
          <div className="w-[80px] h-[80px] rounded-full border-8 border-zinc-800 flex items-center justify-center text-accent">
            <Target size={32} />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Sessions Goal</p>
            <p className="text-2xl font-bold text-zinc-100 tracking-tight">{stats.totalSessions} Conducted</p>
            <p className="text-xs text-zinc-500">On track for program completion</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Engagement Chart - Large Column */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-8">
              <div>
                <CardTitle className="text-lg">Engagement Analytics</CardTitle>
                <p className="text-xs text-zinc-500 mt-1">Attendance percentage over the last 7 sessions</p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-zinc-500">
                  <div className="w-2 h-2 rounded-full bg-accent" /> Attendance %
                </span>
              </div>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-premium-lg">
                            <p className="text-xs font-bold text-zinc-100 mb-1">{payload[0].payload.fullTopic}</p>
                            <p className="text-lg font-bold text-accent">{payload[0].value}% Attendance</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="attendance" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.attendance >= 75 ? '#6366f1' : '#f43f5e'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed - Side Column */}
        <div className="lg:col-span-4">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Activity Stream</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-6">
                {recentActivity.map((item, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="relative">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0 transition-all group-hover:scale-150",
                        item.present ? "bg-success-fg" : "bg-danger-fg"
                      )} />
                      {idx !== recentActivity.length - 1 && (
                        <div className="absolute left-[3px] top-4 bottom-[-24px] w-[2px] bg-zinc-800/50" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-zinc-200">
                        {item.students?.name}
                      </p>
                      <p className="text-xs text-zinc-500 leading-snug">
                        {item.present ? 'Checked in' : 'Missed'} for <span className="text-zinc-400 font-medium">{item.sessions?.topic}</span>
                      </p>
                      <p className="text-[10px] text-zinc-600 font-mono">
                        {item.marked_at ? new Date(item.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-800/50">
                <Button variant="ghost" onClick={() => navigate('/history')} className="w-full justify-between text-xs text-zinc-500 hover:text-zinc-100">
                  Full History Report
                  <ArrowRight size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <Card className="p-1 hover:bg-accent/5 transition-all group border-zinc-800/50 hover:border-accent/30 cursor-pointer" onClick={() => navigate('/materials')}>
          <div className="p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-accent transition-colors">
              <BookOpen size={28} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-zinc-100">Resource Vault</h4>
              <p className="text-sm text-zinc-500">Access learning materials and recordings.</p>
            </div>
          </div>
        </Card>
        <Card className="p-1 hover:bg-zinc-800/30 transition-all group border-zinc-800/50 cursor-pointer" onClick={() => navigate('/history')}>
          <div className="p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-100 transition-colors">
              <Activity size={28} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-zinc-100">Student Analytics</h4>
              <p className="text-sm text-zinc-500">Deep dive into individual performance.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
