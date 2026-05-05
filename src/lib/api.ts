
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const activeId = localStorage.getItem('twitter_clone_active_id');
  const headers = new Headers(init?.headers);
  if (activeId) {
    headers.set('x-user-id', activeId);
  }
  
  return fetch(input, {
    ...init,
    headers
  });
}
