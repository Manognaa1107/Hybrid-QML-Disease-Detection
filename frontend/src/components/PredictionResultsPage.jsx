import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { HeartPulse, Activity, Stethoscope, BarChart3, Atom, Cpu, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, History, Clock, User, Save, Loader2, Check } from 'lucide-react';

export default function PredictionResultsPage({
  predictionResult,
  selectedDisease,
  selectedPatient,
  recentScreenings = [],
  onRunAnotherScreening,
  onBackToDashboard,
  onStartScreening,
  onSelectRecentItem
}) {
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // 1. EMPTY STATE IF NO PREDICTION EXISTS
  if (!predictionResult) {
    return (
      <div className="results-empty-state-wrapper">
        <div className="results-empty-state-card">
          <div className="empty-icon-badge">
            <BarChart3 size={36} className="empty-chart-icon" />
          </div>
          <h3 className="empty-state-title">No prediction yet</h3>
          <p className="empty-state-text">
            Complete a disease screening to see your Hybrid QML prediction here.
          </p>
          <button className="run-qml-btn start-screening-empty-btn" onClick={onStartScreening || onRunAnotherScreening}>
            Start a Screening <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // 2. ACTIVE PREDICTION STATE
  const isHighRisk = predictionResult.prediction === 1;
  const diseaseKey = selectedDisease || 'heart';
  const diseaseName = predictionResult.disease || (
    diseaseKey === 'heart' ? 'Heart Disease' :
    diseaseKey === 'breast_cancer' ? 'Breast Cancer' :
    diseaseKey === 'lung_cancer' ? 'Lung Cancer' : 'Disease'
  );

  const DiseaseIcon = diseaseKey === 'heart' ? HeartPulse :
                      diseaseKey === 'breast_cancer' ? Activity : Stethoscope;

  const decisionScore = predictionResult.decision_score;
  const selectedFeatures = predictionResult.selected_quantum_features || [];

  const handleSaveScreening = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const currentDoctorUid = auth.currentUser ? auth.currentUser.uid : '';
      const screeningDocData = {
        patientUid: selectedPatient?.selectedPatientUid || '',
        patientId: selectedPatient?.selectedPatientId || '',
        patientName: selectedPatient?.selectedPatientName || '',
        doctorUid: currentDoctorUid,
        disease: diseaseName,
        diseaseId: diseaseKey,
        inputs: predictionResult.inputs || {},
        prediction: predictionResult.prediction,
        label: predictionResult.label || (predictionResult.prediction === 1 ? 'High Risk' : 'Low Risk'),
        decisionScore: predictionResult.decision_score ?? null,
        selectedQuantumFeatures: predictionResult.selected_quantum_features || [],
        qubits: predictionResult.qubits || 4,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'screenings'), screeningDocData);
      setSaveSuccess(true);
    } catch (err) {
      console.error('Error saving screening to Firestore:', err);
      setSaveError('Unable to save screening. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="results-view-container">
      {/* SECTION A: CURRENT PREDICTION */}
      <div className="current-prediction-section">
        {/* Top Page Header */}
        <div className="results-page-header">
          <span className="section-kicker-tag">CURRENT PREDICTION</span>
          <h2>Prediction Results</h2>
          <p>
            Result from the Hybrid QML model.
            {selectedPatient && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '12px', background: 'var(--bg-tertiary)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>
                <User size={13} /> {selectedPatient.selectedPatientName} ({selectedPatient.selectedPatientId || selectedPatient.selectedPatientEmail})
              </span>
            )}
          </p>
        </div>

        {/* Primary Result Status Card */}
        <div className="main-result-card">
          <div className="result-card-content">
            <div className="result-disease-badge-row">
              <div className={`disease-avatar-circle ${isHighRisk ? 'high-risk-avatar' : 'low-risk-avatar'}`}>
                <DiseaseIcon size={30} />
              </div>
              <div className="result-disease-info">
                <h3 className="result-disease-name">{diseaseName}</h3>
                <div className="sub-tag">Hybrid QML Prediction</div>
                <div className={`risk-status-pill ${isHighRisk ? 'high-risk-pill' : 'low-risk-pill'}`}>
                  {isHighRisk ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{predictionResult.label}</span>
                </div>
              </div>
            </div>

            {/* Secondary Technical Model Output Box (Raw Decision Score) */}
            {decisionScore !== null && decisionScore !== undefined && (
              <div className="model-output-score-box">
                <span className="output-box-title">Model Output</span>
                <div className="output-score-content">
                  <span className="raw-score-lbl">Decision Score</span>
                  <span className="raw-score-val">
                    {typeof decisionScore === 'number' ? decisionScore.toFixed(4) : decisionScore}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Two-Column Technical Cards: Hybrid Quantum ML & Quantum Feature Profile */}
        <div className="results-two-col-grid">
          {/* Card 1: Hybrid Quantum ML */}
          <div className="results-section-card">
            <h4 className="section-card-title">Hybrid Quantum ML</h4>
            <div className="info-items-stack">
              <div className="info-box-item">
                <div className="box-icon-circle">
                  <Atom size={20} />
                </div>
                <div className="box-text">
                  <span className="box-val">{predictionResult.qubits || 4} Qubits</span>
                  <span className="box-lbl">Allocated Quantum Qubits</span>
                </div>
              </div>

              <div className="info-box-item">
                <div className="box-icon-circle">
                  <Cpu size={20} />
                </div>
                <div className="box-text">
                  <span className="box-val">Hybrid VQC</span>
                  <span className="box-lbl">Variational Quantum Classifier</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Quantum Feature Profile */}
          <div className="results-section-card">
            <h4 className="section-card-title">Quantum Feature Profile</h4>
            <div className="quantum-features-profile-grid">
              {selectedFeatures.length > 0 ? (
                selectedFeatures.map((featName, index) => (
                  <div key={index} className="feature-profile-card">
                    <div className={`feature-dot dot-color-${(index % 4) + 1}`} />
                    <div className="feature-profile-text">
                      <span className="feature-num-label">Feature {index + 1}</span>
                      <span className="feature-name-val">{featName}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-features-text">
                  4 Quantum features encoded into quantum circuit.
                </div>
              )}
            </div>

            <div className="qubit-circuit-footer-note">
              <span>Selected features encoded into 4-qubit quantum statevector circuit</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: RECENT SCREENINGS (SESSION HISTORY) */}
      <div className="recent-screenings-section">
        <div className="recent-section-header">
          <div className="recent-title-row">
            <History size={20} className="recent-icon" />
            <h3 className="section-title">Recent Screenings</h3>
          </div>
          <span className="section-subtitle-hint">Predictions executed during active browser session</span>
        </div>

        <div className="recent-screenings-list">
          {recentScreenings.length > 0 ? (
            recentScreenings.map((item) => {
              const isItemHigh = item.prediction === 1;
              return (
                <div
                  key={item.id}
                  className="recent-screening-item"
                  onClick={() => onSelectRecentItem && onSelectRecentItem(item)}
                >
                  <div className="recent-item-main">
                    <span className="recent-disease-name">{item.disease}</span>
                    <span className={`recent-status-tag ${isItemHigh ? 'recent-high' : 'recent-low'}`}>
                      {item.label}
                    </span>
                  </div>
                  <div className="recent-item-time">
                    <Clock size={14} />
                    <span>{item.timeStr}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="recent-empty-state">
              <p>No recent screenings yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Screening Status Banners */}
      {saveSuccess && (
        <div className="form-error-banner" role="alert" style={{ background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-border)', color: 'var(--risk-low-text)', marginBottom: '16px' }}>
          <CheckCircle2 size={18} />
          <span>Screening saved successfully.</span>
        </div>
      )}

      {saveError && (
        <div className="form-error-banner" role="alert" style={{ marginBottom: '16px' }}>
          <AlertTriangle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Primary Navigation Actions */}
      <div className="results-cta-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          className="run-qml-btn"
          onClick={handleSaveScreening}
          disabled={saving || saveSuccess}
          style={{
            background: saveSuccess ? 'var(--risk-low-bg)' : 'var(--primary)',
            color: saveSuccess ? 'var(--risk-low-text)' : '#ffffff',
            border: saveSuccess ? '1px solid var(--risk-low-border)' : 'none',
            opacity: (saving || saveSuccess) ? 0.85 : 1,
            cursor: (saving || saveSuccess) ? 'default' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {saving ? (
            <>
              <Loader2 size={18} className="btn-spinner" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check size={18} />
              Screening Saved
            </>
          ) : (
            <>
              <Save size={18} />
              Save Screening
            </>
          )}
        </button>

        <button className="run-another-btn" onClick={onRunAnotherScreening}>
          Run Another Screening <ArrowRight size={18} />
        </button>
        <button className="back-dashboard-btn" onClick={onBackToDashboard}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
}
