import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User, Lock, Mail, AlertCircle, ArrowLeft, Loader2, UserPlus, Atom } from 'lucide-react';

export default function PatientRegister({ onRegisterSuccess, onGoToLogin, onBack }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Set role as "patient" in localStorage
      localStorage.setItem(`userRole_${user.uid}`, 'patient');
      if (fullName.trim()) {
        localStorage.setItem(`patientName_${user.uid}`, fullName.trim());
      }

      setLoading(false);
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (err) {
      console.error('Patient registration error:', err);
      setLoading(false);

      let friendlyMessage = 'Registration failed. Please check your details and try again.';
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'An account with this email already exists.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password must be at least 6 characters long.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyMessage = 'Network connection issue. Please check your internet connection.';
      }

      setError(friendlyMessage);
    }
  };

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

        {onBack && (
          <button className="back-link-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Sign In
          </button>
        )}
      </header>

      {/* Registration Card Container */}
      <main className="doctor-login-container">
        <div className="doctor-login-card">
          <div className="doctor-login-header">
            <div className="doctor-badge-icon" style={{ background: '#e7f0e7', color: '#132e1e' }}>
              <UserPlus size={28} />
            </div>
            <span className="hero-badge-pill" style={{ background: '#e7f0e7', color: '#132e1e' }}>
              Patient Account
            </span>
            <h2 className="doctor-login-title">Create Patient Account</h2>
            <p className="doctor-login-subtitle">
              Register a patient account to view your QML screening reports.
            </p>
          </div>

          {error && (
            <div className="form-error-banner" role="alert">
              <AlertCircle size={18} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="doctor-login-form">
            <div className="form-field-group">
              <label className="field-label" htmlFor="register-name">
                Full Name (Optional)
              </label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="register-name"
                  type="text"
                  className="field-input input-padded"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-label" htmlFor="register-email">
                Email Address
              </label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="register-email"
                  type="email"
                  className="field-input input-padded"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-label" htmlFor="register-password">
                Password
              </label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="register-password"
                  type="password"
                  className="field-input input-padded"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-label" htmlFor="register-confirm-password">
                Confirm Password
              </label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="register-confirm-password"
                  type="password"
                  className="field-input input-padded"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="run-qml-btn doctor-login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="btn-spinner" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Register Account
                </>
              )}
            </button>
          </form>

          <div className="doctor-login-footer">
            <p className="footer-notice" style={{ marginBottom: '8px' }}>
              Already registered?
            </p>
            <button
              className="auth-link-btn"
              style={{ fontSize: '0.9rem' }}
              onClick={onGoToLogin}
            >
              Patient Sign In →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
