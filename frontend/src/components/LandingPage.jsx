import React from 'react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-container">
      {/* Top Navbar */}
      <header className="landing-navbar">
        <div className="brand-group">
          <div className="brand-logo-circle">⚛</div>
          <span className="brand-title">Hybrid QML</span>
        </div>
        <nav className="landing-nav-links">
          <span className="nav-link active">Home</span>
          <span className="nav-link">About</span>
          <span className="nav-link">How It Works</span>
        </nav>
      </header>

      {/* Main Hero Section */}
      <main className="landing-hero">
        <div className="hero-content">
          <span className="hero-pill-badge">Early Disease Detection</span>
          <h1 className="hero-title">
            Hybrid Quantum <br />
            <span className="highlight-text">Machine Learning</span>
          </h1>
          <p className="hero-subtitle">
            Combining classical machine learning with quantum computing for early, accurate and reliable disease detection.
          </p>
          <div className="hero-cta">
            <button className="get-started-btn" onClick={onGetStarted}>
              Get Started →
            </button>
            <button className="explore-btn" onClick={onGetStarted}>
              Learn More / Explore
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="quantum-card-graphic">
            <div className="graphic-orbit orbit-1" />
            <div className="graphic-orbit orbit-2" />
            <div className="graphic-center-node">
              <span className="node-icon">🧬</span>
            </div>
            <div className="node-dot dot-1" />
            <div className="node-dot dot-2" />
            <div className="node-dot dot-3" />
            <div className="node-dot dot-4" />
          </div>
        </div>
      </main>

      {/* 3 Compact Feature Cards */}
      <section className="landing-highlights">
        <div className="highlight-card">
          <div className="highlight-icon">⚛</div>
          <div className="highlight-info">
            <h4>3 Disease Models</h4>
            <p>Heart, Breast &amp; Lung</p>
          </div>
        </div>

        <div className="highlight-card">
          <div className="highlight-icon">💻</div>
          <div className="highlight-info">
            <h4>Hybrid QML</h4>
            <p>Classical + Quantum</p>
          </div>
        </div>

        <div className="highlight-card">
          <div className="highlight-icon">🛡️</div>
          <div className="highlight-info">
            <h4>Early Detection</h4>
            <p>Better health outcomes</p>
          </div>
        </div>
      </section>
    </div>
  );
}
