import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { type Student, type Stream, type Subject } from '../services/db';
import { Users, BookOpen, GraduationCap, Award, Calendar, Loader2 } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [streamAverages, setStreamAverages] = useState<{ name: string; avg: number }[]>([]);
  const [overallSchoolAverage, setOverallSchoolAverage] = useState(0);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const [fetchedStreams, fetchedStudents, fetchedSubjects] = await Promise.all([
          api.getStreams(),
          api.getStudents(),
          api.getSubjects(),
        ]);
        
        if (!active) return;
        
        setStreams(fetchedStreams);
        setStudents(fetchedStudents);
        setSubjects(fetchedSubjects);
        
        // Fetch rankings/averages for each stream
        let schoolTotalAvg = 0;
        let streamsWithData = 0;
        
        const averages = await Promise.all(
          fetchedStreams.map(async (stream) => {
            try {
              const result = await api.getStreamRankings(stream.id, 'Term 1 2026');
              const ranks = result.rankings || [];
              if (ranks.length === 0) return { name: stream.name, avg: 0 };
              
              const avg = ranks.reduce((sum, r) => sum + r.averageScore, 0) / ranks.length;
              schoolTotalAvg += avg;
              streamsWithData++;
              
              return {
                name: stream.name,
                avg: Math.round(avg * 10) / 10,
              };
            } catch {
              return { name: stream.name, avg: 0 };
            }
          })
        );
        
        if (!active) return;
        
        setStreamAverages(averages);
        setOverallSchoolAverage(streamsWithData > 0 ? Math.round(schoolTotalAvg / streamsWithData) : 0);
      } catch (err: any) {
        console.error(err);
        if (active) setError(err.message || 'Failed to load dashboard metrics');
      } finally {
        if (active) setLoading(false);
      }
    };
    
    loadData();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={36} />
        <p>Loading school metrics and performance stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="custom-alert alert-error" style={{ margin: '24px 0' }}>
        <h4>Error loading dashboard</h4>
        <p>{error}</p>
        <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => window.location.reload()}>
          Retry Connection
        </button>
      </div>
    );
  }

  const recentStudents = [...students]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 5);

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h2>Dashboard</h2>
          <p>Ikonex Academy Student Management System</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('assessments')}>
            Record Scores
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span>Enrolled Students</span>
            <div className="metric-icon">
              <Users size={20} />
            </div>
          </div>
          <div className="metric-value">{students.length}</div>
          <div className="metric-sub">Active academic year</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Class Streams</span>
            <div className="metric-icon">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="metric-value">{streams.length}</div>
          <div className="metric-sub">Active streams</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Subjects Offered</span>
            <div className="metric-icon">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="metric-value">{subjects.length}</div>
          <div className="metric-sub">Standard curriculum</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Academy Average</span>
            <div className="metric-icon">
              <Award size={20} />
            </div>
          </div>
          <div className="metric-value">{overallSchoolAverage}%</div>
          <div className="metric-sub">Based on latest Term scores</div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* SVG Performance Chart Panel */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Class Stream Performance Average</h3>
          </div>
          
          <div className="chart-widget">
            {streamAverages.map((s, idx) => {
              // Map percentage to chart height (max height is 160px for 100%)
              const heightPx = Math.round((s.avg / 100) * 160);
              return (
                <div key={idx} className="chart-bar-container">
                  <div 
                    className="chart-bar" 
                    style={{ height: `${heightPx}px`, minHeight: s.avg > 0 ? '5px' : '0' }}
                  >
                    <span className="chart-bar-tooltip">{s.name}: {s.avg}%</span>
                  </div>
                  <span className="chart-bar-label">{s.name}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--text-muted)', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', borderRadius: '2px' }}></span>
              <span>Class average score (%)</span>
            </div>
          </div>
        </div>

        {/* School Calendar Quick Widget */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Calendar size={16} style={{ color: 'var(--color-secondary)' }} />
              Term Roadmap
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                <span>CA Record Submissions</span>
                <span style={{ color: 'var(--color-primary)' }}>Active</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Submit Continuous Assessment scores (Max 40 points) for Term 1.</p>
            </div>
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                <span>Final Exam Entries</span>
                <span style={{ color: 'var(--text-muted)' }}>June 10</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Recording final exam paper grades (Max 60 points).</p>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                <span>Report Cards & Rankings</span>
                <span style={{ color: 'var(--text-muted)' }}>June 18</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Compilation of final ranks, averages, grades and PDF exports.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Student Registrations */}
      <div className="panel" style={{ marginTop: '12px' }}>
        <div className="panel-header">
          <h3 className="panel-title">Recent Student Enrolments</h3>
          <button className="btn btn-secondary" onClick={() => onNavigate('students')}>
            View All Directory
          </button>
        </div>
        
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Full Name</th>
                <th>Gender</th>
                <th>Class Stream</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.map(student => {
                const stream = streams.find(s => s.id === student.streamId);
                return (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 'bold' }}>{student.admissionNumber}</td>
                    <td>{student.firstName} {student.lastName}</td>
                    <td>{student.gender}</td>
                    <td>{stream ? stream.name : <span style={{ color: 'var(--text-dim)' }}>Unassigned</span>}</td>
                    <td>
                      <span className={`badge badge-${student.status}`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {recentStudents.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No students registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
