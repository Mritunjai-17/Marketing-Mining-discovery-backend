"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Inbox,
  Activity,
  Settings,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  LogOut,
  LogIn,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newCount, setNewCount] = useState<number | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminProfile | null>(null);

  const [pendingAdminCount, setPendingAdminCount] = useState<number>(0);

  // Bfcache (Back-Forward Cache) back-button security listener:
  // If user clicks browser back button after logout, immediately verify auth or redirect to login
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      const isAuthPage = pathname === "/admin/login" || pathname === "/admin/register";
      if (!isAuthPage && event.persisted) {
        fetch("/api/admin/auth/me", { cache: "no-store" })
          .then((res) => res.json())
          .then((json) => {
            if (!json.success || !json.data) {
              window.location.replace("/admin/login");
            }
          })
          .catch(() => {
            window.location.replace("/admin/login");
          });
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [pathname]);

  // Fetch live stats, admin profile & pending admin requests
  useEffect(() => {
    const isAuthPage = pathname === "/admin/login" || pathname === "/admin/register";
    if (isAuthPage) return;

    let isMounted = true;

    async function fetchBadge() {
      try {
        const res = await fetch("/api/contacts/stats", { cache: "no-store" });
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setNewCount(json.data.new);
        }
      } catch (err) {
        console.warn("Could not fetch badge count", err);
      }
    }

    async function fetchAdminProfile() {
      try {
        const res = await fetch("/api/admin/auth/me", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const json = await res.json();

        if (!isMounted) return;

        if (json.success && json.data) {
          setCurrentAdmin(json.data);
          // Fetch pending requests count for Admin Requests section
          const usersRes = await fetch("/api/admin/users", { cache: "no-store" });
          const usersJson = await usersRes.json();
          if (isMounted && usersJson.success && typeof usersJson.pendingCount === "number") {
            setPendingAdminCount(usersJson.pendingCount);
          }
        } else {
          // Not logged in -> kick to login and replace history
          setCurrentAdmin(null);
          window.location.replace("/admin/login");
        }
      } catch {
        if (isMounted) {
          setCurrentAdmin(null);
          window.location.replace("/admin/login");
        }
      }
    }

    fetchBadge();
    fetchAdminProfile();
    const interval = setInterval(() => {
      fetchBadge();
      fetchAdminProfile();
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setCurrentAdmin(null);
      // Replace history completely so back button does not return to admin dashboard
      window.location.replace("/admin/login");
    }
  };

  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/register";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-[#F4F0E8] text-[#111D2A]">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#09111C] border-r border-[#1E2C3D] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header with Real Mining Discovery Logo */}
        <div className="p-5 border-b border-[#1E2C3D] flex items-center justify-between">
          <Link href="/admin" className="flex flex-col gap-1 focus:outline-none">
            <div className="relative w-48 h-10">
              <Image
                src="/logo.webp"
                alt="Mining Discovery"
                fill
                priority
                sizes="192px"
                className="object-contain object-left"
              />
            </div>
            <div className="text-[10px] tracking-widest uppercase font-mono-code text-[#D6A84F]/80 pl-0.5">
              Operations & Leads
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-[#8C9BAE] hover:text-white hover:bg-[#1E2C3D]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu with Dedicated Sections */}
        <div className="flex-1 py-5 px-3.5 space-y-5 overflow-y-auto">
          {/* SECTION 1: INQUIRIES & LEADS */}
          <div className="space-y-1">
            <div className="px-3 mb-2 text-[10px] uppercase font-mono-code font-semibold tracking-wider text-[#5D6F83]">
              Operations & Inquiries
            </div>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group ${
                pathname === "/admin"
                  ? "bg-[#142233] text-white font-medium border-l-2 border-[#D6A84F]"
                  : "text-[#8C9BAE] hover:text-white hover:bg-[#121E2E]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox
                  className={`w-4 h-4 transition-colors ${
                    pathname === "/admin" ? "text-[#D6A84F]" : "text-[#5D6F83] group-hover:text-[#D6A84F]"
                  }`}
                />
                <span>Inquiries & Leads</span>
              </div>
              {newCount && newCount > 0 ? (
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-[#D6A84F] text-[#09111C] font-bold">
                  {newCount}
                </span>
              ) : null}
            </Link>
          </div>

          {/* SECTION 2: DEDICATED ADMIN REQUESTS SECTION */}
          <div className="space-y-1 pt-1">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono-code font-semibold tracking-wider text-[#D6A84F]/90 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[#D6A84F]" />
                <span>Admin Requests</span>
              </span>
              {pendingAdminCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D6A84F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D6A84F]"></span>
                </span>
              )}
            </div>

            <Link
              href="/admin/users"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group ${
                pathname === "/admin/users"
                  ? "bg-[#142233] text-white font-medium border-l-2 border-[#D6A84F]"
                  : "text-[#8C9BAE] hover:text-white hover:bg-[#121E2E]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    pathname === "/admin/users"
                      ? "text-[#D6A84F]"
                      : "text-[#5D6F83] group-hover:text-[#D6A84F]"
                  }`}
                />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">Admin Requests</span>
                  <span className="text-[10px] text-[#5D6F83] font-mono-code group-hover:text-[#8C9BAE]">
                    Approvals & Access
                  </span>
                </div>
              </div>

              {pendingAdminCount > 0 ? (
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-gradient-to-r from-[#D6A84F] to-[#C99A40] text-[#09111C] font-bold shadow-xs flex items-center gap-1 shrink-0 animate-pulse">
                  <span>{pendingAdminCount}</span>
                  <span className="text-[9px] uppercase tracking-wider">New</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-[#132233] text-[#5D6F83] shrink-0">
                  Manage
                </span>
              )}
            </Link>
          </div>

          {/* SECTION 3: SYSTEM & DIAGNOSTICS */}
          <div className="space-y-1 pt-1">
            <div className="px-3 mb-2 text-[10px] uppercase font-mono-code font-semibold tracking-wider text-[#5D6F83]">
              System & Diagnostics
            </div>

            <a
              href="/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-[#8C9BAE] hover:text-white hover:bg-[#121E2E] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-[#5D6F83] group-hover:text-[#D6A84F] transition-colors" />
                <span>System Health</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#5D6F83]" />
            </a>
          </div>
        </div>

        {/* Sidebar Footer with Live Profile & Logout */}
        <div className="p-4 border-t border-[#1E2C3D] bg-[#060D17] space-y-2.5">
          {currentAdmin ? (
            <div className="p-2.5 rounded-xl bg-[#0E1724] border border-[#1E2C3D]/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#182637] flex items-center justify-center text-[#D6A84F] font-bold text-xs border border-[#D6A84F]/30 shrink-0">
                  {currentAdmin.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                    <span>{currentAdmin.name}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D6A84F] shrink-0" />
                  </div>
                  <div className="text-[10px] font-mono-code text-[#D6A84F] capitalize">
                    {currentAdmin.role === "superadmin" ? "Super Admin" : "Admin"}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-[#8C9BAE] hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/admin/login"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-full border border-[#D6A84F]/40 bg-[#0E1724] text-xs font-heading font-semibold text-[#D6A84F] hover:bg-[#D6A84F]/10 transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Admin Sign In</span>
            </Link>
          )}

          <a
            href={process.env.NEXT_PUBLIC_WEBSITE_URL || "https://miningdiscovery.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-full border border-[#D6A84F]/30 bg-gradient-to-r from-[#D6A84F]/15 to-transparent text-xs font-heading font-medium text-[#D6A84F] hover:bg-[#D6A84F]/25 transition-all shadow-sm"
          >
            <span>Visit Live Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#09111C] border-b border-[#1E2C3D] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-[#142233] text-white hover:bg-[#1A2D44]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative w-36 h-8">
              <Image
                src="/logo.webp"
                alt="Mining Discovery"
                fill
                priority
                sizes="144px"
                className="object-contain object-left"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentAdmin ? (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-[#8C9BAE] hover:text-rose-400"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link href="/admin/login" className="text-xs text-[#D6A84F] font-semibold">
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
