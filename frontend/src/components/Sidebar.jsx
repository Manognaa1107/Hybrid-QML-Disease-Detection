import React, { useState } from 'react';
import { LayoutDashboard, Stethoscope, BarChart3, Atom } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, onNewScreening, onOpenResults }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (action) => {
    setMobileOpen(false);
    action();
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

            <button
              className={`nav-item ${isScreeningActive ? 'active' : ''}`}
              onClick={() => handleNavClick(onNewScreening)}
            >
              <Stethoscope size={18} className="nav-icon-svg" />
              <span className="nav-text">New Screening</span>
            </button>

            <button
              className={`nav-item ${currentView === 'results' ? 'active' : ''}`}
              onClick={() => handleNavClick(onOpenResults)}
            >
              <BarChart3 size={18} className="nav-icon-svg" />
              <span className="nav-text">Prediction Results</span>
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

