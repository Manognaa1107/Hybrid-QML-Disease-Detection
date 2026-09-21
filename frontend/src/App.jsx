import React, { useState, useEffect } from 'react';
import { checkHealth } from './api';
import { useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import SignInSelection from './pages/SignInSelection';
import DoctorLogin from './pages/DoctorLogin';
import PatientLogin from './pages/PatientLogin';
import PatientRegister from './pages/PatientRegister';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/DashboardPage';
import NewScreeningPage from './components/NewScreeningPage';
import DiseaseScreeningPage from './components/DiseaseScreeningPage';
import PredictionResultsPage from './components/PredictionResultsPage';
import PatientDashboardPage from './components/PatientDashboardPage';
import MyReportsPage from './components/MyReportsPage';
import ScreeningHistoryPage from './components/ScreeningHistoryPage';

export default function App() {
  const { user, role, loading: authLoading } = useAuth();

  // Public routing state (when !user): 'landing' | 'signin_select' | 'doctor_login' | 'patient_login' | 'patient_register'
  const [publicView, setPublicView] = useState('landing');

  // Authenticated routing state (when user exists)
  // Doctor views: 'dashboard' | 'new_screening' | 'screening' | 'results'
  // Patient views: 'dashboard' | 'my_reports' | 'screening_history'
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDisease, setSelectedDisease] = useState('heart');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);

  // Session-based Recent Screenings history
  const [recentScreenings, setRecentScreenings] = useState(() => {
    try {
      const saved = sessionStorage.getItem('qml_recent_screenings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check Backend Connection on Mount
  useEffect(() => {
    async function init() {
      await checkHealth();
    }
    init();
  }, []);

  // Save Recent Screenings to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('qml_recent_screenings', JSON.stringify(recentScreenings));
    } catch (e) {
      console.error('Failed to save recent screenings to sessionStorage:', e);
    }
  }, [recentScreenings]);

  // Navigate to Disease Screening form
  const handleSelectDisease = (diseaseId, patientData) => {
    if (patientData) {
      setSelectedPatient(patientData);
    }
    setSelectedDisease(diseaseId);
    setCurrentView('screening');
  };

  // Sidebar -> New Screening (Opens universal disease selection view)
  const handleNewScreening = () => {
    setCurrentView('new_screening');
  };

  // Sidebar -> Prediction Results
  const handleOpenResults = () => {
    setCurrentView('results');
  };

  // Form submit on Disease Screening -> Save to recent list and navigate to Results
  const handleResultReceived = (result, diseaseId, inputsData) => {
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const diseaseName = result.disease || (
      diseaseId === 'heart' ? 'Heart Disease' :
      diseaseId === 'breast_cancer' ? 'Breast Cancer' :
      diseaseId === 'lung_cancer' ? 'Lung Cancer' : 'Disease'
    );

    const fullResult = {
      ...result,
      inputs: inputsData || result.inputs || {}
    };

    const newScreeningEntry = {
      id: Date.now(),
      disease: diseaseName,
      diseaseId: diseaseId,
      label: result.label,
      prediction: result.prediction,
      timeStr: `Today, ${formattedTime}`,
      resultData: fullResult
    };

    setPredictionResult(fullResult);
    setSelectedDisease(diseaseId);
    setRecentScreenings((prev) => [newScreeningEntry, ...prev]);
    setCurrentView('results');
  };

  // View stored prediction from Recent Screenings list
  const handleSelectRecentItem = (entry) => {
    if (entry && entry.resultData) {
      setPredictionResult(entry.resultData);
      setSelectedDisease(entry.diseaseId);
      setCurrentView('results');
    }
  };

  // Prediction Results -> Run Another Screening
  const handleRunAnotherScreening = () => {
    setCurrentView('new_screening');
  };

  // Prediction Results -> Back to Dashboard
  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  // 1. Loading State
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="brand-logo-circle" style={{ margin: '0 auto 12px auto', width: 44, height: 44 }}>⚛</div>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>Initializing EarlyQ...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State -> Show Public Pages ONLY (No Sidebar)
  if (!user) {
    if (publicView === 'signin_select') {
      return (
        <SignInSelection
          onSelectDoctor={() => setPublicView('doctor_login')}
          onSelectPatient={() => setPublicView('patient_login')}
          onBackToHome={() => setPublicView('landing')}
        />
      );
    }

    if (publicView === 'doctor_login') {
      return (
        <div className="landing-public-wrapper">
          <DoctorLogin
            onLoginSuccess={() => setPublicView('landing')}
            onBack={() => setPublicView('signin_select')}
          />
        </div>
      );
    }

    if (publicView === 'patient_login') {
      return (
        <div className="landing-public-wrapper">
          <PatientLogin
            onLoginSuccess={() => setPublicView('landing')}
            onGoToRegister={() => setPublicView('patient_register')}
            onBack={() => setPublicView('signin_select')}
          />
        </div>
      );
    }


    if (publicView === 'patient_register') {
      return (
        <PatientRegister
          onRegisterSuccess={() => setPublicView('landing')}
          onGoToLogin={() => setPublicView('patient_login')}
          onBack={() => setPublicView('patient_login')}
        />
      );
    }

    // Default Public View: Landing Page
    return (
      <LandingPage
        onOpenAuth={() => setPublicView('signin_select')}
      />
    );
  }

  // 3. Authenticated State -> Show Role-based Application Shell (With Sidebar)
  const isDoctor = role === 'doctor' || user?.email?.toLowerCase() === 'doctor@hybridqml.com';
  const isPatient = !isDoctor;

  return (
    <div className="app-shell">
      <div className="app-layout">
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          onNewScreening={handleNewScreening}
          onOpenResults={handleOpenResults}
        />

        <main className="app-main-content">
          {/* PATIENT INTERFACE VIEWS */}
          {isPatient ? (
            <>
              {currentView === 'my_reports' && <MyReportsPage />}

              {currentView === 'screening_history' && <ScreeningHistoryPage />}

              {(currentView !== 'my_reports' && currentView !== 'screening_history') && (
                <PatientDashboardPage
                  onGoToReports={() => setCurrentView('my_reports')}
                  onGoToHistory={() => setCurrentView('screening_history')}
                />
              )}
            </>
          ) : (
            /* DOCTOR INTERFACE VIEWS */
            <>
              {currentView === 'new_screening' && (
                <NewScreeningPage
                  onSelectDisease={handleSelectDisease}
                />
              )}

              {currentView === 'screening' && (
                <DiseaseScreeningPage
                  selectedDisease={selectedDisease}
                  selectedPatient={selectedPatient}
                  onBackToDashboard={handleBackToDashboard}
                  onResultReceived={handleResultReceived}
                />
              )}

              {currentView === 'results' && (
                <PredictionResultsPage
                  predictionResult={predictionResult}
                  selectedDisease={selectedDisease}
                  selectedPatient={selectedPatient}
                  recentScreenings={recentScreenings}
                  onRunAnotherScreening={handleRunAnotherScreening}
                  onBackToDashboard={handleBackToDashboard}
                  onStartScreening={handleNewScreening}
                  onSelectRecentItem={handleSelectRecentItem}
                />
              )}

              {(currentView !== 'new_screening' && currentView !== 'screening' && currentView !== 'results') && (
                <DashboardPage
                  onStartScreening={handleNewScreening}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}



