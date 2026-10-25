"use client";
 
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check } from "lucide-react";
 
import { cn } from "@/lib/utils";
import { THEMES, type ThemeName } from "./theme-provide";
 
const OPTIONS: Record<ThemeName, { label: string; from: string; to: string }> = {
  ember: { label: "Ember", from: "#FFB020", to: "#FF5E7E" },
  emerald: { label: "Emerald Night", from: "#C6F432", to: "#5EEAD4" },
  daylight: { label: "Daylight", from: "#FFD65C", to: "#4F46E5" },
};
 
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
 
  // Avoid hydration mismatch: the saved theme is only known in the browser
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-24" aria-hidden="true" />;
 
  return (
    <div role="radiogroup" aria-label="Choose theme" className="grid gap-3 sm:grid-cols-3">
      {THEMES.map((name) => {
        const o = OPTIONS[name];
        const active = theme === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(name)}
            className={cn(
              "glass flex flex-col gap-3 p-4 text-left transition",
              active && "ring-2 ring-ring"
            )}
          >
            <span
              className="h-10 w-full rounded-lg"
              style={{ background: `linear-gradient(135deg, ${o.from}, ${o.to})` }}
            />
            <span className="flex items-center justify-between text-sm font-semibold">
              {o.label}
              {active && <Check className="size-4" aria-hidden="true" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
 