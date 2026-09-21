import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User, Lock, Mail, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function PatientLogin({ onLoginSuccess, onGoToRegister, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Store role as "patient" using existing mechanism if not already set
      const existingRole = localStorage.getItem(`userRole_${user.uid}`);
      if (!existingRole || existingRole !== 'doctor') {
        localStorage.setItem(`userRole_${user.uid}`, 'patient');
      }

      setLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Patient login error:', err);
      setLoading(false);

      let friendlyMessage = 'Authentication failed. Please check your credentials and try again.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        friendlyMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyMessage = 'Network connection issue. Please check your internet connection.';
      }

      setError(friendlyMessage);
    }
  };

  return (
    <div className="doctor-login-view">
      {onBack && (
        <div className="screening-top-bar" style={{ maxWidth: '440px', margin: '0 auto 16px auto', padding: 0 }}>
          <button className="back-link-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Sign In
          </button>
        </div>
      )}

      <div className="doctor-login-container">
        <div className="doctor-login-card">
          <div className="doctor-login-header">
            <div className="doctor-badge-icon" style={{ background: 'var(--bg-tertiary)', color: 'var(--primary)' }}>
              <User size={28} />
            </div>
            <span className="hero-badge-pill">Patient Portal</span>
            <h2 className="doctor-login-title">Patient Sign In</h2>
            <p className="doctor-login-subtitle">
              Sign in to view your EarlyQ disease screening reports and diagnostic history.
            </p>
          </div>

          {error && (
            <div className="form-error-banner" role="alert">
              <AlertCircle size={18} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="doctor-login-form">
            <div className="form-field-group">
              <label className="field-label" htmlFor="patient-email">
                Patient Email Address
              </label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="patient-email"
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
              <label className="field-label" htmlFor="patient-password">
                Password
              </label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="patient-password"
                  type="password"
                  className="field-input input-padded"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  Signing in...
                </>
              ) : (
                <>
                  <User size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="doctor-login-footer">
            <p className="footer-notice" style={{ marginBottom: '8px' }}>
              Don't have a patient account?
            </p>
            <button
              className="auth-link-btn"
              style={{ fontSize: '0.9rem' }}
              onClick={onGoToRegister}
            >
              Register Patient Account →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
