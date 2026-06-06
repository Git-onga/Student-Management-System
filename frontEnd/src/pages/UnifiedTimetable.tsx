import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Stream, Subject, Teacher, TimetableSlot } from '../services/db';
import { Calendar, RefreshCcw, Plus, X, ArrowLeft, AlertTriangle } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
const PERIODS = Array.from({ length: 8 }, (_, i) => i + 1);

type DayName = typeof DAYS[number];

type StreamWithSubjects = Stream & { streamSubjects?: Array<{ subject: Subject }> };

export const UnifiedTimetable: React.FC = () => {
  const navigate = useNavigate();
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [allStreams, setAllStreams] = useState<StreamWithSubjects[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);

  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayName>('Monday');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterStream, setFilterStream] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);
      const [teachers, streams, subjects, timetable] = await Promise.all([
        api.getTeachers(),
        api.getStreams(),
        api.getSubjects(),
        api.getUnifiedTimetable(),
      ]);
      setAllTeachers(teachers);
      setAllStreams(streams as StreamWithSubjects[]);
      setAllSubjects(subjects);
      setTimetableSlots(timetable);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load timetable data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const teacherOptions = allTeachers;
  const streamOptions = allStreams;
  const selectedTeacherData = allTeachers.find((teacher) => teacher.id === selectedTeacher);
  const selectedStreamData = allStreams.find((stream) => stream.id === selectedStream);

  const subjectOptions = allSubjects.filter((subject) => {
    const teacherCanTeach = !selectedTeacherData || subject.id === selectedTeacherData.subjectOneId || subject.id === selectedTeacherData.subjectTwoId;
    const streamAccepts = !selectedStreamData || selectedStreamData.streamSubjects?.some((ss) => ss.subject.id === subject.id);
    return teacherCanTeach && streamAccepts;
  });

  useEffect(() => {
    if (selectedSubject) return;
    if (subjectOptions.length > 0) {
      setSelectedSubject(subjectOptions[0].id);
    }
  }, [selectedTeacher, selectedStream, subjectOptions.length]);

  const filteredSlots = timetableSlots.filter((slot) => {
    const byTeacher = filterTeacher === 'all' || slot.teacherId === filterTeacher;
    const byStream = filterStream === 'all' || slot.streamId === filterStream;
    const bySubject = filterSubject === 'all' || slot.subjectId === filterSubject;
    return byTeacher && byStream && bySubject;
  });

  const handleGenerateTimetable = async () => {
    try {
      setError('');
      setSuccess('');
      setGenerating(true);
      const result = await api.generateUnifiedTimetable();
      setSuccess(result.message || 'Unified timetable generated successfully');
      if (result.warnings?.length > 0) {
        setError(result.warnings.join('. '));
      }
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddSlot = async () => {
    if (!selectedTeacher || !selectedStream || !selectedSubject) {
      setError('Please choose a teacher, subject and stream before scheduling a slot');
      return;
    }

    try {
      setError('');
      setSuccess('');
      await api.createUnifiedTimetableSlot(selectedSubject, selectedTeacher, selectedStream, selectedDay, selectedPeriod);
      setSuccess('Lesson added to the timetable successfully');
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to add timetable slot');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      setError('');
      setSuccess('');
      await api.deleteUnifiedTimetableSlot(slotId);
      setSuccess('Slot removed successfully');
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to delete timetable slot');
    }
  };

  if (loading) {
    return (
      <div className="panel" style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
          <RefreshCcw className="animate-spin" size={32} />
          <p style={{ marginTop: '16px' }}>Building unified timetable overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ marginBottom: '16px' }}>
        <ArrowLeft size={15} /> Back to Dashboard
      </button>

      <div className="panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <h2 style={{ margin: 0, fontSize: '24px' }}>Unified Timetable</h2>
            <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>
              Generate a school-wide schedule that balances teacher workload and avoids overlapping lessons across streams.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={handleGenerateTimetable} disabled={generating}>
              <RefreshCcw size={16} /> {generating ? 'Regenerating...' : 'Generate Unified Timetable'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(160px, 1fr))', gap: '16px' }}>
          <div className="metric-card" style={{ padding: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '8px' }}>Scheduled Lessons</div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{timetableSlots.length}</div>
            <div style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>Slots across all streams and teachers</div>
          </div>

          <div className="metric-card" style={{ padding: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '8px' }}>Active Teachers</div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{allTeachers.length}</div>
            <div style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>Teachers available for scheduling</div>
          </div>

          <div className="metric-card" style={{ padding: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '8px' }}>Streams Covered</div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{allStreams.length}</div>
            <div style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>Streams in the unified schedule</div>
          </div>
        </div>
      </div>

      {(error || success) && (
        <div className="panel" style={{ marginBottom: '24px', background: error ? 'rgba(244, 67, 54, 0.08)' : 'rgba(16, 185, 129, 0.08)', borderColor: error ? 'rgba(244,67,54,0.25)' : 'rgba(16,185,129,0.25)' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-accent)' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && !error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success)' }}>
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      <div className="panel" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}><Calendar size={18} /> Manual Schedule Adjustment</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          Use this form to fix any schedule gaps or make urgent edits without regenerating the full timetable.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(170px, 1fr))', gap: '14px', alignItems: 'end' }}>
          <div>
            <label className="form-label">Teacher</label>
            <select className="form-control" value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
              <option value="">Select teacher</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Stream</label>
            <select className="form-control" value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)}>
              <option value="">Select stream</option>
              {streamOptions.map((stream) => (
                <option key={stream.id} value={stream.id}>{stream.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Subject</label>
            <select className="form-control" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">Select subject</option>
              {subjectOptions.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Day</label>
            <select className="form-control" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value as DayName)}>
              {DAYS.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Period</label>
            <select className="form-control" value={selectedPeriod} onChange={(e) => setSelectedPeriod(Number(e.target.value))}>
              {PERIODS.map((period) => (
                <option key={period} value={period}>Period {period}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
          <button className="btn btn-primary" onClick={handleAddSlot} disabled={!selectedTeacher || !selectedStream || !selectedSubject}>
            <Plus size={16} /> Save Slot
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>School-wide Schedule</h3>
            <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>Shows scheduled lessons for all streams across the week.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select className="form-control" style={{ minWidth: '180px' }} value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
              <option value="all">All Teachers</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
            <select className="form-control" style={{ minWidth: '180px' }} value={filterStream} onChange={(e) => setFilterStream(e.target.value)}>
              <option value="all">All Streams</option>
              {streamOptions.map((stream) => (
                <option key={stream.id} value={stream.id}>{stream.name}</option>
              ))}
            </select>
            <select className="form-control" style={{ minWidth: '180px' }} value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="all">All Subjects</option>
              {allSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ minWidth: '960px', marginBottom: 0 }}>
            <thead>
              <tr>
                <th style={{ minWidth: '90px' }}>Period</th>
                {DAYS.map((day) => (
                  <th key={day} style={{ textAlign: 'center', minWidth: '180px' }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period}>
                  <td style={{ fontWeight: 'bold', background: 'rgba(255,255,255,0.02)' }}>Period {period}</td>
                  {DAYS.map((day) => {
                    const cellSlots = filteredSlots.filter((slot) => slot.day === day && slot.period === period);
                    return (
                      <td key={`${day}-${period}`} style={{ verticalAlign: 'top', padding: '12px', minWidth: '180px' }}>
                        {cellSlots.length === 0 ? (
                          <div style={{ color: 'var(--text-dim)', fontSize: '12px', fontStyle: 'italic' }}>No lesson</div>
                        ) : (
                          <div style={{ display: 'grid', gap: '10px' }}>
                            {cellSlots.map((slot) => (
                              <div key={slot.id} style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                                  <strong style={{ fontSize: '12px' }}>{slot.subject?.name || 'Subject'}</strong>
                                  <button
                                    className="btn btn-icon"
                                    style={{ padding: '4px', minWidth: 'auto', borderRadius: '6px' }}
                                    onClick={() => handleDeleteSlot(slot.id)}
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                  <div>{slot.stream?.name || 'Stream'}</div>
                                  <div>{slot.teacher?.name || 'Teacher'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
