import React from 'react';
import { HeartPulse, Activity, Stethoscope, ArrowRight, Dna, Cpu, Layers, Sparkles } from 'lucide-react';

export default function DashboardPage({ onStartScreening }) {
  const diseaseCards = [
    {
      id: 'heart',
      name: 'Heart Disease',
      description: 'Cardiovascular risk assessment using 13 clinical parameters.',
      icon: HeartPulse,
      badgeClass: 'heart-static-badge'
    },
    {
      id: 'breast_cancer',
      name: 'Breast Cancer',
      description: 'Cellular morphometric feature analysis for malignancy detection.',
      icon: Activity,
      badgeClass: 'breast-static-badge'
    },
    {
      id: 'lung_cancer',
      name: 'Lung Cancer',
      description: 'Symptom profile evaluation via variational quantum classifier.',
      icon: Stethoscope,
      badgeClass: 'lung-static-badge'
    }
  ];

  const workflowStages = [
    {
      step: '01',
      title: 'SELECT',
      subtitle: 'Choose a disease'
    },
    {
      step: '02',
      title: 'ANALYZE',
      subtitle: 'Process clinical features using the hybrid QML pipeline'
    },
    {
      step: '03',
      title: 'PREDICT',
      subtitle: 'Generate the disease result'
    }
  ];

  return (
    <div className="dashboard-view-container">
      {/* 1. HERO SECTION */}
      <div className="dashboard-hero-card">
        <div className="hero-text-content">
          <span className="hero-badge-pill">Early Disease Detection</span>
          <h1 className="hero-main-heading">
            Hybrid Quantum <br />
            <span className="highlight-green">Machine Learning</span>
          </h1>
          <p className="hero-description">
            Combining classical preprocessing and quantum machine learning for early biomedical risk screening.
          </p>

          <div className="hero-cta-single">
            <button className="run-qml-btn hero-primary-btn" onClick={onStartScreening}>
              Start a Screening <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Sophisticated 3D-Styled Scientific Dimensional Visual */}
        <div className="hero-scientific-graphic">
          <div className="quantum-biomedical-stage">
            {/* Background Layered Depth Grid */}
            <div className="stage-depth-grid" />
            
            {/* Central 3D Quantum Processor Node */}
            <div className="quantum-processor-node">
              <Cpu size={36} className="processor-chip-icon" />
              <div className="chip-laser-glow" />
            </div>

            {/* Floating Scientific Data Cards */}
            <div className="stage-node node-dna">
              <Dna size={15} />
              <span>Biomedical Data</span>
            </div>

            <div className="stage-node node-features">
              <Layers size={15} />
              <span>QML Features</span>
            </div>

            <div className="stage-node node-prediction">
              <Sparkles size={15} />
              <span>Risk Prediction</span>
            </div>

            {/* Circuit Interconnect Geometry */}
            <svg className="circuit-lines-svg" viewBox="0 0 240 200" fill="none">
              <path d="M40 50 L120 100 L200 50" stroke="#5b9b6b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
              <path d="M40 150 L120 100 L200 150" stroke="#5b9b6b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
              <circle cx="120" cy="100" r="48" stroke="#2d5e3c" strokeWidth="1.5" opacity="0.3" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. AVAILABLE SCREENINGS (STATIC INFORMATIONAL CARDS ONLY) */}
      <section className="choose-screening-section">
        <div className="section-header-row">
          <h3 className="section-title">Available Screenings</h3>
          <span className="section-subtitle-hint">Supported disease modules integrated in the platform</span>
        </div>

        <div className="screening-cards-grid">
          {diseaseCards.map((d) => {
            const IconComponent = d.icon;
            return (
              <div key={d.id} className="screening-card static-info-card">
                <div className={`card-icon-badge ${d.badgeClass}`}>
                  <IconComponent size={24} className="disease-svg-icon" />
                </div>
                <h4 className="disease-title">{d.name}</h4>
                <p className="disease-sub">{d.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. THREE-STAGE PRODUCT WORKFLOW */}
      <section className="product-workflow-section">
        <div className="section-header-row">
          <h3 className="section-title">Screening Workflow</h3>
          <span className="section-subtitle-hint">Three-stage hybrid QML execution model</span>
        </div>

        <div className="workflow-stages-grid">
          {workflowStages.map((stg, idx) => (
            <React.Fragment key={stg.step}>
              <div className="workflow-stage-card">
                <span className="stage-num">{stg.step}</span>
                <h4 className="stage-title">{stg.title}</h4>
                <p className="stage-sub">{stg.subtitle}</p>
              </div>

              {idx < workflowStages.length - 1 && (
                <div className="workflow-arrow-divider">
                  <ArrowRight size={18} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    </div>
  );
}
