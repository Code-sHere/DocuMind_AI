const BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const isFormData = init.body instanceof FormData;

  const headers = new Headers(init.headers);

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: "omit",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.log("API REQUEST FAILED:", {
      url: `${BASE}${path}`,
      status: res.status,
      response: data,
    });

    throw new ApiError(
      data?.message ?? `Request failed with status ${res.status}`,
      res.status
    );
  }

  return data as T;
}