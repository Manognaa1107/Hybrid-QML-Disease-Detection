import React from 'react';
import { ArrowRight, Atom, Activity, Cpu, ShieldCheck } from 'lucide-react';

export default function LandingPage({ onOpenAuth }) {
  return (
    <div className="landing-public-wrapper">
      {/* 1. MINIMAL HEADER */}
      <header className="landing-minimal-header">
        <div className="landing-brand">
          <div className="brand-logo-circle">
            <Atom size={22} />
          </div>
          <span className="brand-title">Hybrid QML</span>
        </div>

        <div className="landing-header-actions">
          <button
            className="landing-signin-btn"
            onClick={() => onOpenAuth('patient_login')}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main className="landing-hero-container">
        <div className="landing-hero-content">
          <div className="hero-badge-pill">
            <Activity size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Biomedical Research Platform
          </div>

          <h1 className="landing-hero-title">
            Hybrid Quantum Machine Learning <br />
            <span className="highlight-text">for Early Disease Detection</span>
          </h1>

          <p className="landing-hero-subtitle">
            An integrated hybrid quantum-classical platform for early disease risk assessment using biomedical data and quantum-enhanced machine learning.
          </p>

          <div className="landing-hero-cta">
            <button
              className="get-started-primary-btn"
              onClick={() => onOpenAuth('patient_login')}
            >
              Get Started <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* 3. SCIENTIFIC QML VISUAL (RIGHT COLUMN) */}
        <div className="landing-hero-visual">
          <div className="scientific-qml-card">
            <div className="visual-header">
              <span className="visual-title">4-Qubit Variational Quantum Circuit (VQC)</span>
              <span className="visual-status-dot"></span>
            </div>

            {/* SVG Diagram representing SelectKBest + 4-Qubit VQC */}
            <svg
              className="qml-circuit-svg"
              viewBox="0 0 460 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background grid dots */}
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#d6e4d7" opacity="0.6" />
              </pattern>
              <rect width="460" height="260" fill="url(#grid)" rx="8" />

              {/* Input Feature Nodes */}
              <g className="feature-inputs">
                <rect x="15" y="30" width="85" height="190" rx="6" fill="#eef5ed" stroke="#d6e4d7" strokeWidth="1.5" />
                <text x="57" y="52" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2d5e3c">SelectKBest</text>
                <text x="57" y="68" textAnchor="middle" fontSize="9" fill="#4e6656">Clinical Data</text>
                
                <rect x="25" y="85" width="65" height="22" rx="4" fill="#ffffff" stroke="#cbe9d3" />
                <text x="57" y="100" textAnchor="middle" fontSize="9" fontWeight="600" fill="#132e1e">Feature x₁</text>

                <rect x="25" y="115" width="65" height="22" rx="4" fill="#ffffff" stroke="#cbe9d3" />
                <text x="57" y="130" textAnchor="middle" fontSize="9" fontWeight="600" fill="#132e1e">Feature x₂</text>

                <rect x="25" y="145" width="65" height="22" rx="4" fill="#ffffff" stroke="#cbe9d3" />
                <text x="57" y="160" textAnchor="middle" fontSize="9" fontWeight="600" fill="#132e1e">Feature x₃</text>

                <rect x="25" y="175" width="65" height="22" rx="4" fill="#ffffff" stroke="#cbe9d3" />
                <text x="57" y="190" textAnchor="middle" fontSize="9" fontWeight="600" fill="#132e1e">Feature x₄</text>
              </g>

              {/* Connecting Lines to Qubit Wires */}
              <path d="M 100 96 L 130 96" stroke="#5b9b6b" strokeWidth="2" />
              <path d="M 100 126 L 130 126" stroke="#5b9b6b" strokeWidth="2" />
              <path d="M 100 156 L 130 156" stroke="#5b9b6b" strokeWidth="2" />
              <path d="M 100 186 L 130 186" stroke="#5b9b6b" strokeWidth="2" />

              {/* 4 Qubit Wires */}
              <g className="qubit-wires">
                <text x="120" y="99" fontSize="10" fontWeight="700" fill="#2d5e3c">|q₀⟩</text>
                <line x1="135" y1="96" x2="350" y2="96" stroke="#2d5e3c" strokeWidth="1.8" />

                <text x="120" y="129" fontSize="10" fontWeight="700" fill="#2d5e3c">|q₁⟩</text>
                <line x1="135" y1="126" x2="350" y2="126" stroke="#2d5e3c" strokeWidth="1.8" />

                <text x="120" y="159" fontSize="10" fontWeight="700" fill="#2d5e3c">|q₂⟩</text>
                <line x1="135" y1="156" x2="350" y2="156" stroke="#2d5e3c" strokeWidth="1.8" />

                <text x="120" y="189" fontSize="10" fontWeight="700" fill="#2d5e3c">|q₃⟩</text>
                <line x1="135" y1="186" x2="350" y2="186" stroke="#2d5e3c" strokeWidth="1.8" />
              </g>

              {/* Quantum Gates Layer 1: Hadamard H */}
              <g className="h-gates">
                <rect x="150" y="85" width="22" height="22" rx="4" fill="#2d5e3c" />
                <text x="161" y="100" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">H</text>

                <rect x="150" y="115" width="22" height="22" rx="4" fill="#2d5e3c" />
                <text x="161" y="130" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">H</text>

                <rect x="150" y="145" width="22" height="22" rx="4" fill="#2d5e3c" />
                <text x="161" y="160" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">H</text>

                <rect x="150" y="175" width="22" height="22" rx="4" fill="#2d5e3c" />
                <text x="161" y="190" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">H</text>
              </g>

              {/* Quantum Gates Layer 2: Parameterized Rotations Rz(θ) */}
              <g className="rotation-gates">
                <rect x="190" y="85" width="34" height="22" rx="4" fill="#ffffff" stroke="#2d5e3c" strokeWidth="1.5" />
                <text x="207" y="100" textAnchor="middle" fontSize="9" fontWeight="700" fill="#2d5e3c">R<sub>z</sub>(θ)</text>

                <rect x="190" y="115" width="34" height="22" rx="4" fill="#ffffff" stroke="#2d5e3c" strokeWidth="1.5" />
                <text x="207" y="130" textAnchor="middle" fontSize="9" fontWeight="700" fill="#2d5e3c">R<sub>z</sub>(θ)</text>

                <rect x="190" y="145" width="34" height="22" rx="4" fill="#ffffff" stroke="#2d5e3c" strokeWidth="1.5" />
                <text x="207" y="160" textAnchor="middle" fontSize="9" fontWeight="700" fill="#2d5e3c">R<sub>z</sub>(θ)</text>

                <rect x="190" y="175" width="34" height="22" rx="4" fill="#ffffff" stroke="#2d5e3c" strokeWidth="1.5" />
                <text x="207" y="190" textAnchor="middle" fontSize="9" fontWeight="700" fill="#2d5e3c">R<sub>z</sub>(θ)</text>
              </g>

              {/* Quantum Entanglement CNOT gates */}
              <g className="cnot-entanglement">
                <line x1="245" y1="96" x2="245" y2="126" stroke="#2d5e3c" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle cx="245" cy="96" r="4" fill="#2d5e3c" />
                <circle cx="245" cy="126" r="6" fill="#ffffff" stroke="#2d5e3c" strokeWidth="1.5" />
                <line x1="245" y1="120" x2="245" y2="132" stroke="#2d5e3c" strokeWidth="1.5" />

                <line x1="270" y1="156" x2="270" y2="186" stroke="#2d5e3c" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle cx="270" cy="156" r="4" fill="#2d5e3c" />
                <circle cx="270" cy="186" r="6" fill="#ffffff" stroke="#2d5e3c" strokeWidth="1.5" />
                <line x1="270" y1="180" x2="270" y2="192" stroke="#2d5e3c" strokeWidth="1.5" />
              </g>

              {/* Measurement Nodes */}
              <g className="measurement-nodes">
                <rect x="305" y="85" width="26" height="22" rx="4" fill="#e1efe3" stroke="#5b9b6b" />
                <text x="318" y="100" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2d5e3c">⟨Z⟩</text>

                <rect x="305" y="115" width="26" height="22" rx="4" fill="#e1efe3" stroke="#5b9b6b" />
                <text x="318" y="130" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2d5e3c">⟨Z⟩</text>

                <rect x="305" y="145" width="26" height="22" rx="4" fill="#e1efe3" stroke="#5b9b6b" />
                <text x="318" y="160" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2d5e3c">⟨Z⟩</text>

                <rect x="305" y="175" width="26" height="22" rx="4" fill="#e1efe3" stroke="#5b9b6b" />
                <text x="318" y="190" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2d5e3c">⟨Z⟩</text>
              </g>

              {/* Output Classification Block */}
              <g className="output-prediction">
                <path d="M 331 96 L 365 141" stroke="#2d5e3c" strokeWidth="1.5" />
                <path d="M 331 126 L 365 141" stroke="#2d5e3c" strokeWidth="1.5" />
                <path d="M 331 156 L 365 141" stroke="#2d5e3c" strokeWidth="1.5" />
                <path d="M 331 186 L 365 141" stroke="#2d5e3c" strokeWidth="1.5" />

                <rect x="365" y="110" width="80" height="62" rx="6" fill="#2d5e3c" />
                <text x="405" y="133" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">Risk Prediction</text>
                <text x="405" y="150" textAnchor="middle" fontSize="9" fill="#cbe9d3">High / Low Risk</text>
              </g>
            </svg>
          </div>
        </div>
      </main>

      {/* 4. COMPACT PROJECT FACTS SECTION */}
      <section className="landing-facts-section">
        <div className="fact-card">
          <div className="fact-icon">
            <Activity size={20} />
          </div>
          <div className="fact-content">
            <h4 className="fact-title">3 Disease Models</h4>
            <p className="fact-detail">Heart Disease • Breast Cancer • Lung Cancer</p>
          </div>
        </div>

        <div className="fact-card">
          <div className="fact-icon">
            <Cpu size={20} />
          </div>
          <div className="fact-content">
            <h4 className="fact-title">4-Qubit Quantum Layer</h4>
            <p className="fact-detail">SelectKBest → 4 Quantum Features → 4-Qubit VQC</p>
          </div>
        </div>

        <div className="fact-card">
          <div className="fact-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="fact-content">
            <h4 className="fact-title">Hybrid Architecture</h4>
            <p className="fact-detail">Classical Preprocessing → Quantum Model → Risk Prediction</p>
          </div>
        </div>
      </section>
    </div>
  );
}
