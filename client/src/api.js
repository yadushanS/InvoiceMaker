const TOKEN_KEY = 'invoice_maker_token';

// In dev, Vite's proxy (vite.config.js) forwards /api to localhost:4100, so '' (relative) works.
// In production the frontend (Vercel) and backend (Railway) are different origins, so this must
// be set to the full backend URL via the VITE_API_URL env var at build time.
const API_BASE = import.meta.env.VITE_API_URL || '';

export function assetUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),

  getBusiness: () => request('/business/me'),
  updateBusiness: (payload) => request('/business/me', { method: 'PUT', body: payload }),
  uploadLogo: (formData) => request('/business/me/logo', { method: 'POST', body: formData, isForm: true }),

  listFolders: () => request('/folders'),
  createFolder: (name) => request('/folders', { method: 'POST', body: { name } }),
  renameFolder: (id, name) => request(`/folders/${id}`, { method: 'PUT', body: { name } }),
  deleteFolder: (id) => request(`/folders/${id}`, { method: 'DELETE' }),
  getFolder: (id) => request(`/folders/${id}`),

  listInvoices: (folderId) => request(`/invoices${folderId ? `?folderId=${folderId}` : ''}`),
  getInvoice: (id) => request(`/invoices/${id}`),
  createInvoice: (payload) => request('/invoices', { method: 'POST', body: payload }),
  updateInvoice: (id, payload) => request(`/invoices/${id}`, { method: 'PUT', body: payload }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),
  duplicateInvoice: (id) => request(`/invoices/${id}/duplicate`, { method: 'POST' }),
};
