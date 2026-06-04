import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Streams } from './pages/Streams';
import { Students } from './pages/Students';
import { Subjects } from './pages/Subjects';
import { Assessments } from './pages/Assessments';
import { Book, Users, BookOpen, GraduationCap, Edit3, Calendar } from 'lucide-react';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const navItems: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Book size={18} /> },
    { id: 'streams', label: 'Class Streams', icon: <GraduationCap size={18} /> },
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
    <Router>
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
                onClick={() => setActivePage(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
          <div className="sidebar-footer">
            © {new Date().getFullYear()} Ikonex Academy
          </div>
        </aside>

        {/* Main Content */}
        <main className="app-content">
          {renderPage()}
        </main>
      </div>
    </Router>
  );
};
export default App;

