export async function apiFetch(url: string, options: RequestInit = {}) {
  // Ensure we are in a browser environment
  if (typeof window === 'undefined') {
    return fetch(url, options);
  }

  const token = localStorage.getItem('token');
  
  if (!token && url.startsWith('/api/') && !url.startsWith('/api/login')) {
    // If no token and it's a protected API route, redirect to login
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return new Response(JSON.stringify({ message: 'Belum login. Mengalihkan ke halaman login.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
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
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return response;
  }

  if (response.status === 403) {
    throw new Error('Akses ditolak (HTTP 403).');
  }

  if (response.status >= 500) {
    let message = `Terjadi kesalahan server (HTTP ${response.status}).`;
    try {
      const data = await response.clone().json();
      if (data.message) message = data.message;
      else if (data.error) message = data.error;
    } catch {
      // Ignore parse error
    }
    throw new Error(message);
  }

  return response;
}
