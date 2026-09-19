import React, { useState } from 'react';
import { LayoutDashboard, Stethoscope, BarChart3, Atom, UserCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Sidebar({ currentView, setCurrentView, onNewScreening, onOpenResults }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role } = useAuth();

  const handleNavClick = (action) => {
    setMobileOpen(false);
    action();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView('dashboard');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const isScreeningActive = currentView === 'new_screening' || currentView === 'screening';

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        className="mobile-sidebar-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        <span className="toggle-bar"></span>
        <span className="toggle-bar"></span>
        <span className="toggle-bar"></span>
      </button>

      {/* Sidebar Shell */}
      <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Atom size={22} className="brand-atom-icon" />
          </div>
          <span className="brand-name">Hybrid QML</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <button
              className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick(() => setCurrentView('dashboard'))}
            >
              <LayoutDashboard size={18} className="nav-icon-svg" />
              <span className="nav-text">Dashboard</span>
            </button>

            {role !== 'patient' && (
              <button
                className={`nav-item ${isScreeningActive ? 'active' : ''}`}
                onClick={() => handleNavClick(onNewScreening)}
              >
                <Stethoscope size={18} className="nav-icon-svg" />
                <span className="nav-text">New Screening</span>
              </button>
            )}

            <button
              className={`nav-item ${currentView === 'results' ? 'active' : ''}`}
              onClick={() => handleNavClick(onOpenResults)}
            >
              <BarChart3 size={18} className="nav-icon-svg" />
              <span className="nav-text">Prediction Results</span>
            </button>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.775rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={14} />
              <span>{role === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px', wordBreak: 'break-all' }}>
              {user?.email}
            </div>
            <button
              className="nav-item"
              style={{ color: '#b33325', padding: '8px 12px' }}
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span className="nav-text">Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}


