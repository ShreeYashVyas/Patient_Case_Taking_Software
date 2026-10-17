const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(API_BASE + '/api' + path, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the API. Start the backend server and check its connection.');
  }

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || 'The API request failed with status ' + response.status + '.');
  }
  return result;
}

export async function getPatients() {
  const result = await request('/patients');
  return Array.isArray(result?.data) ? result.data : [];
}

export async function getEncounters() {
  const result = await request('/encounters');
  return Array.isArray(result?.data) ? result.data : [];
}

export async function createPatient(patient) {
  const result = await request('/patients', {
    method: 'POST',
    body: JSON.stringify(patient),
  });
  if (!result?.data) throw new Error('The API did not return the saved patient.');
  return result.data;
}

export async function createEncounter(encounter) {
  const result = await request('/encounters', {
    method: 'POST',
    body: JSON.stringify(encounter),
  });
  if (!result?.data) throw new Error('The API did not return the saved consultation.');
  return result.data;
}
