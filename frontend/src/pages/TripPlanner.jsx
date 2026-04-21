import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { tripService, cartService } from "../services/api";
import { AppContext } from "../context/AppContext";

const PURPOSES = [
  { value: "leisure", label: "Leisure", icon: "🌴" },
  { value: "adventure", label: "Adventure", icon: "🏕️" },
  { value: "business", label: "Business", icon: "💼" },
  { value: "event", label: "Event", icon: "🎉" },
];

export default function TripPlanner() {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();

  const [step, setStep] = useState("form");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const [form, setForm] = useState({
    destination: "",
    purpose: "leisure",
    check_in: "",
    check_out: "",
    group_size: 1,
    max_budget: "",
  });
  const [origin, setOrigin] = useState("");
  const [geoState, setGeoState] = useState("idle");

  const [trip, setTrip] = useState(null);
  const [activities, setActivities] = useState([]);
  const [tripActivities, setTripActivities] = useState({}); // persists across form↔results
  const [bookedIds, setBookedIds] = useState(new Set());

  const [selectedAccomIdx, setSelectedAccomIdx] = useState(0);
  const [selectedTransportIdx, setSelectedTransportIdx] = useState(null);
  const [accomDates, setAccomDates] = useState({ check_in: "", check_out: "" });
  const [transportDate, setTransportDate] = useState({ check_in: "", check_out: "" });
  const [editingAccom, setEditingAccom] = useState(false);
  const [editingTransport, setEditingTransport] = useState(false);

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) { toast.error("Geolocation is not supported by your browser"); return; }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en", "User-Agent": "AfriStay-TripPlanner/1.0" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || addr.state || "";
          if (city) { setOrigin(city); setGeoState("filled"); }
          else { setGeoState("idle"); toast.error("Could not determine your city. Please type it manually."); }
        } catch {
          setGeoState("idle");
          toast.error("Reverse geocode failed. Please type your origin manually.");
        }
      },
      () => { setGeoState("idle"); toast.error("Location access denied"); },
      { timeout: 8000 }
    );
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!form.destination || !form.check_in || !form.check_out) { toast.error("Please fill in destination and dates"); return; }
    if (form.check_out <= form.check_in) { toast.error("Check-out must be after check-in"); return; }
    setGenerating(true);
    try {
      const payload = {
        destination: form.destination,
        purpose: form.purpose,
        check_in: form.check_in,
        check_out: form.check_out,
        group_size: Number(form.group_size),
        ...(form.max_budget ? { max_budget: Number(form.max_budget) } : {}),
        ...(origin.trim() ? { origin: origin.trim() } : {}),
      };
      const result = await tripService.generate(payload);
      setTrip(result);
      setSelectedAccomIdx(result.recommended_accommodation.length > 0 ? 0 : null);
      setSelectedTransportIdx(result.recommended_transport.length > 0 ? 0 : null);
      setAccomDates({ check_in: form.check_in, check_out: form.check_out });
      setTransportDate({ check_in: form.check_in, check_out: form.check_in });
      // Clear activities for new plan
      setTripActivities({});
      setBookedIds(new Set());
      // Fetch activity suggestions (non-fatal)
      try {
        const acts = await tripService.getActivities(result.destination);
        setActivities(acts);
      } catch { setActivities([]); }
      setStep("results");
    } catch (err) {
      toast.error(err.message || "Failed to generate trip");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveTrip() {
    if (!user) { navigate("/login"); return; }
    setSaving(true);
    try {
      const accom = selectedAccomIdx !== null ? trip.recommended_accommodation[selectedAccomIdx] : null;
      const transport = selectedTransportIdx !== null ? trip.recommended_transport[selectedTransportIdx] : null;
      await tripService.save({
        destination: trip.destination,
        purpose: trip.purpose,
        check_in: trip.check_in,
        check_out: trip.check_out,
        group_size: trip.group_size,
        accommodation_id: accom?.id || null,
        transport_id: transport?.id || null,
        origin: trip.origin || null,
      });
      // Book any added activities that haven't been booked inline yet
      const checkIn = new Date(trip.check_in);
      for (const [dayNumStr, dayActs] of Object.entries(tripActivities)) {
        const dayNum = Number(dayNumStr);
        const dayDate = new Date(checkIn);
        dayDate.setDate(dayDate.getDate() + dayNum - 1);
        const dateStr = dayDate.toISOString().split("T")[0];
        for (const act of dayActs) {
          if (bookedIds.has(act.id)) continue;
          await tripService.bookActivity({
            activity_id: act.id,
            activity_name: act.name,
            activity_location: act.address || "",
            destination: trip.destination,
            date: dateStr,
            time: act.available_times?.[0] || "09:00",
            participants: Number(form.group_size) || 1,
            total_fee: act.entrance_fee * (Number(form.group_size) || 1),
            payment_method: act.entrance_fee === 0 ? "free" : "defer",
          });
        }
      }
      toast.success("Trip saved to your account!");
    } catch (err) {
      toast.error(err.message || "Failed to save trip");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddToCart() {
    if (!user) { navigate("/login"); return; }
    setAddingToCart(true);
    let added = 0;
    try {
      if (selectedAccomIdx !== null && trip.recommended_accommodation[selectedAccomIdx]) {
        await cartService.addItem({
          service_id: trip.recommended_accommodation[selectedAccomIdx].id,
          check_in: accomDates.check_in || trip.check_in,
          check_out: accomDates.check_out || trip.check_out,
          quantity: Number(form.group_size),
        });
        added++;
      }
      if (selectedTransportIdx !== null && trip.recommended_transport[selectedTransportIdx]) {
        await cartService.addItem({
          service_id: trip.recommended_transport[selectedTransportIdx].id,
          check_in: transportDate.check_in || trip.check_in,
          check_out: transportDate.check_out || trip.check_in,
          quantity: Number(form.group_size),
        });
        added++;
      }

      // Always save the trip so it appears in cart/bookings
      const accom = selectedAccomIdx !== null ? trip.recommended_accommodation[selectedAccomIdx] : null;
      const transport = selectedTransportIdx !== null ? trip.recommended_transport[selectedTransportIdx] : null;
      await tripService.save({
        destination: trip.destination,
        purpose: trip.purpose,
        check_in: trip.check_in,
        check_out: trip.check_out,
        group_size: trip.group_size,
        accommodation_id: accom?.id || null,
        transport_id: transport?.id || null,
        origin: trip.origin || null,
      });

      // Book all day activities — skip ones already booked inline via payment modal
      const checkIn = new Date(trip.check_in);
      for (const [dayNumStr, dayActs] of Object.entries(tripActivities)) {
        const dayNum = Number(dayNumStr);
        const dayDate = new Date(checkIn);
        dayDate.setDate(dayDate.getDate() + dayNum - 1);
        const dateStr = dayDate.toISOString().split("T")[0];
        for (const act of dayActs) {
          if (bookedIds.has(act.id)) continue; // already booked inline — don't double-book
          await tripService.bookActivity({
            activity_id: act.id,
            activity_name: act.name,
            activity_location: act.address || act.activity_location || "",
            destination: trip.destination,
            date: dateStr,
            time: act.available_times?.[0] || "09:00",
            participants: Number(form.group_size) || 1,
            total_fee: act.entrance_fee * (Number(form.group_size) || 1),
            payment_method: act.entrance_fee === 0 ? "free" : "defer",
          });
        }
      }

      const actCount = Object.values(tripActivities).flat().length;
      const parts = [];
      if (added > 0) parts.push(`${added} service${added > 1 ? "s" : ""}`);
      if (actCount > 0) parts.push(`${actCount} activit${actCount > 1 ? "ies" : "y"}`);
      toast.success(`Trip saved${parts.length ? ` — ${parts.join(", ")} added` : ""}!`);
      navigate("/cart");
    } catch (err) {
      toast.error(err.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {step === "form" ? (
        <FormStep
          form={form}
          origin={origin}
          setOrigin={setOrigin}
          geoState={geoState}
          onUseMyLocation={handleUseMyLocation}
          onChange={handleFormChange}
          onPurpose={(v) => setForm((f) => ({ ...f, purpose: v }))}
          onSubmit={handleGenerate}
          generating={generating}
        />
      ) : (
        <ResultsStep
          trip={trip}
          form={form}
          activities={activities}
          tripActivities={tripActivities}
          setTripActivities={setTripActivities}
          bookedIds={bookedIds}
          setBookedIds={setBookedIds}
          user={user}
          navigate={navigate}
          selectedAccomIdx={selectedAccomIdx}
          setSelectedAccomIdx={setSelectedAccomIdx}
          selectedTransportIdx={selectedTransportIdx}
          setSelectedTransportIdx={setSelectedTransportIdx}
          accomDates={accomDates}
          setAccomDates={setAccomDates}
          transportDate={transportDate}
          setTransportDate={setTransportDate}
          editingAccom={editingAccom}
          setEditingAccom={setEditingAccom}
          editingTransport={editingTransport}
          setEditingTransport={setEditingTransport}
          onBack={() => setStep("form")}
          onSave={handleSaveTrip}
          onAddToCart={handleAddToCart}
          saving={saving}
          addingToCart={addingToCart}
        />
      )}
    </div>
  );
}

/* ─── Step 1: Form ─────────────────────────────────────────────────── */
function FormStep({ form, onChange, onPurpose, onSubmit, generating, origin, setOrigin, geoState, onUseMyLocation }) {
  return (
    <div className="max-w-2xl mx-auto py-14 px-4">
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl text-[#3D2B1A] mb-3">Plan Your Trip</h1>
        <p className="text-[#5C4230]">Tell us where you're headed and we'll build a personalised itinerary.</p>
      </div>
      <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-[#E8D9B8] p-8 space-y-6">
        {/* From */}
        <div>
          <label className="block text-sm font-medium text-[#3D2B1A] mb-1">
            From <span className="text-[#5C4230] font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text" value={origin} onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Nairobi"
              className="flex-1 border border-[#E8D9B8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4622D]"
            />
            <button
              type="button" onClick={onUseMyLocation} disabled={geoState === "loading"}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-xl border text-sm transition-all disabled:opacity-50 ${
                geoState === "filled"
                  ? "border-[#C4622D] bg-[#FDF0E8] text-[#C4622D]"
                  : "border-[#E8D9B8] text-[#5C4230] hover:border-[#C4622D] hover:text-[#C4622D]"
              }`}
            >
              {geoState === "loading"
                ? <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-[#C4622D] border-t-transparent rounded-full" />
                : <span>📍</span>}
              <span className="hidden sm:inline">
                {geoState === "loading" ? "Locating..." : geoState === "filled" ? "Located" : "Use my location"}
              </span>
            </button>
          </div>
        </div>
        {/* To */}
        <div>
          <label className="block text-sm font-medium text-[#3D2B1A] mb-1">To (Destination)</label>
          <input
            type="text" name="destination" value={form.destination} onChange={onChange}
            placeholder="e.g. Mombasa, Maasai Mara, Naivasha"
            className="w-full border border-[#E8D9B8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4622D]"
            required
          />
        </div>
        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-[#3D2B1A] mb-2">Trip Purpose</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PURPOSES.map((p) => (
              <button key={p.value} type="button" onClick={() => onPurpose(p.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm transition-all ${
                  form.purpose === p.value
                    ? "border-[#C4622D] bg-[#FDF0E8] text-[#C4622D] font-semibold"
                    : "border-[#E8D9B8] text-[#5C4230] hover:border-[#C4622D]"
                }`}
              >
                <span className="text-xl">{p.icon}</span>{p.label}
              </button>
            ))}
          </div>
        </div>
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#3D2B1A] mb-1">Check-in</label>
            <input type="date" name="check_in" value={form.check_in} onChange={onChange}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-[#E8D9B8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4622D]" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3D2B1A] mb-1">Check-out</label>
            <input type="date" name="check_out" value={form.check_out} onChange={onChange}
              min={form.check_in || new Date().toISOString().split("T")[0]}
              className="w-full border border-[#E8D9B8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4622D]" required />
          </div>
        </div>
        {/* Group + Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#3D2B1A] mb-1">Group Size</label>
            <input type="number" name="group_size" value={form.group_size} onChange={onChange} min="1" max="20"
              className="w-full border border-[#E8D9B8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4622D]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3D2B1A] mb-1">Max Budget (KES, optional)</label>
            <input type="number" name="max_budget" value={form.max_budget} onChange={onChange} placeholder="e.g. 50000"
              className="w-full border border-[#E8D9B8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4622D]" />
          </div>
        </div>
        <button type="submit" disabled={generating}
          className="w-full bg-[#C4622D] text-white py-3.5 rounded-full font-medium disabled:opacity-50">
          {generating ? "Generating your itinerary..." : "Generate My Trip →"}
        </button>
      </form>
    </div>
  );
}

/* ─── Step 2: Results — 1:3 split ──────────────────────────────────── */
function ResultsStep({
  trip, form, activities,
  tripActivities, setTripActivities, bookedIds, setBookedIds,
  user, navigate,
  selectedAccomIdx, setSelectedAccomIdx,
  selectedTransportIdx, setSelectedTransportIdx,
  accomDates, setAccomDates,
  transportDate, setTransportDate,
  editingAccom, setEditingAccom,
  editingTransport, setEditingTransport,
  onBack, onSave, onAddToCart, saving, addingToCart,
}) {
  const hasAccom = trip.recommended_accommodation.length > 0;
  const hasTransport = trip.recommended_transport.length > 0;
  const nothingSelected = selectedAccomIdx === null && selectedTransportIdx === null;

  const selectedAccom = selectedAccomIdx !== null ? trip.recommended_accommodation[selectedAccomIdx] : null;
  const selectedTransport = selectedTransportIdx !== null ? trip.recommended_transport[selectedTransportIdx] : null;

  const nights = trip.nights;
  const groupSize = Number(form.group_size);
  const accomCost = selectedAccom ? selectedAccom.price * nights * groupSize : 0;
  const transportCost = selectedTransport ? selectedTransport.price * groupSize : 0;
  const activityCost = Object.values(tripActivities).flat()
    .reduce((sum, act) => sum + act.entrance_fee * groupSize, 0);
  const totalCost = accomCost + transportCost + activityCost;

  const routeSuggestions = trip.along_route_suggestions || [];
  const sidebarItems = routeSuggestions.length > 0
    ? routeSuggestions
    : [...trip.recommended_accommodation.slice(0, 3), ...trip.recommended_transport.slice(0, 2)].slice(0, 6);
  const sidebarTitle = trip.origin ? "Along the Route" : `Also in ${trip.destination}`;

  // Ephemeral UI state (does not need to outlive ResultsStep mount)
  const [expandedDay, setExpandedDay] = useState(null);
  const [bookingActivity, setBookingActivity] = useState(null); // { activity, dayNum }
  const [bookForm, setBookForm] = useState({ date: "", time: "", participants: 1 });
  // payment step: null | "method" | "mpesa" | "airtel" | "card_redirect" | "polling"
  const [payStep, setPayStep] = useState(null);
  const [payMethod, setPayMethod] = useState("mpesa");
  const [payPhone, setPayPhone] = useState("");
  const [payBookingId, setPayBookingId] = useState(null);
  const [payPollRef, setPayPollRef] = useState(null);

  async function handleFreeBooking() {
    if (!user) { navigate("/login"); return; }
    const act = bookingActivity.activity;
    try {
      await tripService.bookActivity({
        activity_id: act.id, activity_name: act.name, activity_location: act.address,
        destination: trip.destination, date: bookForm.date, time: bookForm.time,
        participants: bookForm.participants, total_fee: 0, payment_method: "free",
      });
      setBookedIds((prev) => new Set([...prev, act.id]));
      setBookingActivity(null);
      setPayStep(null);
      toast.success(`${act.name} added to your trip!`);
    } catch (err) { toast.error(err.message || "Booking failed"); }
  }

  async function handleMobilePay(selectedMethod) {
    if (!user) { navigate("/login"); return; }
    if (!payPhone.trim()) { toast.error(`Enter your ${selectedMethod === "mpesa" ? "M-Pesa" : "Airtel"} phone number`); return; }
    const act = bookingActivity.activity;
    try {
      const res = await tripService.bookActivity({
        activity_id: act.id, activity_name: act.name, activity_location: act.address,
        destination: trip.destination, date: bookForm.date, time: bookForm.time,
        participants: bookForm.participants,
        total_fee: act.entrance_fee * bookForm.participants,
        payment_method: selectedMethod, phone: payPhone.trim(),
      });
      setPayBookingId(res.id);
      setPayStep("polling");
      startPolling(res.id, act.id);
    } catch (err) { toast.error(err.message || "Payment initiation failed"); }
  }

  async function handleCardPay() {
    if (!user) { navigate("/login"); return; }
    const act = bookingActivity.activity;
    try {
      const res = await tripService.bookActivity({
        activity_id: act.id, activity_name: act.name, activity_location: act.address,
        destination: trip.destination, date: bookForm.date, time: bookForm.time,
        participants: bookForm.participants,
        total_fee: act.entrance_fee * bookForm.participants,
        payment_method: "card",
      });
      if (res.payment_link) window.open(res.payment_link, "_blank");
      setPayBookingId(res.id);
      setPayStep("card_redirect");
      startPolling(res.id, act.id);
    } catch (err) { toast.error(err.message || "Card payment initiation failed"); }
  }

  function startPolling(bookingId, activityId) {
    const handle = setInterval(async () => {
      try {
        const status = await tripService.getActivityPaymentStatus(bookingId);
        if (status.payment_status === "paid" || status.status === "confirmed") {
          clearInterval(handle);
          setPayPollRef(null);
          setBookedIds((prev) => new Set([...prev, activityId]));
          setBookingActivity(null);
          setPayStep(null);
          toast.success(`${bookingActivity?.activity?.name || "Activity"} booked and paid!`);
        } else if (status.payment_status === "failed" || status.status === "cancelled") {
          clearInterval(handle);
          setPayPollRef(null);
          setPayStep("method");
          toast.error("Payment failed. Please try again.");
        }
      } catch { /* non-fatal polling error */ }
    }, 3000);
    setPayPollRef(handle);
  }

  function closePayment() {
    if (payPollRef) clearInterval(payPollRef);
    setPayPollRef(null);
    setPayStep(null);
    setPayBookingId(null);
    setPayPhone("");
    setPayMethod("mpesa");
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

        {/* ── Left sidebar (1/4) ── */}
        <aside className="md:col-span-1 md:sticky md:top-6 space-y-4 order-2 md:order-1">
          <h2 className="font-semibold text-[#3D2B1A] text-sm">{sidebarTitle}</h2>
          {sidebarItems.length === 0 ? (
            <p className="text-xs text-[#5C4230] bg-white border border-[#E8D9B8] rounded-xl px-4 py-4">
              No suggestions available for this route.
            </p>
          ) : (
            <div className="space-y-3">
              {sidebarItems.map((svc) => <RouteCard key={svc.id} service={svc} />)}
            </div>
          )}
        </aside>

        {/* ── Right main panel (3/4) ── */}
        <div className="md:col-span-3 space-y-8 order-1 md:order-2">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <button onClick={onBack} className="text-sm text-[#5C4230] hover:text-[#C4622D] mb-1 flex items-center gap-1">
                ← Edit Details
              </button>
              <h1 className="font-serif text-3xl text-[#3D2B1A]">
                {trip.origin ? `${trip.origin} → ${trip.destination}` : `Your Trip to ${trip.destination}`}
              </h1>
              <p className="text-[#5C4230] text-sm mt-1">
                {new Date(trip.check_in).toLocaleDateString()} – {new Date(trip.check_out).toLocaleDateString()}
                &nbsp;·&nbsp;{nights} night{nights !== 1 ? "s" : ""}
                &nbsp;·&nbsp;{groupSize} guest{groupSize !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="bg-[#FDF0E8] border border-[#E8D9B8] rounded-xl px-5 py-3 text-right">
              <div className="text-xs text-[#5C4230]">Estimated Total</div>
              <div className="text-xl font-bold text-[#C4622D]">KES {totalCost.toLocaleString()}</div>
              {activityCost > 0 && (
                <div className="text-[10px] text-[#5C4230] mt-0.5">
                  incl. KES {activityCost.toLocaleString()} activities
                </div>
              )}
            </div>
          </div>

          {/* ── Itinerary with activity planning ── */}
          <section>
            <h2 className="font-semibold text-[#3D2B1A] mb-3">Day-by-Day Itinerary</h2>
            <div className="space-y-3">
              {trip.itinerary.map((day) => {
                const isExpanded = expandedDay === day.day;
                const dayDate = new Date(trip.check_in);
                dayDate.setDate(dayDate.getDate() + day.day - 1);
                const dateStr = dayDate.toISOString().split("T")[0];

                return (
                  <div key={day.day} className="bg-white border border-[#E8D9B8] rounded-2xl overflow-hidden">
                    {/* Day header + base events */}
                    <div className="px-5 py-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#C4622D] mb-2">
                        Day {day.day} · {dayDate.toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                      {day.activities.length === 0 && (tripActivities[day.day] || []).length === 0 && !isExpanded && (
                        <p className="text-sm text-[#5C4230]">Free day — explore at your leisure</p>
                      )}
                      {day.activities.map((act, i) => (
                        <div key={i} className="flex gap-3 items-start text-sm text-[#3D2B1A] mb-2 last:mb-0">
                          <span className="text-[#C4622D] font-mono text-xs pt-0.5 w-10 shrink-0">{act.time}</span>
                          <div>
                            <span className="font-medium">{act.description}</span>
                            {act.service && (
                              <span className="ml-2 text-xs text-[#5C4230] bg-[#FAF6EF] px-2 py-0.5 rounded-full">
                                {act.service.location}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {(tripActivities[day.day] || []).map((act) => (
                        <div key={act.id} className="flex gap-3 items-start text-sm text-[#3D2B1A] mb-2 last:mb-0">
                          <span className="text-[#C4622D] font-mono text-xs pt-0.5 w-10 shrink-0">{act.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{act.name}</span>
                            {bookedIds.has(act.id) ? (
                              <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Booked</span>
                            ) : (
                              <span className="ml-2 text-[10px] bg-[#FDF0E8] text-[#C4622D] px-2 py-0.5 rounded-full border border-[#E8D9B8]">tap to book</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {activities.length > 0 && (
                        <button
                          onClick={() => {
                            setExpandedDay(isExpanded ? null : day.day);
                            setBookingActivity(null);
                          }}
                          className="mt-3 text-xs text-[#C4622D] font-medium flex items-center gap-1 hover:underline"
                        >
                          {isExpanded ? "▲ Hide Activities" : "▼ Plan Activities for this day"}
                        </button>
                      )}
                    </div>

                    {/* Activity panel */}
                    {isExpanded && (
                      <div className="border-t border-[#E8D9B8] bg-[#FAF6EF] px-5 py-5 space-y-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#5C4230]">
                          Suggested Activities in {trip.destination}
                        </p>

                        {/* Horizontal scroll activity cards */}
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                          {activities.map((act) => {
                            const isBooked = bookedIds.has(act.id);
                            const isAdded = (tripActivities[day.day] || []).some((a) => a.id === act.id);
                            return (
                              <div
                                key={act.id}
                                className={`shrink-0 w-52 bg-white rounded-xl border flex flex-col p-4 gap-2 transition-all ${
                                  isAdded ? "border-[#C4622D] bg-[#FDF9F5]" : "border-[#E8D9B8]"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl">{act.icon}</span>
                                  {isBooked && (
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                      ✓ Booked
                                    </span>
                                  )}
                                  {isAdded && !isBooked && (
                                    <span className="text-[10px] bg-[#FDF0E8] text-[#C4622D] px-2 py-0.5 rounded-full font-semibold border border-[#E8D9B8]">
                                      + Added
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-semibold text-sm text-[#3D2B1A] leading-tight">{act.name}</h4>
                                <div className="flex flex-wrap gap-1 text-[10px] text-[#5C4230]">
                                  <span className="bg-[#FAF6EF] border border-[#E8D9B8] px-1.5 py-0.5 rounded-full">{act.category}</span>
                                  <span>{act.duration}</span>
                                </div>
                                <p className="text-[10px] text-[#5C4230] leading-relaxed line-clamp-2">{act.description}</p>
                                <div className="text-[10px] text-[#5C4230]">⏰ {act.opening_hours}</div>
                                <div className="font-semibold text-sm text-[#C4622D] mt-auto">
                                  {act.entrance_fee === 0 ? "Free entry" : `KES ${act.entrance_fee.toLocaleString()}/adult`}
                                </div>
                                {!isAdded && !isBooked && (
                                  <button
                                    onClick={() => {
                                      setTripActivities((prev) => ({
                                        ...prev,
                                        [day.day]: [...(prev[day.day] || []), act],
                                      }));
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-full font-medium bg-[#C4622D] text-white hover:opacity-90 transition-all"
                                  >
                                    + Add to Trip
                                  </button>
                                )}
                                {isAdded && !isBooked && (
                                  <button
                                    onClick={() => {
                                      setTripActivities((prev) => ({
                                        ...prev,
                                        [day.day]: (prev[day.day] || []).filter((a) => a.id !== act.id),
                                      }));
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-full font-medium border border-[#C4622D] text-[#C4622D] hover:bg-[#FDF0E8] transition-all"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Added activities list + booking form */}
                        {(tripActivities[day.day] || []).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#5C4230]">
                              Added to Day {day.day}
                            </p>
                            {(tripActivities[day.day] || []).map((act) => {
                              const isBooked = bookedIds.has(act.id);
                              const isBookingThis = bookingActivity?.activity?.id === act.id && bookingActivity?.dayNum === day.day;
                              return (
                                <div key={act.id}>
                                  <div className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 ${isBookingThis ? "border-[#C4622D]" : "border-[#E8D9B8]"}`}>
                                    <span className="text-lg shrink-0">{act.icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-[#3D2B1A] truncate">{act.name}</p>
                                      <p className="text-[10px] text-[#5C4230]">{act.duration} · {act.entrance_fee === 0 ? "Free" : `KES ${act.entrance_fee.toLocaleString()}/adult`}</p>
                                    </div>
                                    {isBooked ? (
                                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold shrink-0">✓ Booked</span>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          if (isBookingThis) {
                                            setBookingActivity(null);
                                          } else {
                                            setBookingActivity({ activity: act, dayNum: day.day });
                                            setBookForm({
                                              date: dateStr,
                                              time: act.available_times?.[0] || "09:00",
                                              participants: Number(form.group_size) || 1,
                                            });
                                          }
                                        }}
                                        className={`shrink-0 text-xs px-4 py-1.5 rounded-full font-medium transition-all ${
                                          isBookingThis
                                            ? "bg-[#3D2B1A] text-white"
                                            : "bg-[#C4622D] text-white hover:opacity-90"
                                        }`}
                                      >
                                        {isBookingThis ? "Cancel" : "Book →"}
                                      </button>
                                    )}
                                  </div>
                                  {isBookingThis && (
                                    <div className="bg-white border border-[#C4622D] border-t-0 rounded-b-xl px-4 pb-4 pt-3 space-y-3 -mt-1">
                                      <div className="text-xs text-[#5C4230]">📍 {act.address}</div>
                                      <div className="grid grid-cols-3 gap-3">
                                        <div>
                                          <label className="text-xs text-[#5C4230] font-medium">Date</label>
                                          <input type="date" value={bookForm.date}
                                            onChange={(e) => setBookForm((f) => ({ ...f, date: e.target.value }))}
                                            className="w-full border border-[#E8D9B8] rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#C4622D]" />
                                        </div>
                                        <div>
                                          <label className="text-xs text-[#5C4230] font-medium">Time</label>
                                          <select value={bookForm.time}
                                            onChange={(e) => setBookForm((f) => ({ ...f, time: e.target.value }))}
                                            className="w-full border border-[#E8D9B8] rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#C4622D]">
                                            {(act.available_times || ["09:00"]).map((t) => (
                                              <option key={t} value={t}>{t}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-xs text-[#5C4230] font-medium">Visitors</label>
                                          <input type="number" min="1" max="20" value={bookForm.participants}
                                            onChange={(e) => setBookForm((f) => ({ ...f, participants: Number(e.target.value) }))}
                                            className="w-full border border-[#E8D9B8] rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#C4622D]" />
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between pt-1">
                                        <div>
                                          <div className="text-xs text-[#5C4230]">{bookForm.participants} × KES {act.entrance_fee.toLocaleString()}</div>
                                          <div className="text-base font-bold text-[#C4622D]">
                                            {act.entrance_fee === 0 ? "Free" : `Total: KES ${(act.entrance_fee * bookForm.participants).toLocaleString()}`}
                                          </div>
                                        </div>
                                        {act.entrance_fee === 0 ? (
                                          <button onClick={handleFreeBooking}
                                            className="bg-[#C4622D] text-white px-5 py-2.5 rounded-full text-sm font-medium">
                                            Confirm (Free)
                                          </button>
                                        ) : (
                                          <button onClick={() => setPayStep("method")}
                                            className="bg-[#C4622D] text-white px-5 py-2.5 rounded-full text-sm font-medium">
                                            Proceed to Pay →
                                          </button>
                                        )}
                                      </div>

                                    {/* Payment step */}
                                    {payStep === "method" && (
                                      <div className="border-t border-[#E8D9B8] pt-3 space-y-3">
                                        <p className="text-xs font-semibold text-[#5C4230]">Choose payment method</p>
                                        <div className="grid grid-cols-3 gap-2">
                                          {[
                                            { id: "mpesa",  label: "M-Pesa",      color: "#00A650", letter: "M" },
                                            { id: "airtel", label: "Airtel Money", color: "#E40000", letter: "A" },
                                            { id: "card",   label: "Visa / Card",  color: "#1A1F71", letter: "V" },
                                          ].map((m) => (
                                            <button key={m.id}
                                              onClick={() => { setPayMethod(m.id); setPayPhone(""); m.id === "card" ? handleCardPay() : setPayStep(m.id); }}
                                              className="flex flex-col items-center gap-1.5 border-2 border-[#E8D9B8] rounded-xl py-3 text-xs font-semibold text-[#5C4230] bg-white hover:border-[#C4622D] hover:text-[#3D2B1A] transition-all">
                                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                                                style={{ backgroundColor: m.color }}>
                                                {m.letter}
                                              </div>
                                              {m.label}
                                            </button>
                                          ))}
                                        </div>
                                        <button onClick={closePayment} className="text-xs text-[#5C4230] hover:underline w-full text-center">Cancel</button>
                                      </div>
                                    )}
                                    {(payStep === "mpesa" || payStep === "airtel") && (
                                      <div className="border-t border-[#E8D9B8] pt-3 space-y-3">
                                        <p className="text-xs font-semibold text-[#5C4230]">
                                          {payStep === "mpesa" ? "M-Pesa" : "Airtel Money"} — Enter phone number
                                        </p>
                                        <input type="tel" value={payPhone}
                                          onChange={(e) => setPayPhone(e.target.value)}
                                          placeholder={payStep === "mpesa" ? "e.g. 0712345678" : "e.g. 0733123456"}
                                          className="w-full border border-[#E8D9B8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4622D]" />
                                        <p className="text-[11px] text-[#5C4230]">
                                          {payStep === "mpesa"
                                            ? "You'll receive a Safaricom STK prompt — enter your M-Pesa PIN."
                                            : "You'll receive an Airtel Money prompt — enter your PIN to confirm."}
                                        </p>
                                        <div className="flex gap-2">
                                          <button onClick={() => setPayStep("method")} className="text-xs text-[#5C4230] hover:underline">← Back</button>
                                          <button onClick={() => handleMobilePay(payStep)}
                                            className="flex-1 text-white py-2 rounded-full text-sm font-medium"
                                            style={{ backgroundColor: payStep === "mpesa" ? "#00A650" : "#E40000" }}>
                                            Send {payStep === "mpesa" ? "M-Pesa" : "Airtel"} Request
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                    {(payStep === "polling" || payStep === "card_redirect") && (
                                      <div className="border-t border-[#E8D9B8] pt-3 text-center space-y-2">
                                        <div className="animate-spin inline-block w-5 h-5 border-2 border-[#C4622D] border-t-transparent rounded-full" />
                                        <p className="text-xs text-[#5C4230]">
                                          {payStep === "card_redirect"
                                            ? "Complete payment in the tab that just opened. Waiting for confirmation..."
                                            : payMethod === "airtel"
                                            ? `Airtel prompt sent to ${payPhone}. Enter your PIN to complete payment.`
                                            : `M-Pesa request sent to ${payPhone}. Enter your PIN to complete payment.`}
                                        </p>
                                        <button onClick={closePayment} className="text-xs text-red-400 hover:underline">Cancel</button>
                                      </div>
                                    )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Getting There */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#5C4230] mb-2">
                            Getting There {selectedAccom ? `from ${selectedAccom.title}` : ""}
                          </p>
                          {selectedTransport ? (
                            <div className="flex items-center gap-3 bg-white border border-[#E8D9B8] rounded-xl p-3">
                              <div className="w-10 h-10 bg-[#E8D9B8] rounded-lg flex items-center justify-center text-xl shrink-0">🚐</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#3D2B1A] truncate">{selectedTransport.title}</p>
                                <p className="text-xs text-[#5C4230]">{selectedTransport.location} · {selectedTransport.pricing_type}</p>
                              </div>
                              <div className="text-sm font-semibold text-[#C4622D] shrink-0">
                                KES {selectedTransport.price.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-[#5C4230] bg-white border border-[#E8D9B8] rounded-xl px-4 py-3">
                              No transport selected — choose a transport option in the section below to see it here.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Accommodation picker */}
          {hasAccom ? (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-[#3D2B1A]">Choose Accommodation</h2>
                <span className="text-xs text-[#5C4230]">
                  {trip.recommended_accommodation.length} option{trip.recommended_accommodation.length !== 1 ? "s" : ""} in {trip.destination}
                </span>
              </div>
              <div className="space-y-3">
                {trip.recommended_accommodation.map((svc, idx) => (
                  <ServiceCard key={svc.id} service={svc} selected={selectedAccomIdx === idx}
                    onSelect={() => { setSelectedAccomIdx(idx); setEditingAccom(false); }} />
                ))}
              </div>
              {selectedAccomIdx !== null && (
                <div className="mt-3 bg-[#FDF0E8] rounded-xl border border-[#E8D9B8] px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#3D2B1A]">Accommodation dates</span>
                    <button onClick={() => setEditingAccom((v) => !v)} className="text-xs text-[#C4622D] hover:underline">
                      {editingAccom ? "Done" : "Edit dates"}
                    </button>
                  </div>
                  {editingAccom ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#5C4230]">Check-in</label>
                        <input type="date" value={accomDates.check_in}
                          onChange={(e) => setAccomDates((d) => ({ ...d, check_in: e.target.value }))}
                          className="w-full border border-[#E8D9B8] rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#C4622D]" />
                      </div>
                      <div>
                        <label className="text-xs text-[#5C4230]">Check-out</label>
                        <input type="date" value={accomDates.check_out} min={accomDates.check_in}
                          onChange={(e) => setAccomDates((d) => ({ ...d, check_out: e.target.value }))}
                          className="w-full border border-[#E8D9B8] rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#C4622D]" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#5C4230]">
                      {new Date(accomDates.check_in).toLocaleDateString()} → {new Date(accomDates.check_out).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </section>
          ) : (
            <section>
              <h2 className="font-semibold text-[#3D2B1A] mb-3">Accommodation</h2>
              <div className="bg-white border border-[#E8D9B8] rounded-2xl px-5 py-8 text-center">
                <div className="text-3xl mb-3">🏨</div>
                <p className="text-sm text-[#5C4230]">
                  No accommodations found in <span className="font-medium text-[#3D2B1A]">{trip.destination}</span>.
                  Try a different destination or broaden your search.
                </p>
              </div>
            </section>
          )}

          {/* Transport picker */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-[#3D2B1A]">Transport</h2>
              {hasTransport && (
                <button
                  onClick={() => setSelectedTransportIdx(null)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    selectedTransportIdx === null
                      ? "border-[#C4622D] bg-[#FDF0E8] text-[#C4622D]"
                      : "border-[#E8D9B8] text-[#5C4230] hover:border-[#C4622D]"
                  }`}
                >
                  No transport needed
                </button>
              )}
            </div>
            {!hasTransport ? (
              <p className="text-sm text-[#5C4230] bg-white border border-[#E8D9B8] rounded-2xl px-5 py-4">
                No transport options found. You can arrange your own.
              </p>
            ) : (
              <div className="space-y-3">
                {trip.recommended_transport.map((svc, idx) => (
                  <ServiceCard key={svc.id} service={svc} selected={selectedTransportIdx === idx}
                    onSelect={() => { setSelectedTransportIdx(idx); setEditingTransport(false); }} />
                ))}
              </div>
            )}
            {selectedTransportIdx !== null && hasTransport && (
              <div className="mt-3 bg-[#FDF0E8] rounded-xl border border-[#E8D9B8] px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#3D2B1A]">Transport date</span>
                  <button onClick={() => setEditingTransport((v) => !v)} className="text-xs text-[#C4622D] hover:underline">
                    {editingTransport ? "Done" : "Edit date"}
                  </button>
                </div>
                {editingTransport ? (
                  <div>
                    <label className="text-xs text-[#5C4230]">Departure date</label>
                    <input type="date" value={transportDate.check_in}
                      onChange={(e) => setTransportDate({ check_in: e.target.value, check_out: e.target.value })}
                      className="w-full border border-[#E8D9B8] rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#C4622D]" />
                  </div>
                ) : (
                  <p className="text-sm text-[#5C4230]">
                    Departure: {new Date(transportDate.check_in).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Action bar */}
          <div className="bg-white border border-[#E8D9B8] rounded-2xl p-6 flex flex-col sm:flex-row gap-3 items-center justify-between sticky bottom-4 shadow-lg">
            <div className="text-sm text-[#5C4230] text-center sm:text-left">
              {nothingSelected
                ? "No services selected — using your own accommodation & transport"
                : `${[selectedAccom, selectedTransport].filter(Boolean).length} service${[selectedAccom, selectedTransport].filter(Boolean).length !== 1 ? "s" : ""} selected`}
            </div>
            <div className="flex gap-3">
              <button onClick={onSave} disabled={saving}
                className="border border-[#C4622D] text-[#C4622D] px-6 py-2.5 rounded-full text-sm font-medium disabled:opacity-50 hover:bg-[#FDF0E8]">
                {saving ? "Saving..." : "Save Trip"}
              </button>
              <button onClick={onAddToCart} disabled={addingToCart}
                className="bg-[#C4622D] text-white px-6 py-2.5 rounded-full text-sm font-medium disabled:opacity-50">
                {addingToCart ? "Adding..." : "Add to Cart →"}
              </button>
            </div>
          </div>

        </div>{/* end right panel */}
      </div>{/* end grid */}
    </div>
  );
}

/* ─── Sidebar route card ────────────────────────────────────────────── */
function RouteCard({ service }) {
  const TYPE_ICON = { accommodation: "🏡", transport: "🚐" };
  return (
    <div className="bg-white rounded-xl border border-[#E8D9B8] overflow-hidden">
      {service.images?.[0] ? (
        <img src={service.images[0]} alt={service.title} className="w-full h-24 object-cover" />
      ) : (
        <div className="w-full h-24 bg-[#E8D9B8] flex items-center justify-center text-3xl">
          {TYPE_ICON[service.type] || "📍"}
        </div>
      )}
      <div className="p-3">
        <div className="text-[10px] uppercase tracking-wide text-[#5C4230] mb-0.5">
          {TYPE_ICON[service.type]} {service.type}
        </div>
        <h4 className="text-xs font-semibold text-[#3D2B1A] leading-tight truncate">{service.title}</h4>
        <p className="text-[10px] text-[#5C4230] mt-0.5 truncate">{service.location}</p>
        <p className="text-xs font-medium text-[#C4622D] mt-1">KES {service.price.toLocaleString()}</p>
      </div>
    </div>
  );
}

/* ─── Selectable service card ───────────────────────────────────────── */
function ServiceCard({ service, selected, onSelect }) {
  return (
    <button type="button" onClick={onSelect}
      className={`w-full text-left bg-white rounded-2xl border overflow-hidden flex transition-all ${
        selected ? "border-[#C4622D] ring-1 ring-[#C4622D]" : "border-[#E8D9B8] hover:border-[#C4622D]"
      }`}
    >
      {service.images?.[0] ? (
        <img src={service.images[0]} alt={service.title} className="w-24 object-cover shrink-0" />
      ) : (
        <div className="w-24 bg-[#E8D9B8] flex items-center justify-center text-2xl shrink-0">
          {service.type === "transport" ? "🚐" : "🏡"}
        </div>
      )}
      <div className="p-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-[#3D2B1A] text-sm truncate">{service.title}</h3>
            <p className="text-[#5C4230] text-xs mt-0.5">{service.location}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[#C4622D] font-semibold text-sm">KES {service.price.toLocaleString()}</div>
            <div className="text-xs text-[#5C4230]">/{service.pricing_type}</div>
          </div>
        </div>
        {service.amenities?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {service.amenities.slice(0, 4).map((a) => (
              <span key={a} className="text-[10px] bg-[#FAF6EF] text-[#5C4230] px-2 py-0.5 rounded-full border border-[#E8D9B8]">{a}</span>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center gap-1 text-xs text-[#5C4230]">
          <span className="text-yellow-500">★</span>{service.rating}
          {selected && <span className="ml-auto text-[#C4622D] font-medium text-xs">✓ Selected</span>}
        </div>
      </div>
    </button>
  );
}
