import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, type Stream } from '../services/db';
import { getStreamRankings } from '../utils/academicEngine';
import { generateClassPerformancePDF } from '../utils/pdfGenerator';
import { BookOpen, GraduationCap, Plus, Search, FileText, X, CheckSquare, Square, Trash2 } from 'lucide-react';

export const StreamDetailPage: React.FC = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const stream: Stream | undefined = streamId ? db.getStream(streamId) : undefined;

  const [detailTab, setDetailTab] = React.useState<'students' | 'subjects' | 'rankings'>('students');
  const [assignedSubjectIds, setAssignedSubjectIds] = React.useState<string[]>([]);
  const [searchStudentQuery, setSearchStudentQuery] = React.useState('');

  React.useEffect(() => {
    if (stream) {
      setAssignedSubjectIds(db.getSubjectsByStream(stream.id).map(s => s.id));
    }
  }, [stream]);

  const handleOpenStreamDetails = (stream: Stream) => {
    navigate(`/stream-detail/${stream.id}`);
  };

  const handleDeleteStream = (id: string) => {
    if (confirm('Are you sure you want to delete this class stream? Students will be unassigned, but not deleted.')) {
      db.deleteStream(id);
      navigate('/');
    }
  };

  const handleDownloadClassReport = () => {
    if (stream) {
      generateClassPerformancePDF(stream.id, 'Term 1 2026');
    }
  };

  const activeStudents = stream ? db.getStudentsByStream(stream.id) : [];
  const filteredStudents = activeStudents.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchStudentQuery.toLowerCase())
  );
  const subjects = db.getSubjects();
  const streamRankings = stream ? getStreamRankings(stream.id, 'Term 1 2026') : [];

  const handleToggleSubjectAssignment = (subjectId: string) => {
    setAssignedSubjectIds(prev => prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]);
  };

  const handleSaveSubjectsAssignment = () => {
    if (stream) {
      db.assignSubjectsToStream(stream.id, assignedSubjectIds);
      alert('Subject assignments updated successfully.');
    }
  };

  if (!stream) {
    return (
      <div className="panel">
        <h2>Stream not found</h2>
        <p>No stream details available.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Back</button>
      </div>
    );
  }

  return (
    <><button className="btn btn-secondary" onClick={() => navigate(-1)}>
      <X size={15} /> Back
    </button>
    <div className="panel" style={{ marginTop: '36px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '16px', textTransform: 'uppercase' }}>{stream.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '20px', background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            {/* Avatar placeholder */}
            <div style={{ width: '90px', height: '90px', minWidth: '90px', borderRadius: '14px', background: 'var(--bg-hover, rgba(128,128,128,0.15))' }} />
            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 48px', flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13.5px', minWidth: '110px' }}>Class Teacher</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{stream.classTeacher}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '13.5px', minWidth: '110px' }}>Class Captain</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{stream.classCaptain}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13.5px', minWidth: '110px' }}>Telephone</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{stream.telephone}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '13.5px', minWidth: '110px' }}>Reg No</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{stream.admNo}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13.5px', minWidth: '110px' }}>Subjects</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{stream.subject}</span>
              </div>
              <div />
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13.5px', minWidth: '110px' }}>Employee ID</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{stream.empID}</span>
              </div>
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
          <div style={{ display: 'flex', gap: '12px' }}>
            {detailTab === 'rankings' && streamRankings.length > 0 && (
              <button className="btn btn-success" onClick={handleDownloadClassReport}>
                <FileText size={15} /> Download PDF Report
              </button>
            )}
            <button className="btn btn-danger" onClick={() => handleDeleteStream(stream.id)}>
              <Trash2 size={15} /> Delete Stream
            </button>

          </div>
        </div>

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
                  onChange={e => setSearchStudentQuery(e.target.value)} />
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
                      <td><span className={`badge badge-${student.status}`}>{student.status}</span></td>
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
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: entry.rank === 1 ? 'var(--color-secondary)' : 'var(--text-main)' }}>{entry.rank}</td>
                      <td>{entry.admissionNumber}</td>
                      <td style={{ fontWeight: '500' }}>{entry.firstName} {entry.lastName}</td>
                      <td style={{ textAlign: 'center' }}>{entry.subjectsCount}</td>
                      <td style={{ textAlign: 'center' }}>{entry.totalMarks}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{Math.round(entry.averageScore * 100) / 100}%</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: entry.grade === 'A' ? 'var(--color-success)' : entry.grade === 'F' ? 'var(--color-accent)' : 'var(--color-primary)' }}>{entry.grade}</td>
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
      </div></>
);
};
