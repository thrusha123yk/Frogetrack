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
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Learning <span className="text-neon-purple">Materials</span>
          </h1>
          <p className="text-sm text-zinc-500 font-medium">Manage and share course resources with students</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-3 h-12 px-8 bg-neon-purple hover:bg-neon-purple/80 text-white font-bold uppercase tracking-widest glow-neon-purple border-none transition-all">
          <Plus size={20} /> Add Material
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-950/40 backdrop-blur-3xl p-4 rounded-3xl border border-white/5 shadow-2xl">
        <div className="relative w-full sm:w-64 group">
          <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-neon-purple transition-colors" />
          <select 
            id="month-filter"
            name="month-filter"
            className="w-full bg-void/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-xs font-bold uppercase tracking-widest text-zinc-400 focus:border-neon-purple/50 focus:ring-4 focus:ring-neon-purple/10 appearance-none cursor-pointer transition-all"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">All Sessions</option>
            {distinctMonths.map(m => <option key={m} value={m}>Month {m}</option>)}
          </select>
        </div>
        <div className="hidden sm:block w-[1px] h-8 bg-white/5 mx-2"></div>
        <div className="flex-1 relative w-full group">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-neon-purple transition-colors" />
          <input 
            id="materials-search"
            name="materials-search"
            type="text" 
            className="w-full bg-void/50 border border-zinc-800 rounded-xl py-3 pl-14 pr-6 text-xs font-bold text-white placeholder:text-zinc-700 focus:border-neon-purple/50 focus:ring-4 focus:ring-neon-purple/10 transition-all tracking-wider"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-zinc-900/10 rounded-3xl animate-pulse"></div>)}
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card className="py-32 flex flex-col items-center justify-center text-center bg-zinc-950/20 border-dashed border-zinc-800 rounded-[40px]">
          <div className="w-24 h-24 rounded-[30px] bg-void border border-zinc-800 flex items-center justify-center text-zinc-800 mb-10 shadow-inner">
            <BookOpen size={48} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-3">No Materials Found</h2>
          <p className="text-sm text-zinc-600 font-medium max-w-sm">
            No resources found for the current search or filters.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSessions.map(session => {
            const mats = materials.filter(m => m.session_id === session.id);
            return (
              <Card key={session.id} className="flex flex-col group border-white/5 bg-zinc-950/40 backdrop-blur-xl hover:border-neon-purple/30 transition-all duration-500 shadow-xl overflow-hidden">
                <div className="mb-8 flex justify-between items-start relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-zinc-600 text-xs font-bold uppercase tracking-widest">
                      <Calendar size={14} className="text-neon-purple" /> {session.date}
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-neon-purple transition-colors line-clamp-1">{session.topic}</h3>
                  </div>
                </div>
                
                <div className="space-y-4 flex-1 relative z-10">
                  {mats.map(m => (
                    <a 
                      key={m.id} 
                      href={m.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-5 p-4 rounded-2xl bg-void/50 border border-white/5 hover:border-neon-purple/40 hover:bg-neon-purple/5 transition-all group/item shadow-inner"
                    >
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-600 group-hover/item:text-neon-purple group-hover/item:border-neon-purple/20 group-hover/item:bg-neon-purple/10 transition-all">
                        {getIconForType(m.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-300 group-hover/item:text-white transition-colors truncate uppercase tracking-wide">{m.title}</p>
                        <p className="text-[10px] text-zinc-700 uppercase font-bold tracking-widest mt-1 group-hover/item:text-neon-purple transition-colors">{m.type}</p>
                      </div>
                      <ExternalLink size={16} className="text-zinc-800 group-hover/item:text-neon-purple opacity-0 group-hover/item:opacity-100 transition-all group-hover/item:translate-x-1" />
                    </a>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
                    {mats.length} Item{mats.length !== 1 && 's'}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-purple glow-neon-purple" />
                    <span className="text-[10px] font-bold text-neon-purple uppercase tracking-widest">Active</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Material Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-void/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="max-w-2xl w-full border-white/10 bg-zinc-950/90 backdrop-blur-3xl p-10 md:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
            
            <div className="flex justify-between items-center mb-10">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">Add New Material</h2>
                <p className="text-sm text-zinc-600 font-medium">Upload or link a new learning resource</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center text-zinc-600 hover:text-neon-pink hover:bg-neon-pink/10 rounded-2xl transition-all">
                <X size={32} />
              </button>
            </div>
            
            <form onSubmit={handleAddMaterial} className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest block px-1">Select Session</label>
                <select 
                  id="material-session-id"
                  name="material-session-id"
                  className="flex h-14 w-full rounded-2xl border border-zinc-800 bg-void px-5 py-2 text-xs font-bold uppercase tracking-widest text-white focus:border-neon-purple focus-visible:outline-none transition-all duration-300"
                  required
                  value={newSessionId}
                  onChange={e => setNewSessionId(e.target.value)}
                >
                  <option value="" disabled>Select a session</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.date} - {s.topic}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Input 
                  label="Title" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  placeholder="e.g. Session Slides" 
                  required 
                  className="bg-void border-zinc-800 focus:border-neon-purple h-14 font-bold text-sm tracking-tight"
                />
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest block px-1">Material Type</label>
                  <select 
                    id="material-type"
                    name="material-type"
                    className="flex h-14 w-full rounded-2xl border border-zinc-800 bg-void px-5 py-2 text-xs font-bold uppercase tracking-widest text-white focus:border-neon-purple focus-visible:outline-none transition-all duration-300"
                    value={newType} 
                    onChange={e => setNewType(e.target.value)}
                  >
                    <option value="slides">Slides</option>
                    <option value="recording">Recording</option>
                    <option value="document">Document</option>
                    <option value="link">Link</option>
                  </select>
                </div>
              </div>

              <Input 
                label="Resource URL" 
                type="url" 
                placeholder="https://..." 
                value={newUrl} 
                onChange={e => setNewUrl(e.target.value)} 
                required 
                error={error}
                className="bg-void border-zinc-800 focus:border-neon-purple h-14 font-bold text-sm"
              />

              <div className="flex justify-end gap-6 pt-10 border-t border-white/5">
                <Button variant="ghost" onClick={() => setShowModal(false)} className="h-14 px-10 font-bold uppercase tracking-widest text-zinc-600 hover:text-neon-pink">Cancel</Button>
                <Button type="submit" disabled={saving} className="h-14 px-12 min-w-[200px] bg-neon-purple hover:bg-neon-purple/80 text-white font-bold uppercase tracking-widest glow-neon-purple border-none transition-all">
                  {saving ? 'Saving...' : 'Save Material'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
