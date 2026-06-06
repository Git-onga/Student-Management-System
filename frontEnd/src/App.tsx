import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { StreamDetailPage } from './pages/StreamDetailPage';
import { SubjectDetailPage } from './pages/SubjectDetailPage';
import { Teachers } from './pages/Teachers.tsx';
import { Dashboard } from './pages/Dashboard';
import { Streams } from './pages/Streams';
import { Students } from './pages/Students';
import { Subjects } from './pages/Subjects';
import { Assessments } from './pages/Assessments';
import { Book, Users, BookOpen, GraduationCap, Edit3, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const segment = location.pathname.split('/')[1]?.toLowerCase();
    if (segment) {
      if (segment === 'subjects' || segment.startsWith('subject-detail')) {
        setActivePage('subjects');
      } else if (segment === 'streams' || segment.startsWith('stream-detail')) {
        setActivePage('streams');
      } else if (segment === 'teachers') {
        setActivePage('teachers');
      } else if (segment === 'students') {
        setActivePage('students');
      } else if (segment === 'assessments') {
        setActivePage('assessments');
      } else if (segment === 'dashboard') {
        setActivePage('dashboard');
      }
    }
  }, [location]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      const initial = prefersLight ? 'light' : 'dark';
      setTheme(initial);
      document.documentElement.setAttribute('data-theme', initial);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Book size={18} /> },
    { id: 'streams', label: 'Class Streams', icon: <GraduationCap size={18} /> },
    { id: 'teachers', label: 'Teachers', icon: <Users size={18} /> },
    { id: 'students', label: 'Students', icon: <Users size={18} /> },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen size={18} /> },
    { id: 'assessments', label: 'Assessments', icon: <Edit3 size={18} /> },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={(page) => setActivePage(page)} />;
      case 'streams':
        return <Streams />;
      case 'teachers':
        return <Teachers />;
      case 'students':
        return <Students />;
      case 'subjects':
        return <Subjects />;
      case 'assessments':
        return <Assessments />;
      default:
        return <Dashboard onNavigate={(page) => setActivePage(page)} />;
    }
  };

  return (
    <>
      <div className="app-shell">
        {/* Sidebar */}
        <aside className="app-sidebar">
          <div className="logo-section">
            <div className="logo-icon">IKX</div>
            <div className="logo-text">
              <h1>Ikonex Academy</h1>
              <p>Student Management</p>
            </div>
          </div>
          <ul className="nav-menu">
            {navItems.map(item => (
              <li
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActivePage(item.id);
                  navigate(`/${item.id}`);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={toggleTheme} aria-label="Toggle theme" style={{ padding: '8px 12px' }}>
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                <span style={{ marginLeft: '8px', fontSize: '13px' }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
            <div className="sidebar-footer">© {new Date().getFullYear()} Ikonex Academy</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="app-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard onNavigate={setActivePage} />} />
            <Route path="/streams" element={<Streams />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/students" element={<Students />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/stream-detail/:streamId" element={<StreamDetailPage />} />
            <Route path="/subject-detail/:subjectId" element={<SubjectDetailPage />} />
            <Route path="*" element={renderPage()} />
          </Routes>
        </main>
      </div>
    </>
  );
};

export default App;



