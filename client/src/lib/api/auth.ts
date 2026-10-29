
import { api } from "./client";

export type User = {
    id: string;
    name: string;
    email: string;
    theme: string;
};

export type AuthResponse = {
    success: boolean;
    message: string;
    user: User;
};

export const login = (email: string, password: string) =>
    api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

export const register = (
    name: string,
    email: string,
    password: string
) =>
    api<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
    });

export const logout = () =>
    api<{ success: boolean; message: string }>("/auth/logout", {
        method: "POST",
    });

export type MeResponse = {
    success: boolean;
    user: User;
};

export const getMe = () => api<MeResponse>("/auth/me");