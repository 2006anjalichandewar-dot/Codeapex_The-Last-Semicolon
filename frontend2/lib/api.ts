export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000";

export type ApiError = { detail?: string };

export async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    const message = `Unable to reach API at ${API_URL}. Is the backend running?`;
    throw new Error(message);
  }

  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = (await res.json()) as ApiError;
      if (body?.detail) {
        message = typeof body.detail === "string" ? body.detail : message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}
