const API_BASE = 'http://localhost:5000';

export async function login(username, password, clientInfo = {}) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password, clientInfo }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json().then(r => r.user);
}

export async function logout() {
  await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
}

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Not logged in');
  return res.json();
}

export async function fetchTable(key) {
  const res = await fetch(`${API_BASE}/api/table/${key}`, { credentials: 'include' });
  return res.json();
}

export async function clearTable(key) {
  await fetch(`${API_BASE}/clear/${key}`, { method: 'DELETE', credentials: 'include' });
}

export async function exportTable(key, format = 'json') {
  const url = `${API_BASE}/export/${key}?format=${format}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = `${key}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
