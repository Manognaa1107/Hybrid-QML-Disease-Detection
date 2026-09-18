const BASE_URL = 'http://localhost:8001';

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
    return { status: 'offline', message: 'Unable to connect to http://localhost:8001' };
  }
}

/**
 * Fetch benchmark metrics and system configuration (/model-info)
 */
export async function fetchModelInfo() {
  const res = await fetch(`${BASE_URL}/model-info`);
  if (!res.ok) {
    throw new Error(`Failed to fetch model benchmark information (Status: ${res.status})`);
  }
  return await res.json();
}

/**
 * Send 13 clinical patient features to /predict
 */
export async function predictPatient(patientData) {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patientData),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Prediction failed with status ${res.status}`);
  }
  return await res.json();
}

/**
 * Send 13 clinical patient features to /compare
 */
export async function compareModels(patientData) {
  const res = await fetch(`${BASE_URL}/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patientData),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Model comparison failed with status ${res.status}`);
  }
  return await res.json();
}
