"use client";
 
import { ThemeProvider as NextThemesProvider } from "next-themes";
 
// The three themes defined in globals.css
export const THEMES = ["ember", "emerald", "daylight"] as const;
export type ThemeName = (typeof THEMES)[number];
 
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"      // writes <html data-theme="ember">
      themes={[...THEMES]}
      defaultTheme="ember"
      enableSystem={false}        // user chooses, we don't follow the OS
      disableTransitionOnChange
      storageKey="documind-theme" // remembered in the browser
    >
      {children}
    </NextThemesProvider>
  );
}