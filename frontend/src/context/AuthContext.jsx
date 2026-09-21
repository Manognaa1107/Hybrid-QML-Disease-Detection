import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ensurePatientProfile } from '../lib/patientId';

const AuthContext = createContext({
  user: null,
  role: null,
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Explicit role resolution: doctor@hybridqml.com is ALWAYS doctor
        const isDoctorEmail = firebaseUser.email?.toLowerCase() === 'doctor@hybridqml.com';
        let userRole = isDoctorEmail ? 'doctor' : localStorage.getItem(`userRole_${firebaseUser.uid}`);

        if (!userRole) {
          userRole = 'patient';
        }

        // Persist resolved role in localStorage for consistency
        localStorage.setItem(`userRole_${firebaseUser.uid}`, userRole);
        setRole(userRole);

        // Auto-check/migrate patient profile and patientId for patient users
        if (userRole === 'patient') {
          console.log("AUTH USER:", firebaseUser.email);
          console.log("RESOLVED ROLE:", userRole);
          console.log("CALLING ensurePatientProfile...");

          ensurePatientProfile(firebaseUser)
            .then((patientId) => {
              console.log("ENSURE PATIENT PROFILE RESULT:", patientId);
            })
            .catch((err) => {
              console.error("Patient profile verification error:", err);
            });
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    role,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
