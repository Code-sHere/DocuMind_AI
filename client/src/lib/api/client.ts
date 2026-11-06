const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}


export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {

  const isFormData = init.body instanceof FormData;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include", // REQUIRED: lets the browser store and send the token cookie
    headers: isFormData
      ? { ...init.headers } // browser khud boundary ke saath Content-Type set karega
      : { "Content-Type": "application/json", ...init.headers },
  });

  // Backend always replies with JSON: { success, message, ... }
 const data = await res.json().catch(() => null);

if (!res.ok) {
  console.log("API REQUEST FAILED:", {
    url: `${BASE}${path}`,
    status: res.status,
    response: data,
  });

  throw new ApiError(
    data?.message ??
      `Request failed with status ${res.status}`,
    res.status
  );
}

return data as T;
}