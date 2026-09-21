import React, { useState, useEffect } from 'react';
import { predictDisease } from '../api';
import { HeartPulse, Activity, Stethoscope, ArrowLeft, ArrowRight, AlertCircle, Loader2, User, FileText, CheckCircle2 } from 'lucide-react';

const DISEASE_CONFIGS = {
  heart: {
    title: 'Heart Disease Screening',
    icon: HeartPulse,
    badgeClass: 'heart-icon-badge',
    defaultValues: {
      age: 63.0, sex: 1.0, cp: 1.0, trestbps: 145.0, chol: 233.0,
      fbs: 1.0, restecg: 2.0, thalach: 150.0, exang: 0.0, oldpeak: 2.3,
      slope: 3.0, ca: 0.0, thal: 6.0
    }
  },
  breast_cancer: {
    title: 'Breast Cancer Screening',
    icon: Activity,
    badgeClass: 'breast-icon-badge',
    defaultValues: {
      'mean radius': 17.99, 'mean texture': 10.38, 'mean perimeter': 122.8, 'mean area': 1001.0,
      'mean smoothness': 0.1184, 'mean compactness': 0.2776, 'mean concavity': 0.3001,
      'mean concave points': 0.1471, 'mean symmetry': 0.2419, 'mean fractal dimension': 0.07871
    }
  },
  lung_cancer: {
    title: 'Lung Cancer Screening',
    icon: Stethoscope,
    badgeClass: 'lung-icon-badge',
    defaultValues: {
      GENDER: 1, AGE: 69, SMOKING: 1, YELLOW_FINGERS: 1, ANXIETY: 1,
      PEER_PRESSURE: 1, 'CHRONIC DISEASE': 1, FATIGUE: 1, ALLERGY: 1,
      WHEEZING: 1, 'ALCOHOL CONSUMING': 1, COUGHING: 1,
      'SHORTNESS OF BREATH': 1, 'SWALLOWING DIFFICULTY': 1, 'CHEST PAIN': 1
    }
  }
};

export default function DiseaseScreeningPage({ selectedDisease, selectedPatient, onBackToDashboard, onResultReceived }) {
  const diseaseKey = selectedDisease || 'heart';
  const config = DISEASE_CONFIGS[diseaseKey] || DISEASE_CONFIGS.heart;
  const IconComponent = config.icon;

  const [formData, setFormData] = useState(config.defaultValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedPatient?.extractedValues) {
      const merged = { ...config.defaultValues };
      Object.keys(selectedPatient.extractedValues).forEach((key) => {
        const val = selectedPatient.extractedValues[key];
        if (val !== null && val !== undefined && val !== '' && val !== 'Not found') {
          merged[key] = val;
        }
      });
      setFormData(merged);
    } else {
      setFormData(config.defaultValues);
    }
    setError(null);
  }, [diseaseKey, selectedPatient]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? '' : (isNaN(value) ? value : parseFloat(value))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate no empty or invalid values remain
    const missingKeys = Object.keys(formData).filter((k) => formData[k] === '' || formData[k] === null || formData[k] === undefined || Number.isNaN(formData[k]));
    if (missingKeys.length > 0) {
      setError('Some required values were not found or are incomplete. Please review and complete the remaining fields before prediction.');
      return;
    }

    setLoading(true);

    try {
      const payload = { disease: diseaseKey, ...formData };
      const res = await predictDisease(diseaseKey, payload);
      onResultReceived(res, diseaseKey, formData);
    } catch (err) {
      console.error('Screening prediction error:', err);
      setError(err.message || 'Failed to analyze patient screening data. Ensure backend is active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screening-view-container">
      {/* Back to Dashboard Navigation Bar */}
      <div className="screening-top-bar">
        <button className="back-link-btn" onClick={onBackToDashboard}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {selectedPatient && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={16} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-light)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Patient Record
              </span>
              <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                {selectedPatient.selectedPatientName} {selectedPatient.selectedPatientId && <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.85rem' }}>({selectedPatient.selectedPatientId})</span>}
              </p>
            </div>
          </div>

          {selectedPatient.reportFileName && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-tertiary)',
              color: 'var(--primary)',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '0.8rem',
              fontWeight: '700'
            }}>
              <CheckCircle2 size={14} /> Auto-filled from: {selectedPatient.reportFileName}
            </div>
          )}
        </div>
      )}

      {/* Main Screening Form Card */}
      <div className="screening-card">
        <div className="screening-header">
          <div className="header-title-row">
            <div className={`card-icon-badge ${config.badgeClass}`}>
              <IconComponent size={24} className="disease-svg-icon" />
            </div>
            <h2 className="screening-title">{config.title}</h2>
          </div>
          <p className="screening-subtitle">Enter clinical screening inputs for AI-assisted risk assessment using Hybrid QML.</p>
        </div>

        {error && (
          <div className="form-error-banner" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}


        <form onSubmit={handleSubmit} className="screening-form">
          {/* HEART DISEASE FIELDS */}
          {diseaseKey === 'heart' && (
            <div className="form-grid-2col">
              <div className="form-field-group">
                <label className="field-label">Age (years)</label>
                <input
                  type="number"
                  value={formData.age ?? ''}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  min="1" max="120" required className="field-input"
                />
              </div>

              <div className="form-field-group">
                <label className="field-label">Sex</label>
                <select
                  value={formData.sex ?? 1}
                  onChange={(e) => handleInputChange('sex', e.target.value)}
                  className="field-select"
                >
                  <option value={1}>1 = Male</option>
                  <option value={0}>0 = Female</option>
                </select>
              </div>

              <div className="form-field-group">
                <label className="field-label">Chest Pain Type</label>
                <select
                  value={formData.cp ?? 1}
                  onChange={(e) => handleInputChange('cp', e.target.value)}
                  className="field-select"
                >
                  <option value={1}>1 = Typical Angina</option>
                  <option value={2}>2 = Atypical Angina</option>
                  <option value={3}>3 = Non-Anginal Pain</option>
                  <option value={4}>4 = Asymptomatic</option>
                </select>
              </div>

              <div className="form-field-group">
                <label className="field-label">Resting Blood Pressure (mm Hg)</label>
                <input
                  type="number"
                  value={formData.trestbps ?? ''}
                  onChange={(e) => handleInputChange('trestbps', e.target.value)}
                  min="50" max="250" required className="field-input"
                />
              </div>

              <div className="form-field-group">
                <label className="field-label">Serum Cholesterol (mg/dl)</label>
                <input
                  type="number"
                  value={formData.chol ?? ''}
                  onChange={(e) => handleInputChange('chol', e.target.value)}
                  min="100" max="600" required className="field-input"
                />
              </div>

              <div className="form-field-group">
                <label className="field-label">Fasting Blood Sugar</label>
                <select
                  value={formData.fbs ?? 0}
                  onChange={(e) => handleInputChange('fbs', e.target.value)}
                  className="field-select"
                >
                  <option value={0}>0 = ≤ 120 mg/dl</option>
                  <option value={1}>1 = &gt; 120 mg/dl</option>
                </select>
              </div>

              <div className="form-field-group">
                <label className="field-label">Resting ECG Results</label>
                <select
                  value={formData.restecg ?? 0}
                  onChange={(e) => handleInputChange('restecg', e.target.value)}
                  className="field-select"
                >
                  <option value={0}>0 = Normal</option>
                  <option value={1}>1 = ST-T Abnormality</option>
                  <option value={2}>2 = LV Hypertrophy</option>
                </select>
              </div>

              <div className="form-field-group">
                <label className="field-label">Maximum Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={formData.thalach ?? ''}
                  onChange={(e) => handleInputChange('thalach', e.target.value)}
                  min="60" max="230" required className="field-input"
                />
              </div>

              <div className="form-field-group">
                <label className="field-label">Exercise-Induced Angina</label>
                <select
                  value={formData.exang ?? 0}
                  onChange={(e) => handleInputChange('exang', e.target.value)}
                  className="field-select"
                >
                  <option value={0}>0 = No</option>
                  <option value={1}>1 = Yes</option>
                </select>
              </div>

              <div className="form-field-group">
                <label className="field-label">ST Depression (oldpeak)</label>
                <input
                  type="number"
                  value={formData.oldpeak ?? 0}
                  onChange={(e) => handleInputChange('oldpeak', e.target.value)}
                  min="0" max="10" step="0.1" required className="field-input"
                />
              </div>

              <div className="form-field-group">
                <label className="field-label">Slope of Peak ST</label>
                <select
                  value={formData.slope ?? 1}
                  onChange={(e) => handleInputChange('slope', e.target.value)}
                  className="field-select"
                >
                  <option value={1}>1 = Upsloping</option>
                  <option value={2}>2 = Flat</option>
                  <option value={3}>3 = Downsloping</option>
                </select>
              </div>

              <div className="form-field-group">
                <label className="field-label">Major Vessels (0-3)</label>
                <select
                  value={formData.ca ?? 0}
                  onChange={(e) => handleInputChange('ca', e.target.value)}
                  className="field-select"
                >
                  <option value={0}>0 Major Vessels</option>
                  <option value={1}>1 Major Vessel</option>
                  <option value={2}>2 Major Vessels</option>
                  <option value={3}>3 Major Vessels</option>
                </select>
              </div>

              <div className="form-field-group">
                <label className="field-label">Thalassemia</label>
                <select
                  value={formData.thal ?? 3}
                  onChange={(e) => handleInputChange('thal', e.target.value)}
                  className="field-select"
                >
                  <option value={3}>3 = Normal</option>
                  <option value={6}>6 = Fixed Defect</option>
                  <option value={7}>7 = Reversible Defect</option>
                </select>
              </div>
            </div>
          )}

          {/* BREAST CANCER FIELDS */}
          {diseaseKey === 'breast_cancer' && (
            <div className="form-grid-2col">
              {[
                { name: 'mean radius', label: 'Mean Radius (mm)', min: 5, max: 35, step: 0.01 },
                { name: 'mean texture', label: 'Mean Texture', min: 5, max: 40, step: 0.01 },
                { name: 'mean perimeter', label: 'Mean Perimeter (mm)', min: 40, max: 200, step: 0.1 },
                { name: 'mean area', label: 'Mean Area (mm²)', min: 100, max: 2500, step: 0.1 },
                { name: 'mean smoothness', label: 'Mean Smoothness', min: 0.05, max: 0.25, step: 0.001 },
                { name: 'mean compactness', label: 'Mean Compactness', min: 0.01, max: 0.5, step: 0.001 },
                { name: 'mean concavity', label: 'Mean Concavity', min: 0.0, max: 0.5, step: 0.001 },
                { name: 'mean concave points', label: 'Mean Concave Points', min: 0.0, max: 0.25, step: 0.001 },
                { name: 'mean symmetry', label: 'Mean Symmetry', min: 0.1, max: 0.5, step: 0.001 },
                { name: 'mean fractal dimension', label: 'Mean Fractal Dimension', min: 0.01, max: 0.15, step: 0.001 }
              ].map((f) => (
                <div key={f.name} className="form-field-group">
                  <label className="field-label">{f.label}</label>
                  <input
                    type="number"
                    value={formData[f.name] ?? ''}
                    onChange={(e) => handleInputChange(f.name, e.target.value)}
                    min={f.min} max={f.max} step={f.step} required className="field-input"
                  />
                </div>
              ))}
            </div>
          )}

          {/* LUNG CANCER FIELDS */}
          {diseaseKey === 'lung_cancer' && (
            <div className="form-grid-2col">
              <div className="form-field-group">
                <label className="field-label">Gender</label>
                <select
                  value={formData.GENDER ?? 1}
                  onChange={(e) => handleInputChange('GENDER', e.target.value)}
                  className="field-select"
                >
                  <option value={1}>Male</option>
                  <option value={0}>Female</option>
                </select>
              </div>

              <div className="form-field-group">
                <label className="field-label">Age (years)</label>
                <input
                  type="number"
                  value={formData.AGE ?? ''}
                  onChange={(e) => handleInputChange('AGE', e.target.value)}
                  min="18" max="100" required className="field-input"
                />
              </div>

              {[
                { name: 'SMOKING', label: 'Smoking Habit' },
                { name: 'YELLOW_FINGERS', label: 'Yellow Fingers' },
                { name: 'ANXIETY', label: 'Anxiety' },
                { name: 'PEER_PRESSURE', label: 'Peer Pressure' },
                { name: 'CHRONIC DISEASE', label: 'Chronic Respiratory Disease' },
                { name: 'FATIGUE', label: 'Fatigue / Exhaustion' },
                { name: 'ALLERGY', label: 'Allergies' },
                { name: 'WHEEZING', label: 'Wheezing' },
                { name: 'ALCOHOL CONSUMING', label: 'Alcohol Consumption' },
                { name: 'COUGHING', label: 'Persistent Coughing' },
                { name: 'SHORTNESS OF BREATH', label: 'Shortness of Breath' },
                { name: 'SWALLOWING DIFFICULTY', label: 'Swallowing Difficulty' },
                { name: 'CHEST PAIN', label: 'Chest Pain' }
              ].map((f) => (
                <div key={f.name} className="form-field-group">
                  <label className="field-label">{f.label}</label>
                  <select
                    value={formData[f.name] ?? 0}
                    onChange={(e) => handleInputChange(f.name, e.target.value)}
                    className="field-select"
                  >
                    <option value={0}>No / Absent</option>
                    <option value={1}>Yes / Present</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Action Submit Button */}
          <div className="form-submit-row">
            <button
              type="submit"
              disabled={loading}
              className="run-qml-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="btn-spinner" /> Running Hybrid QML...
                </>
              ) : (
                <>
                  Run Hybrid QML Prediction <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
