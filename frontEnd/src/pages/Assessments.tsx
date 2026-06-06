import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { type Stream, type Subject, type Score, type GradingScale } from '../services/db';
import { getGradeForScore } from '../utils/academicEngine';
import {
  generateReportCardPDF,
  generateClassPerformancePDF,
  generateSubjectMeanPDF,
  generateAllStudentReportsPDF,
  generateAllStreamsReportPDF,
} from '../utils/pdfGenerator';
import {
  AlertCircle, CheckCircle, Save, Info,
  Download, FileText, Users, BookOpen, Layers, ChevronRight, Loader2,
} from 'lucide-react';

type PageTab = 'entry' | 'reports';

export const Assessments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PageTab>('entry');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Score Entry State ───────────────────────────────────────────────────────
  const [streams, setStreams] = useState<Stream[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1 2026');
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  interface EditableScoreRow {
    studentId: string;
    studentName: string;
    admissionNumber: string;
    caScoreRaw: string;
    examScoreRaw: string;
    caError: string;
    examError: string;
  }

  const [gridRows, setGridRows] = useState<EditableScoreRow[]>([]);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [gradingScale, setGradingScale] = useState<GradingScale[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saveTrigger, setSaveTrigger] = useState(0);

  // ── Reports State ───────────────────────────────────────────────────────────
  const [reportTerm, setReportTerm] = useState('Term 1 2026');
  const [reportStreamId, setReportStreamId] = useState('');
  const [reportStudentId, setReportStudentId] = useState('');
  const [reportStudentList, setReportStudentList] = useState<{ id: string; name: string; admNo: string }[]>([]);
  const [reportSubjectId, setReportSubjectId] = useState('');
  const [reportClassStreamId, setReportClassStreamId] = useState('');

  const [downloading, setDownloading] = useState(false);

  // Fetch initial lookups: streams, all subjects, grading scale
  const fetchInitialLookups = async () => {
    try {
      setLoading(true);
      setError('');
      const [fetchedStreams, fetchedSubjects, scale] = await Promise.all([
        api.getStreams(),
        api.getSubjects(),
        api.getGradingScale(),
      ]);
      setStreams(fetchedStreams);
      setAllSubjects(fetchedSubjects);
      setGradingScale(scale);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch lookups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialLookups();
  }, []);

  // Update available subjects when selectedStreamId changes
  useEffect(() => {
    if (selectedStreamId) {
      const loadStreamSubjects = async () => {
        try {
          const detail = await api.getStream(selectedStreamId);
          const subs = detail.subjects || [];
          setAvailableSubjects(subs);
          setSelectedSubjectId(subs.length > 0 ? subs[0].id : '');
        } catch (err) {
          console.error(err);
          setAvailableSubjects([]);
          setSelectedSubjectId('');
        }
      };
      loadStreamSubjects();
    } else {
      setAvailableSubjects([]);
      setSelectedSubjectId('');
    }
    setSuccessMessage('');
    setErrorMessage('');
  }, [selectedStreamId]);

  // Load grading grid rows
  useEffect(() => {
    if (!selectedStreamId || !selectedSubjectId) {
      setGridRows([]);
      return;
    }
    
    let active = true;
    const loadGrid = async () => {
      try {
        setLoadingGrid(true);
        const [students, existingScores] = await Promise.all([
          api.getStudents({ streamId: selectedStreamId, status: 'active' }),
          api.getScores({ streamId: selectedStreamId, subjectId: selectedSubjectId, term: selectedTerm }),
        ]);
        
        if (!active) return;
        
        setGridRows(students.map(student => {
          const scoreObj = existingScores.find(s => s.studentId === student.id);
          return {
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            admissionNumber: student.admissionNumber,
            caScoreRaw: scoreObj ? scoreObj.caScore.toString() : '',
            examScoreRaw: scoreObj ? scoreObj.examScore.toString() : '',
            caError: '',
            examError: '',
          };
        }));
      } catch (err: any) {
        console.error(err);
        if (active) setErrorMessage('Failed to load students/scores grid');
      } finally {
        if (active) setLoadingGrid(false);
      }
    };

    loadGrid();
    setSuccessMessage('');
    setErrorMessage('');
    return () => {
      active = false;
    };
  }, [selectedStreamId, selectedSubjectId, selectedTerm, saveTrigger]);

  // Report student list filter trigger
  useEffect(() => {
    if (reportStreamId) {
      const loadReportStudents = async () => {
        try {
          const students = await api.getStudents({ streamId: reportStreamId });
          setReportStudentList(students.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, admNo: s.admissionNumber })));
          setReportStudentId(students.length > 0 ? students[0].id : '');
        } catch (err) {
          console.error(err);
          setReportStudentList([]);
          setReportStudentId('');
        }
      };
      loadReportStudents();
    } else {
      setReportStudentList([]);
      setReportStudentId('');
    }
  }, [reportStreamId]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleScoreChange = (studentId: string, field: 'ca' | 'exam', value: string) => {
    setGridRows(prev => prev.map(row => {
      if (row.studentId !== studentId) return row;
      const updated = { ...row };
      if (field === 'ca') {
        updated.caScoreRaw = value;
        const num = parseFloat(value);
        updated.caError = value.trim() === '' ? '' : (isNaN(num) ? 'Must be a number' : (num < 0 || num > 40) ? 'CA: 0–40' : '');
      } else {
        updated.examScoreRaw = value;
        const num = parseFloat(value);
        updated.examError = value.trim() === '' ? '' : (isNaN(num) ? 'Must be a number' : (num < 0 || num > 60) ? 'Exam: 0–60' : '');
      }
      return updated;
    }));
  };

  const handleSaveGrid = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    if (gridRows.some(r => r.caError || r.examError)) {
      setErrorMessage('Please fix all validation errors before saving.');
      return;
    }
    const scoresToSave: Omit<Score, 'id'>[] = [];
    for (const row of gridRows) {
      const caVal = row.caScoreRaw.trim();
      const examVal = row.examScoreRaw.trim();
      if ((caVal === '' && examVal !== '') || (caVal !== '' && examVal === '')) {
        setErrorMessage(`Both scores required for ${row.studentName}. Enter 0 if absent.`);
        return;
      }
      if (caVal && examVal) {
        scoresToSave.push({
          studentId: row.studentId,
          subjectId: selectedSubjectId,
          caScore: parseFloat(caVal),
          examScore: parseFloat(examVal),
          term: selectedTerm,
        });
      }
    }
    if (scoresToSave.length === 0) {
      setErrorMessage('No scores entered to save.');
      return;
    }
    try {
      setLoadingGrid(true);
      await api.batchUpsertScores(scoresToSave);
      setSuccessMessage(`Scores saved successfully for ${scoresToSave.length} students.`);
      setSaveTrigger(p => p + 1);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save scores.');
    } finally {
      setLoadingGrid(false);
    }
  };

  const getRowStats = (row: EditableScoreRow) => {
    const ca = parseFloat(row.caScoreRaw);
    const exam = parseFloat(row.examScoreRaw);
    if (isNaN(ca) || isNaN(exam)) return { total: '-', grade: '-' };
    const total = ca + exam;
    const { grade } = getGradeForScore(total, gradingScale);
    return { total: Math.round(total * 10) / 10, grade };
  };

  const errorCount = gridRows.filter(r => r.caError || r.examError).length;

  const TERMS = ['Term 1 2026', 'Term 2 2026', 'Term 3 2026'];

  const TermSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select className="form-control" value={value} onChange={e => onChange(e.target.value)} style={{ height: '40px', padding: '0 12px', minWidth: '160px' }}>
      {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  );

  const wrapDownload = (fn: () => Promise<void>) => async () => {
    try {
      setDownloading(true);
      await fn();
    } catch (err: any) {
      alert(err.message || 'Error generating report.');
    } finally {
      setDownloading(false);
    }
  };

  const ReportSection = ({
    icon, title, description, children, actions,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    children?: React.ReactNode;
    actions: React.ReactNode;
  }) => (
    <div style={{
      background: 'var(--bg-dark-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: '14px',
      padding: '22px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))',
          border: '1px solid var(--border-color-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-primary)', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{title}</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{description}</p>
        </div>
      </div>
      {children && <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>{children}</div>}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{actions}</div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={36} />
        <p>Loading assessment Portal lookups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="custom-alert alert-error" style={{ margin: '24px 0' }}>
        <h4>Error loading Portal</h4>
        <p>{error}</p>
        <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={fetchInitialLookups}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h2>Assessment Portal</h2>
          <p>Record scores and download comprehensive academic reports</p>
        </div>
        <div className="header-actions">
          {activeTab === 'entry' && gridRows.length > 0 && (
            <button className="btn btn-primary" onClick={handleSaveGrid} disabled={errorCount > 0 || loadingGrid}>
              {loadingGrid ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-header" style={{ marginBottom: '28px' }}>
        <button
          className={`tab-btn ${activeTab === 'entry' ? 'active' : ''}`}
          onClick={() => setActiveTab('entry')}
        >
          <Save size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Score Entry
        </button>
        <button
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <Download size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Reports &amp; Downloads
        </button>
      </div>

      {/* ══════════ TAB: SCORE ENTRY ══════════ */}
      {activeTab === 'entry' && (
        <>
          <div className="panel" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flexGrow: 1, minWidth: '180px' }}>
                <label className="form-label">1. Select Class Stream</label>
                <select className="form-control" value={selectedStreamId} onChange={e => setSelectedStreamId(e.target.value)}>
                  <option value="">-- Choose Class Stream --</option>
                  {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ flexGrow: 1, minWidth: '180px' }}>
                <label className="form-label">2. Select Subject</label>
                <select className="form-control" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} disabled={!selectedStreamId}>
                  {availableSubjects.length === 0
                    ? <option value="">-- No subjects assigned --</option>
                    : availableSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>)
                  }
                </select>
              </div>
              <div style={{ flexGrow: 1, minWidth: '180px' }}>
                <label className="form-label">3. Select Term</label>
                <select className="form-control" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
                  {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="custom-alert custom-alert-success"><CheckCircle size={16} /><span>{successMessage}</span></div>
          )}
          {errorMessage && (
            <div className="custom-alert custom-alert-error"><AlertCircle size={16} /><span>{errorMessage}</span></div>
          )}

          {selectedStreamId && selectedSubjectId ? (
            <div className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                  <Info size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>Record CA scores (out of 40) and Exam scores (out of 60). Press Save to submit.</span>
                </div>
                {errorCount > 0 && (
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                    {errorCount} cells with validation errors
                  </span>
                )}
              </div>
              
              <div className="score-grid-container">
                <div className="score-grid-header">
                  <div>Student Full Name</div>
                  <div style={{ textAlign: 'center' }}>Admission No</div>
                  <div style={{ textAlign: 'center' }}>CA Score (Max 40)</div>
                  <div style={{ textAlign: 'center' }}>Exam Score (Max 60)</div>
                  <div style={{ textAlign: 'center' }}>Total Score</div>
                  <div style={{ textAlign: 'center' }}>Grade</div>
                </div>
                {loadingGrid ? (
                  <div style={{ gridColumn: '1 / span 6', display: 'flex', gap: '8px', padding: '60px 0', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Loading student list and score entries...</span>
                  </div>
                ) : (
                  gridRows.map(row => {
                    const { total, grade } = getRowStats(row);
                    return (
                      <div key={row.studentId} className="score-grid-row">
                        <div style={{ fontWeight: '500' }}>{row.studentName}</div>
                        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>{row.admissionNumber}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <input type="text" className={`score-input ${row.caError ? 'invalid' : ''}`} placeholder="-" value={row.caScoreRaw} onChange={e => handleScoreChange(row.studentId, 'ca', e.target.value)} />
                          {row.caError && <span style={{ fontSize: '9px', color: 'var(--color-accent)', marginTop: '4px' }}>{row.caError}</span>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <input type="text" className={`score-input ${row.examError ? 'invalid' : ''}`} placeholder="-" value={row.examScoreRaw} onChange={e => handleScoreChange(row.studentId, 'exam', e.target.value)} />
                          {row.examError && <span style={{ fontSize: '9px', color: 'var(--color-accent)', marginTop: '4px' }}>{row.examError}</span>}
                        </div>
                        <div style={{ textAlign: 'center' }}>{total}</div>
                        <div style={{ textAlign: 'center', color: grade === 'A' ? 'var(--color-success)' : grade === 'F' ? 'var(--color-accent)' : 'var(--color-secondary)' }}>{grade}</div>
                      </div>
                    );
                  })
                )}
                {!loadingGrid && gridRows.length === 0 && (
                  <div style={{ gridColumn: '1 / span 6', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No active students enrolled in this stream.</div>
                )}
              </div>
              
              {!loadingGrid && gridRows.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button className="btn btn-primary" onClick={handleSaveGrid} disabled={errorCount > 0 || loadingGrid}>
                    {loadingGrid ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Score Submissions
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Please select a Class Stream and Subject above to load the grading sheet.
            </div>
          )}
        </>
      )}

      {/* ══════════ TAB: REPORTS & DOWNLOADS ══════════ */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Global Term Selector */}
          <div className="panel" style={{ padding: '16px 20px', marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Academic Term for All Reports:</span>
              <TermSelect value={reportTerm} onChange={setReportTerm} />
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                All report downloads below will use this term.
              </span>
              {downloading && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--color-secondary)', fontSize: '12px', fontWeight: 'bold', marginLeft: 'auto' }}>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Generating and downloading PDF document...</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '20px' }}>

            {/* ── 1. Individual Student Report Card ──────────────────────── */}
            <ReportSection
              icon={<FileText size={20} />}
              title="Individual Student Report Card"
              description="Download a single student's full academic report card — subject scores, class position, grades and remarks."
              actions={
                <button
                  className="btn btn-primary"
                  disabled={!reportStudentId || downloading}
                  onClick={wrapDownload(async () => {
                    await generateReportCardPDF(reportStudentId, reportTerm);
                  })}
                >
                  <Download size={14} /> Download Report Card
                </button>
              }
            >
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label className="form-label">Select Stream</label>
                <select className="form-control" value={reportStreamId} onChange={e => setReportStreamId(e.target.value)}>
                  <option value="">-- Choose Stream --</option>
                  {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label className="form-label">Select Student</label>
                <select className="form-control" value={reportStudentId} onChange={e => setReportStudentId(e.target.value)} disabled={!reportStreamId}>
                  {reportStudentList.length === 0
                    ? <option value="">-- Select stream first --</option>
                    : reportStudentList.map(st => <option key={st.id} value={st.id}>{st.name} ({st.admNo})</option>)
                  }
                </select>
              </div>
            </ReportSection>

            {/* ── 2. All Students in a Stream (bulk report cards) ────────── */}
            <ReportSection
              icon={<Users size={20} />}
              title="All Students in a Stream — Report Cards"
              description="Bulk download individual report card PDFs for every student enrolled in a selected class stream."
              actions={
                <button
                  className="btn btn-success"
                  disabled={!reportStreamId || downloading}
                  onClick={wrapDownload(async () => {
                    await generateAllStudentReportsPDF(reportStreamId, reportTerm);
                  })}
                >
                  <Download size={14} /> Download All Report Cards
                </button>
              }
            >
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">Select Class Stream</label>
                <select className="form-control" value={reportStreamId} onChange={e => setReportStreamId(e.target.value)}>
                  <option value="">-- Choose Stream --</option>
                  {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </ReportSection>

            {/* ── 3. Subject Mean Performance ────────────────────────────── */}
            <ReportSection
              icon={<BookOpen size={20} />}
              title="Subject Mean Performance Report"
              description="Download a subject-level report showing every student's score, subject mean, pass rate, and ranked standings."
              actions={
                <button
                  className="btn btn-primary"
                  disabled={!reportSubjectId || downloading}
                  onClick={wrapDownload(async () => {
                    await generateSubjectMeanPDF(reportSubjectId, reportTerm);
                  })}
                >
                  <Download size={14} /> Download Subject Report
                </button>
              }
            >
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">Select Subject</label>
                <select className="form-control" value={reportSubjectId} onChange={e => setReportSubjectId(e.target.value)}>
                  <option value="">-- Choose Subject --</option>
                  {allSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>)}
                </select>
              </div>
            </ReportSection>

            {/* ── 4. Single Class Performance Report ─────────────────────── */}
            <ReportSection
              icon={<ChevronRight size={20} />}
              title="Single Class Performance Report"
              description="Download a ranked class performance PDF for one specific stream — positions, averages, and grades."
              actions={
                <button
                  className="btn btn-primary"
                  disabled={!reportClassStreamId || downloading}
                  onClick={wrapDownload(async () => {
                    await generateClassPerformancePDF(reportClassStreamId, reportTerm);
                  })}
                >
                  <Download size={14} /> Download Class Report
                </button>
              }
            >
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">Select Class Stream</label>
                <select className="form-control" value={reportClassStreamId} onChange={e => setReportClassStreamId(e.target.value)}>
                  <option value="">-- Choose Stream --</option>
                  {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </ReportSection>

          </div>

          {/* ── 5. All Classes Performance (Bundled PDF) — Full Width ─────── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.05))',
            border: '1px solid var(--border-color-glow)',
            borderRadius: '14px',
            padding: '28px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', flexShrink: 0,
                boxShadow: '0 4px 15px rgba(99,102,241,0.25)',
              }}>
                <Layers size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>All Classes — Bundled Performance PDF</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '520px', lineHeight: '1.5' }}>
                  Generate a single comprehensive PDF containing ranked performance tables for every class stream.
                  Ideal for whole-school academic review and printing.
                </p>
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap' }}
              disabled={downloading}
              onClick={wrapDownload(async () => {
                await generateAllStreamsReportPDF(reportTerm);
              })}
            >
              <Download size={16} /> Download All Classes Report
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
