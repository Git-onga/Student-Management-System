import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { type Teacher, type Subject, type Stream } from '../services/db';
import { Search, Plus, Edit3, Trash2, Loader2, BookOpen, Users, Calendar, CheckCircle2, X } from 'lucide-react';

interface TeacherDetail extends Teacher {
  subjectOne?: Subject;
  subjectTwo?: Subject;
  lessonCount?: number;
}

export const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherDetail[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTeacherForDetails, setSelectedTeacherForDetails] = useState<TeacherDetail | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<TeacherDetail | null>(null);

  const [empID, setEmpID] = useState('');
  const [name, setName] = useState('');
  const [subjectOneId, setSubjectOneId] = useState('');
  const [subjectTwoId, setSubjectTwoId] = useState('');
  const [telephone, setTelephone] = useState('');
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [fetchedTeachers, fetchedSubjects, fetchedStreams] = await Promise.all([
        api.getTeachers(),
        api.getSubjects(),
        api.getStreams(),
      ]);
      setTeachers(fetchedTeachers as TeacherDetail[]);
      setSubjects(fetchedSubjects);
      setStreams(fetchedStreams);
      setSubjectOneId(fetchedSubjects[0]?.id || '');
      setSubjectTwoId(fetchedSubjects[1]?.id || fetchedSubjects[0]?.id || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load teacher data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEmpID('');
    setName('');
    setSubjectOneId(subjects[0]?.id || '');
    setSubjectTwoId(subjects[1]?.id || subjects[0]?.id || '');
    setTelephone('');
    setFormError('');
    setEditingTeacher(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (teacher: TeacherDetail) => {
    setEditingTeacher(teacher);
    setEmpID(teacher.empID);
    setName(teacher.name);
    setSubjectOneId(teacher.subjectOneId);
    setSubjectTwoId(teacher.subjectTwoId);
    setTelephone(teacher.telephone || '');
    setFormError('');
    setShowForm(true);
  };

  const getClassTeacherStreams = (teacher: TeacherDetail): Stream[] => {
    return streams.filter(stream => 
      stream.classTeacher === teacher.name || 
      stream.classTeacher === teacher.empID ||
      stream.classTeacher === teacher.id
    );
  };

  const getHeadOfSubjectStatus = (_teacherId: string, _subjectId?: string): boolean => {
    // Note: Head of subject designation not yet implemented in database
    // This function is a placeholder for future functionality
    return false;
  };

  const openDetailsModal = (teacher: TeacherDetail) => {
    setSelectedTeacherForDetails(teacher);
    setShowDetailsModal(true);
  };

  const handleSaveTeacher = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!empID.trim() || !name.trim() || !subjectOneId || !subjectTwoId) {
      setFormError('Employee ID, name and both subjects are required.');
      return;
    }
    if (subjectOneId === subjectTwoId) {
      setFormError('A teacher must teach two different subjects.');
      return;
    }

    try {
      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, {
          empID: empID.trim(),
          name: name.trim(),
          subjectOneId,
          subjectTwoId,
          telephone: telephone.trim(),
        });
      } else {
        await api.createTeacher({
          empID: empID.trim(),
          name: name.trim(),
          subjectOneId,
          subjectTwoId,
          telephone: telephone.trim(),
        });
      }
      await fetchData();
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Unable to save teacher.');
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!window.confirm('Delete this teacher permanently?')) return;
    try {
      await api.deleteTeacher(id);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete teacher.');
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    const query = searchQuery.toLowerCase();
    const nameMatch = teacher.name.toLowerCase().includes(query) || teacher.empID.toLowerCase().includes(query);
    const subjectMatch = selectedSubject === '' || teacher.subjectOneId === selectedSubject || teacher.subjectTwoId === selectedSubject;
    return nameMatch && subjectMatch;
  });

  const totalLessons = teachers.reduce((sum, teacher) => sum + (teacher.lessonCount ?? 0), 0);
  const distinctSubjects = new Set(
    teachers.flatMap(t => [t.subjectOne?.id, t.subjectTwo?.id]).filter(Boolean)
  ).size;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={36} />
        <p>Loading teacher directory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="custom-alert alert-error" style={{ margin: '24px 0' }}>
        <h4>Error loading Teachers page</h4>
        <p>{error}</p>
        <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={fetchData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h2>Teacher Management</h2>
          <p>Manage your employed teachers, assign subjects, and track scheduled lesson load.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openCreateForm}>
            <Plus size={16} /> Add Teacher
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '18px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Users size={20} />
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)' }}>Total Teachers</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{teachers.length}</div>
            <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>Active instructors in the school</div>
          </div>

          <div style={{ padding: '18px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Calendar size={20} />
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)' }}>Scheduled Lessons</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{totalLessons}</div>
            <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>Total subject lessons assigned across teachers</div>
          </div>

          <div style={{ padding: '18px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <BookOpen size={20} />
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)' }}>Subjects Covered</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{distinctSubjects}</div>
            <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>Distinct subjects assigned to teachers</div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', margin: 0 }}>Teacher Directory</h3>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>Search, filter and manage the teacher roster.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-input-wrapper" style={{ minWidth: '220px', flex: '1' }}>
              <Search size={16} className="search-icon" />
              <input
                className="form-control search-control"
                type="text"
                placeholder="Search by name or employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="form-control"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{ minWidth: '180px', height: '42px', padding: '0 12px' }}
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                <th>Emp ID</th>
                <th>Telephone</th>
                <th style={{ textAlign: 'center' }}>Scheduled Lessons</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map(teacher => (
                <tr key={teacher.id} onClick={() => openDetailsModal(teacher)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{teacher.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{teacher.empID}</div>
                  </td>
                  <td>{[teacher.subjectOne?.name, teacher.subjectTwo?.name].filter(Boolean).join(' / ') || 'Unassigned'}</td>
                  <td>{teacher.empID}</td>
                  <td>{teacher.telephone || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: teacher.lessonCount && teacher.lessonCount > 0 ? 'var(--color-success)' : 'var(--text-dim)' }}>
                      <CheckCircle2 size={14} /> {teacher.lessonCount ?? 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-ghost" style={{ marginRight: '6px' }} onClick={() => openEditForm(teacher)}>
                      <Edit3 size={14} />
                    </button>
                    <button className="btn btn-ghost" onClick={() => handleDeleteTeacher(teacher.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                    No teachers found. Adjust your filters or add new staff members.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          >
            <div
              className="panel"
              style={{
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>{editingTeacher ? 'Edit Teacher' : 'Create New Teacher'}</h3>
                  <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {editingTeacher ? 'Update teacher details and assigned subject.' : 'Register a new teacher for the school.'}
                  </p>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  style={{ padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveTeacher} style={{ display: 'grid', gap: '14px' }}>
                {formError && (
                  <div className="custom-alert alert-error" style={{ padding: '10px 14px' }}>{formError}</div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="form-label">Employee ID</label>
                    <input
                      className="form-control"
                      value={empID}
                      onChange={(e) => setEmpID(e.target.value)}
                      placeholder="e.g. TCH123"
                    />
                  </div>
                  <div>
                    <label className="form-label">Name</label>
                    <input
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Teacher name"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="form-label">Primary Subject</label>
                    <select
                      className="form-control"
                      value={subjectOneId}
                      onChange={(e) => setSubjectOneId(e.target.value)}
                      style={{ height: '42px', padding: '0 12px' }}
                    >
                      <option value="">Select primary subject</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Secondary Subject</label>
                    <select
                      className="form-control"
                      value={subjectTwoId}
                      onChange={(e) => setSubjectTwoId(e.target.value)}
                      style={{ height: '42px', padding: '0 12px' }}
                    >
                      <option value="">Select secondary subject</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingTeacher ? 'Update Teacher' : 'Save Teacher'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {showDetailsModal && selectedTeacherForDetails && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowDetailsModal(false)}
          >
            <div
              className="panel"
              style={{
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>{selectedTeacherForDetails.name}</h3>
                  <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>Employee ID: {selectedTeacherForDetails.empID}</p>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowDetailsModal(false)}
                  style={{ padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dim)', margin: '0 0 12px 0' }}>PERSONAL INFORMATION</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Full Name</label>
                      <p style={{ margin: 0, fontSize: '14px' }}>{selectedTeacherForDetails.name}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Employee ID</label>
                      <p style={{ margin: 0, fontSize: '14px' }}>{selectedTeacherForDetails.empID}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Subjects</label>
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        {[selectedTeacherForDetails.subjectOne?.name, selectedTeacherForDetails.subjectTwo?.name]
                          .filter(Boolean)
                          .join(' / ') || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Telephone</label>
                      <p style={{ margin: 0, fontSize: '14px' }}>{selectedTeacherForDetails.telephone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dim)', margin: '0 0 12px 0' }}>RESPONSIBILITIES</h4>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {getHeadOfSubjectStatus(selectedTeacherForDetails.id) && (
                      <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }}></div>
                        <span style={{ fontSize: '14px' }}>Head of subject</span>
                      </div>
                    )}
                    {getClassTeacherStreams(selectedTeacherForDetails).length > 0 ? (
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Class Teacher For:</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {getClassTeacherStreams(selectedTeacherForDetails).map(stream => (
                            <span
                              key={stream.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: 'var(--color-success)',
                              }}
                            >
                              ✓ {stream.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '12px', background: 'rgba(107, 114, 128, 0.1)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Not a class teacher
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dim)', margin: '0 0 12px 0' }}>WORKLOAD</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Scheduled Lessons</div>
                      <div style={{ fontSize: '24px', fontWeight: '800' }}>{selectedTeacherForDetails.lessonCount ?? 0}</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.08)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>Class Assignments</div>
                      <div style={{ fontSize: '24px', fontWeight: '800' }}>{getClassTeacherStreams(selectedTeacherForDetails).length}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      openEditForm(selectedTeacherForDetails);
                      setShowDetailsModal(false);
                    }}
                  >
                    <Edit3 size={14} style={{ marginRight: '6px' }} /> Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
