import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { bookingService, tripService } from "../services/api";

const PURPOSE_ICONS = { leisure: "🌴", adventure: "🏕️", business: "💼", event: "🎉" };

const STATUS_STYLES = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  pending_payment: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-gray-100 text-gray-500",
  failed: "bg-red-100 text-red-500",
};

const PAYMENT_LABELS = {
  free: { label: "Free", cls: "bg-green-50 text-green-600" },
  paid: { label: "Paid", cls: "bg-green-100 text-green-700" },
  pending: { label: "Payment pending", cls: "bg-yellow-100 text-yellow-700" },
  unpaid: { label: "Unpaid", cls: "bg-yellow-50 text-yellow-600" },
  failed: { label: "Payment failed", cls: "bg-red-100 text-red-500" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

function hoursUntil(dateStr, timeStr) {
  if (!dateStr) return null;
  const dt = new Date(`${dateStr}T${timeStr || "00:00"}:00`);
  return (dt - Date.now()) / 3_600_000;
}

function RefundPolicy({ type, dateStr, timeStr, fee }) {
  const hrs = hoursUntil(dateStr, timeStr);
  if (hrs === null) return null;

  if (type === "activity") {
    if (fee === 0) return <span className="text-[10px] text-green-600">Free — no refund needed</span>;
    if (hrs > 24) return <span className="text-[10px] text-green-600">Full refund available (cancel {">"} 24 hrs before)</span>;
    return <span className="text-[10px] text-red-500">No refund (less than 24 hrs before activity)</span>;
  }
  // Accommodation / transport
  if (hrs > 48) return <span className="text-[10px] text-green-600">Full refund available (cancel {">"} 48 hrs before)</span>;
  if (hrs > 24) return <span className="text-[10px] text-yellow-600">50% refund (24–48 hrs before check-in)</span>;
  return <span className="text-[10px] text-red-500">No refund (less than 24 hrs before check-in)</span>;
}

function CancelModal({ item, type, onConfirm, onClose }) {
  const hrs = type === "activity"
    ? hoursUntil(item.date, item.time)
    : hoursUntil(item.start_time?.split("T")[0], item.start_time?.split("T")[1]?.slice(0, 5));

  const fee = type === "activity" ? Number(item.total_fee) : Number(item.total_price);
  let refundLine = "";
  if (type === "activity") {
    if (fee === 0) refundLine = "Free activity — nothing to refund.";
    else if (hrs > 24) refundLine = `Full refund of KES ${fee.toLocaleString()} will be processed within 3–5 business days.`;
    else refundLine = "No refund applies as the activity is within 24 hours.";
  } else {
    if (hrs > 48) refundLine = `Full refund of KES ${fee.toLocaleString()} within 3–5 business days.`;
    else if (hrs > 24) refundLine = `50% refund (KES ${Math.floor(fee / 2).toLocaleString()}) within 3–5 business days.`;
    else refundLine = "No refund applies — check-in is within 24 hours.";
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <h3 className="font-semibold text-[#3D2B1A] text-lg">Cancel booking?</h3>
        <p className="text-sm text-[#5C4230]">
          <strong>{type === "activity" ? item.activity_name : item.service_title}</strong>
          {type === "activity" ? ` on ${formatDate(item.date)} at ${item.time}` : ` · ${formatDate(item.start_time)}`}
        </p>
        <div className="bg-[#FAF6EF] border border-[#E8D9B8] rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-[#5C4230] mb-1">Refund policy</p>
          <p className="text-sm text-[#3D2B1A]">{refundLine}</p>
          {type === "activity" && hrs !== null && hrs > 24 && (
            <p className="text-[10px] text-[#5C4230] mt-1">To reschedule instead, cancel and rebook at your preferred time.</p>
          )}
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 border border-[#E8D9B8] rounded-full py-2.5 text-sm text-[#5C4230] hover:border-[#C4622D]">
            Keep booking
          </button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white rounded-full py-2.5 text-sm font-medium hover:bg-red-600">
            Cancel booking
          </button>
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip }) {
  const [expanded, setExpanded] = useState(false);
  const purposeIcon = PURPOSE_ICONS[trip.purpose] || "🗺️";

  const PAYMENT_BADGE = {
    free: "bg-green-50 text-green-600",
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    unpaid: "bg-yellow-50 text-yellow-600",
    failed: "bg-red-100 text-red-500",
  };

  return (
    <div className="bg-white border border-[#E8D9B8] rounded-2xl overflow-hidden shadow-sm">
      {/* Trip header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FDF0E8] flex items-center justify-center text-2xl shrink-0">
            {purposeIcon}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#C4622D] font-semibold">Saved Trip</div>
            <h2 className="text-base font-semibold text-[#3D2B1A]">{trip.destination || "Unknown destination"}</h2>
            <p className="text-xs text-[#5C4230] mt-0.5">
              {formatDate(trip.check_in)} → {formatDate(trip.check_out)}
              {trip.nights ? ` · ${trip.nights} night${trip.nights !== 1 ? "s" : ""}` : ""}
              {trip.purpose ? ` · ${trip.purpose}` : ""}
            </p>
          </div>
        </div>
        <span className="text-[#C4622D] text-sm">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Day-by-day breakdown */}
      {expanded && (
        <div className="border-t border-[#E8D9B8]">
          {(trip.days || []).length === 0 ? (
            <p className="px-5 py-4 text-sm text-[#5C4230]">No itinerary data saved for this trip.</p>
          ) : (
            (trip.days || []).map((day) => {
              const hasContent = day.segments.length > 0 || day.activities.length > 0;
              return (
                <div key={day.day} className="border-b border-[#E8D9B8] last:border-b-0 px-5 py-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#C4622D] mb-3">
                    Day {day.day}
                    {day.date && (
                      <span className="font-normal text-[#5C4230] ml-1">
                        · {new Date(day.date).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>

                  {/* Segments: transport + accommodation */}
                  {day.segments.map((seg, i) => (
                    <div key={i} className="flex gap-3 items-start mb-2">
                      <span className="text-[#C4622D] font-mono text-xs w-12 shrink-0 pt-0.5">{seg.time}</span>
                      <div className="text-sm">
                        <span className="font-medium text-[#3D2B1A]">
                          {seg.type === "transport"
                            ? `Travel to ${seg.destination}`
                            : seg.service
                              ? `Check in at ${seg.service.title}`
                              : `Arrive at ${seg.destination}`}
                        </span>
                        {seg.service?.location && (
                          <span className="ml-2 text-xs text-[#5C4230] bg-[#FAF6EF] border border-[#E8D9B8] px-2 py-0.5 rounded-full">
                            {seg.service.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Activity bookings */}
                  {day.activities.map((ab) => (
                    <div key={ab.id} className="flex gap-3 items-start mb-2">
                      <span className="text-[#5C4230] font-mono text-xs w-12 shrink-0 pt-0.5">{ab.time}</span>
                      <div className="flex-1 text-sm">
                        <span className="font-medium text-[#3D2B1A]">{ab.activity_name}</span>
                        <span className="ml-2 text-xs text-[#5C4230]">
                          {ab.participants} visitor{ab.participants !== 1 ? "s" : ""}
                        </span>
                        {Number(ab.total_fee) > 0 && (
                          <span className="ml-2 text-xs font-medium text-[#C4622D]">
                            KES {Number(ab.total_fee).toLocaleString()}
                          </span>
                        )}
                        <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${PAYMENT_BADGE[ab.payment_status] || "bg-gray-100 text-gray-500"}`}>
                          {ab.payment_status === "free" ? "Free" : ab.payment_status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {!hasContent && (
                    <p className="text-sm text-[#5C4230] italic">Free day — explore at your leisure</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [activityBookings, setActivityBookings] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | stays | activities | trips
  const [cancelTarget, setCancelTarget] = useState(null); // { item, type }

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [bData, aData, tData] = await Promise.all([
        bookingService.getBookings(),
        tripService.getActivityBookings(),
        tripService.getSaved(),
      ]);
      setBookings(bData);
      setActivityBookings(aData);
      setSavedTrips(tData);
    } catch (err) {
      toast.error(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking(bookingId) {
    try {
      await bookingService.cancelBooking(bookingId);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: "cancelled" } : b));
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(err.message || "Failed to cancel booking");
    }
    setCancelTarget(null);
  }

  async function handleCancelActivity(bookingId) {
    try {
      await tripService.cancelActivityBooking(bookingId);
      setActivityBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: "cancelled" } : b));
      toast.success("Activity booking cancelled");
    } catch (err) {
      toast.error(err.message || "Failed to cancel activity booking");
    }
    setCancelTarget(null);
  }

  // Only show confirmed + fully paid records
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const confirmedActivities = activityBookings.filter((b) => b.status === "confirmed");

  const filteredBookings = (tab === "activities" || tab === "trips") ? [] : confirmedBookings;
  const filteredActivities = (tab === "stays" || tab === "trips") ? [] : confirmedActivities;
  const filteredTrips = (tab === "stays" || tab === "activities") ? [] : savedTrips;
  const totalCount = confirmedBookings.length + confirmedActivities.length + savedTrips.length;

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-3xl font-bold text-[#3D2B1A]">My Bookings</h1>
          {totalCount > 0 && (
            <div className="flex gap-1 bg-white border border-[#E8D9B8] rounded-full p-1 text-xs">
              {[["all", "All"], ["stays", "Stays & Transport"], ["activities", "Activities"], ["trips", "Trips"]].map(([v, l]) => (
                <button key={v} onClick={() => setTab(v)}
                  className={`px-3 py-1.5 rounded-full transition-all ${tab === v ? "bg-[#C4622D] text-white font-medium" : "text-[#5C4230] hover:text-[#C4622D]"}`}>
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#C4622D] border-t-transparent" />
          </div>
        )}

        {!loading && totalCount === 0 && (
          <div className="text-center py-20 space-y-4">
            <p className="text-[#5C4230] text-lg">No bookings yet.</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Link to="/" className="px-6 py-3 rounded-xl text-white font-semibold inline-block bg-[#C4622D]">
                Explore Stays
              </Link>
              <Link to="/plan" className="px-6 py-3 rounded-xl text-white font-semibold inline-block bg-[#3D2B1A]">
                Plan a Trip
              </Link>
            </div>
          </div>
        )}

        {!loading && totalCount > 0 && (
          <div className="space-y-4">

            {/* ── Regular Bookings ── */}
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white border border-[#E8D9B8] rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-sm">
                <div className="sm:w-44 h-36 sm:h-auto bg-[#E8D9B8] flex-shrink-0 flex items-center justify-center text-3xl">
                  {booking.service_images?.[0]
                    ? <img src={booking.service_images[0]} alt={booking.service_title} className="w-full h-full object-cover" />
                    : "🏡"}
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-[#5C4230] font-medium">Stay / Transport</span>
                        <h2 className="text-base font-semibold text-[#3D2B1A]">{booking.service_title || "Unnamed service"}</h2>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${STATUS_STYLES[booking.status] || "bg-gray-100 text-gray-500"}`}>
                        {booking.status.replace("_", " ")}
                      </span>
                    </div>
                    {booking.service_location && (
                      <p className="text-xs text-[#5C4230] mb-2">📍 {booking.service_location}</p>
                    )}
                    <p className="text-sm text-[#5C4230]">
                      {formatDate(booking.start_time)} → {formatDate(booking.end_time)}
                    </p>
                    <p className="text-base font-bold text-[#3D2B1A] mt-1">KES {Number(booking.total_price).toLocaleString()}</p>
                    <div className="mt-1">
                      <RefundPolicy type="stay" dateStr={booking.start_time?.split("T")[0]} timeStr={booking.start_time?.split("T")[1]?.slice(0, 5)} fee={Number(booking.total_price)} />
                    </div>
                  </div>
                  <div className="flex gap-4 items-center flex-wrap">
                    <Link to={`/listing/${booking.service_id}`} className="text-sm text-[#C4622D] hover:underline font-medium">
                      View listing →
                    </Link>
                    {booking.status !== "cancelled" && (
                      <button onClick={() => setCancelTarget({ item: booking, type: "stay" })}
                        className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* ── Saved Trips ── */}
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}

            {/* ── Activity Bookings ── */}
            {filteredActivities.map((ab) => {
              const payInfo = PAYMENT_LABELS[ab.payment_status] || PAYMENT_LABELS["unpaid"];
              return (
                <div key={ab.id} className="bg-white border border-[#E8D9B8] rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-sm">
                  <div className="sm:w-44 h-36 sm:h-auto bg-[#FDF0E8] flex-shrink-0 flex items-center justify-center text-4xl">
                    🎫
                  </div>
                  <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="text-[10px] uppercase tracking-wide text-[#C4622D] font-medium">Activity</span>
                          <h2 className="text-base font-semibold text-[#3D2B1A]">{ab.activity_name}</h2>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[ab.status] || "bg-gray-100 text-gray-500"}`}>
                            {ab.status.replace("_", " ")}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${payInfo.cls}`}>
                            {payInfo.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-[#5C4230] mb-1">📍 {ab.activity_location} · {ab.destination}</p>
                      <p className="text-sm text-[#5C4230]">
                        {formatDate(ab.date)} at {ab.time} · {ab.participants} visitor{ab.participants !== 1 ? "s" : ""}
                      </p>
                      <p className="text-base font-bold text-[#3D2B1A] mt-1">
                        {Number(ab.total_fee) === 0 ? "Free" : `KES ${Number(ab.total_fee).toLocaleString()}`}
                      </p>
                      <div className="mt-1">
                        <RefundPolicy type="activity" dateStr={ab.date} timeStr={ab.time} fee={Number(ab.total_fee)} />
                      </div>
                    </div>
                    <div className="flex gap-4 items-center flex-wrap">
                      {ab.status !== "cancelled" && (
                        <>
                          <button onClick={() => setCancelTarget({ item: ab, type: "activity" })}
                            className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                            Cancel
                          </button>
                          {hoursUntil(ab.date, ab.time) > 24 && ab.status === "confirmed" && (
                            <span className="text-xs text-[#5C4230]">
                              To reschedule, cancel and rebook at your preferred time.
                            </span>
                          )}
                        </>
                      )}
                      {ab.status === "cancelled" && (
                        <span className="text-xs text-[#5C4230]">Booking cancelled</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <CancelModal
          item={cancelTarget.item}
          type={cancelTarget.type}
          onClose={() => setCancelTarget(null)}
          onConfirm={() => cancelTarget.type === "activity"
            ? handleCancelActivity(cancelTarget.item.id)
            : handleCancelBooking(cancelTarget.item.id)
          }
        />
      )}
    </div>
  );
}
