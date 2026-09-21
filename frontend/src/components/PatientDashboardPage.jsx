import React from 'react';
import { FileText, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


export default function PatientDashboardPage({ onGoToReports, onGoToHistory }) {
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Patient';

  return (
    <div className="dashboard-view-container" style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
      {/* Patient Welcome Hero Card */}
      <div className="dashboard-hero-card">
        <div className="hero-text-col">
          <span className="hero-badge-pill">Patient Portal</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            Welcome, {displayName}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: '520px' }}>
            Access your verified medical screening reports and early disease detection insights prepared by your healthcare provider.
          </p>
        </div>

        <div className="hero-visual-col" style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={48} />
          </div>
        </div>
      </div>

      {/* Patient Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div
          className="screening-card clickable-disease-card"
          onClick={onGoToReports}
          style={{ padding: '24px', cursor: 'pointer' }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
            <FileText size={20} />
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>My Reports</h4>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>View diagnostic reports and quantum screening summaries.</p>
        </div>

        <div
          className="screening-card clickable-disease-card"
          onClick={onGoToHistory}
          style={{ padding: '24px', cursor: 'pointer' }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e7f0e7', color: '#132e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
            <Clock size={20} />
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>Screening History</h4>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Review timeline of past medical risk assessments.</p>
        </div>
      </div>

      {/* Main Empty State Section */}
      <div className="screening-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <FileText size={30} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
          No reports yet
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
          Reports created by your doctor will appear here.
        </p>
      </div>
    </div>
  );
}
