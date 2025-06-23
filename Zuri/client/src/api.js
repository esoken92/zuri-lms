export async function login(username, password) {
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json().then(r => r.user);
}

export async function logout() {
  await fetch('/logout', { method: 'POST', credentials: 'include' });
}

export async function getCurrentUser() {
  const res = await fetch('/me', { credentials: 'include' });
  if (!res.ok) throw new Error('Not logged in');
  return res.json();
}

export async function fetchTable(key) {
  const res = await fetch(`/api/table/${key}`, { credentials: 'include' });
  return res.json();
}

export async function clearTable(key) {
  await fetch(`/clear/${key}`, { method: 'POST', credentials: 'include' });
}

export async function exportTable(key, format = 'json') {
  const url = `/export/${key}?format=${format}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = `${key}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
