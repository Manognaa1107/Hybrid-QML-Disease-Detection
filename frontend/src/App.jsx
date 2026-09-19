import React, { useState, useEffect } from 'react';
import { checkHealth } from './api';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/DashboardPage';
import NewScreeningPage from './components/NewScreeningPage';
import DiseaseScreeningPage from './components/DiseaseScreeningPage';
import PredictionResultsPage from './components/PredictionResultsPage';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'new_screening' | 'screening' | 'results'
  const [selectedDisease, setSelectedDisease] = useState('heart');
  const [predictionResult, setPredictionResult] = useState(null);
  const [healthStatus, setHealthStatus] = useState('loading');
  
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
      const health = await checkHealth();
      setHealthStatus(health.status);
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
  const handleSelectDisease = (diseaseId) => {
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
  const handleResultReceived = (result, diseaseId) => {
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const diseaseName = result.disease || (
      diseaseId === 'heart' ? 'Heart Disease' :
      diseaseId === 'breast_cancer' ? 'Breast Cancer' :
      diseaseId === 'lung_cancer' ? 'Lung Cancer' : 'Disease'
    );

    const newScreeningEntry = {
      id: Date.now(),
      disease: diseaseName,
      diseaseId: diseaseId,
      label: result.label,
      prediction: result.prediction,
      timeStr: `Today, ${formattedTime}`,
      resultData: result
    };

    setPredictionResult(result);
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
          {/* VIEW 1: DASHBOARD */}
          {currentView === 'dashboard' && (
            <DashboardPage
              onStartScreening={handleNewScreening}
            />
          )}

          {/* VIEW 2: NEW SCREENING (DISEASE SELECTION) */}
          {currentView === 'new_screening' && (
            <NewScreeningPage
              onSelectDisease={handleSelectDisease}
            />
          )}

          {/* VIEW 3: DISEASE SCREENING FORM */}
          {currentView === 'screening' && (
            <DiseaseScreeningPage
              selectedDisease={selectedDisease}
              onBackToDashboard={handleBackToDashboard}
              onResultReceived={handleResultReceived}
            />
          )}

          {/* VIEW 4: PREDICTION RESULTS */}
          {currentView === 'results' && (
            <PredictionResultsPage
              predictionResult={predictionResult}
              selectedDisease={selectedDisease}
              recentScreenings={recentScreenings}
              onRunAnotherScreening={handleRunAnotherScreening}
              onBackToDashboard={handleBackToDashboard}
              onStartScreening={handleNewScreening}
              onSelectRecentItem={handleSelectRecentItem}
            />
          )}
        </main>
      </div>
    </div>
  );
}
