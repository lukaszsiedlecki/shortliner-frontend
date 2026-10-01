const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// The gateway sets a readable XSRF-TOKEN cookie on every response; it must be echoed back on
// every state-changing request (as the X-XSRF-TOKEN header, or a _csrf form field), or it answers 403.
export function getCsrfToken(): string | null {
  const cookie = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('XSRF-TOKEN='));
  return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : null;
}

export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (!SAFE_METHODS.has(method)) {
    const token = getCsrfToken();
    if (token) {
      headers.set('X-XSRF-TOKEN', token);
    }
  }
  return fetch(input, {...init, headers, credentials: 'same-origin'});
}
