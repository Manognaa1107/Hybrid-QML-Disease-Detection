import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Stethoscope, Lock, Mail, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function DoctorLogin({ onLoginSuccess, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    // Pre-login email check: Doctor access rule
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
      const firebaseUser = userCredential.user;

      // Post-login verification: Ensure authenticated user email is authorized doctor email
      if (firebaseUser.email?.toLowerCase() !== 'doctor@hybridqml.com') {
        await signOut(auth);
        setError('Doctor access is restricted to the authorized account.');
        setLoading(false);
        return;
      }

      // Save user role in localStorage
      localStorage.setItem(`userRole_${firebaseUser.uid}`, 'doctor');

      const doctorDocRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(doctorDocRef);

      if (!docSnap.exists()) {
        await setDoc(doctorDocRef, {
          name: "Doctor",
          email: firebaseUser.email,
          role: "doctor",
          createdAt: serverTimestamp()
        });
      } else {
        await setDoc(doctorDocRef, {
          name: "Doctor",
          email: firebaseUser.email,
          role: "doctor"
        }, { merge: true });
      }

      setLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Doctor login error:', err);
      setLoading(false);

      let friendlyMessage = 'Authentication failed. Please check your credentials and try again.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        friendlyMessage = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many failed login attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyMessage = 'Network error. Please check your internet connection.';
      } else if (err.code === 'permission-denied' || (err.message && err.message.includes('permission'))) {
        friendlyMessage = 'Firestore Permission Denied: Ensure Firestore rules in Firebase Console allow authenticated users to read/write users/{uid}.';
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
            <div className="doctor-badge-icon">
              <Stethoscope size={28} />
            </div>
            <span className="hero-badge-pill">Authorized Medical Portal</span>
            <h2 className="doctor-login-title">Doctor Sign In</h2>
            <p className="doctor-login-subtitle">
              Sign in with your authorized practitioner account to access EarlyQ screening diagnostics.
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
              <label className="field-label" htmlFor="doctor-email">
                Doctor Email Address
              </label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="doctor-email"
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
              <label className="field-label" htmlFor="doctor-password">
                Password
              </label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="doctor-password"
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
                  Authenticating...
                </>
              ) : (
                <>
                  <Stethoscope size={18} />
                  Login to Portal
                </>
              )}
            </button>
          </form>

          <div className="doctor-login-footer">
            <p className="footer-notice">
              🔒 Access is restricted strictly to authorized medical personnel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
