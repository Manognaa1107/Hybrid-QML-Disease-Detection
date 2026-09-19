import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Stethoscope, User, Lock, Mail, AlertCircle, X, Loader2, UserPlus } from 'lucide-react';

export default function AuthModal({ initialTab = 'patient_login', onClose, onAuthSuccess }) {
  // Tabs: 'doctor_login' | 'patient_login' | 'patient_signup'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Switch tab and clear errors/fields
  const switchTab = (tab) => {
    setActiveTab(tab);
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
  };

  // 1. DOCTOR LOGIN SUBMISSION
  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail !== 'doctor@hybridqml.com') {
      setError('Doctor access is restricted to the authorized account.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      if (user.email?.toLowerCase() !== 'doctor@hybridqml.com') {
        await signOut(auth);
        setError('Doctor access is restricted to the authorized account.');
        setLoading(false);
        return;
      }

      localStorage.setItem(`userRole_${user.uid}`, 'doctor');
      setLoading(false);
      if (onAuthSuccess) onAuthSuccess('doctor');
    } catch (err) {
      console.error('Doctor auth error:', err);
      setLoading(false);
      handleAuthError(err);
    }
  };

  // 2. PATIENT LOGIN SUBMISSION
  const handlePatientLogin = async (e) => {
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

      // Ensure patient role is saved
      const existingRole = localStorage.getItem(`userRole_${user.uid}`);
      if (!existingRole) {
        localStorage.setItem(`userRole_${user.uid}`, 'patient');
      }

      setLoading(false);
      if (onAuthSuccess) onAuthSuccess('patient');
    } catch (err) {
      console.error('Patient auth error:', err);
      setLoading(false);
      handleAuthError(err);
    }
  };

  // 3. PATIENT SIGNUP SUBMISSION
  const handlePatientSignup = async (e) => {
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

      localStorage.setItem(`userRole_${user.uid}`, 'patient');
      if (fullName.trim()) {
        localStorage.setItem(`patientName_${user.uid}`, fullName.trim());
      }

      setLoading(false);
      if (onAuthSuccess) onAuthSuccess('patient');
    } catch (err) {
      console.error('Patient signup error:', err);
      setLoading(false);
      handleAuthError(err);
    }
  };

  const handleAuthError = (err) => {
    let msg = 'Authentication failed. Please check your details and try again.';
    if (
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/wrong-password' ||
      err.code === 'auth/user-not-found'
    ) {
      msg = 'Invalid email or password.';
    } else if (err.code === 'auth/email-already-in-use') {
      msg = 'An account with this email already exists.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address.';
    } else if (err.code === 'auth/weak-password') {
      msg = 'Password should be at least 6 characters.';
    } else if (err.code === 'auth/too-many-requests') {
      msg = 'Too many attempts. Please wait a few moments and try again.';
    } else if (err.code === 'auth/network-request-failed') {
      msg = 'Network connection issue. Please verify your internet connection.';
    }
    setError(msg);
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-header-title">
            <span className="auth-logo-badge">⚛</span>
            <h3>Hybrid QML Access</h3>
          </div>
          {onClose && (
            <button className="auth-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Auth Role Selector Tabs */}
        <div className="auth-tab-selector">
          <button
            className={`auth-tab-btn ${activeTab === 'patient_login' || activeTab === 'patient_signup' ? 'active' : ''}`}
            onClick={() => switchTab('patient_login')}
          >
            <User size={16} /> Patient Portal
          </button>
          <button
            className={`auth-tab-btn ${activeTab === 'doctor_login' ? 'active' : ''}`}
            onClick={() => switchTab('doctor_login')}
          >
            <Stethoscope size={16} /> Doctor Portal
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="form-error-banner" role="alert" style={{ marginTop: '16px', marginBottom: '16px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: DOCTOR LOGIN */}
        {activeTab === 'doctor_login' && (
          <form onSubmit={handleDoctorLogin} className="auth-form-body">
            <div className="auth-role-desc">
              <span className="role-tag doctor-tag">Doctor Access</span>
              <p>Restricted to authorized practitioner account (<code>doctor@hybridqml.com</code>).</p>
            </div>

            <div className="form-field-group">
              <label className="field-label" htmlFor="doc-email">Doctor Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="doc-email"
                  type="email"
                  className="field-input input-padded"
                  placeholder="doctor@hybridqml.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-label" htmlFor="doc-pass">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="doc-pass"
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

            <button type="submit" className="run-qml-btn auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="btn-spinner" /> Authenticating...
                </>
              ) : (
                <>
                  <Stethoscope size={18} /> Doctor Sign In
                </>
              )}
            </button>

            <div className="auth-form-footer">
              <span className="notice-text">Doctor registration is restricted.</span>
            </div>
          </form>
        )}

        {/* TAB 2: PATIENT LOGIN */}
        {activeTab === 'patient_login' && (
          <form onSubmit={handlePatientLogin} className="auth-form-body">
            <div className="auth-role-desc">
              <span className="role-tag patient-tag">Patient Access</span>
              <p>Sign in to view your screening reports and early detection insights.</p>
            </div>

            <div className="form-field-group">
              <label className="field-label" htmlFor="pat-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="pat-email"
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
              <label className="field-label" htmlFor="pat-pass">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="pat-pass"
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

            <button type="submit" className="run-qml-btn auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="btn-spinner" /> Signing in...
                </>
              ) : (
                <>
                  <User size={18} /> Patient Sign In
                </>
              )}
            </button>

            <div className="auth-form-footer">
              <span>Don't have a patient account? </span>
              <button type="button" className="auth-link-btn" onClick={() => switchTab('patient_signup')}>
                Register as Patient
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: PATIENT SIGNUP */}
        {activeTab === 'patient_signup' && (
          <form onSubmit={handlePatientSignup} className="auth-form-body">
            <div className="auth-role-desc">
              <span className="role-tag patient-tag">Patient Registration</span>
              <p>Create a patient account for hybrid QML disease screening.</p>
            </div>

            <div className="form-field-group">
              <label className="field-label" htmlFor="reg-name">Full Name (Optional)</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  className="field-input input-padded"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-label" htmlFor="reg-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="reg-email"
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
              <label className="field-label" htmlFor="reg-pass">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="reg-pass"
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
              <label className="field-label" htmlFor="reg-confirm-pass">Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="reg-confirm-pass"
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

            <button type="submit" className="run-qml-btn auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="btn-spinner" /> Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={18} /> Register Patient Account
                </>
              )}
            </button>

            <div className="auth-form-footer">
              <span>Already registered? </span>
              <button type="button" className="auth-link-btn" onClick={() => switchTab('patient_login')}>
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
