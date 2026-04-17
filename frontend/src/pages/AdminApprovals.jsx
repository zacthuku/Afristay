import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { hostService, userService } from "../services/api";

const TABS = ["services", "hosts"];

const REJECTION_OPTIONS = [
  "Invalid contact details",
  "Insufficient documentation",
  "Suspicious or unverifiable service",
  "Other",
];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-KE", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ─── Rejection modal ─────────────────────────────────────────────────────────

function RejectModal({ title, onConfirm, onClose }) {
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");

  const reason = selected === "Other" ? custom : selected;
  const canSubmit = selected && (selected !== "Other" || custom.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl mx-4">
        <h3 className="text-lg font-semibold text-[#3D2B1A] mb-1">Reject "{title}"</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select a reason — this will be sent to the applicant in a notification email.
        </p>
        <div className="space-y-2 mb-4">
          {REJECTION_OPTIONS.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selected === opt
                  ? "border-red-300 bg-red-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="rejection_reason"
                value={opt}
                checked={selected === opt}
                onChange={() => setSelected(opt)}
                className="accent-red-500"
              />
              <span className="text-sm text-[#3D2B1A]">{opt}</span>
            </label>
          ))}
        </div>
        {selected === "Other" && (
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            rows={3}
            placeholder="Describe the reason for rejection..."
            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-red-400 resize-none mb-4"
          />
        )}
        <div className="flex justify-end gap-3 mt-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!canSubmit}
            className="rounded-xl bg-red-500 text-white px-5 py-2 text-sm font-semibold hover:bg-red-600 disabled:opacity-40"
          >
            Reject &amp; Notify
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Host detail modal ────────────────────────────────────────────────────────

function HostDetailModal({ host, onClose }) {
  const data = host.host_application_data || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#3D2B1A]">Host Application</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Applicant */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#E8D9B8] mb-4">
          <div className="w-12 h-12 rounded-full bg-[#C4622D] text-white text-lg flex items-center justify-center font-bold shrink-0">
            {(host.name || host.email || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[#3D2B1A]">{host.name || "—"}</p>
            <p className="text-sm text-gray-500">{host.email}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="divide-y divide-[#F0E8D8]">
          {[
            { label: "Company Name", value: data.company_name },
            { label: "Business Type", value: data.business_type },
            { label: "Business Email", value: data.business_email || host.email },
            { label: "Phone", value: data.phone || host.phone },
            { label: "Location", value: data.location },
            { label: "Operating Areas", value: data.operating_areas },
            { label: "Pricing Range", value: data.pricing_range },
            { label: "Doc Links", value: data.doc_links },
            { label: "Social / Website", value: data.social_links },
            { label: "Submission Date", value: formatDate(host.created_at) },
          ]
            .filter((row) => row.value)
            .map((row) => (
              <div key={row.label} className="flex justify-between py-2.5 text-sm">
                <span className="text-gray-500 shrink-0">{row.label}</span>
                <span className="font-medium text-[#3D2B1A] text-right ml-4 break-all">{row.value}</span>
              </div>
            ))}
        </div>

        {data.business_description && (
          <div className="rounded-xl bg-[#FAF6EF] p-4 mt-4">
            <p className="text-xs font-semibold text-[#3D2B1A] uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-600">{data.business_description}</p>
          </div>
        )}

        {data.services_offered && (
          <div className="rounded-xl bg-[#FAF6EF] p-4 mt-3">
            <p className="text-xs font-semibold text-[#3D2B1A] uppercase tracking-wide mb-1">Services Offered</p>
            <p className="text-sm text-gray-600">{data.services_offered}</p>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminApprovals() {
  const [activeTab, setActiveTab] = useState("services");
  const [pendingServices, setPendingServices] = useState([]);
  const [pendingHosts, setPendingHosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rejectModal, setRejectModal] = useState(null); // { type: "service"|"host", id, title }
  const [detailModal, setDetailModal] = useState(null); // host object

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [services, users] = await Promise.all([
        hostService.getPendingServices(),
        userService.listUsers(),
      ]);
      setPendingServices(services || []);
      setPendingHosts((users || []).filter((u) => u.host_application_status === "pending"));
    } catch (err) {
      toast.error(err.message || "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }

  // ── Approve ──────────────────────────────────────────────────────────────

  async function handleApproveService(serviceId) {
    try {
      await hostService.approveService(serviceId);
      setPendingServices((prev) => prev.filter((s) => s.id !== serviceId));
      toast.success("Service approved — host has been notified by email.");
    } catch (err) {
      toast.error(err.message || "Failed to approve service");
    }
  }

  async function handleApproveHost(userId) {
    try {
      await userService.approveHost(userId);
      setPendingHosts((prev) => prev.filter((u) => u.id !== userId));
      toast.success("Host application approved — applicant notified by email.");
    } catch (err) {
      toast.error(err.message || "Failed to approve host");
    }
  }

  // ── Reject ───────────────────────────────────────────────────────────────

  async function handleRejectService(serviceId, reason) {
    try {
      await hostService.rejectService(serviceId, reason);
      setPendingServices((prev) => prev.filter((s) => s.id !== serviceId));
      toast.success("Service rejected — host has been notified.");
    } catch (err) {
      toast.error(err.message || "Failed to reject service");
    } finally {
      setRejectModal(null);
    }
  }

  async function handleRejectHost(userId, reason) {
    try {
      await userService.rejectHost(userId, reason);
      setPendingHosts((prev) => prev.filter((u) => u.id !== userId));
      toast.success("Host application rejected — applicant notified.");
    } catch (err) {
      toast.error(err.message || "Failed to reject host application");
    } finally {
      setRejectModal(null);
    }
  }

  const totalPending = pendingServices.length + pendingHosts.length;

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      {rejectModal && (
        <RejectModal
          title={rejectModal.title}
          onClose={() => setRejectModal(null)}
          onConfirm={(reason) => {
            if (rejectModal.type === "service") handleRejectService(rejectModal.id, reason);
            else handleRejectHost(rejectModal.id, reason);
          }}
        />
      )}
      {detailModal && (
        <HostDetailModal host={detailModal} onClose={() => setDetailModal(null)} />
      )}

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#3D2B1A]">Approvals</h1>
            <p className="text-gray-500 text-sm mt-1">
              Review and act on pending host and service applications.
            </p>
          </div>
          {totalPending > 0 && (
            <div className="flex items-center gap-2 bg-[#C4622D]/10 text-[#C4622D] px-4 py-2 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#C4622D] animate-pulse" />
              {totalPending} pending
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E8D9B8] mb-6">
          {TABS.map((tab) => {
            const count = tab === "services" ? pendingServices.length : pendingHosts.length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold capitalize transition-colors flex items-center gap-2 ${
                  activeTab === tab
                    ? "border-b-2 border-[#C4622D] text-[#C4622D]"
                    : "text-gray-500 hover:text-[#3D2B1A]"
                }`}
              >
                {tab === "services" ? "Pending Services" : "Pending Hosts"}
                {count > 0 && (
                  <span className="bg-[#C4622D] text-white text-xs rounded-full px-2 py-0.5 leading-none">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#C4622D] border-t-transparent" />
          </div>
        ) : (
          <>
            {/* ── Pending Services ── */}
            {activeTab === "services" && (
              pendingServices.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="text-gray-400 italic">No pending services — all caught up!</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FAF6EF] border-b border-[#E8D9B8]">
                      <tr>
                        <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold">Service</th>
                        <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold">Type</th>
                        <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold hidden sm:table-cell">Price</th>
                        <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold hidden md:table-cell">Submitted</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingServices.map((service) => (
                        <tr key={service.id} className="border-b border-[#F0E8D8] last:border-0 hover:bg-[#FAF6EF]">
                          <td className="px-5 py-4">
                            <p className="font-medium text-[#3D2B1A]">{service.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {service.service_metadata?.location || service.location || "No location"}
                            </p>
                          </td>
                          <td className="px-5 py-4 capitalize text-gray-600">{service.type}</td>
                          <td className="px-5 py-4 text-gray-600 hidden sm:table-cell">
                            KES {Number(service.price_base || service.price || 0).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-gray-400 hidden md:table-cell">
                            {formatDate(service.created_at)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApproveService(service.id)}
                                className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setRejectModal({ type: "service", id: service.id, title: service.title })
                                }
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* ── Pending Hosts ── */}
            {activeTab === "hosts" && (
              pendingHosts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="text-gray-400 italic">No pending host applications — all caught up!</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FAF6EF] border-b border-[#E8D9B8]">
                      <tr>
                        <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold">Applicant</th>
                        <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold hidden sm:table-cell">Business Type</th>
                        <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold hidden md:table-cell">Email</th>
                        <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold hidden lg:table-cell">Applied</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingHosts.map((host) => {
                        const appData = host.host_application_data || {};
                        return (
                          <tr key={host.id} className="border-b border-[#F0E8D8] last:border-0 hover:bg-[#FAF6EF]">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#C4622D] text-white text-sm flex items-center justify-center font-bold shrink-0">
                                  {(host.name || host.email || "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-[#3D2B1A]">{host.name || "—"}</p>
                                  {appData.company_name && (
                                    <p className="text-xs text-gray-400 truncate">{appData.company_name}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-gray-600 capitalize hidden sm:table-cell">
                              {appData.business_type || "—"}
                            </td>
                            <td className="px-5 py-4 text-gray-600 hidden md:table-cell">{host.email}</td>
                            <td className="px-5 py-4 text-gray-400 hidden lg:table-cell">
                              {formatDate(host.created_at)}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setDetailModal(host)}
                                  className="px-3 py-1.5 rounded-lg bg-[#FAF6EF] text-[#C4622D] border border-[#E8D9B8] text-xs font-semibold hover:bg-[#FFF5EE] transition-colors"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleApproveHost(host.id)}
                                  className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    setRejectModal({ type: "host", id: host.id, title: host.name || host.email })
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
