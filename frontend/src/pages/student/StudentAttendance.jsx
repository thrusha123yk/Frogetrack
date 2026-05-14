import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { BookOpen, Calendar, Award, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function StudentAttendance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyData() {
      if (!user) return;

      // 1. Fetch student profile
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.student_id)
        .maybeSingle();

      // 2. Fetch my attendance history
      const { data: attData } = await supabase
        .from('attendance')
        .select('present, sessions(date, topic)')
        .eq('student_id', user.student_id)
        .order('sessions(date)', { ascending: false });

      if (studentData && attData) {
        const total = attData.length;
        const present = attData.filter(a => a.present).length;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;

        // Calculate current streak
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Loop forward in time to calculate streak properly
        [...attData].reverse().forEach(record => {
          if (record.present) {
            tempStreak++;
            currentStreak++;
            if (tempStreak > longestStreak) longestStreak = tempStreak;
          } else {
            tempStreak = 0;
            currentStreak = 0;
          }
        });

        setData({
          profile: studentData,
          attendance: attData,
          stats: { pct, currentStreak, longestStreak, total }
        });
      }
      setLoading(false);
    }
    fetchMyData();
  }, [user]);

  if (loading) return <div className="p-8 text-secondary">Loading your dashboard...</div>;
  
  if (!data || !data.profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700">
          <Award size={32} />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">No Student Profile Found</h2>
        <p className="text-zinc-500 max-w-sm">
          Your account is registered as a student, but no academic details were found. Please contact your mentor to link your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Profile Header */}
      <Card className="flex flex-col md:flex-row items-center justify-between p-8 bg-gradient-to-r from-surface to-surface-raised border-accent/20">
        <div className="flex items-center gap-6 mb-6 md:mb-0">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent text-h2 font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            {data?.profile?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-h1 mb-1">{data.profile.name}</h1>
            <p className="text-secondary font-mono flex items-center gap-3">
              {data.profile.usn} 
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              {data.profile.branch_code}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-caption text-secondary mb-1">Attendance</p>
            <p className={`text-display-sm tabular-nums ${data.stats.pct >= 75 ? 'text-success-fg' : 'text-danger-fg'}`}>
              {data.stats.pct}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-caption text-secondary mb-1">Current Streak</p>
            <p className="text-display-sm tabular-nums text-accent flex items-center gap-1 justify-center">
              🔥 {data.stats.currentStreak}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Heatmap & Stats */}
        <div className="lg:col-span-2 space-y-8">
          
          <Card>
            <div className="flex justify-between items-center mb-6">
              <span className="text-label text-tertiary">ATTENDANCE HEATMAP</span>
            </div>
            {data.attendance.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {[...data.attendance].reverse().map((record, i) => (
                  <div 
                    key={i}
                    title={`${record.sessions?.date} - ${record.present ? 'Present' : 'Absent'}`}
                    className={`w-10 h-10 rounded-md flex items-center justify-center font-mono text-xs cursor-help transition-all duration-300 hover:scale-110 ${
                      record.present 
                        ? 'bg-success-bg/30 text-success-fg border border-success-border shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
 
                        : 'bg-surface-inset text-tertiary border border-subtle'
                    }`}
                  >
                    {record.sessions?.date?.slice(5)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary">No attendance records found yet.</p>
            )}
          </Card>

          <Card>
            <span className="text-label text-tertiary mb-6 block">RECENT SESSIONS</span>
            <div className="space-y-4">
              {data.attendance.slice(0, 5).map((record, i) => (
                <div key={i} className="flex justify-between items-center p-4 rounded-lg bg-surface-inset border border-subtle">
                  <div className="flex items-center gap-4">
                    <Calendar size={18} className="text-secondary" />
                    <div>
                      <p className="font-medium text-primary">{record.sessions?.topic}</p>
                      <p className="text-caption text-tertiary">{record.sessions?.date}</p>
                    </div>
                  </div>
                  <StatusPill status={record.present ? 'success' : 'danger'}>
                    {record.present ? 'Present' : 'Absent'}
                  </StatusPill>
                </div>
              ))}
            </div>
            {data.attendance.length > 5 && (
              <button 
                className="w-full mt-4 py-3 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                onClick={() => navigate('/me/materials')}
              >
                View Resources for Missed Sessions <ArrowRight size={16} />
              </button>
            )}
          </Card>

        </div>

        {/* Right Col: Alerts & Upcoming */}
        <div className="space-y-8">
          
          {data.stats.pct < 75 && (
            <Card className="border-danger-border relative overflow-hidden" style={{background: 'rgba(244,63,94,0.08)'}}>

              <div className="absolute top-0 left-0 w-1 h-full bg-danger-fg"></div>
              <div className="flex items-start gap-4">
                <AlertTriangle className="text-danger-fg shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-danger-fg mb-2">Attendance Warning</h3>
                  <p className="text-body-sm text-danger-fg/80">
                    Your attendance is currently at {data.stats.pct}%, which is below the 75% requirement. Please ensure you attend the upcoming sessions to improve your standing.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <span className="text-label text-tertiary mb-6 block">ACHIEVEMENTS</span>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  <Award size={24} />
                </div>
                <div>
                  <p className="font-medium text-primary">Longest Streak</p>
                  <p className="text-body-sm text-secondary">{data.stats.longestStreak} sessions</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-success-bg/30 flex items-center justify-center text-success-fg">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="font-medium text-primary">Sessions Attended</p>
                  <p className="text-body-sm text-secondary">{data.stats.pct}% of Program</p>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
