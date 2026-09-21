import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { extractReport } from '../api';
import { HeartPulse, Activity, Stethoscope, ArrowRight, ArrowLeft, User, Search, CheckCircle2, Loader2, AlertCircle, Upload, FileText, Check, Edit3, ShieldAlert } from 'lucide-react';

const DISEASE_FIELDS = {
  heart: [
    { key: 'age', label: 'Age (years)' },
    { key: 'sex', label: 'Sex (1=Male, 0=Female)' },
    { key: 'cp', label: 'Chest Pain Type (1-4)' },
    { key: 'trestbps', label: 'Resting Blood Pressure (mm Hg)' },
    { key: 'chol', label: 'Serum Cholesterol (mg/dl)' },
    { key: 'fbs', label: 'Fasting Blood Sugar (1 = >120, 0 = ≤120)' },
    { key: 'restecg', label: 'Resting ECG (0=Normal, 1=ST-T Abnormality, 2=LV Hypertrophy)' },
    { key: 'thalach', label: 'Maximum Heart Rate (bpm)' },
    { key: 'exang', label: 'Exercise-Induced Angina (1=Yes, 0=No)' },
    { key: 'oldpeak', label: 'ST Depression (oldpeak)' },
    { key: 'slope', label: 'Slope of Peak ST (1=Upsloping, 2=Flat, 3=Downsloping)' },
    { key: 'ca', label: 'Major Vessels (0-3)' },
    { key: 'thal', label: 'Thalassemia (3=Normal, 6=Fixed Defect, 7=Reversible Defect)' }
  ],
  breast_cancer: [
    { key: 'mean radius', label: 'Mean Radius (mm)' },
    { key: 'mean texture', label: 'Mean Texture' },
    { key: 'mean perimeter', label: 'Mean Perimeter (mm)' },
    { key: 'mean area', label: 'Mean Area (mm²)' },
    { key: 'mean smoothness', label: 'Mean Smoothness' },
    { key: 'mean compactness', label: 'Mean Compactness' },
    { key: 'mean concavity', label: 'Mean Concavity' },
    { key: 'mean concave points', label: 'Mean Concave Points' },
    { key: 'mean symmetry', label: 'Mean Symmetry' },
    { key: 'mean fractal dimension', label: 'Mean Fractal Dimension' }
  ],
  lung_cancer: [
    { key: 'AGE', label: 'Age (years)' },
    { key: 'GENDER', label: 'Gender (1=Male, 0=Female)' },
    { key: 'SMOKING', label: 'Smoking History (1=Yes, 0=No)' },
    { key: 'YELLOW_FINGERS', label: 'Yellow Fingers (1=Yes, 0=No)' },
    { key: 'ANXIETY', label: 'Anxiety (1=Yes, 0=No)' },
    { key: 'PEER_PRESSURE', label: 'Peer Pressure (1=Yes, 0=No)' },
    { key: 'CHRONIC DISEASE', label: 'Chronic Respiratory Disease (1=Yes, 0=No)' },
    { key: 'FATIGUE', label: 'Fatigue / Exhaustion (1=Yes, 0=No)' },
    { key: 'ALLERGY', label: 'Allergies (1=Yes, 0=No)' },
    { key: 'WHEEZING', label: 'Wheezing (1=Yes, 0=No)' },
    { key: 'ALCOHOL CONSUMING', label: 'Alcohol Consumption (1=Yes, 0=No)' },
    { key: 'COUGHING', label: 'Persistent Coughing (1=Yes, 0=No)' },
    { key: 'SHORTNESS OF BREATH', label: 'Shortness of Breath (1=Yes, 0=No)' },
    { key: 'SWALLOWING DIFFICULTY', label: 'Swallowing Difficulty (1=Yes, 0=No)' },
    { key: 'CHEST PAIN', label: 'Chest Pain (1=Yes, 0=No)' }
  ]
};

export default function NewScreeningPage({ onSelectDisease }) {
  const [step, setStep] = useState('patient'); // 'patient' | 'disease' | 'upload'
  const [patientIdInput, setPatientIdInput] = useState('');
  const [foundPatient, setFoundPatient] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState('heart');

  const [reportFile, setReportFile] = useState(null);
  const [extractedValues, setExtractedValues] = useState({});
  const [isExtracted, setIsExtracted] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFindPatient = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setFoundPatient(null);

    const cleanId = patientIdInput.trim().toUpperCase();

    if (!cleanId) {
      setError('Please enter a Patient ID.');
      return;
    }

    setLoading(true);

    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'patient'),
        where('patientId', '==', cleanId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Patient not found. Please check the Patient ID.');
        setFoundPatient(null);
      } else {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        const patientData = {
          selectedPatientUid: docSnap.id,
          selectedPatientId: data.patientId || cleanId,
          selectedPatientName: data.name || 'Unnamed Patient',
          selectedPatientEmail: data.email || ''
        };
        setFoundPatient(patientData);
      }
    } catch (err) {
      console.error('Firestore patient lookup error:', err);
      setError('Unable to find patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToDisease = () => {
    if (foundPatient) {
      setSelectedPatient(foundPatient);
      setStep('disease');
    }
  };

  const handleSelectDiseaseModule = (diseaseId) => {
    setSelectedDiseaseId(diseaseId);
    setExtractedValues({});
    setReportFile(null);
    setIsExtracted(false);
    setError(null);
    setStep('upload');
  };

  const handleFileUpload = (e) => {
    setError(null);
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      setError('Please upload a PDF, JPG, JPEG, or PNG file.');
      setReportFile(null);
      return;
    }

    setReportFile(file);
    setIsExtracted(false);
    setExtractedValues({});
  };

  const handleExtractInformation = async () => {
    if (!reportFile) {
      setError('Please select a medical report file before extracting.');
      return;
    }

    setError(null);
    setExtracting(true);

    try {
      const res = await extractReport(reportFile, selectedDiseaseId);
      if (res && res.extracted_fields) {
        setExtractedValues(res.extracted_fields);
        setIsExtracted(true);
      } else {
        setError("Unable to extract information from this report. Please enter the values manually.");
      }
    } catch (err) {
      console.error('Extraction error:', err);
      setError(err.message || "Unable to extract information from this report. Please enter the values manually.");
    } finally {
      setExtracting(false);
    }
  };

  const handleExtractedValueChange = (fieldKey, val) => {
    setExtractedValues((prev) => ({
      ...prev,
      [fieldKey]: val === '' || val === null ? null : (isNaN(val) ? val : parseFloat(val))
    }));
  };

  const handleProceedToScreeningForm = (useExtracted = true) => {
    if (onSelectDisease && selectedPatient) {
      const patientPayload = {
        ...selectedPatient,
        reportFileName: useExtracted && reportFile ? reportFile.name : null,
        extractedValues: useExtracted ? extractedValues : null
      };
      onSelectDisease(selectedDiseaseId, patientPayload);
    }
  };

  const diseases = [
    {
      id: 'heart',
      name: 'Heart Disease Screening',
      description: 'Analyze cardiovascular parameters with classical feature selection and 4-qubit VQC.',
      icon: HeartPulse,
      badgeClass: 'heart-icon-badge'
    },
    {
      id: 'breast_cancer',
      name: 'Breast Cancer Screening',
      description: 'Evaluate cell feature measurements with standardized quantum encoding for risk classification.',
      icon: Activity,
      badgeClass: 'breast-icon-badge'
    },
    {
      id: 'lung_cancer',
      name: 'Lung Cancer Screening',
      description: 'Screen clinical symptoms and risk factors through variational quantum statevector sampling.',
      icon: Stethoscope,
      badgeClass: 'lung-icon-badge'
    }
  ];

  const currentDiseaseObj = diseases.find((d) => d.id === selectedDiseaseId) || diseases[0];
  const diseaseFieldsList = DISEASE_FIELDS[selectedDiseaseId] || DISEASE_FIELDS.heart;

  // Check if any required field is missing/Not found
  const missingFieldKeys = diseaseFieldsList
    .map((f) => f.key)
    .filter((k) => extractedValues[k] === null || extractedValues[k] === undefined || extractedValues[k] === '' || extractedValues[k] === 'Not found');

  // STEP 1: PATIENT IDENTIFICATION
  if (step === 'patient') {
    return (
      <div className="screening-selection-view">
        <div className="selection-header-banner">
          <h2>New Screening — Patient Identification</h2>
          <p>Enter the patient's unique Patient ID (e.g. P101) to identify their record before selecting a disease screening module.</p>
        </div>

        <div className="screening-card" style={{ maxWidth: '580px', marginBottom: '24px' }}>
          <form onSubmit={handleFindPatient}>
            <div className="form-field-group">
              <label className="field-label" htmlFor="patient-id-input">
                Patient ID
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="input-with-icon" style={{ flex: 1 }}>
                  <User size={18} className="input-icon" />
                  <input
                    id="patient-id-input"
                    type="text"
                    className="field-input input-padded"
                    placeholder="Enter Patient ID (e.g. P101)"
                    value={patientIdInput}
                    onChange={(e) => {
                      setPatientIdInput(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={loading}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="run-qml-btn"
                  disabled={loading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 20px', whiteSpace: 'nowrap' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="btn-spinner" />
                      Finding patient...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Find Patient
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="form-error-banner" role="alert" style={{ marginTop: '16px' }}>
              <AlertCircle size={18} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {foundPatient && (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              background: 'var(--bg-tertiary)',
              border: '2px solid var(--primary)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem' }}>
                <CheckCircle2 size={18} />
                <span>Patient Found</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Patient Name
                  </span>
                  <p style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', margin: '2px 0 0 0' }}>
                    {foundPatient.selectedPatientName}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Patient ID
                  </span>
                  <p style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--primary)', margin: '2px 0 0 0' }}>
                    {foundPatient.selectedPatientId}
                  </p>
                </div>
              </div>

              <button
                className="run-qml-btn"
                onClick={handleContinueToDisease}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Continue to Disease Selection <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // STEP 2: DISEASE SELECTION
  if (step === 'disease') {
    return (
      <div className="screening-selection-view">
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-light)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Identified Patient Record
              </span>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                {selectedPatient?.selectedPatientName} <span style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '0.85rem' }}>({selectedPatient?.selectedPatientId})</span>
              </h4>
            </div>
          </div>
          <button
            className="back-link-btn"
            onClick={() => {
              setStep('patient');
              setFoundPatient(null);
            }}
            style={{ fontSize: '0.825rem', padding: '6px 10px' }}
          >
            <ArrowLeft size={14} /> Change Patient
          </button>
        </div>

        <div className="selection-header-banner">
          <h2>Select Disease Module</h2>
          <p>Choose a disease module below to proceed to medical report upload and clinical parameter extraction.</p>
        </div>

        <div className="screening-cards-grid">
          {diseases.map((d) => {
            const IconComponent = d.icon;
            return (
              <div
                key={d.id}
                className="screening-card clickable-disease-card"
                onClick={() => handleSelectDiseaseModule(d.id)}
              >
                <div className={`card-icon-badge ${d.badgeClass}`}>
                  <IconComponent className="card-svg-icon" size={28} />
                </div>
                <h3 className="disease-title">{d.name}</h3>
                <p className="disease-sub">{d.description}</p>
                <div className="card-action-hint">
                  Select & Upload Report <ArrowRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // STEP 3: MEDICAL REPORT UPLOAD & EXTRACTION REVIEW
  return (
    <div className="screening-selection-view">
      {/* Patient & Disease Context Header */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Patient
            </span>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {selectedPatient?.selectedPatientName} <span style={{ color: 'var(--primary)' }}>({selectedPatient?.selectedPatientId})</span>
            </p>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }} />
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Selected Disease
            </span>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {currentDiseaseObj.name}
            </p>
          </div>
        </div>

        <button
          className="back-link-btn"
          onClick={() => setStep('disease')}
          style={{ fontSize: '0.825rem', padding: '6px 10px' }}
        >
          <ArrowLeft size={14} /> Back to Disease Selection
        </button>
      </div>

      <div className="selection-header-banner">
        <h2>Medical Report — Input Extraction & Review</h2>
        <p>Upload a clinical report (PDF, JPG, JPEG, PNG) to extract disease-specific parameters for AI-assisted risk assessment.</p>
      </div>

      {error && (
        <div className="form-error-banner" role="alert" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} className="error-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box Container */}
      <div className="screening-card" style={{ marginBottom: '24px' }}>
        <div style={{
          border: reportFile ? '2px solid var(--primary)' : '2px dashed var(--border-focus)',
          borderRadius: 'var(--radius-md)',
          padding: '32px 20px',
          textAlign: 'center',
          background: reportFile ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
              width: '100%',
              height: '100%'
            }}
          />
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Upload size={24} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
            {reportFile ? reportFile.name : 'Upload Medical Report'}
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Accepted formats: PDF, JPG, JPEG, PNG
          </p>

          {reportFile && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '12px',
              background: 'var(--bg-card)',
              color: 'var(--primary)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 700,
              boxShadow: 'var(--shadow-sm)'
            }}>
              <FileText size={16} /> {reportFile.name} ({(reportFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Action Button: Extract Information */}
        {reportFile && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              className="run-qml-btn"
              onClick={handleExtractInformation}
              disabled={extracting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px' }}
            >
              {extracting ? (
                <>
                  <Loader2 size={18} className="btn-spinner" /> Extracting Disease-Specific Parameters...
                </>
              ) : (
                <>
                  <FileText size={18} /> Extract Information
                </>
              )}
            </button>
          </div>
        )}

        {/* Extracted Information Review Section */}
        {isExtracted && (
          <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-light)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit3 size={18} style={{ color: 'var(--primary)' }} /> Extracted Information ({currentDiseaseObj.name})
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Review and edit extracted values below before auto-filling the screening form.
                </p>
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: '12px' }}>
                Extracted from: {reportFile?.name}
              </div>
            </div>

            {/* Warning if any fields not found */}
            {missingFieldKeys.length > 0 && (
              <div style={{
                marginBottom: '20px',
                padding: '12px 16px',
                background: '#fff8e6',
                border: '1px solid #ffe58f',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#d48806',
                fontSize: '0.85rem'
              }}>
                <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                <span>
                  Some required values were not found in the report. Please review and enter them manually.
                </span>
              </div>
            )}

            {/* Field Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '28px'
            }}>
              {diseaseFieldsList.map((field) => {
                const rawVal = extractedValues[field.key];
                const isNotFound = rawVal === null || rawVal === undefined || rawVal === '' || rawVal === 'Not found';

                return (
                  <div key={field.key} className="form-field-group" style={{
                    background: 'var(--bg-secondary)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: isNotFound ? '1px dashed #ffa39e' : '1px solid var(--border-light)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="field-label" style={{ fontSize: '0.8rem', margin: 0 }}>
                        {field.label}
                      </label>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: isNotFound ? '#fff1f0' : '#e6f7ff',
                        color: isNotFound ? '#cf1322' : '#0958d9'
                      }}>
                        {isNotFound ? 'Not found' : 'Extracted'}
                      </span>
                    </div>

                    <input
                      type={typeof rawVal === 'number' ? 'number' : 'text'}
                      step="any"
                      className="field-input"
                      placeholder={isNotFound ? 'Not found (Enter value)' : ''}
                      value={rawVal ?? ''}
                      onChange={(e) => handleExtractedValueChange(field.key, e.target.value)}
                      style={{ padding: '8px 10px', fontSize: '0.9rem', width: '100%' }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Action Row */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <button
                type="button"
                className="back-link-btn"
                onClick={() => handleProceedToScreeningForm(false)}
                style={{ fontSize: '0.875rem', padding: '10px 18px' }}
              >
                Skip Upload & Fill Form Manually <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="run-qml-btn"
                onClick={() => handleProceedToScreeningForm(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}
              >
                <Check size={18} /> Use These Values & Auto-Fill Form
              </button>
            </div>
          </div>
        )}

        {!isExtracted && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              className="back-link-btn"
              onClick={() => handleProceedToScreeningForm(false)}
              style={{ fontSize: '0.875rem', padding: '10px 18px' }}
            >
              Skip Upload & Fill Form Manually <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
