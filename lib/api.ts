export async function apiFetch(url: string, options: RequestInit = {}) {
  // Ensure we are in a browser environment
  if (typeof window === 'undefined') {
    return fetch(url, options);
  }

  const token = localStorage.getItem('token');
  
  if (!token && url.startsWith('/api/') && !url.startsWith('/api/login')) {
    // If no token and it's a protected API route, redirect to login
    window.location.href = '/login';
    throw new Error('No authentication token found. Redirecting to login.');
  }

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure Content-Type is set for JSON bodies if not already set
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
     headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sesi anda telah habis. Silakan login kembali.');
  }

  if (response.status === 403) {
    throw new Error('Akses ditolak (HTTP 403).');
  }

  return response;
}
