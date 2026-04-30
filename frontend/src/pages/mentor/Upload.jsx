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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1 className="text-h1">Upload Data</h1>
      
      {/* Stepper */}
      <div className="flex items-center justify-between px-12 relative mb-12">
        <div className="absolute top-1/2 left-16 right-16 h-[1px] bg-subtle -z-10"></div>
        {[
          { num: 1, label: 'Upload' },
          { num: 2, label: 'Map Columns' },
          { num: 3, label: 'Preview' }
        ].map(s => (
          <div key={s.num} className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-medium transition-colors ${step >= s.num ? 'bg-primary text-void' : 'bg-canvas border border-subtle text-secondary'}`}>
              {step > s.num ? <CheckCircle2 size={16} /> : s.num}
            </div>
            <span className={`text-caption ${step >= s.num ? 'text-primary' : 'text-tertiary'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-16 flex flex-col items-center justify-center border-dashed border-2 bg-surface hover:bg-surface-raised transition-colors cursor-pointer relative">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud size={48} className="text-primary mb-6" />
          <h2 className="text-h2 mb-2">Drag & Drop CSV File</h2>
          <p className="text-secondary text-body-lg text-center max-w-md">
            Upload your Zoom or Teams attendance reports. We'll help you extract the data into ForgeTrack.
          </p>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-8">
          <div>
            <h3 className="text-h3 mb-2">Map Your Columns</h3>
            <p className="text-secondary">Select which column identifies the student, and map the date columns to your scheduled sessions.</p>
          </div>

          <div className="space-y-4 pt-6 border-t border-subtle">
            <div className="grid grid-cols-2 items-center gap-6 p-4 rounded-lg bg-surface-inset border border-subtle">
              <div>
                <span className="text-label text-primary block mb-1">Student Identifier</span>
                <span className="text-caption text-secondary">Unique ID (like USN)</span>
              </div>
              <select 
                className="input" 
                value={usnColumn} 
                onChange={e => setUsnColumn(e.target.value)}
              >
                <option value="" disabled>Select column...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            
            <div className="mt-8 mb-4">
              <span className="text-label text-tertiary">MAP SESSIONS</span>
            </div>

            {headers.filter(h => h !== usnColumn).map(header => (
              <div key={header} className="grid grid-cols-2 items-center gap-6 py-2">
                <span className="text-body-sm font-medium text-secondary truncate">{header}</span>
                <select 
                  className="input py-2 bg-canvas"
                  value={sessionColumns[header] || ''}
                  onChange={e => handleSessionColumnChange(header, e.target.value)}
                >
                  <option value="">Do not import this column</option>
                  {dbSessions.map(s => (
                    <option key={s.id} value={s.id}>{s.date} - {s.topic}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-t border-subtle">
            <Button 
              onClick={processUnpivot} 
              disabled={!usnColumn || Object.keys(sessionColumns).length === 0}
              className="flex items-center gap-2"
            >
              Continue to Preview <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-info-bg border border-info-border">
            <CheckCircle2 className="text-info-fg shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-body-lg font-medium text-info-fg">Ready to Import</h4>
              <p className="text-body-sm text-info-fg/80 mt-1">
                Found {unpivotedData.length} total attendance records for {Object.keys(sessionColumns).length} sessions across {parsedData.length} students.
              </p>
            </div>
          </div>

          <div className="border border-subtle rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="table w-full">
              <thead className="sticky top-0 bg-surface z-10 border-b border-subtle">
                <tr>
                  <th>USN</th>
                  <th>Session ID (Internal)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {unpivotedData.slice(0, 100).map((row, i) => (
                  <tr key={i}>
                    <td className="font-mono text-secondary">{row.usn}</td>
                    <td className="text-tertiary">{row.session_id.substring(0, 8)}...</td>
                    <td>
                      <span className={`pill ${row.present ? 'pill-success' : 'pill-danger'}`}>
                        {row.present ? 'Present' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {unpivotedData.length > 100 && (
              <div className="p-4 text-center text-caption text-tertiary bg-surface-inset border-t border-subtle">
                Showing first 100 records
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-subtle">
            <Button variant="secondary" onClick={() => setStep(2)}>Back to Mapping</Button>
            <Button onClick={executeImport} disabled={loading}>
              {loading ? 'Importing...' : 'Confirm & Import Data'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
