"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  Inbox,
  Search,
  RefreshCw,
  Download,
  Trash2,
  Clock,
  Mail,
  Phone,
  User,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  X,
  FileText,
  Calendar,
  Save,
  Sparkles,
} from "lucide-react";
import { ContactStatus } from "@/models/contact.model";

interface ContactItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: ContactStatus;
  adminNotes?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

interface StatsData {
  total: number;
  new: number;
  read: number;
  contacted: number;
  archived: number;
  receivedThisWeek: number;
}

export default function AdminInquiriesPage() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    new: 0,
    read: 0,
    contacted: 0,
    archived: 0,
    receivedThisWeek: 0,
  });

  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();
  const [activeStatus, setActiveStatus] = useState<ContactStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Inquiry for Modal view
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalStatus, setModalStatus] = useState<ContactStatus>("new");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/contacts/stats");
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  // Fetch Inquiries
  const fetchContacts = useCallback(
    async (page = 1, status = activeStatus, search = searchQuery) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "15",
        });

        if (status !== "all") params.append("status", status);
        if (search.trim()) params.append("search", search.trim());

        const res = await fetch(`/api/contacts?${params.toString()}`);
        const json = await res.json();

        if (json.success) {
          setContacts(json.data || []);
          if (json.pagination) {
            setTotalPages(json.pagination.totalPages || 1);
            setTotalCount(json.pagination.total || 0);
            setCurrentPage(json.pagination.page || 1);
          }
        }
      } catch (err) {
        console.error("Error fetching contacts:", err);
        showToast("Failed to load inquiries", "error");
      } finally {
        setLoading(false);
      }
    },
    [activeStatus, searchQuery]
  );

  useEffect(() => {
    fetchStats();
    fetchContacts(1, activeStatus, searchQuery);
  }, [fetchStats, fetchContacts, activeStatus]);

  // Handle Search Input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    startTransition(() => {
      fetchContacts(1, activeStatus, val);
    });
  };

  // Status Filter Change
  const handleStatusFilterChange = (status: ContactStatus | "all") => {
    setActiveStatus(status);
    setCurrentPage(1);
    fetchContacts(1, status, searchQuery);
  };

  // Open Modal Details
  const handleOpenDetail = async (contact: ContactItem) => {
    setSelectedContact(contact);
    setModalNotes(contact.adminNotes || "");
    setModalStatus(contact.status);

    try {
      const res = await fetch(`/api/contacts/${contact._id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedContact(json.data);
        setModalStatus(json.data.status);
        setContacts((prev) =>
          prev.map((c) => (c._id === contact._id ? { ...c, status: json.data.status } : c))
        );
        fetchStats();
      }
    } catch (err) {
      console.warn("Could not fetch detailed inquiry:", err);
    }
  };

  // Save Status & Admin Notes from Modal
  const handleSaveModal = async () => {
    if (!selectedContact) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/contacts/${selectedContact._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: modalStatus,
          adminNotes: modalNotes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("Inquiry updated successfully");
        setContacts((prev) =>
          prev.map((c) =>
            c._id === selectedContact._id
              ? { ...c, status: modalStatus, adminNotes: modalNotes }
              : c
          )
        );
        setSelectedContact((prev) =>
          prev ? { ...prev, status: modalStatus, adminNotes: modalNotes } : null
        );
        fetchStats();
      } else {
        showToast(json.message || "Failed to update inquiry", "error");
      }
    } catch {
      showToast("Error updating inquiry", "error");
    } finally {
      setSavingNotes(false);
    }
  };

  // Delete Inquiry
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the inquiry from "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Inquiry deleted");
        setContacts((prev) => prev.filter((c) => c._id !== id));
        if (selectedContact?._id === id) {
          setSelectedContact(null);
        }
        fetchStats();
      } else {
        showToast(json.message || "Failed to delete", "error");
      }
    } catch {
      showToast("Error deleting inquiry", "error");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (contacts.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    const headers = ["ID", "Name", "Email", "Phone", "Status", "Date", "Message", "Admin Notes"];
    const rows = contacts.map((c) => [
      c._id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${(c.phone || "").replace(/"/g, '""')}"`,
      c.status,
      new Date(c.createdAt).toISOString(),
      `"${c.message.replace(/"/g, '""')}"`,
      `"${(c.adminNotes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mining_discovery_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported CSV successfully");
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: ContactStatus) => {
    switch (status) {
      case "new":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-code font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse"></span>
            NEW
          </span>
        );
      case "read":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-mono-code font-medium bg-[#EFF6FF] text-[#1E40AF] border border-[#DBEAFE]">
            READ
          </span>
        );
      case "contacted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-code font-medium bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            CONTACTED
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-mono-code text-[#6B7280] bg-[#F3F4F6] border border-[#E5E7EB]">
            ARCHIVED
          </span>
        );
    }
  };

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

      {/* Header Bar Matching Main Website */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2DDD1]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAE4D5] border border-[#DDD4C1] text-[11px] font-mono-code font-semibold uppercase tracking-wider text-[#8C651E]">
            <Sparkles className="w-3 h-3 text-[#B8860B]" />
            <span>Operations & Partner Inquiries</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-[#0E1B28] tracking-tight mt-2">
            Client & Investor Leads
          </h1>
          <p className="text-xs sm:text-sm text-[#57595E] mt-1 font-sans">
            Review and respond to submissions from the Mining Discovery contact portal.
          </p>
        </div>

        {/* Action Buttons styled like Image 3 "GET IN TOUCH" */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchStats();
              fetchContacts(currentPage, activeStatus, searchQuery);
              showToast("Inquiries refreshed");
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#F2ECE0] border border-[#DDD6C8] text-xs font-heading font-medium text-[#1E2B3A] transition-all shadow-xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B8860B] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D6A84F] to-[#C2933A] hover:brightness-105 text-[#09111C] font-heading font-semibold text-xs transition-all shadow-sm shadow-[#D6A84F]/20 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-[#09111C]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (Porcelain Cards matching Image 3) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inquiries */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5DFD3] shadow-[0_2px_12px_-2px_rgba(20,30,45,0.04)] hover:border-[#D6A84F]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-code uppercase text-[#7C838D] tracking-wider font-medium">
              Total Inquiries
            </span>
            <div className="p-2 rounded-lg bg-[#FAF6ED] text-[#B8860B]">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-heading font-bold text-[#0E1B28] font-mono-code">
            {stats.total}
          </div>
          <div className="text-[11px] text-[#7C838D] mt-1">Lifetime incoming leads</div>
        </div>

        {/* Needs Follow-Up */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5DFD3] shadow-[0_2px_12px_-2px_rgba(20,30,45,0.04)] hover:border-[#D6A84F]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-code uppercase text-[#7C838D] tracking-wider font-medium">
              Needs Follow-Up
            </span>
            <div className="p-2 rounded-lg bg-[#FAF6ED] text-[#B8860B]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-heading font-bold text-[#0E1B28] font-mono-code flex items-center gap-2">
            <span>{stats.new}</span>
            {stats.new > 0 && (
              <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] font-bold border border-[#FDE68A]">
                Action Required
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#7C838D] mt-1">Unread / pending response</div>
        </div>

        {/* Contacted */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5DFD3] shadow-[0_2px_12px_-2px_rgba(20,30,45,0.04)] hover:border-[#D6A84F]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-code uppercase text-[#7C838D] tracking-wider font-medium">
              Contacted
            </span>
            <div className="p-2 rounded-lg bg-[#ECFDF5] text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-heading font-bold text-[#0E1B28] font-mono-code">
            {stats.contacted}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">Successfully engaged</div>
        </div>

        {/* This Week */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5DFD3] shadow-[0_2px_12px_-2px_rgba(20,30,45,0.04)] hover:border-[#D6A84F]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-code uppercase text-[#7C838D] tracking-wider font-medium">
              This Week
            </span>
            <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-heading font-bold text-[#0E1B28] font-mono-code">
            {stats.receivedThisWeek}
          </div>
          <div className="text-[11px] text-[#7C838D] mt-1">Last 7 days activity</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar (Pill style matching Image 3 Nav Capsule) */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-[0_2px_12px_-2px_rgba(20,30,45,0.03)] flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Status Filter Tabs (Capsule layout) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Inquiries", count: stats.total },
            { id: "new", label: "New", count: stats.new, highlight: true },
            { id: "read", label: "Read", count: stats.read },
            { id: "contacted", label: "Contacted", count: stats.contacted },
            { id: "archived", label: "Archived", count: stats.archived },
          ].map((tab) => {
            const isSelected = activeStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleStatusFilterChange(tab.id as ContactStatus | "all")}
                className={`px-4 py-2 rounded-full text-xs font-heading font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#0E1B28] text-white font-semibold shadow-xs"
                    : "text-[#57595E] hover:text-[#0E1B28] hover:bg-[#F4F0E8]"
                }`}
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D6A84F]"></span>}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono-code px-2 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-white/20 text-white font-bold"
                      : tab.highlight && tab.count > 0
                      ? "bg-[#FEF3C7] text-[#92400E] font-bold"
                      : "bg-[#EAE4D5] text-[#57595E]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8A909A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search name, email, phone..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-[#F8F6F0] border border-[#DDD6C8] text-xs text-[#0E1B28] placeholder-[#8A909A] focus:outline-none focus:border-[#D6A84F] focus:bg-white focus:ring-1 focus:ring-[#D6A84F] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                fetchContacts(1, activeStatus, "");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A909A] hover:text-[#0E1B28]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Inquiries Table Container */}
      <div className="rounded-2xl bg-white border border-[#E5DFD3] overflow-hidden shadow-[0_2px_16px_-4px_rgba(20,30,45,0.05)]">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-[#B8860B] animate-spin" />
            <div className="text-sm font-heading text-[#57595E]">Loading inquiries from Atlas...</div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAF5E8] text-[#B8860B] flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-heading font-semibold text-[#0E1B28]">No inquiries found</h3>
            <p className="text-xs text-[#57595E] max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No matching records found for "${searchQuery}".`
                : activeStatus !== "all"
                ? `There are no inquiries marked as "${activeStatus}" at this moment.`
                : "Your database doesn't have any contact inquiries yet. Submissions from the website will appear here in real-time."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE4D7] bg-[#F9F7F1] text-[11px] font-mono-code text-[#6E7582] uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Status</th>
                  <th className="py-3.5 px-4">Visitor / Contact</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Message Preview</th>
                  <th className="py-3.5 px-4 text-right">Received</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE0] text-sm">
                {contacts.map((contact) => (
                  <tr
                    key={contact._id}
                    className="hover:bg-[#FAF8F3] transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetail(contact)}
                  >
                    {/* Status Badge */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      {getStatusBadge(contact.status)}
                    </td>

                    {/* Visitor Info */}
                    <td className="py-4 px-4 min-w-[200px]">
                      <div className="font-heading font-bold text-[#0E1B28] group-hover:text-[#B8860B] transition-colors flex items-center gap-2">
                        <span>{contact.name}</span>
                        {contact.adminNotes && (
                          <span
                            title="Has internal notes"
                            className="w-1.5 h-1.5 rounded-full bg-[#B8860B]"
                          ></span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-[#57595E] mt-1 font-mono-code">
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-[#0E1B28] flex items-center gap-1 text-[11px]"
                        >
                          <Mail className="w-3 h-3 text-[#8A909A]" />
                          <span>{contact.email}</span>
                        </a>
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-[#0E1B28] flex items-center gap-1 text-[11px]"
                          >
                            <Phone className="w-3 h-3 text-[#8A909A]" />
                            <span>{contact.phone}</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Message Preview */}
                    <td className="py-4 px-4 hidden md:table-cell max-w-md">
                      <p className="text-xs text-[#57595E] line-clamp-2 leading-relaxed">
                        {contact.message}
                      </p>
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="text-xs font-mono-code text-[#717885]">
                        {formatDate(contact.createdAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-4 px-4 sm:px-6 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(contact)}
                          title="View Full Detail"
                          className="p-1.5 rounded-lg text-[#6E7582] hover:text-[#0E1B28] hover:bg-[#EAE4D5] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact._id, contact.name)}
                          title="Delete Inquiry"
                          className="p-1.5 rounded-lg text-[#6E7582] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {contacts.length > 0 && (
          <div className="p-4 border-t border-[#EAE4D7] bg-[#F9F7F1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6E7582]">
            <div className="font-mono-code">
              Showing page <span className="text-[#0E1B28] font-bold">{currentPage}</span> of{" "}
              <span className="text-[#0E1B28] font-bold">{totalPages}</span> ({totalCount} total inquiries)
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1 || loading}
                onClick={() => fetchContacts(currentPage - 1, activeStatus, searchQuery)}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#EAE4D5] border border-[#DDD6C8] text-[#0E1B28] font-medium disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages || loading}
                onClick={() => fetchContacts(currentPage + 1, activeStatus, searchQuery)}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#EAE4D5] border border-[#DDD6C8] text-[#0E1B28] font-medium disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white border border-[#DDD6C8] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAE4D7] bg-[#F9F7F1] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FAF5E8] flex items-center justify-center text-[#B8860B] border border-[#E8DFC9]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-[#0E1B28] flex items-center gap-2">
                    <span>{selectedContact.name}</span>
                    {getStatusBadge(modalStatus)}
                  </h3>
                  <div className="text-xs font-mono-code text-[#717885]">
                    Lead ID: {selectedContact._id}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedContact(null)}
                className="p-1.5 rounded-lg text-[#6E7582] hover:text-[#0E1B28] hover:bg-[#EAE4D5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm bg-white">
              {/* Contact Information Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-[#FAF8F3] border border-[#EAE4D7] text-xs">
                <div>
                  <div className="text-[10px] uppercase font-mono-code text-[#717885] font-semibold">Email Address</div>
                  <a
                    href={`mailto:${selectedContact.email}`}
                    className="text-[#B8860B] hover:underline font-medium flex items-center gap-1.5 mt-0.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{selectedContact.email}</span>
                  </a>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-mono-code text-[#717885] font-semibold">Phone Number</div>
                  <div className="text-[#0E1B28] font-medium flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-[#717885]" />
                    <span>{selectedContact.phone || "Not provided"}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-mono-code text-[#717885] font-semibold">Date Received</div>
                  <div className="text-[#0E1B28] font-mono-code mt-0.5">
                    {formatDate(selectedContact.createdAt)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-mono-code text-[#717885] font-semibold">Origin IP Address</div>
                  <div className="text-[#57595E] font-mono-code mt-0.5 truncate">
                    {selectedContact.ipAddress || "Direct Website"}
                  </div>
                </div>
              </div>

              {/* Inquiry Message */}
              <div>
                <label className="text-xs uppercase font-mono-code font-bold tracking-wider text-[#0E1B28] flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-[#B8860B]" />
                  <span>Submitted Message</span>
                </label>
                <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#EAE4D7] text-sm text-[#111D2A] leading-relaxed whitespace-pre-wrap">
                  {selectedContact.message}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-xs uppercase font-mono-code font-bold tracking-wider text-[#0E1B28] block mb-2">
                  Update Lead Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["new", "read", "contacted", "archived"] as ContactStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalStatus(st)}
                      className={`py-2 px-3 rounded-full text-xs font-mono-code uppercase font-semibold border transition-all ${
                        modalStatus === st
                          ? "bg-[#0E1B28] text-white border-[#0E1B28] shadow-xs"
                          : "bg-white text-[#57595E] border-[#DDD6C8] hover:bg-[#F4F0E8] hover:text-[#0E1B28]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div>
                <label className="text-xs uppercase font-mono-code font-bold tracking-wider text-[#0E1B28] block mb-2">
                  Internal Operations Notes
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Record follow-up logs, notes, partner conversations..."
                  className="w-full p-3.5 rounded-xl bg-[#FAF8F3] border border-[#DDD6C8] text-xs text-[#0E1B28] placeholder-[#8A909A] focus:outline-none focus:border-[#D6A84F] focus:bg-white focus:ring-1 focus:ring-[#D6A84F] transition-all resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#EAE4D7] bg-[#F9F7F1] flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href={`mailto:${selectedContact.email}?subject=${encodeURIComponent(
                  `Re: Website Inquiry - Mining Discovery`
                )}`}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-white hover:bg-[#EAE4D5] text-xs font-heading font-medium text-[#0E1B28] flex items-center justify-center gap-2 border border-[#DDD6C8] transition-all shadow-2xs"
              >
                <span>Reply via Email Client</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#B8860B]" />
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="px-4 py-2 rounded-full text-xs font-heading text-[#57595E] hover:text-[#0E1B28] hover:bg-[#EAE4D5] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveModal}
                  disabled={savingNotes}
                  className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#D6A84F] to-[#C2933A] text-[#09111C] font-heading font-bold text-xs hover:brightness-105 transition-all shadow-xs active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-[#09111C]" />
                  <span>{savingNotes ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
