import React, { useState } from 'react';
import { db, type Stream, type Subject, type Student } from '../services/db';
import { getStreamRankings } from '../utils/academicEngine';
import { generateClassPerformancePDF } from '../utils/pdfGenerator';
import { BookOpen, GraduationCap, Plus, Search, FileText, X, CheckSquare, Square, Trash2 } from 'lucide-react';

export const Streams: React.FC = () => {
  const [streams, setStreams] = useState<Stream[]>(db.getStreams());
  const [subjects] = useState<Subject[]>(db.getSubjects());
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  
  // Tab control inside stream detail
  const [detailTab, setDetailTab] = useState<'students' | 'subjects' | 'rankings'>('students');

  // Form states for creating a stream
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStreamName, setNewStreamName] = useState('');
  const [newStreamClassTeacher, setNewStreamClassTeacher] = useState('');
  const [newStreamTelephone, setNewStreamTelephone] = useState('');
  const [newStreamSubject, setNewStreamSubject] = useState('');
  const [newStreamEmpID, setNewStreamEmpID] = useState('');
  const [newStreamClassCaptain, setNewStreamClassCaptain] = useState('');
  const [newStreamAdmNo, setNewStreamAdmNo] = useState('');
  const [formError, setFormError] = useState('');

  // Subject management state for the selected stream
  const [assignedSubjectIds, setAssignedSubjectIds] = useState<string[]>([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');

  const handleOpenStreamDetails = (stream: Stream) => {
    setSelectedStream(stream);
    setDetailTab('students');
    setAssignedSubjectIds(db.getSubjectsByStream(stream.id).map(s => s.id));
    setSearchStudentQuery('');
  };

  const handleCreateStream = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newStreamName.trim()) {
      setFormError('Stream name is required.');
      return;
    }
    
    try {
      const created = db.createStream({
        name: newStreamName,
        classTeacher: newStreamClassTeacher,
        telephone: newStreamTelephone,
        subject: newStreamSubject,
        empID: newStreamEmpID,
        classCaptain: newStreamClassCaptain,
        admNo: newStreamAdmNo,
      });
      setStreams(db.getStreams());
      setShowCreateModal(false);
      // Reset form
      setNewStreamName('');
      setNewStreamClassTeacher('');
      setNewStreamTelephone('');
      setNewStreamSubject('');
      setNewStreamEmpID('');
      setNewStreamClassCaptain('');
      setNewStreamAdmNo('');
      handleOpenStreamDetails(created);
    } catch (err: any) {
      setFormError(err.message || 'Error creating stream.');
    }
  };

  const handleDeleteStream = (streamId: string) => {
    if (confirm('Are you sure you want to delete this class stream? Students will be unassigned, but not deleted.')) {
      db.deleteStream(streamId);
      setStreams(db.getStreams());
      setSelectedStream(null);
    }
  };

  const handleToggleSubjectAssignment = (subjectId: string) => {
    if (assignedSubjectIds.includes(subjectId)) {
      setAssignedSubjectIds(prev => prev.filter(id => id !== subjectId));
    } else {
      setAssignedSubjectIds(prev => [...prev, subjectId]);
    }
  };

  const handleSaveSubjectsAssignment = () => {
    if (selectedStream) {
      db.assignSubjectsToStream(selectedStream.id, assignedSubjectIds);
      alert('Subject assignments updated successfully.');
    }
  };

  const handleDownloadClassReport = () => {
    if (selectedStream) {
      generateClassPerformancePDF(selectedStream.id, 'Term 1 2026');
    }
  };

  // Get data for selected stream details
  const activeStudents = selectedStream ? db.getStudentsByStream(selectedStream.id) : [];
  const filteredStudents = activeStudents.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchStudentQuery.toLowerCase())
  );
  
  const streamRankings = selectedStream ? getStreamRankings(selectedStream.id, 'Term 1 2026') : [];

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h2>Class Streams</h2>
          <p>Create and manage school streams, subject distribution, and performance tables</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create Stream
          </button>
        </div>
      </div>

      <div className="streams-grid">
        {streams.map(st => {
          const enrolledCount = db.getStudentsByStream(st.id).length;
          const assignedSubjects = db.getSubjectsByStream(st.id);
          const fillPercentage = Math.min((enrolledCount / 50) * 100, 100);

          return (
            <div key={st.id} className="stream-card" onClick={() => handleOpenStreamDetails(st)}>
              <div className="stream-card-header">
                <span className="stream-card-name">{st.name}</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-primary)', background: 'rgba(99, 102, 241, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                  {assignedSubjects.length} subjects
                </span>
              </div>
              
              <div>
                <div className="stream-capacity-bar">
                  <div className="stream-capacity-progress" style={{ width: `${fillPercentage}%` }}></div>
                </div>
                <div className="stream-capacity-label">
                  <span>Enrolled: {enrolledCount} Students</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stream Detail drawer / panel */}
      {selectedStream && (
        <div className="panel" style={{ marginTop: '36px' }}>
          <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold' }}>{selectedStream.name} Details</h3>
                <span className="badge badge-active">Active Stream</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {detailTab === 'rankings' && streamRankings.length > 0 && (
                <button className="btn btn-success" onClick={handleDownloadClassReport}>
                  <FileText size={15} /> Download PDF Report
                </button>
              )}
              <button className="btn btn-danger" onClick={() => handleDeleteStream(selectedStream.id)}>
                <Trash2 size={15} /> Delete Stream
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedStream(null)}>
                <X size={15} /> Close Details
              </button>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="tabs-header">
            <button 
              className={`tab-btn ${detailTab === 'students' ? 'active' : ''}`}
              onClick={() => setDetailTab('students')}
            >
              Student Roster ({activeStudents.length})
            </button>
            <button 
              className={`tab-btn ${detailTab === 'subjects' ? 'active' : ''}`}
              onClick={() => setDetailTab('subjects')}
            >
              Curriculum Subjects
            </button>
            <button 
              className={`tab-btn ${detailTab === 'rankings' ? 'active' : ''}`}
              onClick={() => setDetailTab('rankings')}
            >
              Term rankings & Results
            </button>
          </div>

          {/* TAB 1: Enrolled Students */}
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
                    onChange={(e) => setSearchStudentQuery(e.target.value)}
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
                          <span className={`badge badge-${student.status}`}>
                            {student.status}
                          </span>
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

          {/* TAB 2: Subjects Mapping */}
          {detailTab === 'subjects' && (
            <div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Toggle which subjects are offered by <strong>{selectedStream.name}</strong>. Score entries will only be allowed for assigned subjects.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {subjects.map(subject => {
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
                        cursor: 'pointer' 
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

              <button className="btn btn-primary" onClick={handleSaveSubjectsAssignment}>
                Save Subject Settings
              </button>
            </div>
          )}

          {/* TAB 3: Academic Rankings */}
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE STREAM MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create Class Stream</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            {formError && (
              <div className="custom-alert custom-alert-error">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateStream}>
              <div className="form-group">
                <label className="form-label">Stream Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Form 1A, Form 2B" 
                  value={newStreamName}
                  onChange={(e) => setNewStreamName(e.target.value)}
                />
              </div>

               <div className="form-group">
                 <label className="form-label">Class Teacher</label>
                 <input
                   type="text"
                   className="form-control"
                   placeholder="e.g. Mr. Smith"
                   value={newStreamClassTeacher}
                   onChange={(e) => setNewStreamClassTeacher(e.target.value)}
                 />
               </div>
               <div className="form-group">
                 <label className="form-label">Telephone</label>
                 <input
                   type="text"
                   className="form-control"
                   placeholder="e.g. 0721234567"
                   value={newStreamTelephone}
                   onChange={(e) => setNewStreamTelephone(e.target.value)}
                 />
               </div>
               <div className="form-group">
                 <label className="form-label">Subject</label>
                 <input
                   type="text"
                   className="form-control"
                   placeholder="e.g. Mathematics"
                   value={newStreamSubject}
                   onChange={(e) => setNewStreamSubject(e.target.value)}
                 />
               </div>
               <div className="form-group">
                 <label className="form-label">Employee ID</label>
                 <input
                   type="text"
                   className="form-control"
                   placeholder="e.g. Tch101"
                   value={newStreamEmpID}
                   onChange={(e) => setNewStreamEmpID(e.target.value)}
                 />
               </div>
               <div className="form-group">
                 <label className="form-label">Class Captain</label>
                 <input
                   type="text"
                   className="form-control"
                   placeholder="e.g. John Doe"
                   value={newStreamClassCaptain}
                   onChange={(e) => setNewStreamClassCaptain(e.target.value)}
                 />
               </div>
               <div className="form-group">
                 <label className="form-label">Admission No</label>
                 <input
                   type="text"
                   className="form-control"
                   placeholder="e.g. St030"
                   value={newStreamAdmNo}
                   onChange={(e) => setNewStreamAdmNo(e.target.value)}
                 />
               </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Class Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
