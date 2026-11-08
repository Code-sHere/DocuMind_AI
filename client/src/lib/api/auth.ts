import { useAuth, useClerk, useUser } from "@clerk/nextjs";

import { defaultRequest, type ApiRequest } from "./client";

// ================= BACKEND PROFILE (MongoDB) =================
// Dashboard / Settings `getMe` use karte hain. Pehle Clerk migration mein
// ye function hat gaya tha, isliye "getMe is not defined" error aa raha tha.

export type MeUser = {
  id: string;
  name: string;
  email: string;
  theme: "ember" | "emerald" | "daylight";
  stats?: {
    totalQuestionsAsked: number;
    totalDocumentsUploaded: number;
    totalInputTokens: number;
    totalOutputTokens: number;
  };
};

export type MeResponse = {
  success: boolean;
  user: MeUser;
};

export const getMe = (request: ApiRequest = defaultRequest) =>
  request<MeResponse>("/auth/me");

// ================= CLERK HOOKS =================

export function useCurrentUser() {
  const { user, isLoaded, isSignedIn } = useUser();

  return {
    user: user
      ? {
          id: user.id,
          name: user.fullName || user.firstName || "DocuMind User",
          email: user.primaryEmailAddress?.emailAddress || "",
          imageUrl: user.imageUrl,
        }
      : null,
    isLoaded,
    isSignedIn,
  };
}

export function useAuthToken() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return {
    getToken,
    isLoaded,
    isSignedIn,
  };
}

export function useLogout() {
  const { signOut } = useClerk();

  return {
    logout: () =>
      signOut({
        redirectUrl: "/login",
      }),
  };
}