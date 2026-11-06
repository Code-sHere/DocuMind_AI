"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import {
  Settings as SettingsIcon,
  User,
  Mail,
  Lock,
  Pencil,
  Palette,
  Check,
  Sparkles,
  MessageCircle,
  Layers,
  CalendarDays,
  ShieldCheck,
  Download,
  Info,
  Trash2,
  Loader2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import Sidebar from "@/app/(app)/layout";

import { getMe } from "@/lib/api/auth";
import {
  updateProfile,
  updateTheme,
  changePassword,
  exportUserData,
  deleteAccount,
} from "@/lib/api/user";
import { getUsage } from "@/lib/api/usage";
import { THEMES } from "../../app/theme-provide"
/* =========================================================
   TYPES
========================================================= */

type Profile = {
  name: string;
  email: string;
};

type Usage = {
  used: number;
  limit: number;
  remaining: number;
  date?: string;
};

type ThemeName = "ember" | "emerald" | "daylight";

type Notice = {
  type: "ok" | "error";
  text: string;
};

// theme options

const THEME_OPTIONS: Record<
  ThemeName,
  {
    label: string;
    description: string;
    preview: string;
  }
> = {
  ember: {
    label: "Ember",
    description: "Warm orange and pink appearance",
    preview: "linear-gradient(120deg, #FFB020 0%, #FF5E7E 100%)",
  },
  emerald: {
    label: "Emerald Night",
    description: "Fresh green and teal appearance",
    preview: "linear-gradient(120deg, #C6F432 0%, #5EEAD4 100%)",
  },
  daylight: {
    label: "Daylight",
    description: "Bright and colorful appearance",
    preview: "linear-gradient(120deg, #FFD65C 0%, #4F46E5 100%)",
  },
};



// component classes

const inputCls =
  "w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-default disabled:opacity-70";

const ghostBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white/5 px-4 text-sm font-semibold text-foreground transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

const accentBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/15 px-4 text-sm font-semibold text-primary transition hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-50";

const dangerBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/60 bg-red-500/15 px-4 text-sm font-semibold text-red-400 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50";

// section component

function Section({
  icon,
  title,
  description,
  action,
  children,
  danger = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={cn(
        "glass rounded-3xl border p-5 sm:p-6",
        danger ? "border-red-500/40" : "border-border"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            danger
              ? "bg-red-500/15 text-red-400"
              : "bg-primary/15 text-primary"
          )}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              "text-lg font-bold leading-tight",
              danger ? "text-red-400" : "text-foreground"
            )}
          >
            {title}
          </h2>

          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        {action}
      </div>

      {children && (
        <div className="mt-5 sm:pl-16">
          {children}
        </div>
      )}
    </section>
  );
}


// field component

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </span>

      <span className="flex h-11 items-center gap-3 rounded-xl border border-border bg-white/5 px-3 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
        {icon}
        {children}
      </span>
    </label>
  );
}

// model component

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass relative w-full max-w-md rounded-3xl border border-border bg-background/90 p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* =========================================================
   STAT TILE
========================================================= */

function Stat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white/5 px-3 py-2.5">
      <span className="text-primary">{icon}</span>

      <div className="leading-tight">
        <p className="text-sm font-bold text-foreground">
          {value}
        </p>

        <p className="text-xs text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

// main page

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  /* ---------------- BASIC STATES ---------------- */

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
  });

  const [draft, setDraft] = useState<Profile>({
    name: "",
    email: "",
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [usage, setUsage] = useState<Usage>({
    used: 0,
    limit: 0,
    remaining: 0,
  });

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);

  const [notice, setNotice] = useState<Notice | null>(null);

  /* ---------------- TOAST ---------------- */

  const flash = useCallback(
    (type: "ok" | "error", text: string) => {
      setNotice({ type, text });

      window.setTimeout(() => {
        setNotice((current) =>
          current?.text === text ? null : current
        );
      }, 3500);
    },
    []
  );

  /* ---------------- MOUNT ---------------- */

  useEffect(() => {
    setMounted(true);
  }, []);

  //   /* ---------------- LOAD SETTINGS ---------------- */

const loadSettings = useCallback(async () => {
  setLoading(true);

  const [profileResult, usageResult] = await Promise.allSettled([
    getMe(),
    getUsage(),
  ]);

  if (profileResult.status === "fulfilled") {
    const user = profileResult.value.user;

    const currentProfile = {
      name: user.name ?? "",
      email: user.email ?? "",
    };

    setProfile(currentProfile);
    setDraft(currentProfile);

    const savedTheme = user.theme as ThemeName | undefined;

    if (savedTheme && THEMES.includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      setTheme("ember");
    }
  } else {
    console.error("Could not load profile:", profileResult.reason);
    flash("error", "Could not load your profile.");
  }

  if (usageResult.status === "fulfilled") {
    setUsage(usageResult.value.usage);
  } else {
    console.error("Could not load usage:", usageResult.reason);
    flash("error", "Could not load your usage information.");
  }

  setLoading(false);
}, [flash, setTheme]);

useEffect(() => {
  loadSettings();
}, [loadSettings]);
  /* ---------------- SAVE PROFILE ---------------- */

  const saveProfile = async () => {
    const name = draft.name.trim();
    const email = draft.email.trim().toLowerCase();

    if (name.length < 2) {
      flash("error", "Name must be at least 2 characters.");
      return;
    }

    if (name.length > 100) {
      flash("error", "Name cannot exceed 100 characters.");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      flash("error", "Please enter a valid email address.");
      return;
    }

    setSaving(true);

    try {
      const response = await updateProfile({
        name,
        email,
      });

      const updatedProfile = {
        name: response.user.name,
        email: response.user.email,
      };

      setProfile(updatedProfile);
      setDraft(updatedProfile);
      setEditing(false);

      flash("ok", "Profile updated successfully.");
    } catch (error) {
      console.error("Profile update failed:", error);

      flash(
        "error",
        error instanceof Error
          ? error.message
          : "Could not update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setDraft(profile);
    setEditing(false);
  };

  //   /* ---------------- SAVE THEME ---------------- */

  const chooseTheme = async (selectedTheme: ThemeName) => {
    if (themeSaving || selectedTheme === theme) return;

    setThemeSaving(true);

    try {
      await updateTheme(selectedTheme);

      // Backend save hone ke baad local theme apply hoga.
      setTheme(selectedTheme);

      flash(
        "ok",
        `${THEME_OPTIONS[selectedTheme].label} theme applied.`
      );
    } catch (error) {
      console.error("Theme update failed:", error);

      flash(
        "error",
        error instanceof Error
          ? error.message
          : "Could not save theme."
      );
    } finally {
      setThemeSaving(false);
    }
  };

  //   /* ---------------- EXPORT DATA ---------------- */

  const exportData = async () => {
    setExporting(true);

    try {
      const data = await exportUserData();

      const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "documind-data.json";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);

      flash("ok", "Your data export has been downloaded.");
    } catch (error) {
      console.error("Data export failed:", error);

      flash(
        "error",
        error instanceof Error
          ? error.message
          : "Could not export your data."
      );
    } finally {
      setExporting(false);
    }
  };

  //   /* ---------------- USAGE ---------------- */

  const usagePercentage =
    usage.limit > 0
      ? Math.min(
        100,
        Math.round((usage.used / usage.limit) * 100)
      )
      : 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-28 sm:px-6">
      <Sidebar />

      {/* ================= HEADER ================= */}

      <header className="mb-6 flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <SettingsIcon className="size-6" />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Settings
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage your account, preferences and AI usage.
          </p>
        </div>

        {loading && (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        )}
      </header>

      {/* ================= TOAST ================= */}

      {notice && (
        <div
          role="status"
          className={cn(
            "mb-4 rounded-xl border px-4 py-3 text-sm font-medium",
            notice.type === "ok"
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-red-500/40 bg-red-500/10 text-red-400"
          )}
        >
          {notice.text}
        </div>
      )}

      {/* ================= CONTENT ================= */}

      <div className="flex flex-col gap-5">

        {/* ================= PROFILE ================= */}

        <Section
          icon={<User className="size-6" />}
          title="Profile"
          description="Update your personal information and account credentials."
          action={
            editing ? (
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className={ghostBtn}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving || loading}
                  className={accentBtn}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}

                  Save changes
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={loading || !profile.email}
                className={accentBtn}
              >
                <Pencil className="size-4" />
                Edit Profile
              </button>
            )
          }
        >
          <div className="grid gap-4 md:grid-cols-2">

            <Field
              label="Full Name"
              icon={<User className="size-5 shrink-0" />}
            >
              <input
                className={inputCls}
                value={editing ? draft.name : profile.name}
                disabled={!editing || saving}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                maxLength={100}
                placeholder="Your full name"
              />
            </Field>

            <Field
              label="Email Address"
              icon={<Mail className="size-5 shrink-0" />}
            >
              <input
                className={inputCls}
                type="email"
                value={editing ? draft.email : profile.email}
                disabled={!editing || saving}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Your email address"
              />
            </Field>

            <Field
              label="Password"
              icon={<Lock className="size-5 shrink-0" />}
            >
              <input
                className={inputCls}
                type="password"
                value="••••••••••"
                disabled
                readOnly
                aria-label="Password hidden"
              />
            </Field>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setPasswordOpen(true)}
                className={ghostBtn}
              >
                <Lock className="size-4" />
                Change Password
              </button>
            </div>
          </div>
        </Section>
        {/* ================= APPEARANCE ================= */}

        <Section
          icon={<Palette className="size-6" />}
          title="Appearance"
          description="Choose a theme that matches your style."
        >
          <div
            role="radiogroup"
            aria-label="Choose theme"
            className="grid gap-4 sm:grid-cols-3"
          >
            {THEMES.map((name) => {
              const option = THEME_OPTIONS[name];

              const active =
                mounted && (theme ?? "system") === name;

              return (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={themeSaving}
                  onClick={() => chooseTheme(name)}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-white/5 p-1.5 text-left transition",
                    active
                      ? "border-primary ring-2 ring-primary/60"
                      : "border-border hover:border-primary/40",
                    themeSaving && "cursor-wait opacity-70"
                  )}
                >
                  <span
                    className="relative block h-14 w-full rounded-xl"
                    style={{
                      background: option.preview,
                    }}
                  >
                    {active && (
                      <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check
                          className="size-4"
                          aria-hidden="true"
                        />
                      </span>
                    )}
                  </span>

                  <span className="flex items-center justify-between gap-2 px-2 pt-2.5">
                    <span className="text-sm font-semibold text-foreground">
                      {option.label}
                    </span>

                    {active && (
                      <span className="text-xs font-medium text-primary">
                        Active
                      </span>
                    )}
                  </span>

                  <span className="block px-2 pb-2 pt-1 text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          {themeSaving && (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Saving appearance...
            </p>
          )}
        </Section>

        {/* ================= AI & USAGE ================= */}
        <Section
          icon={<Sparkles className="size-6" />}
          title="AI & Usage"
          description="Track your questions and daily usage limits."
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">

            <div className="min-w-0 flex-1">
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="text-2xl font-extrabold text-primary">
                  {usage.used}
                </span>{" "}
                / {usage.limit} questions today
              </p>

              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={usage.limit}
                aria-valuenow={usage.used}
                aria-label="Questions used today"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{
                    width: `${usagePercentage}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Resets daily at midnight IST.
                </p>

                <p className="text-xs font-medium text-muted-foreground">
                  {usagePercentage}% used
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:border-l lg:border-border lg:pl-5">
              <Stat
                icon={<MessageCircle className="size-5" />}
                value={usage.used}
                label="Used"
              />

              <Stat
                icon={<Layers className="size-5" />}
                value={usage.remaining}
                label="Remaining"
              />

              <Stat
                icon={<CalendarDays className="size-5" />}
                value={usage.limit}
                label="Daily Limit"
              />
            </div>
          </div>
        </Section>

        {/* ================= PRIVACY ================= */}

        <Section
          icon={<ShieldCheck className="size-6" />}
          title="Privacy"
          description="Control your data and how it's used."
        >
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportData}
              disabled={exporting}
              className={ghostBtn}
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}

              Export my data
            </button>

            <button
              type="button"
              onClick={() => router.push("/privacy")}
              className={ghostBtn}
            >
              <Info className="size-4" />
              How we use your data
            </button>
          </div>
        </Section>

        {/* ================= DANGER ZONE ================= */}
        <Section
          danger
          icon={<Trash2 className="size-6" />}
          title="Danger Zone"
          description="Irreversible actions that affect your account."
          action={
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-500/60 bg-red-500/10 px-4 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">
                Delete account
              </span>
              <span className="sm:hidden">
                Delete
              </span>
            </button>
          }
        />
      </div>

      {/* change password model  */}

      {passwordOpen && (
        <ChangePasswordModal
          onClose={() => setPasswordOpen(false)}
          onDone={() => {
            setPasswordOpen(false);
            flash("ok", "Password changed successfully.");
          }}
        />
      )}

      {/* delete account modal */}

      {deleteOpen && (
        <DeleteAccountModal
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => {
            router.replace("/");
          }}
        />
      )}
    </main>
  );
}

// change password modal

function ChangePasswordModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 12) {
      setError("New password must be between 8 and 12 characters.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setBusy(true);

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      onDone();
    } catch (error) {
      console.error("Password update failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not change password."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Change password"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">

        <Field
          label="Current password"
          icon={<Lock className="size-5 shrink-0" />}
        >
          <input
            className={inputCls}
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) =>
              setCurrentPassword(event.target.value)
            }
            placeholder="Enter current password"
          />
        </Field>

        <Field
          label="New password"
          icon={<Lock className="size-5 shrink-0" />}
        >
          <input
            className={inputCls}
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(event.target.value)
            }
            placeholder="Enter new password"
          />
        </Field>

        <p className="text-xs text-muted-foreground">
          Password must contain between 8 and 12 characters.
        </p>

        {error && (
          <p className="text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={ghostBtn}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={
              busy ||
              !currentPassword ||
              !newPassword
            }
            className={accentBtn}
          >
            {busy && (
              <Loader2 className="size-4 animate-spin" />
            )}

            Update password
          </button>
        </div>
      </div>
    </Modal>
  );
}

// delete account modal

function DeleteAccountModal({
  onClose,
  onDeleted,
}: {
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirmDelete = async () => {
    if (confirmation !== "DELETE") {
      setError("Please type DELETE to confirm.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await deleteAccount();

      onDeleted();
    } catch (error) {
      console.error("Account deletion failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not delete account."
      );

      setBusy(false);
    }
  };

  return (
    <Modal
      title="Delete account"
      onClose={onClose}
    >
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        This permanently deletes your account, documents,
        chats and usage history. This action cannot be undone.

        {" "}Type{" "}
        <span className="font-bold text-foreground">
          DELETE
        </span>{" "}
        to confirm.
      </p>

      <input
        value={confirmation}
        onChange={(event) =>
          setConfirmation(event.target.value)
        }
        placeholder="Type DELETE"
        disabled={busy}
        className="mb-4 h-11 w-full rounded-xl border border-border bg-white/5 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-red-500/60"
      />

      {error && (
        <p className="mb-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className={ghostBtn}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={confirmDelete}
          disabled={busy || confirmation !== "DELETE"}
          className={dangerBtn}
        >
          {busy && (
            <Loader2 className="size-4 animate-spin" />
          )}

          <Trash2 className="size-4" />
          Delete account
        </button>
      </div>
    </Modal>
  );
}