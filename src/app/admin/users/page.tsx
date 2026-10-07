"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Trash2,
  RefreshCw,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Lock,
} from "lucide-react";
import { AdminRole, AdminStatus } from "@/models/admin.model";

interface AdminUserItem {
  _id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  approvedBy?: string;
  approvedAt?: string;
  lastLogin?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<{ role: string; id: string } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch current user role
      const meRes = await fetch("/api/admin/auth/me");
      const meJson = await meRes.json();
      if (meJson.success && meJson.data) {
        setCurrentAdmin(meJson.data);
      }

      // 2. Fetch admins list
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (json.success) {
        setAdmins(json.data || []);
      } else {
        showToast(json.message || "Failed to load admin users", "error");
      }
    } catch {
      showToast("Error loading admin accounts", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Grant Access / Approve
  const handleApprove = async (id: string, name: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      const json = await res.json();

      if (json.success) {
        showToast(`Access granted to ${name}! They can now log in.`);
        setAdmins((prev) =>
          prev.map((a) => (a._id === id ? { ...a, status: "approved" } : a))
        );
      } else {
        showToast(json.message || "Failed to approve", "error");
      }
    } catch {
      showToast("Error approving user", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject Request
  const handleReject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to decline admin access for "${name}"?`)) {
      return;
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      const json = await res.json();

      if (json.success) {
        showToast(`Access declined for ${name}`);
        setAdmins((prev) =>
          prev.map((a) => (a._id === id ? { ...a, status: "rejected" } : a))
        );
      } else {
        showToast(json.message || "Failed to decline", "error");
      }
    } catch {
      showToast("Error rejecting user", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // Delete Admin
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete account for "${name}"? This cannot be undone.`)) {
      return;
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = await res.json();

      if (json.success) {
        showToast(`Account for ${name} removed`);
        setAdmins((prev) => prev.filter((a) => a._id !== id));
      } else {
        showToast(json.message || "Failed to delete account", "error");
      }
    } catch {
      showToast("Error deleting account", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingRequests = admins.filter((a) => a.status === "pending");
  const approvedAdmins = admins.filter((a) => a.status === "approved");
  const rejectedAdmins = admins.filter((a) => a.status === "rejected");

  if (!loading && currentAdmin && currentAdmin.role !== "superadmin") {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-heading font-bold text-[#0E1B28]">Super Admin Restricted</h2>
        <p className="text-xs text-[#57595E] mt-2 leading-relaxed">
          Only the Super Administrator can grant portal access and approve newly registered administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-medium transition-all ${
            notification.type === "success"
              ? "bg-[#064E3B] text-emerald-100 border-emerald-400"
              : "bg-[#7F1D1D] text-rose-100 border-rose-400"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2DDD1]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAE4D5] border border-[#DDD4C1] text-[11px] font-mono-code font-semibold uppercase tracking-wider text-[#8C651E]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B8860B]" />
            <span>Super Administrator Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-[#0E1B28] tracking-tight mt-2">
            Admin Requests & Access Management
          </h1>
          <p className="text-xs sm:text-sm text-[#57595E] mt-1 font-sans">
            Review registration requests and grant portal permissions to new administrators.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#F2ECE0] border border-[#DDD6C8] text-xs font-heading font-medium text-[#1E2B3A] transition-all shadow-xs active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#B8860B] ${loading ? "animate-spin" : ""}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* SECTION 1: PENDING ACCESS REQUESTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-heading font-bold text-[#0E1B28]">
              Pending Access Requests
            </h2>
            <span
              className={`text-xs font-mono-code font-bold px-2.5 py-0.5 rounded-full ${
                pendingRequests.length > 0
                  ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                  : "bg-[#EAE4D5] text-[#57595E]"
              }`}
            >
              {pendingRequests.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 bg-white rounded-2xl border border-[#E5DFD3] flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#B8860B] animate-spin" />
            <span className="text-xs font-heading text-[#57595E]">Loading access requests...</span>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-[#E5DFD3] text-center shadow-xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF5E8] text-[#B8860B] flex items-center justify-center mx-auto mb-2 border border-[#E8DFC9]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-heading font-bold text-[#0E1B28]">No Pending Requests</h3>
            <p className="text-xs text-[#57595E] mt-1">
              All admin registrations have been reviewed. When someone registers as admin, they will appear here for your approval.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req._id}
                className="p-5 rounded-2xl bg-white border border-[#E8DFC9] shadow-[0_2px_12px_-2px_rgba(20,30,45,0.04)] flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FAF5E8] flex items-center justify-center text-[#B8860B] font-bold text-sm border border-[#E8DFC9]">
                        {req.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-heading font-bold text-base text-[#0E1B28]">
                          {req.name}
                        </div>
                        <div className="text-xs font-mono-code text-[#717885] flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-[#8A909A]" />
                          <span>{req.email}</span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      <Clock className="w-3 h-3 text-[#D97706]" />
                      WAITING
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EAE4D7] text-xs text-[#57595E] flex items-center justify-between font-mono-code text-[11px]">
                    <span>Requested: {formatDate(req.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    disabled={processingId === req._id}
                    onClick={() => handleApprove(req._id, req.name)}
                    className="flex-1 py-2.5 px-4 rounded-full bg-gradient-to-r from-[#D6A84F] to-[#C2933A] hover:brightness-105 text-[#09111C] font-heading font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4 text-[#09111C]" />
                    <span>{processingId === req._id ? "Approving..." : "Grant Access"}</span>
                  </button>

                  <button
                    disabled={processingId === req._id}
                    onClick={() => handleReject(req._id, req.name)}
                    className="py-2.5 px-4 rounded-full bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-heading font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: AUTHORIZED ADMINISTRATORS */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold text-[#0E1B28]">
            Authorized Administrators ({approvedAdmins.length})
          </h2>
        </div>

        <div className="rounded-2xl bg-white border border-[#E5DFD3] overflow-hidden shadow-[0_2px_16px_-4px_rgba(20,30,45,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE4D7] bg-[#F9F7F1] text-[11px] font-mono-code text-[#6E7582] uppercase tracking-wider">
                  <th className="py-3.5 px-6">Admin Profile</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Authorized By</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE0] text-sm">
                {approvedAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-[#FAF8F3] transition-colors">
                    {/* Admin Profile */}
                    <td className="py-4 px-6 min-w-[200px]">
                      <div className="font-heading font-bold text-[#0E1B28] flex items-center gap-2">
                        <span>{admin.name}</span>
                        {admin.role === "superadmin" && (
                          <span title="Super Administrator">
                            <ShieldCheck className="w-4 h-4 text-[#B8860B]" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono-code text-[#717885] mt-0.5">
                        {admin.email}
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {admin.role === "superadmin" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-code font-bold bg-[#FAF5E8] text-[#8C651E] border border-[#E8DFC9]">
                          SUPER ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-mono-code font-medium bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                          ADMIN
                        </span>
                      )}
                    </td>

                    {/* Authorized By */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs font-mono-code text-[#57595E]">
                      {admin.approvedBy || "System Bootstrap"}
                    </td>

                    {/* Last Login */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs font-mono-code text-[#717885]">
                      {formatDate(admin.lastLogin)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      {admin.role !== "superadmin" ? (
                        <button
                          onClick={() => handleDelete(admin._id, admin.name)}
                          disabled={processingId === admin._id}
                          title="Revoke and Delete Access"
                          className="p-1.5 rounded-lg text-[#6E7582] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono-code text-[#94A3B8]">Primary</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 3: REJECTED / DECLINED REQUESTS */}
      {rejectedAdmins.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-heading font-bold text-[#6E7582]">
            Declined Requests ({rejectedAdmins.length})
          </h3>
          <div className="rounded-xl bg-white border border-[#E5DFD3] p-4 divide-y divide-[#EFEAE0]">
            {rejectedAdmins.map((item) => (
              <div key={item._id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#0E1B28]">{item.name}</span>
                  <span className="text-[#717885] font-mono-code ml-2">({item.email})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    DECLINED
                  </span>
                  <button
                    onClick={() => handleApprove(item._id, item.name)}
                    className="text-[#B8860B] hover:underline font-heading font-semibold text-[11px]"
                  >
                    Re-authorize
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
