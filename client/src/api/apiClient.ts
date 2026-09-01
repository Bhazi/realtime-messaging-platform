const API_URL = "http://localhost:5000/api/v1";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
  });

  // Access token is fine
  if (response.status !== 401) {
    return response;
  }

  // Access token expired/invalid
  const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  // Refresh token is also invalid/expired
  if (!refreshResponse.ok) {
    return response;
  }

  // Server has now set a new access-token cookie.
  // Retry the original request.
  response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
  });

  return response;
}
