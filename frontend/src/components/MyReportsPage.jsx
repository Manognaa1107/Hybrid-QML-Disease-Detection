import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { FolderHeart, CheckCircle2, AlertTriangle, Calendar, Stethoscope, User, Loader2, AlertCircle, Cpu, Atom } from 'lucide-react';

export default function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReports() {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const q = query(
          collection(db, 'screenings'),
          where('patientUid', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Client-side sort: Newest screening first
        list.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });

        setReports(list);
      } catch (err) {
        console.error('Error fetching patient reports:', err);
        setError('Unable to load reports. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recent';
    const dateObj = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-view-container" style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
      <div className="selection-header-banner" style={{ marginBottom: '24px' }}>
        <h2>My Reports</h2>
        <p>Access and review your clinical disease screening diagnostic reports.</p>
      </div>

      {error && (
        <div className="form-error-banner" role="alert" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} className="error-icon" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="screening-card" style={{ padding: '60px 32px', textAlign: 'center' }}>
          <Loader2 size={28} className="btn-spinner" style={{ color: 'var(--primary)', margin: '0 auto 12px auto' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading reports from Firestore...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="screening-card" style={{ padding: '64px 32px', textAlign: 'center' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <FolderHeart size={36} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            No reports yet
          </h3>
          <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
            No reports yet — reports created by your doctor will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {reports.map((report) => {
            const isHighRisk = report.prediction === 1;
            return (
              <div key={report.id} className="screening-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {report.disease}
                      </h3>
                      {report.patientId && (
                        <span style={{ background: 'var(--bg-tertiary)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                          {report.patientId}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> {formatDate(report.createdAt)}
                    </p>
                  </div>

                  <div className={`risk-status-pill ${isHighRisk ? 'high-risk-pill' : 'low-risk-pill'}`}>
                    {isHighRisk ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                    <span>{report.label}</span>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  background: 'var(--bg-main)',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Decision Score
                    </span>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '2px 0 0 0' }}>
                      {typeof report.decisionScore === 'number' ? report.decisionScore.toFixed(4) : (report.decisionScore || 'N/A')}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Quantum Model
                    </span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Atom size={14} /> {report.qubits || 4} Qubit VQC
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Attending Doctor
                    </span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Stethoscope size={14} /> {report.doctorUid ? `Doctor (${report.doctorUid.slice(0, 6)}...)` : 'Authorized Practitioner'}
                    </p>
                  </div>
                </div>

                {report.selectedQuantumFeatures && report.selectedQuantumFeatures.length > 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Selected Quantum Features:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {report.selectedQuantumFeatures.map((feat, idx) => (
                        <span key={idx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.775rem', color: 'var(--text-main)' }}>
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
