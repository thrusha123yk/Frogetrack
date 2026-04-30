import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Calendar, Clock, MapPin, Video } from 'lucide-react';

export function Upcoming() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpcoming() {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true });

      if (data) setSessions(data);
      setLoading(false);
    }
    fetchUpcoming();
  }, []);

  if (loading) return <div className="p-8 text-secondary">Loading schedule...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-h1 mb-2">Upcoming Schedule</h1>
        <p className="text-secondary text-body-lg">View your next scheduled sessions and classes.</p>
      </div>

      {sessions.length === 0 ? (
        <Card className="text-center py-16">
          <Calendar size={48} className="text-tertiary mx-auto mb-4" />
          <p className="text-body-lg font-medium text-primary mb-1">No upcoming sessions</p>
          <p className="text-secondary">You're all caught up! There are no sessions scheduled in the future.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {sessions.map((session, i) => {
            const isNext = i === 0;
            return (
              <Card 
                key={session.id} 
                className={`flex flex-col md:flex-row gap-6 p-6 transition-all ${
                  isNext ? 'border-accent/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : ''

                }`}
              >
                <div className="md:w-48 shrink-0 flex flex-col justify-center border-b md:border-b-0 md:border-r border-subtle pb-4 md:pb-0 md:pr-6">
                  <span className="text-label text-tertiary mb-2">DATE</span>
                  <span className={`text-h3 font-medium ${isNext ? 'text-accent' : 'text-primary'}`}>
                    {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {isNext && <span className="mt-2 text-xs font-semibold px-2 py-1 bg-accent/10 text-accent rounded w-max">UP NEXT</span>}
                </div>

                <div className="flex-1">
                  <h3 className="text-h2 mb-4">{session.topic}</h3>
                  <div className="flex flex-wrap gap-6 text-body-sm text-secondary">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-tertiary" />
                      <span>10:00 AM - 12:00 PM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-tertiary" />
                      <span>Main Auditorium</span>
                    </div>
                    <div className="flex items-center gap-2 text-accent">
                      <Video size={16} />
                      <a href="#" className="hover:underline">Join Zoom</a>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
