const BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export type ApiRequest = <T>(
  path: string,
  init?: RequestInit
) => Promise<T>;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Clerk token (hooks ke bina)
//
// Server ka `requireAuth` Clerk ka Bearer token maangta hai. Pehle sirf
// `useApi()` token bhejta tha; baaki sab functions (chat, usage, settings...)
// bina token ke request bhej rahe the, isliye server 401 de raha tha.
// Ab `api()` khud browser ke Clerk session se token utha leta hai.
// ---------------------------------------------------------------------------

type ClerkBrowser = {
  loaded?: boolean;
  session?: {
    getToken: () => Promise<string | null>;
  } | null;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function getClerkToken(): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;

  const startedAt = Date.now();

  // Clerk load hone ka max 5 second wait
  while (Date.now() - startedAt < 5000) {
    const clerk = (window as unknown as { Clerk?: ClerkBrowser }).Clerk;

    if (clerk?.loaded) {
      try {
        return (await clerk.session?.getToken()) ?? undefined;
      } catch {
        return undefined;
      }
    }

    await sleep(100);
  }

  return undefined;
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const isFormData = init.body instanceof FormData;

  const headers = new Headers(init.headers);

  // FormData ke saath Content-Type browser khud set karta hai (boundary ke liye)
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const authToken = token ?? (await getClerkToken());

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  let res: Response;

  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers,
      credentials: "omit",
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Please check that the backend is running.",
      0
    );
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("API REQUEST FAILED:", {
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

// Default request function: token automatically Clerk se aata hai.
// Isko `request` ki jagah use kiya jaata hai jab hook available nahi hota.
export const defaultRequest: ApiRequest = api;