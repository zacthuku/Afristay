import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { AppContext } from "../context/AppContext";
import { hostService, reviewService } from "../services/api";

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

// Build last-6-months data from bookings
function buildMonthly(bookings) {
  const today = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleString("default", { month: "short" });

    const monthBookings = bookings.filter(b => {
      const bd = new Date(b.start_time);
      return bd.getFullYear() === year && bd.getMonth() === month;
    });

    const revenue = monthBookings
      .filter(b => b.status === "confirmed")
      .reduce((s, b) => s + Number(b.total_price), 0);

    return { label, revenue, bookings: monthBookings.length };
  });
}

const STATUS_STYLE = {
  approved:  "bg-green-100 text-green-700",
  pending:   "bg-yellow-100 text-yellow-700",
  rejected:  "bg-red-100 text-red-600",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const PIE_COLORS = ["#2D6B4A", "#C4622D", "#6B7280", "#F59E0B"];

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent || "text-[#3D2B1A]"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Stars({ rating }) {
  return (
    <span className="text-yellow-400 text-sm">
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8D9B8] rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-[#3D2B1A] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: {p.name === "Revenue" ? `KES ${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useContext(AppContext);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      hostService.getMyServices(),
      hostService.getHostBookings(),
      reviewService.getHostReviews(),
    ])
      .then(([s, b, r]) => {
        setServices(s || []);
        setBookings(b || []);
        setReviews(r || []);
      })
      .catch(e => toast.error(e.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF6EF]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#C4622D] border-t-transparent" />
      </div>
    );
  }

  // Stats
  const approved  = services.filter(s => s.approval_status === "approved").length;
  const pending   = services.filter(s => s.approval_status === "pending").length;
  const confirmed = bookings.filter(b => b.status === "confirmed").length;
  const cancelled = bookings.filter(b => b.status === "cancelled").length;
  const revenue   = bookings.filter(b => b.status === "confirmed").reduce((s, b) => s + Number(b.total_price), 0);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const upcoming = [...bookings]
    .filter(b => b.status === "confirmed" && new Date(b.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 5);

  const recent = [...bookings]
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
    .slice(0, 8);

  const monthly = buildMonthly(bookings);

  const bookingStatusData = [
    { name: "Confirmed", value: confirmed },
    { name: "Pending",   value: bookings.filter(b => b.status === "pending").length },
    { name: "Cancelled", value: cancelled },
  ].filter(d => d.value > 0);

  function bookingCount(sid) { return bookings.filter(b => b.service_id === sid && b.status === "confirmed").length; }
  function serviceRevenue(sid) { return bookings.filter(b => b.service_id === sid && b.status === "confirmed").reduce((s, b) => s + Number(b.total_price), 0); }

  function exportBookings() {
    const rows = [
      ["Host Report", new Date().toLocaleDateString()],
      ["Host", user?.name || user?.email],
      [],
      ["Guest", "Service", "Check-in", "Check-out", "Total (KES)", "Status"],
      ...bookings.map(b => [b.guest_name || "Guest", b.service_title || "—", fmt(b.start_time), fmt(b.end_time), b.total_price, b.status]),
    ];
    downloadCSV(rows, `host-bookings-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("Bookings exported as CSV");
  }

  function exportListings() {
    const rows = [
      ["Title", "Status", "Bookings", "Revenue (KES)"],
      ...services.map(s => [s.title, s.approval_status, bookingCount(s.id), serviceRevenue(s.id)]),
    ];
    downloadCSV(rows, `host-listings-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("Listings exported as CSV");
  }

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#3D2B1A]">Host Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm">Welcome back, {user?.name || user?.email?.split("@")[0]}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={exportBookings}
              className="flex items-center gap-2 bg-white border border-[#E8D9B8] text-[#3D2B1A] px-4 py-2.5 rounded-xl text-sm font-semibold hover:border-[#C4622D] hover:text-[#C4622D] transition-colors">
              ⬇ Export Bookings
            </button>
            <Link to="/host"
              className="bg-[#C4622D] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#a8521f] transition-colors">
              + Add Listing
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Listings"    value={services.length} sub={`${approved} approved · ${pending} pending`} />
          <StatCard label="Total Bookings"    value={bookings.length} sub={`${confirmed} confirmed`} />
          <StatCard label="Revenue"           value={`KES ${revenue.toLocaleString()}`} sub="confirmed only" accent="text-green-600" />
          <StatCard label="Avg. Rating"       value={avgRating ? `${avgRating} ★` : "—"} sub={`${reviews.length} review${reviews.length !== 1 ? "s" : ""}`} accent="text-yellow-500" />
          <StatCard label="Upcoming Check-ins" value={upcoming.length} sub="confirmed future stays" />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">

          {/* Revenue + bookings bar chart */}
          <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5">
            <h3 className="font-semibold text-[#3D2B1A] mb-4">Revenue & Bookings — Last 6 Months</h3>
            {bookings.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No bookings yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E8D8" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5C4230" }} />
                  <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <YAxis yAxisId="bkg" orientation="right" tick={{ fontSize: 10, fill: "#9CA3AF" }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="rev" dataKey="revenue"  name="Revenue"  fill="#C4622D" radius={[3,3,0,0]} maxBarSize={28} />
                  <Bar yAxisId="bkg" dataKey="bookings" name="Bookings" fill="#2D6B4A" radius={[3,3,0,0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Booking status pie + upcoming */}
          <div className="grid grid-rows-2 gap-4">

            {/* Booking status donut */}
            <div className="bg-white rounded-2xl border border-[#E8D9B8] p-4">
              <h3 className="font-semibold text-[#3D2B1A] mb-2 text-sm">Booking Status</h3>
              {bookingStatusData.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-4">No bookings yet</p>
              ) : (
                <div className="flex items-center gap-3">
                  <ResponsiveContainer width="45%" height={90}>
                    <PieChart>
                      <Pie data={bookingStatusData} cx="50%" cy="50%" innerRadius={25} outerRadius={42}
                        dataKey="value" paddingAngle={3}>
                        {bookingStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1">
                    {bookingStatusData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                          {d.name}
                        </span>
                        <span className="font-semibold text-[#3D2B1A]">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upcoming check-ins */}
            <div className="bg-white rounded-2xl border border-[#E8D9B8] p-4">
              <h3 className="font-semibold text-[#3D2B1A] mb-2 text-sm">Upcoming Check-ins</h3>
              {upcoming.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No upcoming confirmed bookings</p>
              ) : (
                <div className="space-y-1.5 overflow-y-auto max-h-[90px]">
                  {upcoming.map((b) => (
                    <div key={b.id} className="flex items-center justify-between">
                      <p className="text-xs text-[#3D2B1A] truncate max-w-[55%]">{b.service_title || "—"}</p>
                      <p className="text-xs font-semibold text-[#C4622D] shrink-0">{fmt(b.start_time)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listings */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#3D2B1A]">My Listings</h2>
            {services.length > 0 && (
              <button onClick={exportListings} className="text-xs text-[#C4622D] font-medium hover:underline">⬇ Export</button>
            )}
          </div>
          {services.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8D9B8] p-10 text-center">
              <p className="text-gray-400 mb-4">No listings yet.</p>
              <Link to="/host" className="bg-[#C4622D] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#a8521f] transition-colors">
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services.map((svc) => {
                const meta  = svc.service_metadata || {};
                const img   = meta.images?.[0];
                const count = bookingCount(svc.id);
                const rev   = serviceRevenue(svc.id);
                return (
                  <div key={svc.id} className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
                    <div className="h-28 bg-gray-100 relative">
                      {img
                        ? <img src={img} alt={svc.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
                      }
                      <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[svc.approval_status] || "bg-gray-100 text-gray-500"}`}>
                        {svc.approval_status}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-[#3D2B1A] text-sm truncate mb-0.5">{svc.title}</p>
                      {meta.location && <p className="text-[10px] text-gray-400 mb-2">📍 {meta.location}</p>}
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>{count} booking{count !== 1 ? "s" : ""}</span>
                        <span className="font-semibold text-green-600">KES {rev.toLocaleString()}</span>
                      </div>
                      {svc.approval_status === "approved" && (
                        <Link to={`/listing/${svc.id}`} className="text-xs text-[#C4622D] font-medium hover:underline">View listing →</Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent bookings + reviews */}
        <div className="grid lg:grid-cols-2 gap-8">

          <section>
            <h2 className="text-xl font-bold text-[#3D2B1A] mb-4">Recent Bookings</h2>
            {recent.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8D9B8] p-8 text-center">
                <p className="text-gray-400 text-sm">No bookings yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FAF6EF] border-b border-[#E8D9B8]">
                      <tr>
                        <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold text-xs">Guest</th>
                        <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold text-xs hidden sm:table-cell">Service</th>
                        <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold text-xs">Check-in</th>
                        <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold text-xs">Total</th>
                        <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((b) => (
                        <tr key={b.id} className="border-b border-[#F0E8D8] last:border-0 hover:bg-[#FAF6EF]">
                          <td className="px-4 py-2.5 text-gray-700 text-sm">{b.guest_name || "Guest"}</td>
                          <td className="px-4 py-2.5 font-medium text-[#3D2B1A] text-sm hidden sm:table-cell truncate max-w-[110px]">{b.service_title || "—"}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-sm">{fmt(b.start_time)}</td>
                          <td className="px-4 py-2.5 font-semibold text-[#3D2B1A] text-sm">KES {Number(b.total_price).toLocaleString()}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[b.status] || "bg-gray-100 text-gray-500"}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#3D2B1A]">Guest Reviews</h2>
              {avgRating && <span className="text-sm text-gray-500">{avgRating} ★ avg</span>}
            </div>
            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8D9B8] p-8 text-center">
                <p className="text-gray-400 text-sm">No reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-[#E8D9B8] p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-[#3D2B1A] text-sm">{r.user_name}</span>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{r.service_title} · {fmt(r.created_at)}</p>
                    {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Pending approval notice */}
        {pending > 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-center gap-4">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-yellow-800">{pending} listing{pending !== 1 ? "s" : ""} pending admin review</p>
              <p className="text-sm text-yellow-600">Listings go live once approved — usually within 24 hours.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
