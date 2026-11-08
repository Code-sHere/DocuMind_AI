import { defaultRequest, type ApiRequest } from "./client";

export type Usage = {
  used: number;
  limit: number;
  remaining: number;
  date: string;
};

export type UsageResponse = {
  success: boolean;
  usage: Usage;
};

export const getUsage = (request: ApiRequest = defaultRequest) =>
  request<UsageResponse>("/usage");