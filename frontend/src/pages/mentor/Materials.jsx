import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Search, 
  Plus, 
  PlayCircle, 
  FileText, 
  Link as LinkIcon, 
  Image, 
  X, 
  BookOpen, 
  ExternalLink,
  Calendar,
  Filter,
  MoreVertical,
  Download
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function Materials() {
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  const [monthFilter, setMonthFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Modal form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('slides');
  const [newUrl, setNewUrl] = useState('');
  const [newSessionId, setNewSessionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: sessData } = await supabase.from('sessions').select('*').order('date', { ascending: false });
    const { data: matData } = await supabase.from('materials').select('*');
    
    if (sessData) setSessions(sessData);
    if (matData) setMaterials(matData);
    setLoading(false);
  }

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setError('');

    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      setError('URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    const { data, error: err } = await supabase
      .from('materials')
      .insert({
        session_id: newSessionId,
        title: newTitle,
        type: newType,
        url: newUrl
      })
      .select()
      .maybeSingle();

    if (err) {
      setError(err.message);
    } else {
      setMaterials([...materials, data]);
      setShowModal(false);
      setNewTitle('');
      setNewUrl('');
    }
    setSaving(false);
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'recording': return <PlayCircle size={18} />;
      case 'document': return <FileText size={18} />;
      case 'link': return <LinkIcon size={18} />;
      case 'slides': default: return <Image size={18} />;
    }
  };

  const sessionsWithMaterials = sessions.filter(s => materials.some(m => m.session_id === s.id));
  const distinctMonths = [...new Set(sessionsWithMaterials.map(s => s.month_number))].sort((a,b) => b - a);

  const filteredSessions = sessionsWithMaterials.filter(s => {
    if (monthFilter !== 'all' && s.month_number.toString() !== monthFilter) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const topicMatches = s.topic.toLowerCase().includes(query);
      const materialsForSess = materials.filter(m => m.session_id === s.id);
      const titleMatches = materialsForSess.some(m => m.title.toLowerCase().includes(query));
      if (!topicMatches && !titleMatches) return false;
    }
    return true;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Learning Materials</h1>
          <p className="text-zinc-500 font-medium">Manage and distribute class resources, slides, and session recordings.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 h-11 px-6 shadow-premium">
          <Plus size={18} /> Upload Resource
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-900/40 backdrop-blur-xl p-3 rounded-2xl border border-zinc-800/50 shadow-premium">
        <div className="relative w-full sm:w-48">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <select 
            className="w-full bg-transparent border-none text-sm text-zinc-300 focus:ring-0 pl-10 appearance-none cursor-pointer"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">All Months</option>
            {distinctMonths.map(m => <option key={m} value={m}>Month {m}</option>)}
          </select>
        </div>
        <div className="hidden sm:block w-[1px] h-6 bg-zinc-800 mx-2"></div>
        <div className="flex-1 relative w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            className="w-full bg-transparent border-none text-zinc-100 placeholder:text-zinc-600 focus:outline-none pl-12 pr-4 text-sm"
            placeholder="Search topics or resource titles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => <Card key={i} className="h-64 bg-zinc-900/40 animate-pulse"></Card>)}
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card className="py-24 flex flex-col items-center justify-center text-center bg-zinc-900/10 border-dashed">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 mb-8">
            <BookOpen size={40} />
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">No Materials Found</h2>
          <p className="text-zinc-500 max-w-sm">
            Try adjusting your filters or search query to find the resources you're looking for.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSessions.map(session => {
            const mats = materials.filter(m => m.session_id === session.id);
            return (
              <Card key={session.id} className="flex flex-col group hover:border-accent/30 transition-all duration-300">
                <div className="mb-6 flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                      <Calendar size={12} /> {session.date}
                    </div>
                    <h3 className="text-lg font-bold text-zinc-100 group-hover:text-accent transition-colors line-clamp-1">{session.topic}</h3>
                  </div>
                </div>
                
                <div className="space-y-3 flex-1">
                  {mats.map(m => (
                    <a 
                      key={m.id} 
                      href={m.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/50 hover:border-accent/40 hover:bg-accent/5 transition-all group/item"
                    >
                      <div className="p-2 rounded-lg bg-zinc-900 text-zinc-500 group-hover/item:text-accent group-hover/item:bg-accent/10 transition-colors">
                        {getIconForType(m.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-200 group-hover/item:text-zinc-100 transition-colors truncate">{m.title}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">{m.type}</p>
                      </div>
                      <ExternalLink size={14} className="text-zinc-700 group-hover/item:text-accent opacity-0 group-hover/item:opacity-100 transition-all" />
                    </a>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-800/50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    {mats.length} Resource{mats.length !== 1 && 's'}
                  </span>
                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                    <MoreVertical size={14} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Material Modal */}
      {showModal && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <Card className="modal max-w-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-zinc-100">Upload Resource</h2>
                <p className="text-sm text-zinc-500">Link a new file or recording to a session.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-zinc-500 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddMaterial} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-zinc-400 block px-0.5">Associated Session</label>
                <select 
                  className="flex h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-200"
                  required
                  value={newSessionId}
                  onChange={e => setNewSessionId(e.target.value)}
                >
                  <option value="" disabled>Select a session</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.date} - {s.topic}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Material Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Session Slides" required />
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-zinc-400 block px-0.5">Resource Type</label>
                  <select 
                    className="flex h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-200"
                    value={newType} 
                    onChange={e => setNewType(e.target.value)}
                  >
                    <option value="slides">Slides (PDF/PPT)</option>
                    <option value="recording">Video Recording</option>
                    <option value="document">Document/Notes</option>
                    <option value="link">External Link</option>
                  </select>
                </div>
              </div>

              <Input 
                label="Resource URL" 
                type="url" 
                placeholder="https://docs.google.com/..." 
                value={newUrl} 
                onChange={e => setNewUrl(e.target.value)} 
                required 
                error={error}
              />

              <div className="flex justify-end gap-4 pt-6 border-t border-zinc-800/50">
                <Button variant="ghost" onClick={() => setShowModal(false)} className="h-11 px-8">Cancel</Button>
                <Button type="submit" disabled={saving} className="h-11 px-8 min-w-[140px]">
                  {saving ? 'Uploading...' : 'Save Resource'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
