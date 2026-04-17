import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { hostService, reviewService } from "../services/api";

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_STYLE = {
  approved: "bg-green-100 text-green-700",
  pending:  "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-600",
  confirmed:"bg-green-100 text-green-700",
  cancelled:"bg-gray-100 text-gray-500",
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent || "text-[#3D2B1A]"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Stars({ rating }) {
  return (
    <span className="text-yellow-400 text-sm">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

// Build last-6-months revenue bars from bookings
function RevenueChart({ bookings }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return { label: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });

  const data = months.map(({ label, year, month }) => {
    const total = bookings
      .filter((b) => {
        if (b.status !== "confirmed") return false;
        const d = new Date(b.start_time);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((s, b) => s + Number(b.total_price), 0);
    return { label, total };
  });

  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5">
      <h3 className="font-semibold text-[#3D2B1A] mb-4">Revenue — Last 6 Months</h3>
      <div className="flex items-end gap-3 h-32">
        {data.map(({ label, total }) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400">{total > 0 ? `${(total / 1000).toFixed(1)}k` : ""}</span>
            <div
              className="w-full rounded-t-lg bg-[#C4622D] opacity-80 transition-all"
              style={{ height: `${Math.max((total / max) * 96, total > 0 ? 4 : 2)}px` }}
            />
            <span className="text-[10px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useContext(AppContext);
  const [services, setServices] = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      hostService.getMyServices(),
      hostService.getHostBookings(),
      reviewService.getHostReviews(),
    ])
      .then(([s, b, r]) => { setServices(s || []); setBookings(b || []); setReviews(r || []); })
      .catch((e) => toast.error(e.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF6EF]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#C4622D] border-t-transparent" />
      </div>
    );
  }

  const approved   = services.filter((s) => s.approval_status === "approved").length;
  const pending    = services.filter((s) => s.approval_status === "pending").length;
  const confirmed  = bookings.filter((b) => b.status === "confirmed").length;
  const revenue    = bookings.filter((b) => b.status === "confirmed").reduce((s, b) => s + Number(b.total_price), 0);
  const avgRating  = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

  const upcoming = [...bookings]
    .filter((b) => b.status === "confirmed" && new Date(b.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 5);

  const recent = [...bookings]
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
    .slice(0, 8);

  function bookingCount(serviceId) {
    return bookings.filter((b) => b.service_id === serviceId && b.status === "confirmed").length;
  }
  function serviceRevenue(serviceId) {
    return bookings.filter((b) => b.service_id === serviceId && b.status === "confirmed")
      .reduce((s, b) => s + Number(b.total_price), 0);
  }

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#3D2B1A]">Host Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.name || user?.email?.split("@")[0]}</p>
          </div>
          <Link to="/host" className="bg-[#C4622D] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition">
            + Add Listing
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Listings"    value={services.length}                  sub={`${approved} approved · ${pending} pending`} />
          <StatCard label="Total Bookings"    value={bookings.length}                  sub={`${confirmed} confirmed`} />
          <StatCard label="Revenue"           value={`KES ${revenue.toLocaleString()}`} sub="confirmed only" accent="text-green-600" />
          <StatCard label="Avg. Rating"       value={avgRating !== "—" ? `${avgRating} ★` : "—"} sub={`${reviews.length} review${reviews.length !== 1 ? "s" : ""}`} accent="text-yellow-500" />
          <StatCard label="Upcoming Check-ins" value={upcoming.length}                 sub="in the next days" />
        </div>

        {/* Revenue Chart + Upcoming */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart bookings={bookings} />

          {/* Upcoming check-ins */}
          <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5">
            <h3 className="font-semibold text-[#3D2B1A] mb-4">Upcoming Check-ins</h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No upcoming confirmed bookings.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#F0E8D8] last:border-0">
                    <div>
                      <p className="font-medium text-[#3D2B1A] text-sm">{b.service_title || "—"}</p>
                      <p className="text-xs text-gray-400">{b.guest_name || "Guest"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#C4622D]">{fmt(b.start_time)}</p>
                      <p className="text-xs text-gray-400">→ {fmt(b.end_time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Listings */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#3D2B1A] mb-4">My Listings</h2>
          {services.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8D9B8] p-10 text-center">
              <p className="text-gray-400 mb-4">No listings yet.</p>
              <Link to="/host" className="bg-[#C4622D] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90">
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
                    <div className="h-32 bg-gray-100 relative">
                      {img
                        ? <img src={img} alt={svc.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No image</div>
                      }
                      <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[svc.approval_status] || "bg-gray-100 text-gray-500"}`}>
                        {svc.approval_status}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-[#3D2B1A] text-sm truncate mb-0.5">{svc.title}</p>
                      {meta.location && <p className="text-xs text-gray-400 mb-2">📍 {meta.location}</p>}
                      <div className="flex justify-between text-xs text-gray-500 mb-3">
                        <span>{count} booking{count !== 1 ? "s" : ""}</span>
                        <span className="font-semibold text-green-600">KES {rev.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2">
                        {svc.approval_status === "approved" && (
                          <Link to={`/listing/${svc.id}`} className="text-xs text-[#C4622D] font-medium hover:underline">View →</Link>
                        )}
                        <Link to="/host" className="text-xs text-gray-400 hover:text-[#3D2B1A]">Edit</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Bookings Table + Reviews side by side */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
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
                        <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold">Guest</th>
                        <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold hidden sm:table-cell">Service</th>
                        <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold">Check-in</th>
                        <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold">Total</th>
                        <th className="text-left px-4 py-3 text-[#3D2B1A] font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((b) => (
                        <tr key={b.id} className="border-b border-[#F0E8D8] last:border-0 hover:bg-[#FAF6EF]">
                          <td className="px-4 py-3 text-gray-700">{b.guest_name || "Guest"}</td>
                          <td className="px-4 py-3 font-medium text-[#3D2B1A] hidden sm:table-cell truncate max-w-[110px]">{b.service_title || "—"}</td>
                          <td className="px-4 py-3 text-gray-500">{fmt(b.start_time)}</td>
                          <td className="px-4 py-3 font-semibold text-[#3D2B1A]">KES {Number(b.total_price).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[b.status] || "bg-gray-100 text-gray-500"}`}>{b.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Reviews */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#3D2B1A]">Guest Reviews</h2>
              {reviews.length > 0 && (
                <span className="text-sm text-gray-500">{avgRating} ★ avg</span>
              )}
            </div>
            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8D9B8] p-8 text-center">
                <p className="text-gray-400 text-sm">No reviews yet. Approved listings start collecting reviews after stays.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 6).map((r) => (
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
              <p className="text-sm text-yellow-600">Listings go live once approved. Usually within 24 hours.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
