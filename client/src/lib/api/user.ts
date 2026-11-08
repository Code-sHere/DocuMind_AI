import type { ThemeName } from "../../app/theme-provide";
import { defaultRequest, type ApiRequest } from "./client";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  theme: "ember" | "emerald" | "daylight";
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

// `request` optional hai: na dene par token automatically Clerk se aata hai,
// isliye SettingPage jaise purane callers (jo request nahi dete) bhi chalenge.

// Update profile
export const updateProfile = (
  data: UpdateProfileInput,
  request: ApiRequest = defaultRequest
) =>
  request<UserResponse>("/user/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// Update theme
export const updateTheme = (
  theme: ThemeName,
  request: ApiRequest = defaultRequest
) =>
  request<ThemeResponse>("/user/theme", {
    method: "PATCH",
    body: JSON.stringify({ theme }),
  });

// Change password
export const changePassword = (
  data: ChangePasswordInput,
  request: ApiRequest = defaultRequest
) =>
  request<BasicResponse>("/user/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Export user data
export const exportUserData = (request: ApiRequest = defaultRequest) =>
  request<Record<string, unknown>>("/user/export");

// Delete account
export const deleteAccount = (request: ApiRequest = defaultRequest) =>
  request<BasicResponse>("/user/account", { method: "DELETE" });