import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { adminService } from "../services/api";

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5 flex items-start gap-4">
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 mb-0.5">{label}</p>
        <p className={`text-2xl font-bold ${accent || "text-[#3D2B1A]"}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    confirmed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-gray-100 text-gray-500",
    host: "bg-purple-100 text-purple-700",
    admin: "bg-red-100 text-red-700",
    client: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${map[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

const QUICK_LINKS = [
  { label: "Manage Users", icon: "👥", to: "/admin/users", desc: "Block, delete, view all accounts" },
  { label: "Approvals", icon: "✅", to: "/admin/approvals", desc: "Review pending hosts & services" },
  { label: "Manage Careers", icon: "💼", to: "/admin/careers", desc: "Post, edit, and remove job openings" },
  { label: "Browse Listings", icon: "🏠", to: "/search", desc: "See all approved listings live" },
];

export default function AdminDashboard() {
  const { user } = useContext(AppContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then(setStats)
      .catch((e) => toast.error(e.message || "Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF6EF]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#C4622D] border-t-transparent" />
      </div>
    );
  }

  const u = stats?.users || {};
  const s = stats?.services || {};
  const b = stats?.bookings || {};

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#3D2B1A]">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.name || user?.email?.split("@")[0]}</p>
          </div>
          <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-full text-sm font-semibold">
            👑 Administrator
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon="👥" label="Total Users" value={u.total ?? "—"} sub={`${u.guests ?? 0} guests`} />
          <StatCard icon="🏠" label="Total Hosts" value={u.hosts ?? "—"} sub={`${u.pending_hosts ?? 0} pending approval`} accent="text-purple-600" />
          <StatCard icon="📋" label="Listings" value={s.total ?? "—"} sub={`${s.approved ?? 0} approved · ${s.pending ?? 0} pending`} />
          <StatCard icon="💰" label="Platform Revenue" value={`KES ${(stats?.revenue ?? 0).toLocaleString()}`} sub="from confirmed bookings" accent="text-green-600" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon="🗓️" label="Total Bookings" value={b.total ?? "—"} sub={`${b.confirmed ?? 0} confirmed`} />
          <StatCard icon="❌" label="Cancelled" value={b.cancelled ?? "—"} sub="booking cancellations" />
          <StatCard icon="⏳" label="Pending Approvals" value={(u.pending_hosts ?? 0) + (s.pending ?? 0)} sub="hosts + services" accent="text-yellow-600" />
          <StatCard icon="✅" label="Approved Services" value={s.approved ?? "—"} sub={`of ${s.total ?? 0} total`} accent="text-green-600" />
        </div>

        {/* Quick Actions */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#3D2B1A] mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="bg-white border border-[#E8D9B8] rounded-2xl p-5 hover:border-[#C4622D] hover:shadow-md transition group"
              >
                <div className="text-3xl mb-3">{link.icon}</div>
                <p className="font-semibold text-[#3D2B1A] group-hover:text-[#C4622D] transition mb-1">{link.label}</p>
                <p className="text-xs text-gray-400">{link.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#3D2B1A]">Recent Registrations</h2>
              <Link to="/admin/users" className="text-sm text-[#C4622D] hover:underline">View all →</Link>
            </div>
            <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
              {(stats?.recent_users || []).length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No users yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[#FAF6EF] border-b border-[#E8D9B8]">
                    <tr>
                      <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold">User</th>
                      <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold">Role</th>
                      <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold hidden sm:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recent_users || []).map((u) => (
                      <tr key={u.id} className="border-b border-[#F0E8D8] last:border-0 hover:bg-[#FAF6EF]">
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#3D2B1A]">{u.name || "—"}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                        <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{fmt(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Recent Bookings */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#3D2B1A]">Recent Bookings</h2>
            </div>
            <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
              {(stats?.recent_bookings || []).length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No bookings yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[#FAF6EF] border-b border-[#E8D9B8]">
                    <tr>
                      <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold">Service</th>
                      <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold">Amount</th>
                      <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recent_bookings || []).map((b) => (
                      <tr key={b.id} className="border-b border-[#F0E8D8] last:border-0 hover:bg-[#FAF6EF]">
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#3D2B1A] truncate max-w-[160px]">{b.service_title}</p>
                          <p className="text-xs text-gray-400">{fmt(b.created_at)}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#3D2B1A]">KES {Number(b.total_price).toLocaleString()}</td>
                        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        {/* Approval alert */}
        {((u.pending_hosts ?? 0) + (s.pending ?? 0)) > 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-yellow-800">
                  {(u.pending_hosts ?? 0) + (s.pending ?? 0)} items awaiting approval
                </p>
                <p className="text-sm text-yellow-600">
                  {u.pending_hosts ?? 0} host application{(u.pending_hosts ?? 0) !== 1 ? "s" : ""} ·{" "}
                  {s.pending ?? 0} service{(s.pending ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Link
              to="/admin/approvals"
              className="flex-shrink-0 bg-yellow-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-yellow-600 transition"
            >
              Review Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
