import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { analyzeSpreadsheet, isAIConfigured } from '../../lib/gemini';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  Database,
  Calendar,
  Layers,
  History,
  Check,
  Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function AIUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // App State
  const [step, setStep] = useState(1); // 1: Upload, 2: Sheet Select, 3: AI Reasoning, 4: Review, 5: Done
  const [file, setFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // AI & Data State
  const [aiResponse, setAiResponse] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [existingSessions, setExistingSessions] = useState([]);
  const [importSummary, setImportSummary] = useState(null);

  // 1. File Upload Handler
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const wb = XLSX.read(data, { type: 'binary' });
      setWorkbook(wb);
      setSheets(wb.SheetNames);
      if (wb.SheetNames.length === 1) {
        setSelectedSheet(wb.SheetNames[0]);
        setStep(2); // Still show selection but pre-selected
      } else {
        setStep(2);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // 2. Start AI Reasoning
  const startAIReasoning = async () => {
    if (!selectedSheet || !workbook) return;
    
    if (!isAIConfigured()) {
      alert('Gemini API Key is missing! Please add your valid API key to the .env.local file to enable AI features.');
      setStep(1);
      return;
    }

    setLoading(true);
    setStep(3); // Explicitly move to the "AI Thinking" step
    
    try {
      const worksheet = workbook.Sheets[selectedSheet];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setParsedData(rawData);

      // Extract a sample for the AI (first 10 rows)
      const sample = rawData.slice(0, 15).map(row => row.join(' | ')).join('\n');
      
      setStatus('AI is analyzing your spreadsheet structure...');
      
      // Fetch existing sessions for deduplication
      const { data: dbSessions } = await supabase
        .from('sessions')
        .select('id, date, topic');
      
      const aiData = await analyzeSpreadsheet(sample, dbSessions || []);
      
      // Normalize dates to YYYY-MM-DD if AI returned other formats (e.g., DD/MM/YYYY)
      if (aiData.sessions) {
        aiData.sessions = aiData.sessions.map(s => {
          if (s.date && (s.date.includes('-') || s.date.includes('/'))) {
            const parts = s.date.split(/[-/]/);
            if (parts[0].length === 2 && parts[2].length === 4) {
              const [d, m, y] = parts;
              s.date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
          }
          return s;
        });
      }
      
      setExistingSessions(dbSessions || []);
      setAiResponse(aiData);
      setStep(4);
    } catch (err) {
      console.error('AI Error:', err);
      if (err.message?.includes('429')) {
        alert('AI Quota Exceeded: Please wait 30-60 seconds and try again. The free tier of Gemini has a limit on how many requests you can make per minute.');
      } else {
        alert('AI failed to parse the sheet: ' + (err.message || 'Unknown error'));
      }
      setStep(2); // Fall back to sheet selection
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to update a session date manually
  const updateSessionDate = (idx, newDate) => {
    const updatedSessions = [...aiResponse.sessions];
    updatedSessions[idx].date = newDate;
    
    // Re-check for duplicates if date changed
    const duplicate = existingSessions.find(s => s.date === newDate);
    updatedSessions[idx].is_duplicate = !!duplicate;
    updatedSessions[idx].existing_id = duplicate?.id || null;
    
    setAiResponse({ ...aiResponse, sessions: updatedSessions });
  };

  const fixFutureDates = () => {
    const today = new Date().toISOString().split('T')[0];
    const updatedSessions = aiResponse.sessions.map(s => {
      if (s.date > today) return { ...s, date: today };
      return s;
    });
    setAiResponse({ ...aiResponse, sessions: updatedSessions });
  };

  // 3. Final Import Execution
  const executeImport = async () => {
    setLoading(true);
    setStatus('Performing bulk import...');
    
    try {
      const { mapping, sessions } = aiResponse;
      const finalAttendance = [];
      const newSessionsCreated = [];

      // Process sessions first (create missing ones)
      for (const sess of sessions) {
        if (sess.is_duplicate && sess.existing_id) {
          // Use existing session
          sess.final_id = sess.existing_id;
        } else {
          // Create new session
          const month = new Date(sess.date).getMonth() + 1;
          const { data, error } = await supabase
            .from('sessions')
            .upsert({ 
              date: sess.date, 
              topic: sess.topic, 
              month_number: month,
              session_type: sess.topic.toLowerCase().includes('assessment') ? 'assessment' : 'theory'
            }, { onConflict: 'date' })
            .select()
            .single();
          
          if (error) throw error;
          sess.final_id = data.id;
          newSessionsCreated.push(data);
        }
      }

      // Process Students (Enrolment)
      const dataRows = parsedData.slice(3);
      const usnsInSheet = [...new Set(dataRows.map(row => row[mapping.usn_idx]).filter(Boolean))];
      
      const { data: dbStudents } = await supabase.from('students').select('id, usn');
      const existingUsns = new Set(dbStudents?.map(s => s.usn) || []);
      
      const missingStudents = dataRows.filter(row => row[mapping.usn_idx] && !existingUsns.has(row[mapping.usn_idx]));
      const newStudentRecords = [];
      
      if (missingStudents.length > 0) {
        setStatus(`Enrolling ${missingStudents.length} new students...`);
        const enrollmentData = missingStudents.map(row => ({
          name: row[mapping.name_idx] || 'Unknown',
          usn: row[mapping.usn_idx],
          branch_code: row[6] || 'GEN', // Branch is often col 6
          batch: '2024-2028'
        }));
        
        // Remove duplicates from enrollmentData (some students might have multiple rows if wide format is weird, though usually it's one per USN)
        const uniqueEnrollment = [];
        const seenUsns = new Set();
        enrollmentData.forEach(s => {
          if (!seenUsns.has(s.usn)) {
            uniqueEnrollment.push(s);
            seenUsns.add(s.usn);
          }
        });

        const { data: createdStudents, error: enrollError } = await supabase
          .from('students')
          .insert(uniqueEnrollment)
          .select();
        
        if (enrollError) throw enrollError;
        createdStudents.forEach(s => {
          dbStudents.push(s);
        });
      }

      const usnMap = {};
      dbStudents.forEach(s => usnMap[s.usn] = s.id);

      setStatus('Mapping attendance records...');
      for (const row of dataRows) {
        const usn = row[mapping.usn_idx];
        const studentId = usnMap[usn];
        
        if (!studentId) continue;

        for (const sess of sessions) {
          const val = row[sess.col_idx];
          // Reasoning for "Present": true, "P", non-zero scores
          let isPresent = false;
          if (val === true || val === 'P' || val === 'p' || (typeof val === 'number' && val > 0)) {
            isPresent = true;
          }

          finalAttendance.push({
            student_id: studentId,
            session_id: sess.final_id,
            present: isPresent,
            marked_by: 'AI Smart Import'
          });
        }
      }

      // Bulk Upsert Attendance
      const chunks = Array.from({ length: Math.ceil(finalAttendance.length / 500) }, (_, i) =>
        finalAttendance.slice(i * 500, i * 500 + 500)
      );

      for (const chunk of chunks) {
        const { error } = await supabase
          .from('attendance')
          .upsert(chunk, { onConflict: 'student_id,session_id' });
        if (error) throw error;
      }

      setImportSummary({
        sessions: sessions.length,
        newSessions: newSessionsCreated.length,
        attendanceRecords: finalAttendance.length
      });
      setStep(5);
    } catch (err) {
      console.error('Import Error:', err);
      alert('Import failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
      
      {/* Step Indicator */}
      <div className="flex items-center justify-between max-w-2xl mx-auto relative px-10 mb-16">
        <div className="absolute top-1/2 left-20 right-20 h-px bg-zinc-800 -z-10 shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
        {[1, 2, 3, 4, 5].map((s) => (
          <div 
            key={s} 
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-500 shadow-xl",
              step === s ? "bg-neon-purple text-white scale-110 shadow-[0_0_20px_rgba(191,0,255,0.4)]" :
              step > s ? "bg-neon-green text-void shadow-[0_0_15px_rgba(57,255,20,0.3)]" : 
              "bg-zinc-900 text-zinc-600 border border-zinc-800"
            )}
          >
            {step > s ? <Check size={18} strokeWidth={3} /> : s}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-12 text-center max-w-3xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              Smart <span className="text-neon-purple">Upload</span>
            </h1>
            <p className="text-sm text-zinc-600 font-medium leading-relaxed max-w-xl mx-auto">
              Our AI tool will process your attendance data, identify patterns, and fill in any missing information automatically.
            </p>
          </div>
          
          {!isAIConfigured() && (
            <div className="p-5 rounded-2xl bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-xs font-bold uppercase tracking-widest flex items-center gap-3 justify-center glow-neon-pink-sm">
              <AlertTriangle size={18} />
              <span>AI Feature Disabled: Please configure your <strong className="text-white">API KEY</strong></span>
            </div>
          )}

          <Card className="p-24 border-dashed border-2 border-zinc-800 bg-zinc-950/40 backdrop-blur-3xl hover:border-neon-purple/50 hover:bg-neon-purple/5 transition-all cursor-pointer relative group rounded-[50px] shadow-2xl">
            <input 
              id="file-upload"
              name="file-upload"
              type="file" 
              accept=".xlsx, .csv" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-[40px] bg-void border border-zinc-800 flex items-center justify-center text-zinc-800 group-hover:text-neon-purple group-hover:border-neon-purple/30 transition-all mb-10 shadow-inner group-hover:shadow-[0_0_50px_rgba(191,0,255,0.1)]">
                <UploadCloud size={56} className="animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Click or Drag to Upload</h2>
              <p className="text-xs text-zinc-700 font-bold uppercase tracking-wider">Supports Excel (.xlsx) and CSV files</p>
            </div>
            <div className="absolute inset-0 rounded-[50px] bg-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Card>
        </div>
      )}

      {/* Step 2: Sheet Selection */}
      {step === 2 && (
        <div className="space-y-12 max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-neon-purple shadow-inner">
              <Layers size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Select Sheet</h2>
              <p className="text-sm text-zinc-600 font-medium">Choose the specific sheet you want to analyze.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {sheets.map(name => (
              <button
                key={name}
                onClick={() => setSelectedSheet(name)}
                className={cn(
                  "p-8 rounded-[30px] border text-left transition-all group relative overflow-hidden shadow-xl",
                  selectedSheet === name 
                    ? "bg-neon-purple/10 border-neon-purple text-neon-purple shadow-[0_0_30px_rgba(191,0,255,0.1)]" 
                    : "bg-zinc-950/40 border-white/5 text-zinc-600 hover:border-neon-purple/30 hover:text-zinc-300"
                )}
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "p-4 rounded-2xl bg-void border transition-colors",
                    selectedSheet === name ? "border-neon-purple/30" : "border-zinc-800"
                  )}>
                    <FileSpreadsheet size={28} />
                  </div>
                  <span className="text-sm font-bold">{name}</span>
                </div>
                {selectedSheet === name && (
                  <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <CheckCircle2 size={24} className="animate-in zoom-in duration-300" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-12 border-t border-white/5">
            <Button 
              size="lg" 
              onClick={startAIReasoning} 
              disabled={!selectedSheet}
              className="gap-4 px-12 h-16 bg-neon-purple hover:bg-neon-purple/80 text-white font-bold glow-neon-purple border-none transition-all rounded-[20px]"
            >
              Analyze Data <Sparkles size={22} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: AI Reasoning Loader */}
      {step === 3 && (
        <div className="py-32 flex flex-col items-center justify-center space-y-12 text-center max-w-xl mx-auto">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-zinc-900 border-t-neon-purple animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-purple drop-shadow-[0_0_15px_rgba(191,0,255,0.8)]" size={40} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white tracking-tight">AI Analysis in Progress</h2>
            <p className="text-xs text-neon-purple font-bold uppercase tracking-[0.3em] animate-pulse">{status}</p>
          </div>
          <Card className="bg-void/80 backdrop-blur-md p-8 border-white/5 rounded-[30px] shadow-2xl">
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              Identifying student records and mapping session topics...
            </p>
          </Card>
        </div>
      )}

      {/* Step 4: AI Review & Gap Filling */}
      {step === 4 && aiResponse && (
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-4">
                <Sparkles className="text-neon-purple" /> Review <span className="text-neon-purple">Results</span>
              </h1>
              <p className="text-sm text-zinc-600 font-medium">Verify the data before importing it into the system.</p>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setStep(2)} className="h-14 px-8 font-bold text-zinc-600 hover:text-white">Change Sheet</Button>
              <Button 
                onClick={executeImport} 
                disabled={loading || aiResponse?.sessions.some(s => new Date(s.date) > new Date())} 
                className={cn(
                  "h-14 px-12 bg-neon-green hover:bg-neon-green/80 text-void font-bold glow-neon-green border-none transition-all rounded-2xl shadow-2xl",
                  aiResponse?.sessions.some(s => new Date(s.date) > new Date()) && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                {loading ? <Loader2 className="animate-spin mr-3" /> : <CheckCircle2 size={20} className="mr-3" />}
                Confirm Import
              </Button>
            </div>
          </div>

          {aiResponse?.sessions.some(s => new Date(s.date) > new Date()) && (
            <div className="p-6 rounded-3xl bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-xs font-bold uppercase tracking-widest flex items-center justify-between gap-6 glow-neon-pink-sm">
              <div className="flex items-center gap-4">
                <AlertCircle size={20} />
                <span>Future dates detected. Please correct the session dates.</span>
              </div>
              <Button size="sm" variant="secondary" onClick={fixFutureDates} className="bg-neon-pink/20 hover:bg-neon-pink/30 text-neon-pink border-neon-pink/20 font-bold h-10 px-6">
                Set to Today
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Sessions Table */}
            <div className="lg:col-span-8">
              <Card className="p-0 overflow-hidden border-white/5 bg-zinc-950/40 backdrop-blur-xl shadow-2xl rounded-[40px]">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/30">
                  <h3 className="font-bold text-zinc-600 uppercase tracking-widest text-xs">Identified Sessions ({aiResponse.sessions.length})</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-purple glow-neon-purple" />
                    <span className="text-xs font-bold text-neon-purple uppercase tracking-widest">Live Sync</span>
                  </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-zinc-900/10">
                        <th className="pl-8 py-5 text-left text-xs font-bold text-zinc-700 uppercase tracking-widest">Excel Column</th>
                        <th className="py-5 text-left text-xs font-bold text-zinc-700 uppercase tracking-widest">Session Topic</th>
                        <th className="py-5 text-left text-xs font-bold text-zinc-700 uppercase tracking-widest">Date</th>
                        <th className="pr-8 py-5 text-right text-xs font-bold text-zinc-700 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {aiResponse.sessions.map((s, i) => (
                        <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="pl-8 py-5">
                            <span className="text-xs font-bold text-zinc-700 uppercase tracking-widest group-hover:text-neon-cyan transition-colors">Column {s.col_idx}</span>
                          </td>
                          <td className="font-bold text-zinc-300 text-sm group-hover:text-white transition-colors">{s.topic}</td>
                          <td>
                            <div className={cn(
                              "flex items-center gap-3",
                              new Date(s.date) > new Date() ? "text-neon-pink" : "text-zinc-500"
                            )}>
                              <Calendar size={14} className={cn(new Date(s.date) > new Date() ? "text-neon-pink" : "text-neon-purple")} />
                              <input 
                                id={`session-date-${i}`}
                                name={`session-date-${i}`}
                                type="date" 
                                value={s.date} 
                                onChange={(e) => updateSessionDate(i, e.target.value)}
                                className="bg-void border border-zinc-800 text-xs font-bold tracking-wider rounded-lg px-3 py-2 text-white focus:border-neon-purple transition-all outline-none"
                              />
                            </div>
                          </td>
                          <td className="pr-8 py-5 text-right">
                            {s.is_duplicate ? (
                              <div className="inline-flex items-center gap-2 text-neon-pink bg-neon-pink/10 border border-neon-pink/20 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(255,0,255,0.05)]">
                                <History size={12} /> Overwrite
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 text-neon-green bg-neon-green/10 border border-neon-green/20 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(57,255,20,0.05)]">
                                <Plus size={12} /> New
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* AI Insights & Warnings */}
            <div className="lg:col-span-4 space-y-8">
              <Card className="bg-neon-purple/[0.03] border-neon-purple/20 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles size={64} className="text-neon-purple" />
                </div>
                <h4 className="font-bold text-neon-purple uppercase tracking-widest text-xs mb-6 flex items-center gap-3">
                  <Sparkles size={16} /> AI Insights
                </h4>
                <div className="space-y-6">
                  {aiResponse.gaps_found.map((gap, i) => (
                    <div key={i} className="flex gap-4 text-xs text-zinc-400 bg-void/50 p-4 rounded-2xl border border-white/5 font-medium leading-relaxed group hover:border-neon-purple/30 transition-all">
                      <AlertCircle size={18} className="text-neon-purple shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <p>{gap}</p>
                    </div>
                  ))}
                  <div className="pt-8 border-t border-white/5">
                    <p className="text-[10px] text-zinc-700 font-bold mb-4 uppercase tracking-widest">Weekly Schedule Detected</p>
                    <div className="flex flex-wrap gap-2">
                      {aiResponse.suggested_weekly_schedule.map(day => (
                        <span key={day} className="px-4 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:border-neon-purple/50 hover:text-white transition-all cursor-default">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-neon-pink/20 bg-neon-pink/[0.02] p-8 rounded-[40px] shadow-xl">
                <h4 className="font-bold text-neon-pink uppercase tracking-widest text-xs mb-4 flex items-center gap-3">
                  <AlertTriangle size={16} /> Duplicate Data
                </h4>
                <p className="text-sm text-zinc-600 font-medium leading-relaxed">
                  <span className="text-neon-pink font-bold">{aiResponse.sessions.filter(s => s.is_duplicate).length} sessions</span> already exist in the system and will be updated.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Success State */}
      {step === 5 && importSummary && (
        <div className="max-w-3xl mx-auto py-24 text-center space-y-12">
          <div className="relative inline-block">
            <div className="w-40 h-40 rounded-[50px] bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-neon-green animate-in zoom-in duration-700 shadow-[0_0_50px_rgba(57,255,20,0.1)]">
              <Check size={80} strokeWidth={4} />
            </div>
            <Sparkles className="absolute -top-6 -right-6 text-neon-purple animate-bounce" size={48} />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              Upload <span className="text-neon-green">Complete</span>
            </h1>
            <p className="text-sm text-zinc-600 font-medium">Your attendance data has been successfully imported.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="bg-zinc-950/40 p-8 rounded-[40px] border border-white/5 shadow-2xl group hover:border-neon-cyan/30 transition-all">
              <p className="text-5xl font-bold text-white tracking-tight group-hover:text-neon-cyan transition-colors">{importSummary.sessions}</p>
              <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest mt-3 group-hover:text-zinc-500 transition-colors">Total Sessions</p>
            </div>
            <div className="bg-zinc-950/40 p-8 rounded-[40px] border border-white/5 shadow-2xl group hover:border-neon-purple/30 transition-all">
              <p className="text-5xl font-bold text-neon-purple tracking-tight glow-neon-purple-sm">{importSummary.newSessions}</p>
              <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest mt-3 group-hover:text-zinc-500 transition-colors">New Sessions</p>
            </div>
            <div className="bg-zinc-950/40 p-8 rounded-[40px] border border-white/5 shadow-2xl group hover:border-neon-green/30 transition-all">
              <p className="text-5xl font-bold text-neon-green tracking-tight glow-neon-green-sm">{importSummary.attendanceRecords}</p>
              <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest mt-3 group-hover:text-zinc-500 transition-colors">Records Updated</p>
            </div>
          </div>

          <div className="flex justify-center gap-8 pt-12">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="h-16 px-12 font-bold text-zinc-600 hover:text-white transition-all">
              Back to Dashboard
            </Button>
            <Button onClick={() => window.location.reload()} className="h-16 px-14 bg-neon-purple hover:bg-neon-purple/80 text-white font-bold rounded-2xl glow-neon-purple border-none transition-all hover:scale-105 shadow-2xl">
              Upload Another
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
