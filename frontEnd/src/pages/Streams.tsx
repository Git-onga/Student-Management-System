import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  // Subject management state for the selected stream
  const [assignedSubjectIds, setAssignedSubjectIds] = useState<string[]>([]);
  const navigate = useNavigate();


  const handleOpenStreamDetails = (stream: Stream) => {
    navigate(`/stream-detail/${stream.id}`);
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

  const [formError, setFormError] = useState('');

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
        {Object.entries(
          streams.reduce<Record<string, Stream[]>>((acc, st) => {
            const match = st.name.match(/Form\s*(\d+)/i);
            const form = match ? match[1] : 'Other';
            if (!acc[form]) acc[form] = [];
            acc[form].push(st);
            return acc;
          }, {})
        )
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([form, formStreams]) => (
            <div key={form}>
              <h3 className="form-group-header">Form {form}</h3>
              <div className="form-streams">
                {formStreams.map(st => {
                  return (
                    <div key={st.id} className="stream-card" onClick={() => handleOpenStreamDetails(st)}>
                      <div className="stream-card-header">
                        <span className="stream-card-name">{st.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>


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
