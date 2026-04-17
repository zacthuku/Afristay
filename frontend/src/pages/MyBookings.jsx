import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { bookingService } from "../services/api";

const STATUS_STYLES = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-gray-100 text-gray-500",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const data = await bookingService.getBookings();
      setBookings(data);
    } catch (err) {
      toast.error(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId) {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await bookingService.cancelBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b
        )
      );
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(err.message || "Failed to cancel booking");
    }
  }

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-[#3D2B1A] mb-8">My Bookings</h1>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#C4622D] border-t-transparent" />
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">No bookings yet.</p>
            <Link
              to="/"
              className="px-6 py-3 rounded-xl text-white font-semibold inline-block"
              style={{ backgroundColor: "#C4622D" }}
            >
              Explore Stays
            </Link>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="flex flex-col gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-[#E8D9B8] rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-sm"
              >
                {/* Image */}
                <div className="sm:w-48 h-40 sm:h-auto bg-gray-200 flex-shrink-0">
                  {booking.service_images && booking.service_images.length > 0 ? (
                    <img
                      src={booking.service_images[0]}
                      alt={booking.service_title || "Stay"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h2 className="text-lg font-semibold text-[#3D2B1A]">
                        {booking.service_title || "Unknown stay"}
                      </h2>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
                          STATUS_STYLES[booking.status] || "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    {booking.service_location && (
                      <p className="text-sm text-gray-500 mb-2">
                        📍 {booking.service_location}
                      </p>
                    )}

                    <div className="text-sm text-gray-600 mb-3">
                      <span>{formatDate(booking.start_time)}</span>
                      <span className="mx-2">→</span>
                      <span>{formatDate(booking.end_time)}</span>
                    </div>

                    <p className="text-lg font-bold text-[#3D2B1A]">
                      KES {Number(booking.total_price).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Link
                      to={`/listing/${booking.service_id}`}
                      className="text-sm text-[#C4622D] hover:underline font-medium"
                    >
                      View listing →
                    </Link>
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
