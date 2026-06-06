import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { type Subject, type Teacher, type Stream } from '../services/db';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award, 
  Percent, 
  ArrowLeft, 
  Search, 
  Phone, 
  Layers,
  GraduationCap,
  Loader2,
  X,
  Plus,
  Trash2,
  Calendar
} from 'lucide-react';

interface StudentPerformance {
  studentId: string;
  admissionNumber: string;
  name: string;
  gender: string;
  streamId: string;
  streamName: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string;
  term: string;
}

interface ClassAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  streamId: string;
  teacher?: Teacher;
  stream?: Stream;
  createdAt: string;
}

interface TimetableSlot {
  id: string;
  teacherId: string;
  subjectId: string;
  streamId: string;
  day: string;
  period: number;
  teacher?: Teacher;
  stream?: Stream;
  createdAt: string;
}

export const SubjectDetailPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [performanceData, setPerformanceData] = useState<StudentPerformance[]>([]);
  const [assignedStreams, setAssignedStreams] = useState<Stream[]>([]);
  const [assignedTeachers, setAssignedTeachers] = useState<Teacher[]>([]);

  // New state for class assignments and timetable
  const [classAssignments, setClassAssignments] = useState<ClassAssignment[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [selectedTeacherForAssignment, setSelectedTeacherForAssignment] = useState('');
  const [selectedStreamForAssignment, setSelectedStreamForAssignment] = useState('');
  const [selectedTeacherForTimetable, setSelectedTeacherForTimetable] = useState('');
  const [selectedStreamForTimetable, setSelectedStreamForTimetable] = useState('');
  const [selectedDayForTimetable, setSelectedDayForTimetable] = useState('Monday');
  const [selectedPeriodForTimetable, setSelectedPeriodForTimetable] = useState(1);
  const [timetablePopoverOpen, setTimetablePopoverOpen] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');

  const fetchSubjectDetails = async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      setError('');
      
      // Fetch subject details (includes teachers & stream subjects relations)
      const detail = await api.getSubject(subjectId);
      setSubject(detail);
      setAssignedTeachers(detail.teachers || []);
      
      const streamsList = (detail.streamSubjects || []).map((ss: any) => ss.stream).filter(Boolean);
      setAssignedStreams(streamsList);
      
      // Fetch performance analytics for this subject
      const perf = await api.getSubjectPerformance(subjectId, 'Term 1 2026');
      const mapped: StudentPerformance[] = (perf.scores || []).map((sc: any) => ({
        studentId: sc.student?.id || '',
        admissionNumber: sc.student?.admissionNumber || '',
        name: `${sc.student?.firstName || ''} ${sc.student?.lastName || ''}`.trim(),
        gender: sc.student?.gender || '',
        streamId: sc.student?.stream?.id || '',
        streamName: sc.student?.stream?.name || '',
        caScore: sc.caScore,
        examScore: sc.examScore,
        totalScore: sc.total,
        grade: sc.grade,
        remark: sc.remark,
        term: 'Term 1 2026',
      }));
      setPerformanceData(mapped);

      // Fetch class assignments and timetable for this subject
      const assignments = await api.getClassAssignments(subjectId);
      setClassAssignments(assignments);

      const timetable = await api.getSubjectTimetable(subjectId);
      setTimetableSlots(timetable);

      // Fetch all teachers and streams for dropdowns
      const teachers = await api.getTeachers();
      // Filter to only show teachers teaching this specific subject
      const filteredTeachers = teachers.filter(t => t.subjectOneId === subjectId || t.subjectTwoId === subjectId);
      setAllTeachers(filteredTeachers);

      const streams = await api.getStreams();
      setAllStreams(streams);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load subject details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectDetails();
  }, [subjectId]);

  const handleCreateClassAssignment = async () => {
    if (!subjectId || !selectedTeacherForAssignment || !selectedStreamForAssignment) return;
    try {
      await api.createClassAssignment(subjectId, selectedTeacherForAssignment, selectedStreamForAssignment);
      setSelectedTeacherForAssignment('');
      setSelectedStreamForAssignment('');
      await fetchSubjectDetails();
    } catch (err) {
      console.error('Failed to create assignment:', err);
    }
  };

  const handleDeleteClassAssignment = async (assignmentId: string) => {
    if (!subjectId) return;
    try {
      await api.deleteClassAssignment(subjectId, assignmentId);
      await fetchSubjectDetails();
    } catch (err) {
      console.error('Failed to delete assignment:', err);
    }
  };

  const handleCreateTimetableSlot = async () => {
    if (!subjectId || !selectedTeacherForTimetable || !selectedStreamForTimetable) return;
    try {
      await api.createTimetableSlot(
        subjectId, 
        selectedTeacherForTimetable, 
        selectedStreamForTimetable, 
        selectedDayForTimetable, 
        selectedPeriodForTimetable
      );
      setSelectedTeacherForTimetable('');
      setSelectedStreamForTimetable('');
      setSelectedDayForTimetable('Monday');
      setSelectedPeriodForTimetable(1);
      setTimetablePopoverOpen(null);
      await fetchSubjectDetails();
    } catch (err) {
      console.error('Failed to create timetable slot:', err);
    }
  };

  const handleDeleteTimetableSlot = async (slotId: string) => {
    if (!subjectId) return;
    try {
      await api.deleteTimetableSlot(subjectId, slotId);
      await fetchSubjectDetails();
    } catch (err) {
      console.error('Failed to delete timetable slot:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={36} />
        <p>Loading subject details and coverage metrics...</p>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="panel">
        <h2>Subject Not Found</h2>
        <p>{error || 'The subject you are trying to view does not exist or has been deleted.'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/subjects')}>
          <ArrowLeft size={16} /> Back to Subjects
        </button>
      </div>
    );
  }

  // Calculate statistics
  const totalStudents = performanceData.length;
  const averageScore = totalStudents > 0 
    ? Math.round((performanceData.reduce((sum, item) => sum + item.totalScore, 0) / totalStudents) * 10) / 10
    : 0;

  const passedStudents = performanceData.filter(item => item.totalScore >= 40).length;
  const passRate = totalStudents > 0 
    ? Math.round((passedStudents / totalStudents) * 1000) / 10
    : 0;

  // Find highest & lowest performers
  let topPerformer: StudentPerformance | null = null;

  if (totalStudents > 0) {
    const sortedByScore = [...performanceData].sort((a, b) => b.totalScore - a.totalScore);
    topPerformer = sortedByScore[0];
  }

  // Grade count breakdown
  const gradeDistribution = {
    'A': performanceData.filter(item => item.grade === 'A').length,
    'B': performanceData.filter(item => item.grade === 'B').length,
    'C': performanceData.filter(item => item.grade === 'C').length,
    'D': performanceData.filter(item => item.grade === 'D').length,
    'E': performanceData.filter(item => item.grade === 'E').length,
    'F': performanceData.filter(item => item.grade === 'F').length,
  };

  // Filtered Performance Data
  const filteredPerformance = performanceData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStream = selectedStream === 'all' || item.streamId === selectedStream;
    const matchesGrade = selectedGrade === 'all' || item.grade === selectedGrade;

    return matchesSearch && matchesStream && matchesGrade;
  });

  return (
    <>
      <button className="btn btn-secondary" onClick={() => navigate('/subjects')} style={{ marginBottom: '16px' }}>
        <ArrowLeft size={15} /> Back to Subjects
      </button>

      {/* SUBJECT COVER SUMMARY CARD */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '70px', 
            height: '70px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)'
          }}>
            <BookOpen size={32} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>{subject.name}</h2>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: 'var(--color-secondary)', 
                background: 'rgba(6, 182, 212, 0.08)', 
                padding: '4px 10px', 
                borderRadius: '6px',
                border: '1px solid rgba(6, 182, 212, 0.15)'
              }}>
                {subject.id}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px', marginBottom: 0 }}>
              {subject.description || 'No description available for this curriculum subject.'}
            </p>
          </div>
        </div>

        {/* Assigned Streams Quick info */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Assigned Streams ({assignedStreams.length})
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              {assignedStreams.map(s => (
                <span key={s.id} className="badge badge-graduated" style={{ fontSize: '11px' }}>
                  {s.name}
                </span>
              ))}
              {assignedStreams.length === 0 && (
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  No streams assigned.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* METRIC PERFORMANCE CARDS */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-header">
            <span>TOTAL ASSESSED STUDENTS</span>
            <div className="metric-icon">
              <Users size={18} />
            </div>
          </div>
          <div className="metric-value">{totalStudents}</div>
          <div className="metric-sub">Across {assignedStreams.length} active class streams</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>SUBJECT AVERAGE</span>
            <div className="metric-icon" style={{ color: 'var(--color-secondary)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="metric-value">{averageScore}%</div>
          <div className="metric-sub">Mean overall score out of 100</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>PASS RATE (≥ 40)</span>
            <div className="metric-icon" style={{ color: 'var(--color-success)' }}>
              <Percent size={18} />
            </div>
          </div>
          <div className="metric-value">{passRate}%</div>
          <div className="metric-sub">{passedStudents} of {totalStudents} students passed</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>TOP PERFORMER</span>
            <div className="metric-icon" style={{ color: 'var(--color-warning)' }}>
              <Award size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ fontSize: '18px', margin: '8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {topPerformer ? `${topPerformer.name}` : 'N/A'}
          </div>
          <div className="metric-sub" style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>
            {topPerformer ? `Score: ${topPerformer.totalScore}% (Grade ${topPerformer.grade})` : 'No scores entered yet'}
          </div>
        </div>
      </div>

      {/* DETAILS GRID LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: STUDENT LIST & FILTERS */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Overall Student Performance Roster</h3>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Showing {filteredPerformance.length} students</span>
          </div>

          {/* Search and filter bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: '220px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search student by name or adm number..."
                className="form-control search-control"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Stream Filter */}
            <div style={{ minWidth: '150px' }}>
              <select 
                className="form-control"
                value={selectedStream}
                onChange={e => setSelectedStream(e.target.value)}
                style={{ height: '42px', padding: '0 12px' }}
              >
                <option value="all">All Streams</option>
                {assignedStreams.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Grade Filter */}
            <div style={{ minWidth: '120px' }}>
              <select 
                className="form-control"
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                style={{ height: '42px', padding: '0 12px' }}
              >
                <option value="all">All Grades</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="D">Grade D</option>
                <option value="E">Grade E</option>
                <option value="F">Grade F</option>
              </select>
            </div>
          </div>

          {/* Table list */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Class Stream</th>
                  <th style={{ textAlign: 'center' }}>CA (40)</th>
                  <th style={{ textAlign: 'center' }}>Exam (60)</th>
                  <th style={{ textAlign: 'center' }}>Total (100)</th>
                  <th style={{ textAlign: 'center' }}>Grade</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {filteredPerformance.map(item => (
                  <tr key={item.studentId}>
                    <td style={{ fontWeight: 'bold' }}>{item.admissionNumber}</td>
                    <td>{item.name}</td>
                    <td>
                      <span className="badge badge-graduated" style={{ fontSize: '11px' }}>
                        {item.streamName}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.caScore}</td>
                    <td style={{ textAlign: 'center' }}>{item.examScore}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: item.totalScore >= 40 ? 'var(--text-main)' : 'var(--color-accent)' }}>
                      {item.totalScore}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge badge-grade-${item.grade.toLowerCase()}`}>
                        {item.grade}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{item.remark}</td>
                  </tr>
                ))}
                {filteredPerformance.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                      No performance results found matching your filter selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: GRADE DISTRIBUTION & ASSIGNED TEACHERS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Grade Distribution Bar Chart */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} /> Grade Distribution
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(Object.keys(gradeDistribution) as Array<keyof typeof gradeDistribution>).map(grd => {
                const count = gradeDistribution[grd];
                const pct = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
                
                let barColor = 'var(--color-primary)';
                if (grd === 'A') barColor = '#10b981';
                if (grd === 'B') barColor = '#06b6d4';
                if (grd === 'C') barColor = '#6366f1';
                if (grd === 'D') barColor = '#f59e0b';
                if (grd === 'E') barColor = '#fb923c';
                if (grd === 'F') barColor = '#f43f5e';

                return (
                  <div key={grd}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold' }}>Grade {grd}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count} ({Math.round(pct)}%)</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${pct}%`, 
                        background: barColor, 
                        borderRadius: '4px',
                        transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Teachers card */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={16} /> Subject Faculty
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {assignedTeachers.map(teacher => (
                <div 
                  key={teacher.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: 'var(--bg-hover, rgba(128,128,128,0.15))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-secondary)',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {teacher.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '13.5px' }}>{teacher.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <span>ID: {teacher.empID}</span>
                      <span>•</span>
                      <span>{teacher.telephone || 'No phone'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {assignedTeachers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-dim)', fontSize: '13px', fontStyle: 'italic' }}>
                  No teachers assigned to this subject.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="panel" style={{marginTop:'24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Layers size={18} /> Class Allocation
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Assign teachers to specific class streams for this subject.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              value={selectedTeacherForAssignment}
              onChange={(e) => setSelectedTeacherForAssignment(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            >
              <option value="">Select teacher...</option>
              {allTeachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
            <select
              className="form-control"
              value={selectedStreamForAssignment}
              onChange={(e) => setSelectedStreamForAssignment(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            >
              <option value="">Select stream...</option>
              {allStreams.map(stream => (
                <option key={stream.id} value={stream.id}>{stream.name}</option>
              ))}
            </select>
            <button 
              className="btn btn-primary" 
              onClick={handleCreateClassAssignment}
              disabled={!selectedTeacherForAssignment || !selectedStreamForAssignment}
            >
              <Plus size={16} /> Assign
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '500px', width: '100%', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <table className="custom-table" style={{ width: 'max-content', minWidth: '100%', marginBottom: 0 }}>
            <thead>
              <tr>
                <th style={{ minWidth: '160px', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'var(--bg-panel)', zIndex: 2 }}>Teacher Name</th>
                <th style={{ minWidth: '100px', whiteSpace: 'nowrap', position: 'sticky', left: '160px', background: 'var(--bg-panel)', zIndex: 2 }}>Emp ID</th>
                {assignedStreams.map(stream => (
                  <th key={stream.id} style={{ textAlign: 'center', minWidth: '140px', whiteSpace: 'nowrap' }}>{stream.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTeachers.length > 0 ? allTeachers.map(teacher => (
                <tr key={teacher.id}>
                  <td style={{ fontWeight: 'bold', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'var(--bg-panel)', zIndex: 1 }}>{teacher.name}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap', position: 'sticky', left: '160px', background: 'var(--bg-panel)', zIndex: 1 }}>{teacher.empID}</td>
                  {assignedStreams.map(stream => {
                    const hasAssignment = classAssignments.find(
                      a => a.teacherId === teacher.id && a.streamId === stream.id
                    );
                    return (
                      <td key={stream.id} style={{ textAlign: 'center', minWidth: '140px', whiteSpace: 'nowrap' }}>
                        {hasAssignment ? (
                          <span style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '12px' }}>✓ Assigned</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )) : (
                <tr>
                  <td colSpan={2 + assignedStreams.length} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '13px' }}>
                    No teachers available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>      
    </>
  );
};

