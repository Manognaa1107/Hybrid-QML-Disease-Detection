import React from 'react';
import { Stethoscope, User, ArrowLeft, Atom, ArrowRight } from 'lucide-react';

export default function SignInSelection({ onSelectDoctor, onSelectPatient, onBackToHome }) {
  return (
    <div className="landing-public-wrapper">
      {/* Minimal Header */}
      <header className="landing-minimal-header">
        <div className="landing-brand">
          <div className="brand-logo-circle">
            <Atom size={22} />
          </div>
          <span className="brand-title">Hybrid QML</span>
        </div>

        <button className="back-link-btn" onClick={onBackToHome}>
          <ArrowLeft size={16} /> Back to Home
        </button>
      </header>

      {/* Main Selection Area */}
      <main className="signin-selection-container">
        <div className="signin-selection-header">
          <span className="hero-badge-pill">Account Access</span>
          <h1 className="signin-selection-title">Sign In</h1>
          <p className="signin-selection-subtitle">
            Choose your account type to continue.
          </p>
        </div>

        <div className="signin-options-grid">
          {/* Option 1: Doctor */}
          <div className="account-option-card doctor-option-card">
            <div className="option-badge doctor-tag">Medical Practitioner</div>
            <div className="option-icon-wrapper doctor-icon-wrapper">
              <Stethoscope size={32} />
            </div>
            <h3 className="option-title">Doctor</h3>
            <p className="option-description">
              Sign in to access disease screening and prediction tools.
            </p>
            <button
              className="run-qml-btn option-btn doctor-btn"
              onClick={onSelectDoctor}
            >
              Doctor Sign In <ArrowRight size={18} />
            </button>
          </div>

          {/* Option 2: Patient */}
          <div className="account-option-card patient-option-card">
            <div className="option-badge patient-tag">Patient Portal</div>
            <div className="option-icon-wrapper patient-icon-wrapper">
              <User size={32} />
            </div>
            <h3 className="option-title">Patient</h3>
            <p className="option-description">
              Sign in to view your screening results.
            </p>
            <button
              className="run-qml-btn option-btn patient-btn"
              onClick={onSelectPatient}
            >
              Patient Sign In <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="signin-selection-footer">
          <button className="back-link-btn" onClick={onBackToHome}>
            <ArrowLeft size={16} /> Return to Public Landing Page
          </button>
        </div>
      </main>
    </div>
  );
}
