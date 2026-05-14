import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  
  // Mapping state
  const [usnColumn, setUsnColumn] = useState('');
  const [sessionColumns, setSessionColumns] = useState({}); // { headerName: sessionId }
  
  // App state
  const [dbSessions, setDbSessions] = useState([]);
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview
  const [unpivotedData, setUnpivotedData] = useState([]); // Final array of { usn, session_id, present }
  const [loading, setLoading] = useState(false);

  // Parse file when dropped/selected
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setHeaders(results.meta.fields);
        setParsedData(results.data);
        
        // Fetch sessions to map against
        const { data: sessData } = await supabase.from('sessions').select('id, date, topic').order('date', { ascending: false });
        if (sessData) setDbSessions(sessData);
        
        // Auto-detect USN
        const usnMatch = results.meta.fields.find(f => f.toLowerCase().includes('usn') || f.toLowerCase().includes('email'));
        if (usnMatch) setUsnColumn(usnMatch);
        
        setStep(2);
      }
    });
  };

  const handleSessionColumnChange = (header, sessionId) => {
    setSessionColumns(prev => {
      const next = { ...prev };
      if (!sessionId) {
        delete next[header];
      } else {
        next[header] = sessionId;
      }
      return next;
    });
  };

  // Convert wide format (CSV) to long format (Database)
  const processUnpivot = () => {
    const results = [];
    
    parsedData.forEach(row => {
      const usn = row[usnColumn]?.trim();
      if (!usn) return;

      Object.entries(sessionColumns).forEach(([header, sessionId]) => {
        const cellValue = row[header];
        if (cellValue === undefined || cellValue === null) return;
        
        const valStr = cellValue.toString().trim().toLowerCase();
        
        // Determine presence based on thresholds
        // P = present, > 60 mins = present, True = present
        let present = false;
        if (valStr === 'p' || valStr === 'present' || valStr === 'true') {
          present = true;
        } else if (!isNaN(parseFloat(valStr))) {
          // If it's a number (minutes in meeting)
          if (parseFloat(valStr) >= 60) present = true;
        }

        results.push({
          usn,
          session_id: sessionId,
          present,
          marked_by: user?.display_name || 'System Import'
        });
      });
    });

    setUnpivotedData(results);
    setStep(3);
  };

  const executeImport = async () => {
    setLoading(true);

    try {
      // 1. We need student IDs, not USNs. Let's fetch the mapping.
      const usns = [...new Set(unpivotedData.map(d => d.usn))];
      const { data: students } = await supabase.from('students').select('id, usn').in('usn', usns);
      
      const usnToId = {};
      students?.forEach(s => { usnToId[s.usn] = s.id; });

      // 2. Prepare final inserts
      const finalInserts = [];
      let skippedCount = 0;
      
      unpivotedData.forEach(row => {
        const studentId = usnToId[row.usn];
        if (studentId) {
          finalInserts.push({
            student_id: studentId,
            session_id: row.session_id,
            present: row.present,
            marked_by: row.marked_by
          });
        } else {
          skippedCount++;
        }
      });

      // 3. Upsert Attendance
      if (finalInserts.length > 0) {
        const { error: attError } = await supabase
          .from('attendance')
          .upsert(finalInserts, { onConflict: 'student_id,session_id' });
          
        if (attError) throw attError;
      }

      // 4. Record Import Log
      const { error: logError } = await supabase
        .from('import_log')
        .insert({
          uploaded_by: user?.display_name || 'System',
          filename: file.name,
          imported_rows: finalInserts.length
        });

      if (logError) throw logError;

      alert(`Successfully imported ${finalInserts.length} records. ${skippedCount > 0 ? `Skipped ${skippedCount} unknown students.` : ''}`);
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      alert('Import failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Manual <span className="text-neon-cyan">Import</span>
        </h1>
        <p className="text-sm text-zinc-500 font-medium">Import attendance records from CSV spreadsheets</p>
      </div>
      
      {/* Stepper */}
      <div className="flex items-center justify-between px-16 relative mb-16">
        <div className="absolute top-1/2 left-20 right-20 h-px bg-zinc-800 -z-10 shadow-[0_0_10px_rgba(255,255,255,0.05)]"></div>
        {[
          { num: 1, label: 'UPLOAD' },
          { num: 2, label: 'MAP' },
          { num: 3, label: 'PREVIEW' }
        ].map(s => (
          <div key={s.num} className="flex flex-col items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-500 shadow-lg",
              step > s.num ? "bg-neon-green text-void shadow-[0_0_15px_rgba(57,255,20,0.3)]" :
              step === s.num ? "bg-neon-cyan text-void shadow-[0_0_15px_rgba(0,255,255,0.3)] scale-110" :
              "bg-zinc-900 border border-zinc-800 text-zinc-600"
            )}>
              {step > s.num ? <CheckCircle2 size={18} /> : s.num}
            </div>
            <span className={cn(
              "text-[10px] font-bold tracking-widest uppercase transition-colors",
              step >= s.num ? "text-white" : "text-zinc-700"
            )}>{s.label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-24 flex flex-col items-center justify-center border-dashed border-2 border-zinc-800 bg-zinc-950/40 backdrop-blur-xl hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all cursor-pointer relative group rounded-[40px]">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="w-24 h-24 rounded-[30px] bg-void border border-zinc-800 flex items-center justify-center text-zinc-800 mb-8 shadow-inner group-hover:border-neon-cyan/30 group-hover:text-neon-cyan transition-all">
            <UploadCloud size={48} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-3">Upload CSV File</h2>
          <p className="text-sm text-zinc-600 font-medium text-center max-w-sm leading-relaxed">
            Compatible with Zoom or Teams CSV exports. Upload your file to begin the import process.
          </p>
          <div className="absolute inset-0 rounded-[40px] bg-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-10 border-white/5 bg-zinc-950/40 backdrop-blur-xl p-10">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Map Columns</h3>
            <p className="text-sm text-zinc-600 font-medium">Connect your spreadsheet columns to the system's data fields.</p>
          </div>

          <div className="space-y-6 pt-10 border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 p-6 rounded-3xl bg-void/50 border border-white/5 shadow-inner">
              <div>
                <span className="text-xs font-bold text-neon-cyan block uppercase tracking-widest mb-1">Student Identifier</span>
                <span className="text-xs text-zinc-600 font-bold">Primary column for student USN</span>
              </div>
              <select 
                className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-xs font-bold uppercase tracking-widest text-white focus:border-neon-cyan transition-all" 
                value={usnColumn} 
                onChange={e => setUsnColumn(e.target.value)}
              >
                <option value="" disabled>Select Column</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            
            <div className="mt-12 mb-6 flex items-center gap-4">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-widest">SESSION COLUMNS</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {headers.filter(h => h !== usnColumn).map(header => (
                <div key={header} className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 py-3 group">
                  <span className="text-sm font-bold text-zinc-500 truncate group-hover:text-white transition-colors">{header}</span>
                  <select 
                    className="w-full h-12 bg-void border border-zinc-800 rounded-xl px-4 text-xs font-bold uppercase tracking-widest text-zinc-400 focus:border-neon-cyan focus:text-white transition-all"
                    value={sessionColumns[header] || ''}
                    onChange={e => handleSessionColumnChange(header, e.target.value)}
                  >
                    <option value="">IGNORE COLUMN</option>
                    {dbSessions.map(s => (
                      <option key={s.id} value={s.id}>{s.date} - {s.topic}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-10 border-t border-white/5">
            <Button 
              onClick={processUnpivot} 
              disabled={!usnColumn || Object.keys(sessionColumns).length === 0}
              className="flex items-center gap-3 h-14 px-10 bg-neon-cyan hover:bg-neon-cyan/80 text-void font-bold uppercase tracking-widest glow-neon-cyan border-none transition-all"
            >
              Preview Data <ArrowRight size={20} />
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-8 border-white/5 bg-zinc-950/40 backdrop-blur-xl p-10">
          <div className="flex items-start gap-5 p-6 rounded-3xl bg-neon-green/5 border border-neon-green/20 shadow-[0_0_20px_rgba(57,255,20,0.05)]">
            <CheckCircle2 className="text-neon-green shrink-0 mt-1" size={24} />
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">Ready to Import</h4>
              <p className="text-sm text-zinc-500 font-medium mt-2 leading-relaxed">
                Found <span className="text-neon-green">{unpivotedData.length} records</span> across <span className="text-neon-cyan">{Object.keys(sessionColumns).length} sessions</span>.
              </p>
            </div>
          </div>

          <div className="border border-white/5 rounded-3xl overflow-hidden bg-void/50 shadow-inner max-h-[500px] overflow-y-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-zinc-900/90 backdrop-blur-md z-10 border-b border-white/5">
                <tr>
                  <th className="pl-8 py-5 text-left text-xs font-bold text-zinc-600 uppercase tracking-widest">USN</th>
                  <th className="py-5 text-left text-xs font-bold text-zinc-600 uppercase tracking-widest">Session</th>
                  <th className="pr-8 py-5 text-right text-xs font-bold text-zinc-600 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {unpivotedData.slice(0, 100).map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="pl-8 py-4 font-mono text-xs font-bold text-neon-cyan">{row.usn}</td>
                    <td className="py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">{row.session_id.substring(0, 12)}...</td>
                    <td className="pr-8 py-4 text-right">
                      <div className={cn(
                        "inline-flex px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                        row.present ? "bg-neon-green/10 text-neon-green border border-neon-green/20" : "bg-neon-pink/10 text-neon-pink border border-neon-pink/20"
                      )}>
                        {row.present ? 'Present' : 'Absent'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {unpivotedData.length > 100 && (
              <div className="p-6 text-center text-xs font-bold text-zinc-700 uppercase tracking-widest bg-zinc-900/30 border-t border-white/5">
                + {unpivotedData.length - 100} Additional Records Truncated
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-10 border-t border-white/5">
            <Button variant="ghost" onClick={() => setStep(2)} className="h-12 px-8 font-bold uppercase tracking-widest text-zinc-600 hover:text-white">Back to Mapping</Button>
            <Button 
              onClick={executeImport} 
              disabled={loading}
              className="h-14 px-12 bg-neon-green hover:bg-neon-green/80 text-void font-bold uppercase tracking-widest glow-neon-green border-none transition-all shadow-2xl"
            >
              {loading ? 'Importing...' : 'Confirm Import'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
