import React, { useState } from 'react';
import { db, type Student, type Stream } from '../services/db';
import { getStudentAcademicReport } from '../utils/academicEngine';
import { generateReportCardPDF } from '../utils/pdfGenerator';
import { Search, UserPlus, Eye, Edit, Trash2, X, FileText } from 'lucide-react';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(db.getStudents());
  const [streams] = useState<Stream[]>(db.getStreams());

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [streamId, setStreamId] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended' | 'graduated'>('active');
  const [formError, setFormError] = useState('');

  const handleOpenRegister = () => {
    setEditingStudent(null);
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setGender('Male');
    setStreamId(streams.length > 0 ? streams[0].id : '');
    setStatus('active');
    setFormError('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStudent(student);
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setDateOfBirth(student.dateOfBirth);
    setGender(student.gender);
    setStreamId(student.streamId);
    setStatus(student.status);
    setFormError('');
    setShowFormModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First name and last name are required.');
      return;
    }
    if (!dateOfBirth) {
      setFormError('Date of birth is required.');
      return;
    }

    try {
      if (editingStudent) {
        db.updateStudent(editingStudent.id, {
          firstName,
          lastName,
          dateOfBirth,
          gender,
          streamId,
          status,
        });
      } else {
        db.createStudent({
          firstName,
          lastName,
          dateOfBirth,
          gender,
          streamId,
          status,
        });
      }
      setStudents(db.getStudents());
      setShowFormModal(false);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    }
  };

  const handleDeleteStudent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this student record? All scores associated with them will also be removed.')) {
      db.deleteStudent(id);
      setStudents(db.getStudents());
      if (selectedStudent && selectedStudent.id === id) {
        setSelectedStudent(null);
      }
    }
  };

  const handleDownloadReportCard = (id: string) => {
    generateReportCardPDF(id, 'Term 1 2026');
  };

  // Filter students based on queries
  const filteredStudents = students.filter(st => {
    const nameMatch = `${st.firstName} ${st.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      st.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const streamMatch = selectedStreamId === '' || st.streamId === selectedStreamId;
    const statusMatch = selectedStatus === '' || st.status === selectedStatus;
    return nameMatch && streamMatch && statusMatch;
  });

  // Load selected student report card preview data
  const reportData = selectedStudent ? getStudentAcademicReport(selectedStudent.id, 'Term 1 2026') : null;

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h2>Student Directory</h2>
          <p>Register, update profiles, view transcripts and download individual report cards</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleOpenRegister}>
            <UserPlus size={16} /> Register Student
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="panel" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flexGrow: 2, minWidth: '240px' }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search students by name or admission number..." 
              className="form-control search-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div style={{ flexGrow: 1, minWidth: '160px' }}>
            <select 
              className="form-control"
              value={selectedStreamId}
              onChange={(e) => setSelectedStreamId(e.target.value)}
            >
              <option value="">All Streams</option>
              {streams.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flexGrow: 1, minWidth: '160px' }}>
            <select 
              className="form-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="panel">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Full Name</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Class Stream</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(st => {
                const stream = streams.find(s => s.id === st.streamId);
                return (
                  <tr key={st.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(st)}>
                    <td style={{ fontWeight: 'bold' }}>{st.admissionNumber}</td>
                    <td style={{ fontWeight: '500' }}>{st.firstName} {st.lastName}</td>
                    <td>{st.gender}</td>
                    <td>{st.dateOfBirth}</td>
                    <td>{stream ? stream.name : <span style={{ color: 'var(--text-dim)' }}>Unassigned</span>}</td>
                    <td>
                      <span className={`badge badge-${st.status}`}>
                        {st.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => setSelectedStudent(st)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={(e) => handleOpenEdit(st, e)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={(e) => handleDeleteStudent(st.id, e)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                    No student records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT PROFILE / TRANSCRIPT DETAIL MODAL */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Student Profile & Academic Transcript</h3>
              <button className="modal-close" onClick={() => setSelectedStudent(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
              {/* Profile Card left */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: 'white', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>
                  {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                </div>
                
                <h4 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h4>
                <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {selectedStudent.admissionNumber}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Class Stream:</span>
                    <span style={{ fontWeight: 'bold' }}>{streams.find(s => s.id === selectedStudent.streamId)?.name || 'Unassigned'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Gender:</span>
                    <span>{selectedStudent.gender}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Date of Birth:</span>
                    <span>{selectedStudent.dateOfBirth}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                    <span className={`badge badge-${selectedStudent.status}`}>{selectedStudent.status}</span>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleDownloadReportCard(selectedStudent.id)}>
                    <FileText size={16} /> Download Report Card
                  </button>
                </div>
              </div>

              {/* Transcript right */}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold' }}>Subject Performance (Term 1 2026)</h4>
                  {reportData && (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                      Class Rank: {reportData.classPosition} of {reportData.classTotalStudents} (Avg: {reportData.overallAverage}%)
                    </span>
                  )}
                </div>

                <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th style={{ textAlign: 'center' }}>CA (40)</th>
                        <th style={{ textAlign: 'center' }}>Exam (60)</th>
                        <th style={{ textAlign: 'center' }}>Total</th>
                        <th style={{ textAlign: 'center' }}>Grade</th>
                        <th>Pos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData && reportData.subjectResults.map(res => (
                        <tr key={res.subjectId}>
                          <td>
                            <div style={{ fontWeight: 'bold' }}>{res.subjectName}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{res.subjectCode}</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>{res.caScore}</td>
                          <td style={{ textAlign: 'center' }}>{res.examScore}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{res.totalScore}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: res.grade === 'A' ? 'var(--color-success)' : res.grade === 'F' ? 'var(--color-accent)' : 'var(--color-primary)' }}>
                            {res.grade}
                          </td>
                          <td style={{ textAlign: 'center' }}>{res.subjectPosition}</td>
                        </tr>
                      ))}
                      {(!reportData || reportData.subjectResults.length === 0) && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                            No assessment scores registered for this student.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER / EDIT MODAL */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingStudent ? 'Edit Student Details' : 'Register New Student'}
              </h3>
              <button className="modal-close" onClick={() => setShowFormModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="custom-alert custom-alert-error">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveStudent}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. John" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Doe" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-control"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Class Stream Assignment</label>
                  <select 
                    className="form-control"
                    value={streamId}
                    onChange={(e) => setStreamId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {streams.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                {editingStudent && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-control"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="graduated">Graduated</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? 'Save Details' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
