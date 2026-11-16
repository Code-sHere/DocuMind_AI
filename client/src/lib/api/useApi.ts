
"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

import { api, ApiError } from "./client";

export function useApi() {
  const { getToken } = useAuth();

  const request = useCallback(
    async <T,>(
      path: string,
      init: RequestInit = {}
    ): Promise<T> => {
      const token = await getToken();
      console.log("CLERK FRONTEND DEBUG:", {
        hasToken: Boolean(token),
        tokenLength: token?.length ?? 0,
      });

      if (!token) {
        throw new ApiError(
          "Please sign in to continue",
          401
        );
      }

      return api<T>(path, init, token);
    },
    [getToken]
  );

  return request;
}
