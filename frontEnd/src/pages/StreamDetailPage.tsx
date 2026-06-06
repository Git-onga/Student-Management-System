import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { type Stream, type Student, type Subject, type Teacher } from '../services/db';
import { getStreamRankings, type StreamRankEntry } from '../utils/academicEngine';
import { generateClassPerformancePDF } from '../utils/pdfGenerator';
import { Search, FileText, X, CheckSquare, Square, Trash2, Loader2 } from 'lucide-react';

export const StreamDetailPage: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();

  const [stream, setStream] = useState<Stream | null>(null);
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [streamRankings, setStreamRankings] = useState<StreamRankEntry[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allStreams, setAllStreams] = useState<Stream[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [editName, setEditName] = useState('');
  const [editClassTeacher, setEditClassTeacher] = useState('');
  const [editTelephone, setEditTelephone] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editEmpID, setEditEmpID] = useState('');
  const [editClassCaptain, setEditClassCaptain] = useState('');
  const [editAdmNo, setEditAdmNo] = useState('');

  const [detailTab, setDetailTab] = useState<'students' | 'subjects' | 'rankings'>('students');
  const [assignedSubjectIds, setAssignedSubjectIds] = useState<string[]>([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');

  const assignedClassTeacherEmpIDs = new Set(
    allStreams.filter(s => s.id !== streamId).map(s => s.empID).filter(Boolean)
  );
  const eligibleClassTeachers = teachers.filter(t =>
    !assignedClassTeacherEmpIDs.has(t.empID) || t.empID === stream?.empID
  );
  const classCaptainOptions = activeStudents.filter(student => student.status === 'active');

  const fetchStreamData = async () => {
    if (!streamId) return;
    try {
      setLoading(true);
      setError('');
      
      // Fetch stream details (includes students & subjects assigned)
      const detail = await api.getStream(streamId);
      setStream(detail);
      setActiveStudents(detail.students || []);
      setAssignedSubjects(detail.subjects || []);
      setAssignedSubjectIds((detail.subjects || []).map(s => s.id));

      // Fetch teachers and all streams for dropdown filtering
      const [teachersList, streamsList, subjectsList] = await Promise.all([
        api.getTeachers(),
        api.getStreams(),
        api.getSubjects(),
      ]);
      setTeachers(teachersList);
      setAllStreams(streamsList);
      setAllSubjects(subjectsList);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load stream details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamData();
  }, [streamId]);

  useEffect(() => {
    if (!stream) return;
    setEditName(stream.name || '');
    setEditClassTeacher(stream.classTeacher || '');
    setEditTelephone(stream.telephone || '');
    setEditSubject(stream.subject || '');
    setEditEmpID(stream.empID || '');
    setEditClassCaptain(stream.classCaptain || '');
    setEditAdmNo(stream.admNo || '');
  }, [stream]);

  const handleEditStream = () => {
    setSaveError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (stream) {
      setEditName(stream.name || '');
      setEditClassTeacher(stream.classTeacher || '');
      setEditTelephone(stream.telephone || '');
      setEditSubject(stream.subject || '');
      setEditEmpID(stream.empID || '');
      setEditClassCaptain(stream.classCaptain || '');
      setEditAdmNo(stream.admNo || '');
    }
    setSaveError('');
    setIsEditing(false);
  };

  const handleSaveStreamDetails = async () => {
    if (!streamId || !stream) return;
    if (!editName.trim()) {
      setSaveError('Stream name is required.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError('');
      const updated = await api.updateStream(streamId, {
        name: editName.trim(),
        classTeacher: editClassTeacher.trim(),
        telephone: editTelephone.trim(),
        subject: editSubject.trim(),
        empID: editEmpID.trim(),
        classCaptain: editClassCaptain.trim(),
        admNo: editAdmNo.trim(),
      });
      setStream(updated);
      setIsEditing(false);
      alert('Stream details updated successfully.');
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update stream details.');
    } finally {
      setIsSaving(false);
    }
  };

  // Load rankings when rankings tab is active
  useEffect(() => {
    if (detailTab === 'rankings' && streamId) {
      const loadRankings = async () => {
        try {
          setLoadingRankings(true);
          const ranks = await getStreamRankings(streamId, 'Term 1 2026');
          setStreamRankings(ranks);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingRankings(false);
        }
      };
      loadRankings();
    }
  }, [detailTab, streamId]);

  const handleDeleteStream = async (id: string) => {
    if (confirm('Are you sure you want to delete this class stream? Students will be unassigned, but not deleted.')) {
      try {
        await api.deleteStream(id);
        navigate('/streams');
      } catch (err: any) {
        alert(err.message || 'Failed to delete stream.');
      }
    }
  };

  const handleDownloadClassReport = async () => {
    if (streamId) {
      await generateClassPerformancePDF(streamId, 'Term 1 2026');
    }
  };

  const handleToggleSubjectAssignment = (subjectId: string) => {
    setAssignedSubjectIds(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleSaveSubjectsAssignment = async () => {
    if (!streamId || !stream) return;
    try {
      // Find what to add & what to remove
      const originalIds = assignedSubjects.map(s => s.id);
      const toAdd = assignedSubjectIds.filter(id => !originalIds.includes(id));
      const toRemove = originalIds.filter(id => !assignedSubjectIds.includes(id));

      // Execute assignments sequentially or in parallel
      await Promise.all([
        ...toAdd.map(id => api.assignSubjectToStream(streamId, id)),
        ...toRemove.map(id => api.removeSubjectFromStream(streamId, id)),
      ]);

      alert('Subject assignments updated successfully.');
      
      // Reload stream info
      const detail = await api.getStream(streamId);
      setAssignedSubjects(detail.subjects || []);
      setAssignedSubjectIds((detail.subjects || []).map(s => s.id));
    } catch (err: any) {
      alert(err.message || 'Failed to update subject assignments.');
    }
  };

  const filteredStudents = activeStudents.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchStudentQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={36} />
        <p>Loading stream information...</p>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="panel">
        <h2>Stream not found</h2>
        <p>{error || 'No stream details available.'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/streams')}>Back to Streams</button>
      </div>
    );
  }

  return (
    <>
      <button className="btn btn-secondary" onClick={() => navigate('/streams')}>
        <X size={15} /> Back
      </button>
      
      <div className="panel" style={{ marginTop: '36px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '16px', textTransform: 'uppercase' }}>
            {stream.name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '20px', background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            {/* Avatar placeholder */}
            <div style={{ width: '90px', height: '90px', minWidth: '90px', borderRadius: '14px', background: 'var(--bg-hover, rgba(128,128,128,0.15))' }} />
            {/* Details grid or edit form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 48px', flex: 1 }}>
              {isEditing ? (
                <> 
                  <div className="form-group">
                    <label className="form-label">Stream Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Class Teacher</label>
                    <select
                      className="form-control"
                      value={editEmpID}
                      onChange={(e) => {
                        const selected = teachers.find(t => t.empID === e.target.value);
                        if (selected) {
                          setEditClassTeacher(selected.name);
                          setEditEmpID(selected.empID);
                          setEditTelephone(selected.telephone)
                        } else {
                          setEditClassTeacher('');
                          setEditEmpID('');
                        }
                      }}
                    >
                      <option value="">Select a teacher</option>
                      {eligibleClassTeachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.empID}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telephone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editTelephone}
                      onChange={(e) => setEditTelephone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reg No</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editAdmNo}
                      onChange={(e) => setEditAdmNo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employee ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmpID}
                      onChange={(e) => setEditEmpID(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Class Captain</label>
                    <select
                      className="form-control"
                      value={editClassCaptain}
                      onChange={(e) => {
                        const selected = classCaptainOptions.find(student => student.id === e.target.value);
                        if (selected) {
                          setEditClassCaptain(`${selected.firstName} ${selected.lastName}`);
                          setEditAdmNo(selected.admissionNumber);
                        } else {
                          setEditClassCaptain('');
                          setEditAdmNo('');
                        }
                      }}
                    >
                      <option value="">Select a student</option>
                      {classCaptainOptions.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.firstName} {student.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13.5px', minWidth: '110px' }}>Class Teacher</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{stream.classTeacher || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '13.5px', minWidth: '110px' }}>Class Captain</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{stream.classCaptain || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13.5px', minWidth: '110px' }}>Telephone</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{stream.telephone || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '13.5px', minWidth: '110px' }}>Reg No</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{stream.admNo || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13.5px', minWidth: '110px' }}>Subjects</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{stream.subject || 'N/A'}</span>
                  </div>
                  <div />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13.5px', minWidth: '110px' }}>Employee ID</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{stream.empID || 'N/A'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold' }}>{stream.name} Details</h3>
              <span className="badge badge-active">Active Stream</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {detailTab === 'rankings' && streamRankings.length > 0 && (
              <button className="btn btn-success" onClick={handleDownloadClassReport}>
                <FileText size={15} /> Download PDF Report
              </button>
            )}
            {!isEditing ? (
              <button className="btn btn-secondary" onClick={handleEditStream}>
                <CheckSquare size={15} /> Edit Stream
              </button>
            ) : (
              <>
                <button className="btn btn-primary" onClick={handleSaveStreamDetails} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary" onClick={handleCancelEdit} disabled={isSaving}>
                  Cancel
                </button>
              </>
            )}
            <button className="btn btn-danger" onClick={() => handleDeleteStream(stream.id)}>
              <Trash2 size={15} /> Delete Stream
            </button>
          </div>
        </div>
        {saveError && (
          <div className="custom-alert alert-error" style={{ marginBottom: '16px' }}>
            {saveError}
          </div>
        )}

        <div className="tabs-header">
          <button className={`tab-btn ${detailTab === 'students' ? 'active' : ''}`} onClick={() => setDetailTab('students')}>
            Student Roster ({activeStudents.length})
          </button>
          <button className={`tab-btn ${detailTab === 'subjects' ? 'active' : ''}`} onClick={() => setDetailTab('subjects')}>
            Curriculum Subjects
          </button>
          <button className={`tab-btn ${detailTab === 'rankings' ? 'active' : ''}`} onClick={() => setDetailTab('rankings')}>
            Term rankings & Results
          </button>
        </div>

        {detailTab === 'students' && (
          <div>
            <div className="search-bar-container">
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search students in this stream by name or admission number..."
                  className="form-control search-control"
                  value={searchStudentQuery}
                  onChange={e => setSearchStudentQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Full Name</th>
                    <th>Gender</th>
                    <th>Date of Birth</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 'bold' }}>{student.admissionNumber}</td>
                      <td>{student.firstName} {student.lastName}</td>
                      <td>{student.gender}</td>
                      <td>{student.dateOfBirth}</td>
                      <td>
                        <span className={`badge badge-${student.status}`}>{student.status}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No students found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detailTab === 'subjects' && (
          <div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Toggle which subjects are offered by <strong>{stream.name}</strong>. Score entries will only be allowed for assigned subjects.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {allSubjects.map(subject => {
                const isAssigned = assignedSubjectIds.includes(subject.id);
                return (
                  <div
                    key={subject.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleToggleSubjectAssignment(subject.id)}
                  >
                    {isAssigned ? (
                      <CheckSquare size={18} style={{ color: 'var(--color-primary)' }} />
                    ) : (
                      <Square size={18} style={{ color: 'var(--text-dim)' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{subject.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{subject.code}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-primary" onClick={handleSaveSubjectsAssignment}>Save Subject Settings</button>
          </div>
        )}

        {detailTab === 'rankings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
                Overall academic positions computed by sorting student overall averages. Ties are resolved by sharing positions.
              </p>
              <button className="btn btn-success" onClick={handleDownloadClassReport}>
                <FileText size={15} /> Export Class Rankings PDF
              </button>
            </div>
            
            <div className="table-container">
              {loadingRankings ? (
                <div style={{ display: 'flex', gap: '8px', padding: '40px', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Calculating class rankings...</span>
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                      <th>Admission No</th>
                      <th>Student Name</th>
                      <th style={{ textAlign: 'center' }}>Subjects</th>
                      <th style={{ textAlign: 'center' }}>Total Marks</th>
                      <th style={{ textAlign: 'center' }}>Average Score</th>
                      <th style={{ textAlign: 'center' }}>Overall Grade</th>
                      <th>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streamRankings.map(entry => (
                      <tr key={entry.studentId}>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: entry.rank === 1 ? 'var(--color-secondary)' : 'var(--text-main)' }}>
                          {entry.rank}
                        </td>
                        <td>{entry.admissionNumber}</td>
                        <td style={{ fontWeight: '500' }}>{entry.firstName} {entry.lastName}</td>
                        <td style={{ textAlign: 'center' }}>{entry.subjectsCount}</td>
                        <td style={{ textAlign: 'center' }}>{entry.totalMarks}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{Math.round(entry.averageScore * 100) / 100}%</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: entry.grade === 'A' ? 'var(--color-success)' : entry.grade === 'F' ? 'var(--color-accent)' : 'var(--color-primary)' }}>
                          {entry.grade}
                        </td>
                        <td>{entry.remark}</td>
                      </tr>
                    ))}
                    {streamRankings.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          No assessment data available to compile rankings for this class stream.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
