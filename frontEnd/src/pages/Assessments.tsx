import React, { useState, useEffect } from 'react';
import { db, type Stream, type Subject, type Score, type GradingScale } from '../services/db';
import { getGradeForScore } from '../utils/academicEngine';
import { AlertCircle, CheckCircle, Save, Info } from 'lucide-react';

export const Assessments: React.FC = () => {
  const [streams] = useState<Stream[]>(db.getStreams());
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1 2026');

  // Dynamic subjects based on stream
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  // Scores editing grid state
  interface EditableScoreRow {
    studentId: string;
    studentName: string;
    admissionNumber: string;
    caScoreRaw: string; // raw input string to allow easy editing
    examScoreRaw: string;
    caError: string;
    examError: string;
  }

  const [gridRows, setGridRows] = useState<EditableScoreRow[]>([]);
  const [gradingScale] = useState<GradingScale[]>(db.getGradingScale());
  
  // Notification states
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Track if database changed to trigger visual updates
  const [saveTrigger, setSaveTrigger] = useState(0);

  // Load available subjects when stream changes
  useEffect(() => {
    if (selectedStreamId) {
      const subs = db.getSubjectsByStream(selectedStreamId);
      setAvailableSubjects(subs);
      // Reset subject selection if current not available in new stream
      if (subs.length > 0) {
        setSelectedSubjectId(subs[0].id);
      } else {
        setSelectedSubjectId('');
      }
    } else {
      setAvailableSubjects([]);
      setSelectedSubjectId('');
    }
    setSuccessMessage('');
    setErrorMessage('');
  }, [selectedStreamId]);

  // Load score entries grid
  useEffect(() => {
    if (!selectedStreamId || !selectedSubjectId) {
      setGridRows([]);
      return;
    }

    const students = db.getStudentsByStream(selectedStreamId);
    const existingScores = db.getScoresByStreamAndSubject(selectedStreamId, selectedSubjectId, selectedTerm);

    const rows: EditableScoreRow[] = students.map(student => {
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
    });

    setGridRows(rows);
    setSuccessMessage('');
    setErrorMessage('');
  }, [selectedStreamId, selectedSubjectId, selectedTerm, saveTrigger]);

  const handleScoreChange = (
    studentId: string,
    field: 'ca' | 'exam',
    value: string
  ) => {
    setGridRows(prevRows =>
      prevRows.map(row => {
        if (row.studentId !== studentId) return row;

        const updatedRow = { ...row };
        if (field === 'ca') {
          updatedRow.caScoreRaw = value;
          // Validate
          if (value.trim() === '') {
            updatedRow.caError = '';
          } else {
            const num = parseFloat(value);
            if (isNaN(num)) {
              updatedRow.caError = 'Must be a number';
            } else if (num < 0 || num > 40) {
              updatedRow.caError = 'CA Score must be between 0 and 40';
            } else {
              updatedRow.caError = '';
            }
          }
        } else {
          updatedRow.examScoreRaw = value;
          // Validate
          if (value.trim() === '') {
            updatedRow.examError = '';
          } else {
            const num = parseFloat(value);
            if (isNaN(num)) {
              updatedRow.examError = 'Must be a number';
            } else if (num < 0 || num > 60) {
              updatedRow.examError = 'Exam Score must be between 0 and 60';
            } else {
              updatedRow.examError = '';
            }
          }
        }
        return updatedRow;
      })
    );
  };

  const handleSaveGrid = () => {
    setSuccessMessage('');
    setErrorMessage('');

    // Check for errors in state
    const hasValidationErrors = gridRows.some(
      r => r.caError !== '' || r.examError !== ''
    );
    if (hasValidationErrors) {
      setErrorMessage('Please fix all formatting and boundary score errors before saving.');
      return;
    }

    // Prepare scores array
    const scoresToSave: Omit<Score, 'id'>[] = [];

    for (const row of gridRows) {
      const caVal = row.caScoreRaw.trim();
      const examVal = row.examScoreRaw.trim();

      // If one field is filled and another empty, raise error
      if ((caVal === '' && examVal !== '') || (caVal !== '' && examVal === '')) {
        setErrorMessage(`Both CA (40) and Exam (60) scores must be entered for ${row.studentName}. If student did not sit, enter 0.`);
        return;
      }

      if (caVal !== '' && examVal !== '') {
        const caScore = parseFloat(caVal);
        const examScore = parseFloat(examVal);
        
        scoresToSave.push({
          studentId: row.studentId,
          subjectId: selectedSubjectId,
          caScore,
          examScore,
          term: selectedTerm,
        });
      }
    }

    if (scoresToSave.length === 0) {
      setErrorMessage('No assessment scores were entered to save.');
      return;
    }

    try {
      db.saveScoresBatch(scoresToSave);
      setSuccessMessage(`Assessment scores saved successfully for ${scoresToSave.length} students.`);
      setSaveTrigger(prev => prev + 1); // Trigger reload from DB
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save scores database.');
    }
  };

  const getRowStats = (row: EditableScoreRow) => {
    const ca = parseFloat(row.caScoreRaw);
    const exam = parseFloat(row.examScoreRaw);
    if (isNaN(ca) || isNaN(exam)) {
      return { total: '-', grade: '-' };
    }
    const total = ca + exam;
    const { grade } = getGradeForScore(total, gradingScale);
    return { total: Math.round(total * 10) / 10, grade };
  };

  const errorCount = gridRows.filter(r => r.caError || r.examError).length;

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h2>Assessment Portal</h2>
          <p>Record Continuous Assessment (CA) and final examination marks for student streams</p>
        </div>
        <div className="header-actions">
          {gridRows.length > 0 && (
            <button className="btn btn-primary" onClick={handleSaveGrid} disabled={errorCount > 0}>
              <Save size={16} /> Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          
          <div style={{ flexGrow: 1, minWidth: '180px' }}>
            <label className="form-label">1. Select Class Stream</label>
            <select 
              className="form-control"
              value={selectedStreamId}
              onChange={(e) => setSelectedStreamId(e.target.value)}
            >
              <option value="">-- Choose Class Stream --</option>
              {streams.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flexGrow: 1, minWidth: '180px' }}>
            <label className="form-label">2. Select Subject</label>
            <select 
              className="form-control"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!selectedStreamId}
            >
              {availableSubjects.length === 0 ? (
                <option value="">-- No subjects assigned to stream --</option>
              ) : (
                availableSubjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                ))
              )}
            </select>
          </div>

          <div style={{ flexGrow: 1, minWidth: '180px' }}>
            <label className="form-label">3. Select Term</label>
            <select 
              className="form-control"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="Term 1 2026">Term 1 2026</option>
              <option value="Term 2 2026">Term 2 2026</option>
              <option value="Term 3 2026">Term 3 2026</option>
            </select>
          </div>

        </div>
      </div>

      {successMessage && (
        <div className="custom-alert custom-alert-success">
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="custom-alert custom-alert-error">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid Sheet panel */}
      {selectedStreamId && selectedSubjectId ? (
        <div className="panel">
          <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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

            {gridRows.map(row => {
              const { total, grade } = getRowStats(row);
              return (
                <div key={row.studentId} className="score-grid-row">
                  <div style={{ fontWeight: '500' }}>{row.studentName}</div>
                  <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {row.admissionNumber}
                  </div>
                  
                  {/* CA Score Cell */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      className={`score-input ${row.caError ? 'invalid' : ''}`}
                      placeholder="-"
                      value={row.caScoreRaw}
                      onChange={(e) => handleScoreChange(row.studentId, 'ca', e.target.value)}
                    />
                    {row.caError && (
                      <span style={{ fontSize: '9px', color: 'var(--color-accent)', marginTop: '4px' }}>
                        {row.caError}
                      </span>
                    )}
                  </div>

                  {/* Exam Score Cell */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      className={`score-input ${row.examError ? 'invalid' : ''}`}
                      placeholder="-"
                      value={row.examScoreRaw}
                      onChange={(e) => handleScoreChange(row.studentId, 'exam', e.target.value)}
                    />
                    {row.examError && (
                      <span style={{ fontSize: '9px', color: 'var(--color-accent)', marginTop: '4px' }}>
                        {row.examError}
                      </span>
                    )}
                  </div>

                  <div style={{ textAlign: 'center' }} className="score-total">
                    {total}
                  </div>

                  <div 
                    style={{ 
                      textAlign: 'center', 
                      color: grade === 'A' ? 'var(--color-success)' : grade === 'F' ? 'var(--color-accent)' : 'var(--color-secondary)' 
                    }} 
                    className="score-grade"
                  >
                    {grade}
                  </div>
                </div>
              );
            })}

            {gridRows.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active students enrolled in this stream to grade.
              </div>
            )}
          </div>

          {gridRows.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={handleSaveGrid} disabled={errorCount > 0}>
                <Save size={16} /> Save Score Submissions
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Please select a Class Stream and Subject above to render the grading sheet.
        </div>
      )}
    </div>
  );
};
