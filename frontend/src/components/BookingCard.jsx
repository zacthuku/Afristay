import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { bookingService, paymentService } from "../services/api";

const BRAND = "#C4622D";

// Supported steps: "dates" | "payment" | "polling" | "confirmed" | "failed"

export function BookingCard({ listing }) {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState("dates");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const pollRef = useRef(null);
  const timeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const nights =
    checkIn && checkOut
      ? Math.round(
          (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
        )
      : 0;

  const price = listing?.price || listing?.price_base || 0;
  const total = nights > 0 ? price * nights : 0;

  function validateDates() {
    if (!checkIn || !checkOut) return "Please select check-in and check-out dates.";
    if (checkIn < today) return "Check-in date cannot be in the past.";
    if (checkOut <= checkIn) return "Check-out must be after check-in.";
    return null;
  }

  function handleReserve() {
    const fe = {};
    if (!checkIn) fe.checkIn = true;
    if (!checkOut) fe.checkOut = true;
    if (Object.keys(fe).length > 0) {
      setFieldErrors(fe);
      return;
    }
    const err = validateDates();
    if (err) {
      setError(err);
      return;
    }
    setFieldErrors({});
    setError("");
    if (!user) {
      navigate(`/login?from=${location.pathname}`);
      return;
    }
    setStep("payment");
  }

  async function handlePayment() {
    if (!phone.trim()) {
      setFieldErrors({ phone: true });
      return;
    }
    setFieldErrors({});
    setError("");
    setLoading(true);

    try {
      // 1. Create booking (status = "pending")
      const bookingData = await bookingService.createBooking({
        service_id: listing.id,
        start_time: `${checkIn}T14:00:00`,
        end_time: `${checkOut}T11:00:00`,
        quantity: 1,
      });
      const newBookingId = bookingData.id;

      // 2. Initiate M-Pesa STK Push
      const paymentData = await paymentService.initiateMpesa({
        booking_id: newBookingId,
        phone: phone.trim(),
      });
      setStep("polling");
      startPolling(paymentData.checkout_request_id);
    } catch (err) {
      setError(err.message || "Payment initiation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startPolling(crid) {
    // Poll every 3 seconds
    pollRef.current = setInterval(async () => {
      try {
        const result = await paymentService.checkStatus(crid);
        if (result.status === "completed") {
          clearInterval(pollRef.current);
          clearTimeout(timeoutRef.current);
          setStep("confirmed");
          toast.success("Booking confirmed! Check your email for details.");
          setTimeout(() => navigate("/bookings"), 3000);
        } else if (result.status === "failed") {
          clearInterval(pollRef.current);
          clearTimeout(timeoutRef.current);
          setStep("failed");
        }
      } catch {
        // Ignore poll errors — keep trying
      }
    }, 3000);

    // 2-minute timeout
    timeoutRef.current = setTimeout(() => {
      clearInterval(pollRef.current);
      setStep("failed");
      setError("Payment timed out. Please try again.");
    }, 120000);
  }

  function handleCancel() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStep("dates");
    setError("");
  }

  if (!listing) return null;

  return (
    <div className="border border-[#E8D9B8] p-6 rounded-2xl shadow-xl sticky top-20 bg-white">
      {step === "dates" && (
        <>
          <div className="flex items-baseline justify-between mb-5">
            <span className="text-2xl font-bold text-[#3D2B1A]">
              KES {price.toLocaleString()}
            </span>
            <span className="text-gray-500 text-sm">/ night</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-xs font-semibold text-[#3D2B1A] mb-1 uppercase tracking-wide">
                Check-in <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => { setCheckIn(e.target.value); setError(""); setFieldErrors((p) => ({ ...p, checkIn: false })); }}
                className={`w-full border p-2 rounded-lg text-sm focus:outline-none focus:border-[#C4622D] ${fieldErrors.checkIn ? "border-red-400 bg-red-50" : "border-[#E8D9B8]"}`}
              />
              {fieldErrors.checkIn && <p className="text-red-500 text-xs mt-0.5">Required.</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3D2B1A] mb-1 uppercase tracking-wide">
                Check-out <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => { setCheckOut(e.target.value); setError(""); setFieldErrors((p) => ({ ...p, checkOut: false })); }}
                className={`w-full border p-2 rounded-lg text-sm focus:outline-none focus:border-[#C4622D] ${fieldErrors.checkOut ? "border-red-400 bg-red-50" : "border-[#E8D9B8]"}`}
              />
              {fieldErrors.checkOut && <p className="text-red-500 text-xs mt-0.5">Required.</p>}
            </div>
          </div>

          {nights > 0 && (
            <div className="text-sm text-gray-600 bg-[#FAF6EF] rounded-lg p-3 mb-3">
              <div className="flex justify-between">
                <span>KES {price.toLocaleString()} × {nights} night{nights > 1 ? "s" : ""}</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-[#3D2B1A] mt-2 pt-2 border-t border-[#E8D9B8]">
                <span>Total</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-600 text-sm mb-3">{error}</p>
          )}

          <button
            onClick={handleReserve}
            className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            Reserve
          </button>

          {!user && (
            <p className="text-center text-xs text-gray-500 mt-2">
              You'll be asked to log in
            </p>
          )}
        </>
      )}

      {step === "payment" && (
        <>
          <button
            onClick={() => setStep("dates")}
            className="text-sm text-[#C4622D] mb-4 hover:underline"
          >
            ← Back to dates
          </button>

          <h3 className="text-lg font-semibold text-[#3D2B1A] mb-1">Pay with M-Pesa</h3>
          <p className="text-sm text-gray-500 mb-4">
            Enter your Safaricom number. You'll receive a prompt to enter your PIN.
          </p>

          <div className="bg-[#FAF6EF] rounded-lg p-3 mb-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{checkIn} → {checkOut}</span>
              <span>{nights} night{nights > 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between font-bold text-[#3D2B1A] mt-1">
              <span>Total</span>
              <span>KES {total.toLocaleString()}</span>
            </div>
          </div>

          <label className="block text-xs font-semibold text-[#3D2B1A] mb-1 uppercase tracking-wide">
            M-Pesa Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="e.g. 0712345678"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(""); setFieldErrors((p) => ({ ...p, phone: false })); }}
            className={`w-full border p-3 rounded-lg text-sm focus:outline-none focus:border-[#C4622D] ${fieldErrors.phone ? "border-red-400 bg-red-50" : "border-[#E8D9B8]"}`}
          />
          {fieldErrors.phone && <p className="text-red-500 text-xs mt-1 mb-2">M-Pesa phone number is required.</p>}

          {error && (
            <p className="text-red-600 text-sm mb-3">{error}</p>
          )}

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: BRAND }}
          >
            {loading ? "Initiating..." : `Pay KES ${total.toLocaleString()} via M-Pesa`}
          </button>
        </>
      )}

      {step === "polling" && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#C4622D] border-t-transparent mx-auto mb-4" />
          <h3 className="font-semibold text-[#3D2B1A] mb-1">Waiting for payment</h3>
          <p className="text-sm text-gray-600 mb-1">
            A prompt has been sent to <strong>{phone}</strong>.
          </p>
          <p className="text-sm text-gray-500 mb-5">Enter your M-Pesa PIN to complete the payment.</p>
          <div className="bg-[#FAF6EF] rounded-lg p-3 mb-5 text-sm">
            <div className="flex justify-between font-bold text-[#3D2B1A]">
              <span>Amount</span>
              <span>KES {total.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-sm text-gray-500 hover:underline"
          >
            Cancel payment
          </button>
        </div>
      )}

      {step === "confirmed" && (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#3D2B1A] mb-1">Booking Confirmed!</h3>
          <p className="text-sm text-gray-600 mb-4">
            A confirmation email has been sent to you.
          </p>
          <button
            onClick={() => navigate("/bookings")}
            className="w-full py-2 rounded-xl text-white font-semibold"
            style={{ backgroundColor: BRAND }}
          >
            View My Bookings
          </button>
        </div>
      )}

      {step === "failed" && (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#3D2B1A] mb-1">Payment Failed</h3>
          <p className="text-sm text-gray-500 mb-4">
            {error || "The payment was not completed. Please try again."}
          </p>
          <button
            onClick={handleCancel}
            className="w-full py-2 rounded-xl text-white font-semibold"
            style={{ backgroundColor: BRAND }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
