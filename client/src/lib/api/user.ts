import type { ThemeName } from "../../app/theme-provide";
import { api } from "./client";

export type UserProfile = {
    id: string;
    name: string;
    email: string;
    theme: "light" | "dark" | "system";
};

export type UserResponse = {
    success: boolean;
    message: string;
    user: UserProfile;
};

export type ThemeResponse = {
    success: boolean;
    message: string;
    theme: UserProfile["theme"];
};

export type UpdateProfileInput = {
    name: string;
    email: string;
};

export type ChangePasswordInput = {
    currentPassword: string;
    newPassword: string;
};

export type BasicResponse = {
    success: boolean;
    message: string;
};

// Update profile
export const updateProfile = (data: UpdateProfileInput) =>
    api<UserResponse>("/user/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
    });

// Update theme
export const updateTheme = (theme: ThemeName) =>
  api("/users/theme", {
    method: "PATCH",
    body: JSON.stringify({ theme }),
  });

// Change password
export const changePassword = (data: ChangePasswordInput) =>
    api<BasicResponse>("/user/change-password", {
        method: "POST",
        body: JSON.stringify(data),
    });

// Export user data
export const exportUserData = () =>
    api<Record<string, unknown>>("/user/export");

// Delete account
export const deleteAccount = () =>
    api<BasicResponse>("/user/account", {
        method: "DELETE",
    });
