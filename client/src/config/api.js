export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3001';

export function apiUrl(path) {
  if (!path.startsWith('/')) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}


