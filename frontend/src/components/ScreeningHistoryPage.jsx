import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Clock, CheckCircle2, AlertTriangle, Calendar, Atom, Loader2, AlertCircle } from 'lucide-react';

export default function ScreeningHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
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

        // Sort newest screening first
        list.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });

        setHistory(list);
      } catch (err) {
        console.error('Error fetching patient screening history:', err);
        setError('Unable to load screening history. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
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
        <h2>Screening History</h2>
        <p>View timeline and historical records of your medical screening evaluations.</p>
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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading screening history from Firestore...</p>
        </div>
      ) : history.length === 0 ? (
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
            <Clock size={36} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            No screening history yet
          </h3>
          <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
            No screening history yet. Once your healthcare provider performs a QML screening, your records will appear here.
          </p>
        </div>
      ) : (
        <div className="screening-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {history.map((item, index) => {
              const isHighRisk = item.prediction === 1;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      #{history.length - index}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                        {item.disease}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    {item.decisionScore !== null && item.decisionScore !== undefined && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600, display: 'block' }}>
                          DECISION SCORE
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {typeof item.decisionScore === 'number' ? item.decisionScore.toFixed(4) : item.decisionScore}
                        </span>
                      </div>
                    )}

                    <div className={`risk-status-pill ${isHighRisk ? 'high-risk-pill' : 'low-risk-pill'}`}>
                      {isHighRisk ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                      <span>{item.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
