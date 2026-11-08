
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
    LayoutDashboard,
    Library,
    MessagesSquare,
    Settings,
    Menu,
    X,
    Sparkles,
} from "lucide-react";

// ================= LANDING NAVBAR =================

type LandingNavProps = {
    isLoggedIn: boolean;
    isAuthLoading: boolean;
};

export function LandingNav({
    isLoggedIn,
    isAuthLoading,
}: LandingNavProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-16">
                <Link
                    href="/"
                    className="text-xl font-bold tracking-tight text-foreground"
                >
                    DocuMind <span className="text-primary">AI</span>
                </Link>

                <nav className="flex items-center gap-3">
                    {isAuthLoading ? (
                        <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
                    ) : isLoggedIn ? (
                        <Link
                            href="/dashboard"
                            className={cn(buttonVariants(), "btn-gradient")}
                        >
                            <LayoutDashboard className="mr-2 size-4" />
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className={cn(
                                    buttonVariants({
                                        variant: "outline",
                                    }),
                                    "glass"
                                )}
                            >
                                Log in
                            </Link>

                            <Link
                                href="/register"
                                className={cn(
                                    buttonVariants(),
                                    "btn-gradient"
                                )}
                            >
                                Start free
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}

// ================= NAV ITEMS =================

const navItems = [
    {
        label: "Desk",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Library",
        href: "/dashboard/library",
        icon: Library,
    },
    {
        label: "Chats",
        href: "/dashboard/chats",
        icon: MessagesSquare,
    },
    {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
];

// ================= SIDEBAR =================

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === href;
        }

        return pathname === href || pathname.startsWith(`${href}/`);
    };

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isOpen) return;

        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", onKey);

        return () => {
            window.removeEventListener("keydown", onKey);
        };
    }, [isOpen]);

    return (
        <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-6 sm:pt-4">
            <div className="relative w-full max-w-5xl">
                <div
                    className={cn(
                        "relative flex h-16 items-center justify-between gap-2 overflow-hidden rounded-full px-2 sm:px-3",
                        "border border-white/30 bg-white/40 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06]"
                    )}
                >
                    {/* Logo */}
                    <Link
                        href="/dashboard"
                        aria-label="DocuMind AI home"
                        className="group relative flex shrink-0 items-center gap-2 pl-3 pr-2"
                    >
                        <span className="text-4xl font-extrabold leading-none tracking-tighter text-[#FFAE28] transition-transform group-hover:scale-110">
                            D
                        </span>

                        <span className="hidden text-sm font-bold tracking-wide text-foreground lg:block">
                            DocuMind{" "}
                            <span className="text-primary">AI</span>
                        </span>
                    </Link>

                    {/* Desktop navigation */}
                    <nav
                        aria-label="Dashboard"
                        className="relative hidden flex-1 items-center justify-center gap-1 md:flex lg:gap-2"
                    >
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={
                                        active ? "page" : undefined
                                    }
                                    className={cn(
                                        "group flex items-center gap-2 rounded-full px-3 py-2.5 transition-all duration-200 lg:px-4",
                                        active
                                            ? "bg-primary/15 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_0_18px_rgba(255,174,40,0.25)]"
                                            : "text-muted-foreground hover:bg-white/40 hover:text-foreground dark:hover:bg-white/10"
                                    )}
                                >
                                    <Icon
                                        size={19}
                                        strokeWidth={active ? 2.4 : 1.8}
                                        className="transition-transform group-hover:scale-110"
                                    />

                                    <span className="text-sm font-semibold">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Workspace badge */}
                    <div className="relative hidden shrink-0 items-center gap-2 rounded-full bg-primary/10 py-2 pl-3 pr-4 xl:flex">
                        <Sparkles className="size-4 text-primary" />

                        <span className="text-xs font-semibold text-foreground">
                            Your AI workspace
                        </span>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        type="button"
                        onClick={() => setIsOpen((value) => !value)}
                        aria-label={
                            isOpen
                                ? "Close navigation menu"
                                : "Open navigation menu"
                        }
                        aria-expanded={isOpen}
                        aria-controls="mobile-menu"
                        className="relative mr-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-white/40 text-foreground transition-colors hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/20 md:hidden"
                    >
                        {isOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* Mobile menu */}
                {isOpen && (
                    <>
                        <button
                            type="button"
                            aria-label="Close navigation"
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 -z-10 bg-black/30 backdrop-blur-sm md:hidden"
                        />

                        <nav
                            id="mobile-menu"
                            aria-label="Dashboard"
                            className="absolute inset-x-0 top-full mt-2 flex flex-col gap-1 rounded-3xl border border-white/20 bg-background/95 p-2 shadow-xl backdrop-blur-2xl md:hidden"
                        >
                            {navItems.map((item) => {
                                const active = isActive(item.href);
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-current={
                                            active ? "page" : undefined
                                        }
                                        className={cn(
                                            "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base font-semibold transition-colors",
                                            active
                                                ? "bg-primary/15 text-primary"
                                                : "text-muted-foreground hover:bg-white/40 hover:text-foreground dark:hover:bg-white/10"
                                        )}
                                    >
                                        <Icon
                                            size={20}
                                            strokeWidth={active ? 2.4 : 1.8}
                                        />

                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </>
                )}
            </div>
        </header>
    );
}
