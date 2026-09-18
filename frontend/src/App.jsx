import React, { useState, useEffect } from 'react';
import { checkHealth, fetchModelInfo, predictPatient, compareModels } from './api';

// Sample Patient Presets for Quick Testing
const SAMPLE_PATIENT_HIGH_RISK = {
  age: 67.0,
  sex: 1.0,
  cp: 4.0,
  trestbps: 160.0,
  chol: 286.0,
  fbs: 0.0,
  restecg: 2.0,
  thalach: 108.0,
  exang: 1.0,
  oldpeak: 1.5,
  slope: 2.0,
  ca: 3.0,
  thal: 3.0
};

const SAMPLE_PATIENT_LOW_RISK = {
  age: 37.0,
  sex: 1.0,
  cp: 3.0,
  trestbps: 130.0,
  chol: 250.0,
  fbs: 0.0,
  restecg: 0.0,
  thalach: 187.0,
  exang: 0.0,
  oldpeak: 3.5,
  slope: 3.0,
  ca: 0.0,
  thal: 3.0
};

export default function App() {
  // Form State initialized with Cleveland Dataset Sample #1
  const [formData, setFormData] = useState({
    age: 63.0,
    sex: 1.0,
    cp: 1.0,
    trestbps: 145.0,
    chol: 233.0,
    fbs: 1.0,
    restecg: 2.0,
    thalach: 150.0,
    exang: 0.0,
    oldpeak: 2.3,
    slope: 3.0,
    ca: 0.0,
    thal: 6.0
  });

  // System & API State
  const [healthStatus, setHealthStatus] = useState('loading');
  const [modelInfo, setModelInfo] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check Backend Health & Load Model Info on mount
  useEffect(() => {
    async function initSystem() {
      const health = await checkHealth();
      setHealthStatus(health.status);

      if (health.status === 'healthy') {
        try {
          const info = await fetchModelInfo();
          setModelInfo(info);
        } catch (err) {
          console.warn('Could not load benchmark metrics:', err);
        }
      }
    }
    initSystem();
  }, []);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // Load Presets
  const loadPreset = (presetData) => {
    setFormData(presetData);
    setPredictionResult(null);
    setComparisonResult(null);
    setError(null);
  };

  // Form Submit / Predict Action
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Call /predict for VQC Risk Assessment
      const predRes = await predictPatient(formData);
      setPredictionResult(predRes);

      // 2. Call /compare for Classical vs QML Model Comparison
      const compRes = await compareModels(formData);
      setComparisonResult(compRes);

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to complete patient risk screening analysis. Please verify the FastAPI backend is running at http://localhost:8001.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* 1. Header */}
      <header className="app-header">
        <div className="header-title-group">
          <h1>Hybrid QML Disease Detection</h1>
          <p className="header-subtitle">Early Heart Disease Risk Screening</p>
        </div>
        <div className="status-badge">
          <span
            className={`status-dot ${
              healthStatus === 'healthy' ? '' : healthStatus === 'loading' ? 'loading' : 'offline'
            }`}
          ></span>
          <span>
            {healthStatus === 'healthy'
              ? 'System Ready'
              : healthStatus === 'loading'
              ? 'Connecting...'
              : 'Backend Offline'}
          </span>
        </div>
      </header>

      {/* Global Error Banner if Backend Error */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* 2. Patient Information Form */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Patient Clinical Measurements</h2>
          <p className="card-subtitle">
            Enter the patient's clinical measurements to generate a model-based risk screening result.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Age */}
            <div className="form-group">
              <label className="form-label" htmlFor="age">Age (years)</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="1"
                max="120"
                step="1"
                required
                className="form-input"
              />
            </div>

            {/* Sex */}
            <div className="form-group">
              <label className="form-label" htmlFor="sex">Sex</label>
              <select
                id="sex"
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="form-select"
              >
                <option value={1}>1 = Male</option>
                <option value={0}>0 = Female</option>
              </select>
            </div>

            {/* Chest Pain Type */}
            <div className="form-group">
              <label className="form-label" htmlFor="cp">Chest Pain Type</label>
              <select
                id="cp"
                name="cp"
                value={formData.cp}
                onChange={handleChange}
                className="form-select"
              >
                <option value={1}>1 = Typical Angina</option>
                <option value={2}>2 = Atypical Angina</option>
                <option value={3}>3 = Non-Anginal Pain</option>
                <option value={4}>4 = Asymptomatic</option>
              </select>
            </div>

            {/* Resting Blood Pressure */}
            <div className="form-group">
              <label className="form-label" htmlFor="trestbps">Resting Blood Pressure (mm Hg)</label>
              <input
                type="number"
                id="trestbps"
                name="trestbps"
                value={formData.trestbps}
                onChange={handleChange}
                min="50"
                max="250"
                step="1"
                required
                className="form-input"
              />
            </div>

            {/* Cholesterol */}
            <div className="form-group">
              <label className="form-label" htmlFor="chol">Serum Cholesterol (mg/dl)</label>
              <input
                type="number"
                id="chol"
                name="chol"
                value={formData.chol}
                onChange={handleChange}
                min="100"
                max="600"
                step="1"
                required
                className="form-input"
              />
            </div>

            {/* Fasting Blood Sugar */}
            <div className="form-group">
              <label className="form-label" htmlFor="fbs">Fasting Blood Sugar</label>
              <select
                id="fbs"
                name="fbs"
                value={formData.fbs}
                onChange={handleChange}
                className="form-select"
              >
                <option value={0}>0 = ≤ 120 mg/dl (Normal)</option>
                <option value={1}>1 = &gt; 120 mg/dl (Elevated)</option>
              </select>
            </div>

            {/* Resting ECG */}
            <div className="form-group">
              <label className="form-label" htmlFor="restecg">Resting ECG Results</label>
              <select
                id="restecg"
                name="restecg"
                value={formData.restecg}
                onChange={handleChange}
                className="form-select"
              >
                <option value={0}>0 = Normal</option>
                <option value={1}>1 = ST-T Wave Abnormality</option>
                <option value={2}>2 = Left Ventricular Hypertrophy</option>
              </select>
            </div>

            {/* Maximum Heart Rate */}
            <div className="form-group">
              <label className="form-label" htmlFor="thalach">Maximum Heart Rate (bpm)</label>
              <input
                type="number"
                id="thalach"
                name="thalach"
                value={formData.thalach}
                onChange={handleChange}
                min="60"
                max="230"
                step="1"
                required
                className="form-input"
              />
            </div>

            {/* Exercise-Induced Angina */}
            <div className="form-group">
              <label className="form-label" htmlFor="exang">Exercise-Induced Angina</label>
              <select
                id="exang"
                name="exang"
                value={formData.exang}
                onChange={handleChange}
                className="form-select"
              >
                <option value={0}>0 = No</option>
                <option value={1}>1 = Yes</option>
              </select>
            </div>

            {/* ST Depression */}
            <div className="form-group">
              <label className="form-label" htmlFor="oldpeak">ST Depression (oldpeak)</label>
              <input
                type="number"
                id="oldpeak"
                name="oldpeak"
                value={formData.oldpeak}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.1"
                required
                className="form-input"
              />
              <span className="helper-text">Exercise ST depression relative to rest</span>
            </div>

            {/* Slope */}
            <div className="form-group">
              <label className="form-label" htmlFor="slope">Slope of Peak ST Segment</label>
              <select
                id="slope"
                name="slope"
                value={formData.slope}
                onChange={handleChange}
                className="form-select"
              >
                <option value={1}>1 = Upsloping</option>
                <option value={2}>2 = Flat</option>
                <option value={3}>3 = Downsloping</option>
              </select>
            </div>

            {/* Major Vessels */}
            <div className="form-group">
              <label className="form-label" htmlFor="ca">Major Vessels (Fluoroscopy)</label>
              <select
                id="ca"
                name="ca"
                value={formData.ca}
                onChange={handleChange}
                className="form-select"
              >
                <option value={0}>0 Major Vessels</option>
                <option value={1}>1 Major Vessel</option>
                <option value={2}>2 Major Vessels</option>
                <option value={3}>3 Major Vessels</option>
              </select>
            </div>

            {/* Thalassemia */}
            <div className="form-group">
              <label className="form-label" htmlFor="thal">Thalassemia Indicator</label>
              <select
                id="thal"
                name="thal"
                value={formData.thal}
                onChange={handleChange}
                className="form-select"
              >
                <option value={3}>3 = Normal</option>
                <option value={6}>6 = Fixed Defect</option>
                <option value={7}>7 = Reversible Defect</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="sample-btn"
                onClick={() => loadPreset(SAMPLE_PATIENT_LOW_RISK)}
              >
                Sample Patient (Low Risk)
              </button>
              <button
                type="button"
                className="sample-btn"
                onClick={() => loadPreset(SAMPLE_PATIENT_HIGH_RISK)}
              >
                Sample Patient (At Risk)
              </button>
            </div>

            <button type="submit" disabled={loading} className="analyze-btn">
              {loading ? 'Analyzing...' : 'Analyze Patient'}
            </button>
          </div>
        </form>
      </section>

      {/* 3. Prediction Result Section */}
      {predictionResult && (
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Risk Screening Result</h2>
            <p className="card-subtitle">
              Generated by the Variational Quantum Classifier (VQC) using quantum feature encoding.
            </p>
          </div>

          <div
            className={`result-banner ${
              predictionResult.prediction === 1 ? 'high-risk' : 'low-risk'
            }`}
          >
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Condition: Heart Disease</div>
              <div
                className={`result-badge ${
                  predictionResult.prediction === 1 ? 'high-risk' : 'low-risk'
                }`}
              >
                {predictionResult.label}
              </div>
            </div>
          </div>

          <div className="result-details-grid">
            <div className="detail-item">
              <span className="detail-label">Model Architecture</span>
              <span className="detail-value">{predictionResult.model}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Qubits Allocated</span>
              <span className="detail-value">{predictionResult.qubits} Qubits</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Decision Score</span>
              <span className="detail-value">
                {predictionResult.decision_score !== null && predictionResult.decision_score !== undefined
                  ? predictionResult.decision_score
                  : 'N/A'}
              </span>
            </div>
          </div>

          <p className="explanation-note">
            * Model decision score — not a calibrated medical probability.
          </p>

          <div className="disclaimer-box">
            <strong>Medical Disclaimer:</strong> Screening result generated by experimental Hybrid QML model for research purposes only. Not a medical diagnosis.
          </div>
        </section>
      )}

      {/* 4. Model Comparison Section */}
      {comparisonResult && (
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Model Comparison</h2>
            <p className="card-subtitle">
              Side-by-side assessment from classical baseline models and the variational quantum classifier for the same patient.
            </p>
          </div>

          <div className="comparison-grid">
            {/* Logistic Regression */}
            <div className="model-comp-card">
              <div className="comp-model-name">Logistic Regression</div>
              <div
                className={`comp-prediction-tag ${
                  comparisonResult.logistic_regression.prediction === 1 ? 'high' : 'low'
                }`}
              >
                {comparisonResult.logistic_regression.label}
              </div>
              <div className="comp-metric-row">
                <span className="comp-metric-label">Predicted Probability</span>
                <span className="comp-metric-value">
                  {comparisonResult.logistic_regression.probability !== undefined
                    ? comparisonResult.logistic_regression.probability
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* SVM */}
            <div className="model-comp-card">
              <div className="comp-model-name">Support Vector Machine (SVM)</div>
              <div
                className={`comp-prediction-tag ${
                  comparisonResult.svm.prediction === 1 ? 'high' : 'low'
                }`}
              >
                {comparisonResult.svm.label}
              </div>
              <div className="comp-metric-row">
                <span className="comp-metric-label">Predicted Probability</span>
                <span className="comp-metric-value">
                  {comparisonResult.svm.probability !== undefined
                    ? comparisonResult.svm.probability
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Hybrid QML (VQC) */}
            <div className="model-comp-card vqc-highlight">
              <div className="comp-model-name">Hybrid QML (VQC)</div>
              <div
                className={`comp-prediction-tag ${
                  comparisonResult.vqc.prediction === 1 ? 'high' : 'low'
                }`}
              >
                {comparisonResult.vqc.label}
              </div>
              <div className="comp-metric-row">
                <span className="comp-metric-label">Decision Score</span>
                <span className="comp-metric-value">
                  {comparisonResult.vqc.decision_score !== undefined
                    ? comparisonResult.vqc.decision_score
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Quantum Pipeline Section */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Hybrid Quantum Pipeline</h2>
          <p className="card-subtitle">
            Data transformation flow from 13 biomedical features to 4-qubit quantum state encoding and classification.
          </p>
        </div>

        <div className="pipeline-flow">
          <div className="pipeline-step">
            <div className="pipeline-step-title">Patient Data</div>
            <div className="pipeline-step-sub">13 Clinical Features</div>
          </div>
          <div className="pipeline-arrow">→</div>

          <div className="pipeline-step">
            <div className="pipeline-step-title">Preprocessing</div>
            <div className="pipeline-step-sub">StandardScaler</div>
          </div>
          <div className="pipeline-arrow">→</div>

          <div className="pipeline-step">
            <div className="pipeline-step-title">Feature Selection</div>
            <div className="pipeline-step-sub">SelectKBest (ANOVA)</div>
          </div>
          <div className="pipeline-arrow">→</div>

          <div className="pipeline-step">
            <div className="pipeline-step-title">4 Quantum Features</div>
            <div className="pipeline-step-sub">Selected Subset</div>
          </div>
          <div className="pipeline-arrow">→</div>

          <div className="pipeline-step">
            <div className="pipeline-step-title">Feature Map</div>
            <div className="pipeline-step-sub">ZZFeatureMap (4 Qubits)</div>
          </div>
          <div className="pipeline-arrow">→</div>

          <div className="pipeline-step">
            <div className="pipeline-step-title">Variational Circuit</div>
            <div className="pipeline-step-sub">RealAmplitudes + COBYLA</div>
          </div>
          <div className="pipeline-arrow">→</div>

          <div className="pipeline-step">
            <div className="pipeline-step-title">Risk Output</div>
            <div className="pipeline-step-sub">Binary Classification</div>
          </div>
        </div>

        {/* Selected Features Chips */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Selected Quantum Features (4 Qubits):
          </div>
          <div className="feature-chips">
            <div className="chip">
              Maximum Heart Rate <span>(thalach)</span>
            </div>
            <div className="chip">
              Exercise-Induced Angina <span>(exang)</span>
            </div>
            <div className="chip">
              Major Vessels <span>(ca)</span>
            </div>
            <div className="chip">
              Thalassemia Indicator <span>(thal)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Model Benchmark Information Table */}
      {modelInfo && modelInfo.evaluation_metrics && (
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Model Performance Benchmark</h2>
            <p className="card-subtitle">
              Hold-out test set performance measured on the Cleveland Heart Disease dataset (20% test split, n=61).
            </p>
          </div>

          <div className="benchmark-table-wrapper">
            <table className="benchmark-table">
              <thead>
                <tr>
                  <th>Model Architecture</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-Score</th>
                  <th>Sensitivity</th>
                  <th>Specificity</th>
                  <th>ROC-AUC</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Logistic Regression</strong></td>
                  <td>{modelInfo.evaluation_metrics.logistic_regression.accuracy}</td>
                  <td>{modelInfo.evaluation_metrics.logistic_regression.precision}</td>
                  <td>{modelInfo.evaluation_metrics.logistic_regression.recall}</td>
                  <td>{modelInfo.evaluation_metrics.logistic_regression.f1_score}</td>
                  <td>{modelInfo.evaluation_metrics.logistic_regression.sensitivity}</td>
                  <td>{modelInfo.evaluation_metrics.logistic_regression.specificity}</td>
                  <td>{modelInfo.evaluation_metrics.logistic_regression.roc_auc}</td>
                </tr>
                <tr>
                  <td><strong>Support Vector Machine (SVM)</strong></td>
                  <td>{modelInfo.evaluation_metrics.svm.accuracy}</td>
                  <td>{modelInfo.evaluation_metrics.svm.precision}</td>
                  <td>{modelInfo.evaluation_metrics.svm.recall}</td>
                  <td>{modelInfo.evaluation_metrics.svm.f1_score}</td>
                  <td>{modelInfo.evaluation_metrics.svm.sensitivity}</td>
                  <td>{modelInfo.evaluation_metrics.svm.specificity}</td>
                  <td>{modelInfo.evaluation_metrics.svm.roc_auc}</td>
                </tr>
                <tr className="vqc-row">
                  <td><strong>Hybrid QML (VQC)</strong></td>
                  <td>{modelInfo.evaluation_metrics.vqc.accuracy}</td>
                  <td>{modelInfo.evaluation_metrics.vqc.precision}</td>
                  <td>{modelInfo.evaluation_metrics.vqc.recall}</td>
                  <td>{modelInfo.evaluation_metrics.vqc.f1_score}</td>
                  <td>{modelInfo.evaluation_metrics.vqc.sensitivity}</td>
                  <td>{modelInfo.evaluation_metrics.vqc.specificity}</td>
                  <td>{modelInfo.evaluation_metrics.vqc.roc_auc}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>Hybrid Quantum Machine Learning Disease Detection System — Academic Research Prototype</p>
        <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>
          Backend Service: http://localhost:8001 | Powered by Qiskit 2.5.2 &amp; Qiskit Machine Learning 0.9.1
        </p>
      </footer>
    </div>
  );
}
