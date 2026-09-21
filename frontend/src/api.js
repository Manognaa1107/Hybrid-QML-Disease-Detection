const BASE_URL = 'http://127.0.0.1:8001';

/**
 * Check backend health status (/health)
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) {
      return { status: 'offline', message: `Server error (${res.status})` };
    }
    const data = await res.json();
    return { status: 'healthy', ...data };
  } catch (err) {
    return { status: 'offline', message: 'Unable to connect to http://127.0.0.1:8001' };
  }
}

/**
 * Fetch benchmark metrics and system configuration (/model-info)
 */
export async function fetchModelInfo() {
  const res = await fetch(`${BASE_URL}/model-info`);
  if (!res.ok) {
    throw new Error(`Failed to fetch model information (Status: ${res.status})`);
  }
  return await res.json();
}

/**
 * Send disease features for Hybrid QML Risk Prediction
 * Supports: 'heart', 'breast-cancer', 'lung-cancer'
 */
export async function predictDisease(diseaseType, payload) {
  let endpoint = `${BASE_URL}/predict`;
  if (diseaseType === 'heart') {
    endpoint = `${BASE_URL}/predict/heart`;
  } else if (diseaseType === 'breast-cancer' || diseaseType === 'breast_cancer') {
    endpoint = `${BASE_URL}/predict/breast-cancer`;
  } else if (diseaseType === 'lung-cancer' || diseaseType === 'lung_cancer') {
    endpoint = `${BASE_URL}/predict/lung-cancer`;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Prediction failed with status ${res.status}`);
  }
  return await res.json();
}

/**
 * Backward compatible prediction helper for Heart Disease
 */
export async function predictPatient(patientData) {
  return predictDisease('heart', patientData);
}

/**
 * Upload medical report for disease-specific parameter extraction (/extract-report)
 */
export async function extractReport(file, disease) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('disease', disease);

  const res = await fetch(`${BASE_URL}/extract-report`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Report extraction failed with status ${res.status}`);
  }

  return await res.json();
}

