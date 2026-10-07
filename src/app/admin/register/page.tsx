"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingSuccess, setPendingSuccess] = useState<string | null>(null);
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);

  // Check whether this is the first admin (Super Admin initial registration)
  React.useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch("/api/admin/auth/setup-status");
        const json = await res.json();
        if (json.success && json.data) {
          setIsFirstAdmin(!!json.data.isFirstAdmin);
        }
      } catch {
        // fallback to standard
      }
    }
    checkSetup();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Please complete all required fields");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed");
      }

      // If this was the first user (superadmin), they are approved immediately
      if (!data.isPendingApproval && data.token) {
        // Use replace so register page is replaced in browser history
        window.location.replace("/admin");
        return;
      }

      // Subsequent admin -> pending Super Admin approval
      setPendingSuccess(
        data.message ||
          "Registration submitted. The Super Admin must grant you access before you can log in."
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070D18] flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#D6A84F]/30 selection:text-white">
      {/* Background Decorative Mineral Dust & Radial Glows */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-[#D6A84F]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-[#162E50]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
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
            <span>{isFirstAdmin ? "INITIAL SYSTEM SETUP" : "OPERATIONS PORTAL"}</span>
          </div>

          {isFirstAdmin && (
            <div className="mt-2.5 px-3 py-1 rounded-full bg-[#D6A84F]/15 border border-[#D6A84F]/40 text-[#E8C068] text-[11px] font-mono-code font-semibold tracking-wide flex items-center gap-1.5">
              <span>★</span>
              <span>FIRST USER: SUPER ADMINISTRATOR</span>
            </div>
          )}

          <h1 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight mt-3">
            {isFirstAdmin ? "Register as Super Admin" : "Register as Admin"}
          </h1>
          <p className="text-xs text-[#8C9BAE] mt-1 font-sans">
            {isFirstAdmin
              ? "Your account will be the primary Super Admin with full portal management authority."
              : "Access requires authorization by the Super Administrator"}
          </p>
        </div>

        {/* Pending Approval Success Screen */}
        {pendingSuccess ? (
          <div className="mt-8 space-y-6 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-[#FAF5E8]/10 border border-[#D6A84F]/40 flex items-center justify-center mx-auto text-[#D6A84F]">
              <Clock className="w-8 h-8 text-[#D6A84F] animate-pulse" />
            </div>

            <div>
              <h2 className="text-lg font-heading font-bold text-white">Access Request Submitted</h2>
              <p className="text-xs text-[#8C9BAE] mt-2 leading-relaxed">
                Your account (<span className="text-[#D6A84F] font-mono-code">{email}</span>) has been
                registered and is pending review.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-[#0E1B2C] border border-[#1E3048] text-[11px] text-[#A0B0C4] text-left leading-relaxed">
                <span className="text-[#D6A84F] font-bold block mb-0.5">Approval Policy:</span>
                The Super Admin must give you access from their dashboard before you can log in.
              </div>
            </div>

            <Link
              href="/admin/login"
              className="group relative w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#D6A84F] via-[#C99A40] to-[#B3832B] hover:brightness-110 active:scale-[0.99] transition-all duration-300 shadow-lg shadow-[#D6A84F]/20 flex items-center justify-center gap-2 cursor-pointer font-heading font-bold text-xs uppercase tracking-widest text-[#0B1522]"
            >
              <span>RETURN TO LOGIN</span>
              <ArrowRight className="w-4 h-4 text-[#0B1522] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        ) : (
          <>
            {/* Error Alert */}
            {errorMessage && (
              <div className="mt-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-mono-code uppercase text-[#8C9BAE] font-medium mb-1.5 pl-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#5D6F83] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Mercer"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#060D17] border border-[#1E2C3D] text-sm text-white placeholder-[#5D6F83] focus:outline-none focus:border-[#D6A84F] focus:ring-1 focus:ring-[#D6A84F] transition-all font-sans"
                  />
                </div>
              </div>

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
                  Password (min. 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#5D6F83] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={6}
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

              {/* Prompt: Already have an account? Log in */}
              <div className="pt-2 text-center">
                <span className="text-xs text-[#8C9BAE] font-sans">
                  Already have an account?{" "}
                  <Link
                    href="/admin/login"
                    className="text-[#D6A84F] hover:text-[#E8C068] font-semibold underline underline-offset-4 transition-colors"
                  >
                    Log in
                  </Link>
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#D6A84F] via-[#C99A40] to-[#B3832B] hover:brightness-110 active:scale-[0.99] transition-all duration-300 shadow-lg shadow-[#D6A84F]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                >
                  <span className="font-heading font-bold text-xs uppercase tracking-widest text-[#0B1522]">
                    {loading
                      ? "SUBMITTING..."
                      : isFirstAdmin
                      ? "REGISTER AS SUPER ADMIN"
                      : "REQUEST ADMIN ACCESS"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#0B1522] transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </form>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#1E2C3D]/60 text-center text-[11px] font-mono-code text-[#5D6F83]">
          Mining Discovery Operations System · Super Admin Verification
        </div>
      </div>
    </div>
  );
}
