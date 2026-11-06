
import { api } from "./client";

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

export const getUsage = () =>
    api<UsageResponse>("/usage");
