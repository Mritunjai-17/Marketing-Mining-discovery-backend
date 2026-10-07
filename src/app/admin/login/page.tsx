"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, Clock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPendingNotice, setIsPendingNotice] = useState(false);

  // Prevent back-button navigation into previously viewed protected admin screens
  React.useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsPendingNotice(false);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.message && data.message.toLowerCase().includes("pending")) {
          setIsPendingNotice(true);
          throw new Error(data.message);
        }
        throw new Error(data.message || "Invalid credentials");
      }

      // Successful login -> navigate to dashboard and replace history entry
      window.location.replace("/admin");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070D18] flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#D6A84F]/30 selection:text-white">
      {/* Background Decorative Mineral Dust & Radial Glows */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#D6A84F]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-[#162E50]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#09111C] border border-[#1E2C3D] rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10">
        {/* Brand Header with Real Logo */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="relative w-52 h-12 mb-2 focus:outline-none block">
            <Image
              src="/logo.webp"
              alt="Mining Discovery"
              fill
              priority
              sizes="208px"
              className="object-contain"
            />
          </Link>
          <div className="text-[10px] tracking-widest uppercase font-mono-code text-[#D6A84F] font-semibold flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OPERATIONS PORTAL</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight mt-3">
            Admin Sign In
          </h1>
          <p className="text-xs text-[#8C9BAE] mt-1 font-sans">
            Access lead management and customer inquiries
          </p>
        </div>

        {/* Error Alert / Pending Notice */}
        {errorMessage && (
          <div
            className={`mt-6 p-4 rounded-xl border text-xs flex items-start gap-3 animate-in fade-in leading-relaxed ${
              isPendingNotice
                ? "bg-[#251A07] border-[#D6A84F]/40 text-[#F5DEB3]"
                : "bg-rose-950/60 border-rose-500/40 text-rose-200"
            }`}
          >
            {isPendingNotice ? (
              <Clock className="w-5 h-5 text-[#D6A84F] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              {isPendingNotice && (
                <div className="font-heading font-bold text-[#D6A84F] uppercase tracking-wider text-[11px] mb-1">
                  Access Authorization Pending
                </div>
              )}
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-mono-code uppercase text-[#8C9BAE] font-medium mb-1.5 pl-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#5D6F83] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@miningdiscovery.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#060D17] border border-[#1E2C3D] text-sm text-white placeholder-[#5D6F83] focus:outline-none focus:border-[#D6A84F] focus:ring-1 focus:ring-[#D6A84F] transition-all font-sans"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-mono-code uppercase text-[#8C9BAE] font-medium mb-1.5 pl-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#5D6F83] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-11 pr-11 py-3 rounded-xl bg-[#060D17] border border-[#1E2C3D] text-sm text-white placeholder-[#5D6F83] focus:outline-none focus:border-[#D6A84F] focus:ring-1 focus:ring-[#D6A84F] transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5D6F83] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Above Login Button: Not registered? Register as Admin prompt */}
          <div className="pt-2 text-center">
            <span className="text-xs text-[#8C9BAE] font-sans">
              Not registered?{" "}
              <Link
                href="/admin/register"
                className="text-[#D6A84F] hover:text-[#E8C068] font-semibold underline underline-offset-4 transition-colors"
              >
                Register as Admin
              </Link>
            </span>
          </div>

          {/* Golden Pill Submit Button matching screenshot */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#D6A84F] via-[#C99A40] to-[#B3832B] hover:brightness-110 active:scale-[0.99] transition-all duration-300 shadow-lg shadow-[#D6A84F]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
            >
              <span className="font-heading font-bold text-xs uppercase tracking-widest text-[#0B1522]">
                {loading ? "AUTHENTICATING..." : "LOG IN"}
              </span>
              <ArrowRight className="w-4 h-4 text-[#0B1522] transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#1E2C3D]/60 text-center text-[11px] font-mono-code text-[#5D6F83]">
          Mining Discovery Operations System · Secure JWT Session
        </div>
      </div>
    </div>
  );
}
