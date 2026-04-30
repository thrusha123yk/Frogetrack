import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { BookOpen, Video, FileText, Download, ExternalLink, Calendar } from 'lucide-react';

export function StudentMaterials() {
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterials() {
      // Fetch all past sessions
      const today = new Date().toISOString().split('T')[0];
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('id, date, topic')
        .lte('date', today)
        .order('date', { ascending: false });

      if (sessionData) {
        setSessions(sessionData);
        const sessionIds = sessionData.map(s => s.id);
        
        // Fetch materials for those sessions
        const { data: matData } = await supabase
          .from('materials')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false });

        if (matData) {
          const grouped = {};
          matData.forEach(m => {
            if (!grouped[m.session_id]) grouped[m.session_id] = [];
            grouped[m.session_id].push(m);
          });
          setMaterials(grouped);
        }
      }
      setLoading(false);
    }
    fetchMaterials();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'video': return <Video size={20} className="text-accent" />;
      case 'document': return <FileText size={20} className="text-info-fg" />;
      default: return <BookOpen size={20} className="text-secondary" />;
    }
  };

  if (loading) return <div className="p-8 text-secondary">Loading resources...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-h1 mb-2">Class Materials</h1>
        <p className="text-secondary text-body-lg">Access slides, recordings, and assignments for your completed sessions.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {sessions.map(session => {
          const sessionMats = materials[session.id] || [];
          if (sessionMats.length === 0) return null;

          return (
            <Card key={session.id} className="p-0 overflow-hidden border-subtle">
              <div className="bg-surface-inset border-b border-subtle p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-h3 text-primary mb-1">{session.topic}</h3>
                  <div className="flex items-center gap-2 text-caption text-secondary">
                    <Calendar size={14} />
                    <span>{new Date(session.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="bg-canvas px-3 py-1 rounded-full text-xs font-medium border border-subtle text-secondary">
                  {sessionMats.length} Resource{sessionMats.length !== 1 && 's'}
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessionMats.map(mat => (
                  <a 
                    key={mat.id} 
                    href={mat.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-4 rounded-lg bg-canvas border border-subtle hover:border-accent/50 hover:bg-surface transition-all group"
                  >
                    <div className="mt-1 p-2 rounded-md bg-surface-inset">
                      {getIcon(mat.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-primary mb-1 truncate group-hover:text-accent transition-colors">{mat.title}</p>
                      <p className="text-caption text-tertiary mb-2 line-clamp-2">{mat.description}</p>
                      <div className="flex items-center text-xs text-accent font-medium mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        {mat.type === 'video' ? 'Watch Recording' : 'Download File'}
                        <ExternalLink size={12} className="ml-1" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          );
        })}

        {sessions.every(s => !materials[s.id] || materials[s.id].length === 0) && (
          <div className="py-16 text-center border border-dashed border-subtle rounded-lg">
            <BookOpen size={48} className="mx-auto mb-4 text-tertiary" />
            <p className="text-body-lg text-secondary">No materials have been uploaded for any sessions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
