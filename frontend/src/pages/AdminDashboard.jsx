import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { AppContext } from "../context/AppContext";
import { adminService } from "../services/api";
import { validateEmail } from "../utils/validate";

// ─── helpers ────────────────────────────────────────────────────────
function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const COLORS = ["#C4622D", "#2D6B4A", "#1A3D5C", "#E8A87C", "#8B5CF6", "#6B7280"];

// ─── sub-components ─────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5 flex items-start gap-4">
      <div className="text-2xl shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className={`text-2xl font-bold truncate ${accent || "text-[#3D2B1A]"}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {trend != null && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${trend >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    confirmed: "bg-green-100 text-green-700",
    pending:   "bg-yellow-100 text-yellow-700",
    cancelled: "bg-gray-100 text-gray-500",
    host:      "bg-purple-100 text-purple-700",
    admin:     "bg-red-100 text-red-700",
    client:    "bg-blue-100 text-blue-700",
    guest:     "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${map[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

function CustomTooltip({ active, payload, label, prefix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8D9B8] rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-[#3D2B1A] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Onboard Host Modal ──────────────────────────────────────────────
function OnboardHostModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setFormErrors(e => ({ ...e, [k]: null })); };

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const res = await adminService.onboardHost({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
      });
      toast.success(`Host "${res.user?.name}" onboarded successfully`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to onboard host");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl border border-[#E8D9B8] shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#3D2B1A]">Onboard New Host</h2>
            <p className="text-xs text-gray-400 mt-0.5">Account is created with host role — no approval needed</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: "name",  label: "Full Name",        type: "text",  placeholder: "e.g. Jane Mwangi",      required: true },
            { key: "email", label: "Email Address",    type: "email", placeholder: "e.g. jane@example.com", required: true },
            { key: "phone", label: "Phone (optional)", type: "tel",   placeholder: "e.g. +254 700 000000",  required: false },
          ].map(({ key, label, type, placeholder, required }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-[#3D2B1A] mb-1">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                required={required}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4622D] transition-colors ${formErrors[key] ? "border-red-400 bg-red-50" : "border-[#E8D9B8]"}`}
              />
              {formErrors[key] && <p className="text-red-500 text-xs mt-1">{formErrors[key]}</p>}
            </div>
          ))}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            ⚡ A temporary password will be <strong>emailed to the host</strong>. They can log in immediately and change it in Settings → Change Password.
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-[#E8D9B8] text-[#5C4230] py-2.5 rounded-xl text-sm font-medium hover:bg-[#FAF6EF] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-[#C4622D] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a8521f] disabled:opacity-50 transition-colors">
              {saving ? "Creating…" : "Create Host Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: "Manage Users",    icon: "👥", to: "/admin/users",         desc: "Block, delete, view all accounts" },
  { label: "Approvals",       icon: "✅", to: "/admin/approvals",     desc: "Review pending hosts & services" },
  { label: "Manage Careers",  icon: "💼", to: "/admin/careers",       desc: "Post, edit, and remove job openings" },
  { label: "Browse Listings", icon: "🏠", to: "/search",              desc: "See all approved listings live" },
  { label: "Countries",       icon: "🌍", to: "/admin/countries",     desc: "Manage countries, currencies & payments" },
  { label: "Categories",      icon: "🏷️",  to: "/admin/categories",    desc: "Manage experience & adventure categories" },
  { label: "Destinations",    icon: "📍", to: "/admin/destinations",  desc: "Manage featured home-page destinations" },
  { label: "Service Types",   icon: "⚙️",  to: "/admin/service-types", desc: "Manage accommodation & transport types" },
];

export default function AdminDashboard() {
  const { user } = useContext(AppContext);
  const [stats, setStats]           = useState(null);
  const [monthly, setMonthly]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showOnboard, setShowOnboard] = useState(false);

  function loadData() {
    return Promise.all([
      adminService.getStats(),
      adminService.getMonthlyStats().catch(() => []),
    ]).then(([s, m]) => {
      setStats(s);
      setMonthly(m);
    });
  }

  useEffect(() => {
    loadData()
      .catch(e => toast.error(e.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF6EF]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#C4622D] border-t-transparent" />
      </div>
    );
  }

  const u = stats?.users    || {};
  const s = stats?.services || {};
  const b = stats?.bookings || {};

  const userRolesData = [
    { name: "Guests",  value: u.guests  ?? 0 },
    { name: "Hosts",   value: u.hosts   ?? 0 },
    { name: "Clients", value: Math.max(0, (u.total ?? 0) - (u.guests ?? 0) - (u.hosts ?? 0) - 1) },
  ].filter(d => d.value > 0);

  const serviceStatusData = [
    { name: "Approved", value: s.approved ?? 0 },
    { name: "Pending",  value: s.pending  ?? 0 },
  ].filter(d => d.value > 0);

  function exportReport() {
    const rows = [
      ["AfriStay Admin Report", new Date().toLocaleDateString()],
      [],
      ["=== PLATFORM SUMMARY ==="],
      ["Total Users", u.total ?? 0],
      ["Total Hosts", u.hosts ?? 0],
      ["Pending Host Applications", u.pending_hosts ?? 0],
      ["Total Listings", s.total ?? 0],
      ["Approved Listings", s.approved ?? 0],
      ["Pending Listings", s.pending ?? 0],
      ["Total Bookings", b.total ?? 0],
      ["Confirmed Bookings", b.confirmed ?? 0],
      ["Cancelled Bookings", b.cancelled ?? 0],
      ["Platform Revenue (KES)", stats?.revenue ?? 0],
      [],
      ["=== MONTHLY TRENDS ==="],
      ["Month", "Revenue (KES)", "Bookings", "New Users"],
      ...monthly.map(m => [m.month, m.revenue, m.bookings, m.new_users]),
    ];
    downloadCSV(rows, `afristay-report-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("Report exported as CSV");
  }

  function exportUsers() {
    const rows = [
      ["Name", "Email", "Role", "Joined"],
      ...(stats?.recent_users || []).map(u => [u.name || "", u.email, u.role, fmt(u.created_at)]),
    ];
    downloadCSV(rows, `afristay-users-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("Users exported");
  }

  function exportBookings() {
    const rows = [
      ["Service", "Amount (KES)", "Status", "Date"],
      ...(stats?.recent_bookings || []).map(b => [b.service_title, b.total_price, b.status, fmt(b.created_at)]),
    ];
    downloadCSV(rows, `afristay-bookings-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("Bookings exported");
  }

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      {showOnboard && (
        <OnboardHostModal
          onClose={() => setShowOnboard(false)}
          onSuccess={() => loadData().catch(() => {})}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#3D2B1A]">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm">Welcome back, {user?.name || user?.email?.split("@")[0]}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowOnboard(true)}
              className="flex items-center gap-2 bg-[#C4622D] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a8521f] transition-colors"
            >
              👤 Onboard Host
            </button>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 bg-white border border-[#E8D9B8] text-[#3D2B1A] px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-[#C4622D] hover:text-[#C4622D] transition-colors"
            >
              ⬇ Export Report
            </button>
          </div>
        </div>

        {/* Approval alert */}
        {((u.pending_hosts ?? 0) + (s.pending ?? 0)) > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="font-semibold text-yellow-800 text-sm">
                {(u.pending_hosts ?? 0) + (s.pending ?? 0)} items awaiting approval —
                {" "}{u.pending_hosts ?? 0} host application{(u.pending_hosts ?? 0) !== 1 ? "s" : ""} ·
                {" "}{s.pending ?? 0} service{(s.pending ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <Link to="/admin/approvals"
              className="shrink-0 bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-yellow-600 transition-colors">
              Review →
            </Link>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard icon="👥" label="Total Users"      value={u.total ?? "—"}    sub={`${u.guests ?? 0} guests · ${u.hosts ?? 0} hosts`} />
          <StatCard icon="🏠" label="Total Hosts"      value={u.hosts ?? "—"}    sub={`${u.pending_hosts ?? 0} pending`} accent="text-purple-600" />
          <StatCard icon="📋" label="Listings"         value={s.total ?? "—"}    sub={`${s.approved ?? 0} approved · ${s.pending ?? 0} pending`} />
          <StatCard icon="💰" label="Platform Revenue" value={`KES ${(stats?.revenue ?? 0).toLocaleString()}`} sub="confirmed bookings" accent="text-green-600" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon="🗓️" label="Total Bookings"    value={b.total ?? "—"}      sub={`${b.confirmed ?? 0} confirmed`} />
          <StatCard icon="❌" label="Cancellations"     value={b.cancelled ?? "—"} sub="booking cancellations" />
          <StatCard icon="⏳" label="Pending Approvals" value={(u.pending_hosts ?? 0) + (s.pending ?? 0)} sub="hosts + services" accent="text-yellow-600" />
          <StatCard icon="✅" label="Approved Services" value={s.approved ?? "—"}  sub={`of ${s.total ?? 0} total`} accent="text-green-600" />
        </div>

        {/* Charts row 1 — Revenue + Bookings */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">

          {/* Revenue area chart */}
          <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#3D2B1A]">Revenue — Last 6 Months</h3>
              <span className="text-xs text-gray-400">KES</span>
            </div>
            {monthly.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C4622D" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C4622D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E8D8" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5C4230" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<CustomTooltip prefix="KES " />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#C4622D" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bookings + new users bar chart */}
          <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#3D2B1A]">Bookings & New Users — Last 6 Months</h3>
            </div>
            {monthly.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E8D8" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5C4230" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="bookings"  name="Bookings"  fill="#C4622D" radius={[3,3,0,0]} maxBarSize={28} />
                  <Bar dataKey="new_users" name="New Users" fill="#2D6B4A" radius={[3,3,0,0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Charts row 2 — Pie charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">

          {/* User roles pie */}
          <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5">
            <h3 className="font-semibold text-[#3D2B1A] mb-4">User Distribution</h3>
            {userRolesData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No users yet</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={userRolesData} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                      dataKey="value" paddingAngle={3}>
                      {userRolesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {userRolesData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-[#3D2B1A]">{d.name}</span>
                      </span>
                      <span className="font-semibold text-[#3D2B1A]">{d.value}</span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 pt-1">Total: {u.total ?? 0} users</p>
                </div>
              </div>
            )}
          </div>

          {/* Service status pie */}
          <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5">
            <h3 className="font-semibold text-[#3D2B1A] mb-4">Listings by Status</h3>
            {serviceStatusData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No listings yet</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={serviceStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                      dataKey="value" paddingAngle={3}>
                      <Cell fill="#2D6B4A" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {serviceStatusData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: i === 0 ? "#2D6B4A" : "#F59E0B" }} />
                        <span className="text-[#3D2B1A]">{d.name}</span>
                      </span>
                      <span className="font-semibold text-[#3D2B1A]">{d.value}</span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 pt-1">
                    {s.total ?? 0} total · {s.approved ?? 0 > 0 ? Math.round((s.approved / s.total) * 100) : 0}% approved
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#3D2B1A] mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_LINKS.map((link) => (
              <Link key={link.to} to={link.to}
                className="bg-white border border-[#E8D9B8] rounded-2xl p-5 hover:border-[#C4622D] hover:shadow-md transition group">
                <div className="text-3xl mb-3">{link.icon}</div>
                <p className="font-semibold text-[#3D2B1A] group-hover:text-[#C4622D] transition mb-1">{link.label}</p>
                <p className="text-xs text-gray-400">{link.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Tables */}
        <div className="grid lg:grid-cols-2 gap-8">

          {/* Recent users */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#3D2B1A]">Recent Registrations</h2>
              <div className="flex items-center gap-3">
                <button onClick={exportUsers} className="text-xs text-[#C4622D] font-medium hover:underline">⬇ Export</button>
                <Link to="/admin/users" className="text-sm text-[#C4622D] hover:underline">View all →</Link>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
              {!(stats?.recent_users?.length) ? (
                <p className="text-center text-gray-400 py-8 text-sm">No users yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[#FAF6EF] border-b border-[#E8D9B8]">
                    <tr>
                      <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold text-xs">User</th>
                      <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold text-xs">Role</th>
                      <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold text-xs hidden sm:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_users.map((u) => (
                      <tr key={u.id} className="border-b border-[#F0E8D8] last:border-0 hover:bg-[#FAF6EF]">
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#3D2B1A] text-sm">{u.name || "—"}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{fmt(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Recent bookings */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#3D2B1A]">Recent Bookings</h2>
              <button onClick={exportBookings} className="text-xs text-[#C4622D] font-medium hover:underline">⬇ Export</button>
            </div>
            <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
              {!(stats?.recent_bookings?.length) ? (
                <p className="text-center text-gray-400 py-8 text-sm">No bookings yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[#FAF6EF] border-b border-[#E8D9B8]">
                    <tr>
                      <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold text-xs">Service</th>
                      <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold text-xs">Amount</th>
                      <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_bookings.map((b) => (
                      <tr key={b.id} className="border-b border-[#F0E8D8] last:border-0 hover:bg-[#FAF6EF]">
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#3D2B1A] text-sm truncate max-w-[160px]">{b.service_title}</p>
                          <p className="text-xs text-gray-400">{fmt(b.created_at)}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#3D2B1A] text-sm">KES {Number(b.total_price).toLocaleString()}</td>
                        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
