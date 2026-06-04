import React, { useState } from 'react';
import { db, type Subject, type Stream } from '../services/db';
import { BookOpen, Plus, Edit, Trash2, X, GraduationCap } from 'lucide-react';

export const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>(db.getSubjects());
  const [streams] = useState<Stream[]>(db.getStreams());
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    setDescription('');
    setFormError('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setCode(subject.code);
    setName(subject.name);
    setDescription(subject.description);
    setFormError('');
    setShowFormModal(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!code.trim()) {
      setFormError('Subject code is required.');
      return;
    }
    if (!name.trim()) {
      setFormError('Subject name is required.');
      return;
    }

    try {
      if (editingSubject) {
        db.updateSubject(editingSubject.id, {
          code: code.toUpperCase(),
          name,
          description,
        });
      } else {
        db.createSubject({
          code: code.toUpperCase(),
          name,
          description,
        });
      }
      setSubjects(db.getSubjects());
      setShowFormModal(false);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    }
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this subject? It will be removed from all assigned class streams and all related exam/CA scores will be deleted.')) {
      db.deleteSubject(id);
      setSubjects(db.getSubjects());
    }
  };

  // Helper to find streams assigned to a subject
  const getAssignedStreamsForSubject = (subjectId: string): string[] => {
    const rawLinks = db.getStreamSubjectsRaw();
    const assignedStreamIds = rawLinks
      .filter(link => link.subjectId === subjectId)
      .map(link => link.streamId);
    
    return streams
      .filter(s => assignedStreamIds.includes(s.id))
      .map(s => s.name);
  };

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h2>Subject Management</h2>
          <p>Configure the school curriculum catalogue and monitor class stream coverage</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Create Subject
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {subjects.map(sub => {
          const assignedClassNames = getAssignedStreamsForSubject(sub.id);

          return (
            <div key={sub.id} className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-secondary)', background: 'rgba(6, 182, 212, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                    {sub.code}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px' }}>{sub.name}</h3>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => handleOpenEdit(sub)}>
                    <Edit size={13} />
                  </button>
                  <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDeleteSubject(sub.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '13px', flexGrow: 1, marginBottom: '20px' }}>
                {sub.description || 'No description provided.'}
              </p>

              {/* Coverage block */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 'bold', marginBottom: '8px' }}>
                  <GraduationCap size={13} />
                  <span>STREAM COVERAGE ({assignedClassNames.length})</span>
                </div>
                
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {assignedClassNames.map((name, idx) => (
                    <span key={idx} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', fontWeight: '500' }}>
                      {name}
                    </span>
                  ))}
                  {assignedClassNames.length === 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      Not assigned to any class streams.
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT SUBJECT MODAL */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingSubject ? 'Edit Subject Details' : 'Create New Subject'}
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

            <form onSubmit={handleSaveSubject}>
              <div className="form-group">
                <label className="form-label">Subject Code</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. MATH101, PHY201" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Mathematics" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  placeholder="Describe subject content details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
