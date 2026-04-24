import { useState, useContext, useEffect, useRef } from "react";
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
  const [tripActivities, setTripActivities] = useState({});
  const [bookedIds, setBookedIds] = useState(new Set());

  const [selectedAccomId, setSelectedAccomId] = useState(null);
  const [selectedTransportId, setSelectedTransportId] = useState(null);
  const [accomDates, setAccomDates] = useState({ check_in: "", check_out: "" });
  const [transportDate, setTransportDate] = useState({ check_in: "", check_out: "" });
  const [editingAccom, setEditingAccom] = useState(false);
  const [editingTransport, setEditingTransport] = useState(false);

  const pendingActionRef = useRef(null);

  // Restore trip state when returning from login
  useEffect(() => {
    const raw = localStorage.getItem("afristayhub_pending_trip");
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      setForm(saved.form);
      setOrigin(saved.origin || "");
      setTrip(saved.trip);
      setActivities(saved.activities || []);
      setSelectedAccomId(saved.selectedAccomId || null);
      setSelectedTransportId(saved.selectedTransportId || null);
      setAccomDates(saved.accomDates || { check_in: "", check_out: "" });
      setTransportDate(saved.transportDate || { check_in: "", check_out: "" });
      setTripActivities(saved.tripActivities || {});
      setBookedIds(new Set(saved.bookedIds || []));
      setStep("results");
      pendingActionRef.current = saved.pendingAction || null;
    } catch {
      localStorage.removeItem("afristayhub_pending_trip");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Execute pending action once the user is logged in and trip state is restored
  useEffect(() => {
    if (!user || !trip || !pendingActionRef.current) return;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action === "addToCart") handleAddToCart();
    else if (action === "saveTrip") handleSaveTrip();
  }, [user, trip]); // eslint-disable-line react-hooks/exhaustive-deps

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
            { headers: { "Accept-Language": "en", "User-Agent": "AfriStayHub-TripPlanner/1.0" } }
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
    if (form.check_out < form.check_in) { toast.error("Check-out must be on or after check-in"); return; }
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
      setSelectedAccomId(result.recommended_accommodation[0]?.id ?? null);
      setSelectedTransportId(result.recommended_transport[0]?.id ?? null);
      setAccomDates({ check_in: form.check_in, check_out: form.check_out });
      setTransportDate({ check_in: form.check_in, check_out: form.check_in });
      setTripActivities({});
      setBookedIds(new Set());
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

  function saveTripToSession(pendingAction) {
    localStorage.setItem("afristayhub_pending_trip", JSON.stringify({
      form, origin, trip, activities,
      selectedAccomId, selectedTransportId,
      accomDates, transportDate,
      tripActivities,
      bookedIds: [...bookedIds],
      pendingAction,
    }));
  }

  async function handleSaveTrip() {
    if (!user) {
      saveTripToSession("saveTrip");
      navigate("/login", { state: { from: { pathname: "/trip-planner" } } });
      return;
    }
    setSaving(true);
    try {
      const seen = new Set();
      const allSvcs = [...trip.recommended_accommodation, ...trip.recommended_transport, ...(trip.along_route_suggestions || [])]
        .filter(s => seen.has(s.id) ? false : seen.add(s.id));
      const accom = allSvcs.find(s => s.id === selectedAccomId) || null;
      const transport = allSvcs.find(s => s.id === selectedTransportId) || null;
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
      localStorage.removeItem("afristayhub_pending_trip");
    } catch (err) {
      toast.error(err.message || "Failed to save trip");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddToCart() {
    if (!user) {
      saveTripToSession("addToCart");
      navigate("/login", { state: { from: { pathname: "/trip-planner" } } });
      return;
    }
    setAddingToCart(true);
    let added = 0;
    try {
      const seen = new Set();
      const allSvcs = [...trip.recommended_accommodation, ...trip.recommended_transport, ...(trip.along_route_suggestions || [])]
        .filter(s => seen.has(s.id) ? false : seen.add(s.id));
      const accom = allSvcs.find(s => s.id === selectedAccomId) || null;
      const transport = allSvcs.find(s => s.id === selectedTransportId) || null;

      if (accom) {
        await cartService.addItem({
          service_id: accom.id,
          check_in: accomDates.check_in || trip.check_in,
          check_out: accomDates.check_out || trip.check_out,
          quantity: Number(form.group_size),
        });
        added++;
      }
      if (transport) {
        await cartService.addItem({
          service_id: transport.id,
          check_in: transportDate.check_in || trip.check_in,
          check_out: transportDate.check_out || trip.check_in,
          quantity: Number(form.group_size),
        });
        added++;
      }

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
      localStorage.removeItem("afristayhub_pending_trip");
      navigate("/cart");
    } catch (err) {
      toast.error(err.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] overflow-x-hidden">
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
          selectedAccomId={selectedAccomId}
          setSelectedAccomId={setSelectedAccomId}
          selectedTransportId={selectedTransportId}
          setSelectedTransportId={setSelectedTransportId}
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

/* ─── Step 2: Results — 3-column layout ────────────────────────────── */
function ResultsStep({
  trip, form, activities,
  tripActivities, setTripActivities, bookedIds, setBookedIds,
  user, navigate,
  selectedAccomId, setSelectedAccomId,
  selectedTransportId, setSelectedTransportId,
  accomDates, setAccomDates,
  transportDate, setTransportDate,
  editingAccom, setEditingAccom,
  editingTransport, setEditingTransport,
  onBack, onSave, onAddToCart, saving, addingToCart,
}) {
  const allRouteServices = (() => {
    const seen = new Set();
    return [
      ...trip.recommended_accommodation,
      ...trip.recommended_transport,
      ...(trip.along_route_suggestions || []),
    ].filter(s => seen.has(s.id) ? false : seen.add(s.id));
  })();

  const selectedAccom = allRouteServices.find(s => s.id === selectedAccomId) || null;
  const selectedTransport = allRouteServices.find(s => s.id === selectedTransportId) || null;

  const nights = trip.nights;
  const groupSize = Number(form.group_size);
  const accomCost = selectedAccom ? selectedAccom.price * nights * groupSize : 0;
  const transportCost = selectedTransport ? selectedTransport.price * groupSize : 0;
  const activityCost = Object.values(tripActivities).flat()
    .reduce((sum, act) => sum + act.entrance_fee * groupSize, 0);
  const totalCost = accomCost + transportCost + activityCost;
  const nothingSelected = selectedAccomId === null && selectedTransportId === null;

  const [filters, setFilters] = useState({ type: "all", priceMin: "", priceMax: "", locality: "", minRating: 0 });

  const filteredServices = allRouteServices.filter(s => {
    if (filters.type !== "all" && s.type !== filters.type) return false;
    if (filters.priceMin !== "" && s.price < Number(filters.priceMin)) return false;
    if (filters.priceMax !== "" && s.price > Number(filters.priceMax)) return false;
    if (filters.locality.trim() && !s.location?.toLowerCase().includes(filters.locality.toLowerCase())) return false;
    if (filters.minRating > 0 && (s.rating ?? 0) < filters.minRating) return false;
    return true;
  });

  const [expandedDay, setExpandedDay] = useState(null);
  const [expandedServicesDay, setExpandedServicesDay] = useState(null);
  const [bookingActivity, setBookingActivity] = useState(null);
  const [bookForm, setBookForm] = useState({ date: "", time: "", participants: 1 });
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

  function onSelectService(svc) {
    if (svc.type === "accommodation") {
      setSelectedAccomId(prev => prev === svc.id ? null : svc.id);
      setEditingAccom(false);
    } else {
      setSelectedTransportId(prev => prev === svc.id ? null : svc.id);
      setEditingTransport(false);
    }
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto py-10 px-4 box-border">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-5 items-start">

        {/* ── Column 1: Filter Panel ── */}
        <aside className="lg:sticky lg:top-6 order-3 lg:order-1 min-w-0">
          <FilterPanel filters={filters} onFilterChange={setFilters} />
        </aside>

        {/* ── Column 2: Middle (header + itinerary + services) ── */}
        <div className="min-w-0 space-y-8 order-1 lg:order-2">

          {/* Header */}
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

          {/* ── Day-by-Day Itinerary ── */}
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
                    <div className="px-5 py-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#C4622D] mb-2">
                        Day {day.day} · {dayDate.toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                      {day.activities.length === 0 && (tripActivities[day.day] || []).length === 0 && !isExpanded && (
                        <p className="text-sm text-[#5C4230]">Free day — explore at your leisure</p>
                      )}
                      {day.activities.map((act, i) => {
                        const isCheckIn = act.type === "check_in";
                        const isTransportAct = act.type === "transport";
                        const displayDesc = isCheckIn
                          ? `Check in at ${selectedAccom?.title || act.service?.title || "your accommodation"}`
                          : isTransportAct
                          ? `Travel to ${trip.destination}${selectedTransport ? ` via ${selectedTransport.title}` : ""}`
                          : act.description;
                        const displayLocation = isCheckIn
                          ? (selectedAccom?.location || act.service?.location)
                          : isTransportAct
                          ? (selectedTransport?.location || act.service?.location)
                          : act.service?.location;
                        return (
                          <div key={i} className="flex gap-3 items-start text-sm text-[#3D2B1A] mb-2 last:mb-0">
                            <span className="text-[#C4622D] font-mono text-xs pt-0.5 w-10 shrink-0">{act.time}</span>
                            <div>
                              <span className="font-medium">{displayDesc}</span>
                              {displayLocation && (
                                <span className="ml-2 text-xs text-[#5C4230] bg-[#FAF6EF] px-2 py-0.5 rounded-full">
                                  {displayLocation}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                      <button
                        onClick={() => setExpandedServicesDay(expandedServicesDay === day.day ? null : day.day)}
                        className="mt-2 text-xs text-[#5C4230] font-medium flex items-center gap-1 hover:text-[#C4622D] hover:underline"
                      >
                        {expandedServicesDay === day.day ? "▲ Hide Stays & Transport" : "▼ Change Stays & Transport"}
                      </button>
                    </div>

                    {expandedServicesDay === day.day && (
                      <div className="border-t border-[#E8D9B8] bg-[#FAF6EF] px-5 py-5 space-y-5">

                        {/* Accommodation picker */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#5C4230] mb-2">Accommodation</p>
                          {trip.recommended_accommodation.length === 0 ? (
                            <p className="text-xs text-[#5C4230]">No accommodation options found for this destination.</p>
                          ) : (
                            <div className="space-y-2">
                              {trip.recommended_accommodation.map((svc) => {
                                const isSel = svc.id === selectedAccomId;
                                return (
                                  <button key={svc.id} type="button"
                                    onClick={() => { setSelectedAccomId(isSel ? null : svc.id); setEditingAccom(false); }}
                                    className={`w-full text-left flex items-center gap-3 bg-white rounded-xl border p-3 transition-all ${isSel ? "border-[#C4622D] ring-1 ring-[#C4622D]" : "border-[#E8D9B8] hover:border-[#C4622D]"}`}
                                  >
                                    {svc.images?.[0] ? (
                                      <img src={svc.images[0]} alt={svc.title} className="w-14 h-14 object-cover rounded-lg shrink-0" />
                                    ) : (
                                      <div className="w-14 h-14 bg-[#E8D9B8] rounded-lg flex items-center justify-center text-xl shrink-0">🏡</div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-[#3D2B1A] truncate">{svc.title}</p>
                                      <p className="text-xs text-[#5C4230]">{svc.location}</p>
                                      <p className="text-xs font-semibold text-[#C4622D] mt-0.5">KES {svc.price.toLocaleString()}/night · ★ {svc.rating}</p>
                                    </div>
                                    <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-semibold ${isSel ? "bg-[#C4622D] text-white" : "bg-[#FAF6EF] text-[#5C4230]"}`}>
                                      {isSel ? "✓ Selected" : "Select"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Transport picker */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#5C4230] mb-2">Transport Options</p>
                          {trip.recommended_transport.length === 0 ? (
                            <p className="text-xs text-[#5C4230]">No transport options available for this route.</p>
                          ) : (
                            <div className="space-y-2">
                              {trip.recommended_transport.map((svc) => {
                                const isSel = svc.id === selectedTransportId;
                                return (
                                  <button key={svc.id} type="button"
                                    onClick={() => { setSelectedTransportId(isSel ? null : svc.id); setEditingTransport(false); }}
                                    className={`w-full text-left flex items-center gap-3 bg-white rounded-xl border p-3 transition-all ${isSel ? "border-[#C4622D] ring-1 ring-[#C4622D]" : "border-[#E8D9B8] hover:border-[#C4622D]"}`}
                                  >
                                    {svc.images?.[0] ? (
                                      <img src={svc.images[0]} alt={svc.title} className="w-14 h-14 object-cover rounded-lg shrink-0" />
                                    ) : (
                                      <div className="w-14 h-14 bg-[#E8D9B8] rounded-lg flex items-center justify-center text-xl shrink-0">🚐</div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-[#3D2B1A] truncate">{svc.title}</p>
                                      <p className="text-xs text-[#5C4230]">{svc.location} · {svc.pricing_type}</p>
                                      <p className="text-xs font-semibold text-[#C4622D] mt-0.5">KES {svc.price.toLocaleString()} · ★ {svc.rating}</p>
                                    </div>
                                    <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-semibold ${isSel ? "bg-[#C4622D] text-white" : "bg-[#FAF6EF] text-[#5C4230]"}`}>
                                      {isSel ? "✓ Selected" : "Select"}
                                    </span>
                                  </button>
                                );
                              })}
                              {selectedTransportId !== null && (
                                <button type="button"
                                  onClick={() => setSelectedTransportId(null)}
                                  className="w-full text-xs text-[#5C4230] border border-dashed border-[#E8D9B8] rounded-xl py-2.5 hover:border-[#C4622D] hover:text-[#C4622D] transition-all"
                                >
                                  No transport needed
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="border-t border-[#E8D9B8] bg-[#FAF6EF] px-5 py-5 space-y-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#5C4230]">
                          Suggested Activities in {trip.destination}
                        </p>

                        <div className="flex gap-3 overflow-x-auto pb-2">
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
                              No transport selected — pick one from the services panel below.
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

          {/* ── All Services on This Route ── */}
          <AllServicesSection
            services={filteredServices}
            allCount={allRouteServices.length}
            selectedAccomId={selectedAccomId}
            selectedTransportId={selectedTransportId}
            onSelectService={onSelectService}
          />

        </div>{/* end middle column */}

        {/* ── Column 3: Trip Planner Card ── */}
        <aside className="lg:sticky lg:top-6 order-2 lg:order-3 min-w-0">
          <TripPlannerCard
            selectedAccom={selectedAccom}
            selectedTransport={selectedTransport}
            accomCost={accomCost}
            transportCost={transportCost}
            activityCost={activityCost}
            totalCost={totalCost}
            nights={nights}
            groupSize={groupSize}
            nothingSelected={nothingSelected}
            accomDates={accomDates}
            setAccomDates={setAccomDates}
            transportDate={transportDate}
            setTransportDate={setTransportDate}
            editingAccom={editingAccom}
            setEditingAccom={setEditingAccom}
            editingTransport={editingTransport}
            setEditingTransport={setEditingTransport}
            tripActivities={tripActivities}
            onSave={onSave}
            onAddToCart={onAddToCart}
            saving={saving}
            addingToCart={addingToCart}
          />
        </aside>

      </div>
    </div>
  );
}

/* ─── All Services Section ──────────────────────────────────────────── */
function AllServicesSection({ services, allCount, selectedAccomId, selectedTransportId, onSelectService }) {
  const TYPE_ICON = { accommodation: "🏡", transport: "🚐" };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-[#3D2B1A]">All Services on This Route</h2>
        <span className="text-xs text-[#5C4230] bg-[#FAF6EF] border border-[#E8D9B8] px-3 py-1 rounded-full">
          {services.length} of {allCount}
        </span>
      </div>
      {services.length === 0 ? (
        <div className="bg-white border border-[#E8D9B8] rounded-2xl px-5 py-10 text-center">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-sm text-[#5C4230]">No services match your filters.</p>
          <p className="text-xs text-[#5C4230] mt-1">Try adjusting the filters on the left.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => {
            const isSelectedAccom = svc.id === selectedAccomId;
            const isSelectedTransport = svc.id === selectedTransportId;
            const isSelected = isSelectedAccom || isSelectedTransport;
            return (
              <div
                key={svc.id}
                className={`bg-white rounded-2xl border overflow-hidden flex transition-all ${
                  isSelected ? "border-[#C4622D] ring-1 ring-[#C4622D]" : "border-[#E8D9B8]"
                }`}
              >
                {svc.images?.[0] ? (
                  <img src={svc.images[0]} alt={svc.title} className="w-24 h-auto object-cover shrink-0" />
                ) : (
                  <div className="w-24 bg-[#E8D9B8] flex items-center justify-center text-2xl shrink-0 min-h-[90px]">
                    {TYPE_ICON[svc.type] || "📍"}
                  </div>
                )}
                <div className="p-4 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wide text-[#5C4230] mb-0.5">
                        {TYPE_ICON[svc.type]} {svc.type}
                      </div>
                      <h3 className="font-semibold text-[#3D2B1A] text-sm truncate">{svc.title}</h3>
                      <p className="text-[#5C4230] text-xs mt-0.5">{svc.location}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[#C4622D] font-semibold text-sm">KES {svc.price.toLocaleString()}</div>
                      <div className="text-xs text-[#5C4230]">/{svc.pricing_type}</div>
                    </div>
                  </div>
                  {svc.amenities?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {svc.amenities.slice(0, 4).map((a) => (
                        <span key={a} className="text-[10px] bg-[#FAF6EF] text-[#5C4230] px-2 py-0.5 rounded-full border border-[#E8D9B8]">{a}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-[#5C4230]"><span className="text-yellow-500">★</span> {svc.rating}</span>
                    <button
                      onClick={() => onSelectService(svc)}
                      className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all shrink-0 ${
                        isSelected
                          ? "border border-[#C4622D] text-[#C4622D] bg-[#FDF0E8]"
                          : "bg-[#C4622D] text-white hover:opacity-90"
                      }`}
                    >
                      {isSelected
                        ? (svc.type === "accommodation" ? "✓ Stay Selected" : "✓ Transport Selected")
                        : (svc.type === "accommodation" ? "Select Stay" : "Select Transport")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ─── Filter Panel ──────────────────────────────────────────────────── */
const INIT_FILTERS = { type: "all", priceMin: "", priceMax: "", locality: "", minRating: 0 };

function FilterPanel({ filters, onFilterChange }) {
  const isActive =
    filters.type !== "all" ||
    filters.priceMin !== "" ||
    filters.priceMax !== "" ||
    filters.locality.trim() !== "" ||
    filters.minRating > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E8D9B8] p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[#3D2B1A] text-sm">Filter Services</h2>
        {isActive && (
          <button
            onClick={() => onFilterChange(INIT_FILTERS)}
            className="text-xs text-[#C4622D] hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* Type */}
      <div>
        <p className="text-xs font-medium text-[#5C4230] mb-2">Type</p>
        <div className="flex flex-col gap-1.5">
          {[
            { value: "all", label: "All" },
            { value: "accommodation", label: "🏡 Accommodation" },
            { value: "transport", label: "🚐 Transport" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange({ ...filters, type: opt.value })}
              className={`text-left text-xs px-3 py-2 rounded-xl border transition-all ${
                filters.type === opt.value
                  ? "border-[#C4622D] bg-[#FDF0E8] text-[#C4622D] font-semibold"
                  : "border-[#E8D9B8] text-[#5C4230] hover:border-[#C4622D]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-xs font-medium text-[#5C4230] mb-2">Price (KES)</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[#5C4230]">Min</label>
            <input
              type="number" value={filters.priceMin} placeholder="0"
              onChange={(e) => onFilterChange({ ...filters, priceMin: e.target.value })}
              className="w-full border border-[#E8D9B8] rounded-lg px-2 py-1.5 text-xs mt-0.5 focus:outline-none focus:border-[#C4622D]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#5C4230]">Max</label>
            <input
              type="number" value={filters.priceMax} placeholder="Any"
              onChange={(e) => onFilterChange({ ...filters, priceMax: e.target.value })}
              className="w-full border border-[#E8D9B8] rounded-lg px-2 py-1.5 text-xs mt-0.5 focus:outline-none focus:border-[#C4622D]"
            />
          </div>
        </div>
      </div>

      {/* Locality */}
      <div>
        <p className="text-xs font-medium text-[#5C4230] mb-1.5">Location</p>
        <input
          type="text" value={filters.locality} placeholder="Filter by location…"
          onChange={(e) => onFilterChange({ ...filters, locality: e.target.value })}
          className="w-full border border-[#E8D9B8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C4622D]"
        />
      </div>

      {/* Min rating */}
      <div>
        <p className="text-xs font-medium text-[#5C4230] mb-2">Min Rating</p>
        <div className="flex gap-1.5 flex-wrap">
          {[0, 1, 2, 3, 4].map((r) => (
            <button
              key={r}
              onClick={() => onFilterChange({ ...filters, minRating: r })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                filters.minRating === r
                  ? "border-[#C4622D] bg-[#FDF0E8] text-[#C4622D] font-semibold"
                  : "border-[#E8D9B8] text-[#5C4230] hover:border-[#C4622D]"
              }`}
            >
              {r === 0 ? "Any" : `${"★".repeat(r)}+`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Trip Planner Card ─────────────────────────────────────────────── */
function TripPlannerCard({
  selectedAccom, selectedTransport,
  accomCost, transportCost, activityCost, totalCost,
  nights, groupSize, nothingSelected,
  accomDates, setAccomDates,
  transportDate, setTransportDate,
  editingAccom, setEditingAccom,
  editingTransport, setEditingTransport,
  tripActivities,
  onSave, onAddToCart, saving, addingToCart,
}) {
  const activityList = Object.values(tripActivities).flat();

  return (
    <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5 space-y-5">
      <h2 className="font-semibold text-[#3D2B1A]">Your Trip Plan</h2>

      {/* Accommodation */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5C4230] mb-2">Accommodation</p>
        {selectedAccom ? (
          <div className="space-y-2">
            <div className="flex gap-3 items-start bg-[#FAF6EF] border border-[#E8D9B8] rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#3D2B1A] truncate">{selectedAccom.title}</p>
                <p className="text-xs text-[#5C4230]">{selectedAccom.location}</p>
              </div>
              <div className="text-[#C4622D] font-semibold text-xs shrink-0 text-right">
                KES {accomCost.toLocaleString()}
                <div className="text-[10px] text-[#5C4230] font-normal">{nights}n × {groupSize}</div>
              </div>
            </div>
            <div className="bg-[#FDF0E8] rounded-xl border border-[#E8D9B8] px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#3D2B1A]">Stay dates</span>
                <button onClick={() => setEditingAccom((v) => !v)} className="text-[10px] text-[#C4622D] hover:underline">
                  {editingAccom ? "Done" : "Edit dates"}
                </button>
              </div>
              {editingAccom ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#5C4230]">Check-in</label>
                    <input type="date" value={accomDates.check_in}
                      onChange={(e) => setAccomDates((d) => ({ ...d, check_in: e.target.value }))}
                      className="w-full border border-[#E8D9B8] rounded-lg px-2 py-1.5 text-xs mt-0.5 focus:outline-none focus:border-[#C4622D]" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#5C4230]">Check-out</label>
                    <input type="date" value={accomDates.check_out} min={accomDates.check_in}
                      onChange={(e) => setAccomDates((d) => ({ ...d, check_out: e.target.value }))}
                      className="w-full border border-[#E8D9B8] rounded-lg px-2 py-1.5 text-xs mt-0.5 focus:outline-none focus:border-[#C4622D]" />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#5C4230]">
                  {new Date(accomDates.check_in).toLocaleDateString()} → {new Date(accomDates.check_out).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#5C4230] bg-[#FAF6EF] border border-[#E8D9B8] rounded-xl px-3 py-3">
            No accommodation selected — use the services panel to pick one.
          </p>
        )}
      </div>

      {/* Transport */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5C4230] mb-2">Transport</p>
        {selectedTransport ? (
          <div className="space-y-2">
            <div className="flex gap-3 items-start bg-[#FAF6EF] border border-[#E8D9B8] rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#3D2B1A] truncate">{selectedTransport.title}</p>
                <p className="text-xs text-[#5C4230]">{selectedTransport.location}</p>
              </div>
              <div className="text-[#C4622D] font-semibold text-xs shrink-0 text-right">
                KES {transportCost.toLocaleString()}
                <div className="text-[10px] text-[#5C4230] font-normal">×{groupSize}</div>
              </div>
            </div>
            <div className="bg-[#FDF0E8] rounded-xl border border-[#E8D9B8] px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#3D2B1A]">Departure date</span>
                <button onClick={() => setEditingTransport((v) => !v)} className="text-[10px] text-[#C4622D] hover:underline">
                  {editingTransport ? "Done" : "Edit date"}
                </button>
              </div>
              {editingTransport ? (
                <div>
                  <label className="text-[10px] text-[#5C4230]">Departure</label>
                  <input type="date" value={transportDate.check_in}
                    onChange={(e) => setTransportDate({ check_in: e.target.value, check_out: e.target.value })}
                    className="w-full border border-[#E8D9B8] rounded-lg px-2 py-1.5 text-xs mt-0.5 focus:outline-none focus:border-[#C4622D]" />
                </div>
              ) : (
                <p className="text-xs text-[#5C4230]">
                  {new Date(transportDate.check_in).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#5C4230] bg-[#FAF6EF] border border-[#E8D9B8] rounded-xl px-3 py-3">
            No transport selected — use the services panel to pick one.
          </p>
        )}
      </div>

      {/* Activities summary */}
      {activityList.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5C4230] mb-1.5">Activities</p>
          <p className="text-xs text-[#3D2B1A]">
            {activityList.length} activit{activityList.length !== 1 ? "ies" : "y"} added
            {activityCost > 0 && ` · KES ${activityCost.toLocaleString()}`}
          </p>
        </div>
      )}

      {/* Cost breakdown */}
      <div className="border-t border-[#E8D9B8] pt-4 space-y-1.5">
        {selectedAccom && (
          <div className="flex justify-between text-xs text-[#5C4230]">
            <span>Accommodation</span>
            <span>KES {accomCost.toLocaleString()}</span>
          </div>
        )}
        {selectedTransport && (
          <div className="flex justify-between text-xs text-[#5C4230]">
            <span>Transport</span>
            <span>KES {transportCost.toLocaleString()}</span>
          </div>
        )}
        {activityCost > 0 && (
          <div className="flex justify-between text-xs text-[#5C4230]">
            <span>Activities</span>
            <span>KES {activityCost.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold text-[#3D2B1A] pt-2 border-t border-[#E8D9B8]">
          <span>Estimated Total</span>
          <span className="text-[#C4622D]">KES {totalCost.toLocaleString()}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        {nothingSelected && (
          <p className="text-[10px] text-[#5C4230] text-center">Using your own accommodation &amp; transport</p>
        )}
        <button onClick={onSave} disabled={saving}
          className="w-full border border-[#C4622D] text-[#C4622D] py-2.5 rounded-full text-sm font-medium disabled:opacity-50 hover:bg-[#FDF0E8] transition-colors">
          {saving ? "Saving..." : "Save Trip"}
        </button>
        <button onClick={onAddToCart} disabled={addingToCart}
          className="w-full bg-[#C4622D] text-white py-2.5 rounded-full text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
          {addingToCart ? "Adding..." : "Add to Cart →"}
        </button>
      </div>
    </div>
  );
}

/* ─── Sidebar route card (kept for reference) ───────────────────────── */
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
