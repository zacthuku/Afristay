import { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { cartService, bookingService, paymentService, tripService } from "../services/api";
import { AppContext } from "../context/AppContext";

const DEFAULT_KES_PER_USD = 130;
const PURPOSE_ICONS = { leisure: "🌴", adventure: "🏕️", business: "💼", event: "🎉" };

function useCurrencyRate() {
  const [rate, setRate] = useState(DEFAULT_KES_PER_USD);
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((d) => { if (d?.rates?.KES) setRate(d.rates.KES); })
      .catch(() => {});
  }, []);
  return rate;
}

function formatDate(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Collapsed / expanded trip card ── */
function TripSummaryCard({ trip, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Activity editing
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(null);
  const [removing, setRemoving] = useState(null);

  // Add activity to a day
  const [addingDay, setAddingDay] = useState(null);          // day object being expanded
  const [availableActs, setAvailableActs] = useState(null);  // null = not loaded yet
  const [loadingActs, setLoadingActs] = useState(false);
  const [pickedAct, setPickedAct] = useState(null);          // selected activity card
  const [addForm, setAddForm] = useState({ date: "", time: "", participants: 1 });
  const [bookingAct, setBookingAct] = useState(false);

  // Totals
  const allActivities = (trip.days || []).flatMap((d) => d.activities || []);
  const activityTotal = allActivities.reduce((s, a) => s + Number(a.total_fee), 0);
  const segmentTotal = (trip.days || []).flatMap((d) => d.segments || [])
    .reduce((s, seg) => s + Number(seg.service?.price || seg.service?.price_base || 0), 0);
  const tripTotal = activityTotal + segmentTotal;

  async function handleDeleteTrip() {
    setDeleting(true);
    try {
      await tripService.deleteTrip(trip.id);
      toast.success("Trip removed");
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  function startEdit(ab) {
    setEditingId(ab.id);
    setEditForm({ date: ab.date, time: ab.time, participants: ab.participants });
  }

  async function saveEdit(ab) {
    setSaving(ab.id);
    try {
      const feePerPerson = Number(ab.total_fee) / (ab.participants || 1);
      await tripService.updateActivityBooking(ab.id, {
        date: editForm.date,
        time: editForm.time,
        participants: Number(editForm.participants),
        total_fee: feePerPerson * Number(editForm.participants),
      });
      setEditingId(null);
      toast.success("Activity updated");
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(null);
    }
  }

  async function removeActivity(id) {
    setRemoving(id);
    try {
      await tripService.cancelActivityBooking(id);
      toast.success("Activity removed");
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Remove failed");
    } finally {
      setRemoving(null);
    }
  }

  async function openAddActivity(day) {
    if (addingDay?.day === day.day) { setAddingDay(null); setPickedAct(null); return; }
    setAddingDay(day);
    setPickedAct(null);
    setAddForm({ date: day.date || trip.check_in || "", time: "09:00", participants: 1 });
    if (!availableActs) {
      setLoadingActs(true);
      try {
        const acts = await tripService.getActivities(trip.destination || "");
        setAvailableActs(acts);
      } catch { setAvailableActs([]); }
      finally { setLoadingActs(false); }
    }
  }

  async function confirmAddActivity() {
    if (!pickedAct) return;
    setBookingAct(true);
    try {
      await tripService.bookActivity({
        activity_id: pickedAct.id,
        activity_name: pickedAct.name,
        activity_location: pickedAct.address || "",
        destination: trip.destination || "",
        date: addForm.date,
        time: addForm.time,
        participants: Number(addForm.participants),
        total_fee: pickedAct.entrance_fee * Number(addForm.participants),
        payment_method: pickedAct.entrance_fee === 0 ? "free" : "defer",
      });
      toast.success(`${pickedAct.name} added to Day ${addingDay.day}`);
      setAddingDay(null);
      setPickedAct(null);
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to add activity");
    } finally {
      setBookingAct(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-3 flex-1 text-left min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FDF0E8] flex items-center justify-center text-xl shrink-0">
            {PURPOSE_ICONS[trip.purpose] || "🗺️"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#3D2B1A] truncate">{trip.destination || "Unnamed trip"}</p>
            <p className="text-xs text-[#5C4230]">
              {formatDate(trip.check_in)} – {formatDate(trip.check_out)}
              {trip.nights ? ` · ${trip.nights} night${trip.nights !== 1 ? "s" : ""}` : ""}
              {trip.purpose ? ` · ${trip.purpose}` : ""}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-3 shrink-0">
          {tripTotal > 0 && (
            <span className="text-sm font-semibold text-[#C4622D]">KES {tripTotal.toLocaleString()}</span>
          )}
          {/* Delete button */}
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5C4230]">Remove trip?</span>
              <button onClick={handleDeleteTrip} disabled={deleting}
                className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-full font-medium disabled:opacity-50">
                {deleting ? "…" : "Yes"}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-[#5C4230] hover:underline">No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-400 hover:text-red-600 border border-red-200 rounded-full px-2.5 py-1">
              Delete
            </button>
          )}
          <button onClick={() => setOpen((v) => !v)} className="text-[#C4622D] text-xs">{open ? "▲" : "▼"}</button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#E8D9B8]">
          {(trip.days || []).length === 0
            ? <p className="px-4 py-3 text-xs text-[#5C4230] italic">No itinerary saved.</p>
            : (trip.days || []).map((day) => {
              const isFree = day.segments.length === 0 && day.activities.length === 0;
              const isAddingThis = addingDay?.day === day.day;
              return (
                <div key={day.day} className="px-4 py-3 border-b border-[#E8D9B8] last:border-b-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C4622D] mb-2">
                    Day {day.day}{day.date ? ` · ${new Date(day.date).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" })}` : ""}
                  </p>

                  {/* Segments */}
                  {day.segments.map((seg, i) => (
                    <div key={i} className="flex gap-2 text-xs text-[#5C4230] mb-1">
                      <span className="font-mono text-[#C4622D] w-10 shrink-0">{seg.time}</span>
                      <span className="flex-1">
                        {seg.type === "transport"
                          ? `Travel to ${seg.destination}`
                          : seg.service?.title ? `Check in – ${seg.service.title}` : `Arrive at ${seg.destination}`}
                      </span>
                    </div>
                  ))}

                  {/* Activity bookings */}
                  {day.activities.map((ab) => (
                    <div key={ab.id} className="mt-2">
                      {editingId === ab.id ? (
                        <div className="bg-[#FAF6EF] border border-[#E8D9B8] rounded-xl p-3 space-y-2">
                          <p className="text-xs font-semibold text-[#3D2B1A]">Edit: {ab.activity_name}</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[["date","Date","date"],["time","Time","time"],["participants","Visitors","number"]].map(([key, label, type]) => (
                              <div key={key}>
                                <label className="text-[10px] text-[#5C4230]">{label}</label>
                                <input type={type} min={type === "number" ? 1 : undefined} max={type === "number" ? 20 : undefined}
                                  value={editForm[key]}
                                  onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                                  className="w-full border border-[#E8D9B8] rounded-lg px-2 py-1.5 text-xs mt-0.5 focus:outline-none focus:border-[#C4622D]" />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingId(null)} className="text-xs text-[#5C4230] hover:underline">Cancel</button>
                            <button onClick={() => saveEdit(ab)} disabled={saving === ab.id}
                              className="bg-[#C4622D] text-white text-xs px-4 py-1.5 rounded-full font-medium disabled:opacity-50">
                              {saving === ab.id ? "Saving…" : "Save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 text-xs text-[#5C4230] items-start group">
                          <span className="font-mono w-10 shrink-0 pt-0.5">{ab.time}</span>
                          <span className="flex-1">
                            {ab.activity_name}
                            <span className="ml-1 text-[#C4622D]">
                              {Number(ab.total_fee) > 0 ? `· KES ${Number(ab.total_fee).toLocaleString()}` : "· Free"}
                            </span>
                            <span className="ml-1 opacity-70">· {ab.participants} visitor{ab.participants !== 1 ? "s" : ""}</span>
                          </span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => startEdit(ab)} className="text-[#C4622D] hover:underline">Edit</button>
                            <button onClick={() => removeActivity(ab.id)} disabled={removing === ab.id}
                              className="text-red-400 hover:text-red-600 disabled:opacity-50">
                              {removing === ab.id ? "…" : "Remove"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Free day label + Add Activity button */}
                  {isFree && !isAddingThis && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#5C4230] italic">Free day</p>
                      <button onClick={() => openAddActivity(day)}
                        className="text-xs text-[#C4622D] font-medium border border-[#C4622D] rounded-full px-3 py-1 hover:bg-[#C4622D] hover:text-white transition-colors">
                        + Add Activity
                      </button>
                    </div>
                  )}

                  {/* Days with activities also get an Add Activity button */}
                  {!isFree && !isAddingThis && (
                    <button onClick={() => openAddActivity(day)}
                      className="mt-2 text-xs text-[#C4622D] font-medium hover:underline">
                      + Add Activity
                    </button>
                  )}

                  {/* Activity picker panel */}
                  {isAddingThis && (
                    <div className="mt-3 bg-[#FAF6EF] border border-[#E8D9B8] rounded-xl p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#3D2B1A]">Pick an activity for Day {day.day}</p>
                        <button onClick={() => { setAddingDay(null); setPickedAct(null); }} className="text-xs text-[#5C4230] hover:underline">Close</button>
                      </div>

                      {loadingActs && <p className="text-xs text-[#5C4230] italic">Loading activities…</p>}

                      {!loadingActs && availableActs?.length === 0 && (
                        <p className="text-xs text-[#5C4230] italic">No activities found for {trip.destination}.</p>
                      )}

                      {!loadingActs && availableActs?.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {availableActs.map((act) => {
                            const isPicked = pickedAct?.id === act.id;
                            return (
                              <button key={act.id} onClick={() => {
                                  setPickedAct(isPicked ? null : act);
                                  if (!isPicked) setAddForm((f) => ({ ...f, time: act.available_times?.[0] || "09:00" }));
                                }}
                                className={`shrink-0 w-44 text-left border rounded-xl p-3 transition-all ${isPicked ? "border-[#C4622D] bg-white" : "border-[#E8D9B8] bg-white hover:border-[#C4622D]"}`}>
                                <div className="text-xl mb-1">{act.icon}</div>
                                <p className="text-xs font-semibold text-[#3D2B1A] leading-tight">{act.name}</p>
                                <p className="text-[10px] text-[#5C4230] mt-0.5">{act.category} · {act.duration}</p>
                                <p className="text-xs font-medium text-[#C4622D] mt-1">
                                  {act.entrance_fee === 0 ? "Free" : `KES ${act.entrance_fee.toLocaleString()}`}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {pickedAct && (
                        <div className="space-y-2 pt-1 border-t border-[#E8D9B8]">
                          <p className="text-xs font-medium text-[#3D2B1A]">{pickedAct.name}</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-[#5C4230]">Date</label>
                              <input type="date" value={addForm.date}
                                onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                                className="w-full border border-[#E8D9B8] rounded-lg px-2 py-1.5 text-xs mt-0.5 focus:outline-none focus:border-[#C4622D]" />
                            </div>
                            <div>
                              <label className="text-[10px] text-[#5C4230]">Time</label>
                              <select value={addForm.time}
                                onChange={(e) => setAddForm((f) => ({ ...f, time: e.target.value }))}
                                className="w-full border border-[#E8D9B8] rounded-lg px-2 py-1.5 text-xs mt-0.5 focus:outline-none focus:border-[#C4622D]">
                                {(pickedAct.available_times || ["09:00"]).map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-[#5C4230]">Visitors</label>
                              <input type="number" min="1" max="20" value={addForm.participants}
                                onChange={(e) => setAddForm((f) => ({ ...f, participants: e.target.value }))}
                                className="w-full border border-[#E8D9B8] rounded-lg px-2 py-1.5 text-xs mt-0.5 focus:outline-none focus:border-[#C4622D]" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#C4622D]">
                              {pickedAct.entrance_fee === 0
                                ? "Free entry"
                                : `Total: KES ${(pickedAct.entrance_fee * Number(addForm.participants)).toLocaleString()}`}
                            </span>
                            <button onClick={confirmAddActivity} disabled={bookingAct}
                              className="bg-[#C4622D] text-white text-xs px-4 py-1.5 rounded-full font-medium disabled:opacity-50">
                              {bookingAct ? "Adding…" : "Confirm"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Trip total footer */}
          {tripTotal > 0 && (
            <div className="px-4 py-3 bg-[#FAF6EF] flex justify-between text-sm font-semibold text-[#3D2B1A]">
              <span>Trip total</span>
              <span className="text-[#C4622D]">KES {tripTotal.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PAY_METHODS = [
  { id: "mpesa",  label: "M-Pesa",      color: "#00A650", letter: "M" },
  { id: "airtel", label: "Airtel Money", color: "#E40000", letter: "A" },
  { id: "card",   label: "Visa / Card",  color: "#1A1F71", letter: "V" },
];

/* ── Inline payment widget ── */
function PayWidget({ target, onClose, onPaid }) {
  // method | mpesa | airtel | polling | card_redirect
  const [step, setStep] = useState("method");
  const [method, setMethod] = useState("mpesa");
  const [phone, setPhone] = useState("");
  const pollRef = useRef(null);

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  useEffect(() => () => stopPoll(), []);

  function startPolling(checkoutId) {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        let done = false;
        if (target.type === "booking") {
          const s = await paymentService.checkStatus(checkoutId);
          if (s.status === "completed") done = true;
          if (s.status === "failed") { stopPoll(); setStep("method"); toast.error("Payment failed. Try again."); return; }
        } else {
          const s = await tripService.getActivityPaymentStatus(target.id);
          if (s.payment_status === "paid") done = true;
          if (s.payment_status === "failed") { stopPoll(); setStep("method"); toast.error("Payment failed. Try again."); return; }
        }
        if (done) { stopPoll(); toast.success(`${target.name} — payment confirmed!`); onPaid(); }
      } catch { /* non-fatal */ }
    }, 3000);
  }

  async function handleMobilePay(selectedMethod) {
    if (!phone.trim()) { toast.error(`Enter your ${selectedMethod === "mpesa" ? "M-Pesa" : "Airtel"} phone number`); return; }
    try {
      let res;
      if (target.type === "booking") {
        res = selectedMethod === "mpesa"
          ? await paymentService.initiateMpesa({ booking_id: target.id, phone: phone.trim() })
          : await paymentService.initiateAirtel({ booking_id: target.id, phone: phone.trim() });
      } else {
        res = await tripService.retryActivityPayment(target.id, { method: selectedMethod, phone: phone.trim() });
      }
      setStep("polling");
      startPolling(res.checkout_request_id);
    } catch (err) { toast.error(err.message || "Payment initiation failed"); }
  }

  async function handleCard() {
    try {
      let res;
      if (target.type === "booking") {
        res = await paymentService.initiateCard(target.id);
        if (res.payment_link) window.open(res.payment_link, "_blank");
        setStep("card_redirect");
        startPolling(res.checkout_request_id);
      } else {
        res = await tripService.retryActivityPayment(target.id, { method: "card" });
        if (res.payment_link) window.open(res.payment_link, "_blank");
        setStep("card_redirect");
        stopPoll();
        pollRef.current = setInterval(async () => {
          try {
            const s = await tripService.getActivityPaymentStatus(target.id);
            if (s.payment_status === "paid") { stopPoll(); toast.success(`${target.name} — payment confirmed!`); onPaid(); }
            if (s.payment_status === "failed") { stopPoll(); setStep("method"); toast.error("Payment failed. Try again."); }
          } catch { }
        }, 3000);
      }
    } catch (err) { toast.error(err.message || "Card payment initiation failed"); }
  }

  return (
    <div className="border-t border-[#E8D9B8] bg-[#FAF6EF] px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#5C4230]">
          Pay for: <span className="text-[#3D2B1A]">{target.name}</span>
        </p>
        <button onClick={() => { stopPoll(); onClose(); }} className="text-xs text-[#5C4230] hover:underline">Cancel</button>
      </div>

      {step === "method" && (
        <div className="grid grid-cols-3 gap-2">
          {PAY_METHODS.map((m) => (
            <button key={m.id}
              onClick={() => { setMethod(m.id); setPhone(""); m.id === "card" ? handleCard() : setStep(m.id); }}
              className="flex flex-col items-center gap-1.5 border-2 border-[#E8D9B8] rounded-xl py-3 text-xs font-semibold text-[#5C4230] bg-white hover:border-[#C4622D] hover:text-[#3D2B1A] transition-all">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                style={{ backgroundColor: m.color }}>
                {m.letter}
              </div>
              {m.label}
            </button>
          ))}
        </div>
      )}

      {(step === "mpesa" || step === "airtel") && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#3D2B1A]">
            {step === "mpesa" ? "M-Pesa" : "Airtel"} Phone Number
          </label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder={step === "mpesa" ? "e.g. 0712 345 678" : "e.g. 0733 123 456"}
            className="w-full border border-[#E8D9B8] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#C4622D]" />
          <p className="text-[11px] text-[#5C4230]">
            {step === "mpesa"
              ? "You'll receive a Safaricom STK prompt — enter your M-Pesa PIN."
              : "You'll receive an Airtel Money prompt — enter your PIN to confirm."}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setStep("method")} className="text-xs text-[#5C4230] hover:underline">← Back</button>
            <button onClick={() => handleMobilePay(step)}
              className="flex-1 text-white py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: step === "mpesa" ? "#00A650" : "#E40000" }}>
              Send {step === "mpesa" ? "M-Pesa" : "Airtel"} Request
            </button>
          </div>
        </div>
      )}

      {(step === "polling" || step === "card_redirect") && (
        <div className="text-center space-y-2 py-2">
          <div className="animate-spin inline-block w-5 h-5 border-2 border-[#C4622D] border-t-transparent rounded-full" />
          <p className="text-xs text-[#5C4230]">
            {step === "card_redirect"
              ? "Complete payment in the tab that just opened. Waiting for confirmation..."
              : method === "airtel"
              ? `Airtel prompt sent to ${phone}. Enter your PIN on your phone.`
              : `M-Pesa prompt sent to ${phone}. Enter your PIN on your phone.`}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Main Cart page ── */
export default function Cart() {
  const { user, refreshCartCount } = useContext(AppContext);
  const navigate = useNavigate();
  const kesPerUsd = useCurrencyRate();

  const [cart, setCart] = useState(null);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [pendingActivities, setPendingActivities] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currency, setCurrency] = useState("KES");
  const [removing, setRemoving] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(null);

  // inline payment widget target: { id, type: 'booking'|'activity', name, amount }
  const [payTarget, setPayTarget] = useState(null);

  const fmt = (kes) => currency === "USD"
    ? `$${(kes / kesPerUsd).toFixed(2)}`
    : `KES ${Number(kes).toLocaleString()}`;

  const fetchAll = async () => {
    try {
      const [cartData, bookingsData, actData, tripsData] = await Promise.all([
        cartService.getCart(),
        bookingService.getBookings(),
        tripService.getActivityBookings(),
        tripService.getSaved(),
      ]);
      setCart(cartData);
      setPendingBookings(bookingsData.filter((b) => b.status === "pending"));
      setPendingActivities(actData.filter((a) => a.status === "pending_payment"));
      setSavedTrips(tripsData);
    } catch {
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
      refreshCartCount();
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRemove = async (id) => {
    setRemoving(id);
    try { await cartService.removeItem(id); await fetchAll(); toast.success("Removed"); }
    catch { toast.error("Failed to remove item"); }
    finally { setRemoving(null); }
  };

  const startEdit = (item) => {
    setEditingItem(item.id);
    setEditForm({ check_in: item.check_in.split("T")[0], check_out: item.check_out.split("T")[0], quantity: item.quantity });
  };

  const handleSaveEdit = async (id) => {
    setSavingEdit(id);
    try {
      await cartService.updateItem(id, { check_in: editForm.check_in, check_out: editForm.check_out, quantity: Number(editForm.quantity) });
      setEditingItem(null);
      await fetchAll();
      toast.success("Item updated");
    } catch (err) { toast.error(err.message || "Update failed"); }
    finally { setSavingEdit(null); }
  };

  const handleCheckout = async () => {
    if (!cart?.items?.length) return;
    setCheckingOut(true);
    try {
      for (const item of cart.items) {
        await bookingService.createBooking({ service_id: item.service_id, start_time: item.check_in, end_time: item.check_out, quantity: item.quantity });
      }
      await cartService.clearCart();
      await fetchAll();
      toast.success("Bookings created — complete payment below.");
    } catch (err) { toast.error(err.message || "Checkout failed"); }
    finally { setCheckingOut(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#C4622D]" />
      </div>
    );
  }

  const items = cart?.items || [];
  const totalItems = items.length + pendingBookings.length + pendingActivities.length + savedTrips.length;
  const isEmpty = totalItems === 0;

  return (
    <div className="min-h-screen bg-[#FAF6EF] py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-3xl text-[#3D2B1A]">Your Cart</h1>
            <p className="text-[#5C4230] text-sm mt-1">
              {isEmpty ? "Nothing here yet." : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            </p>
          </div>
          {!isEmpty && (
            <div className="flex items-center gap-1 bg-white border border-[#E8D9B8] rounded-full p-1 text-xs">
              {["KES", "USD"].map((c) => (
                <button key={c} onClick={() => setCurrency(c)}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all ${currency === c ? "bg-[#C4622D] text-white" : "text-[#5C4230] hover:text-[#C4622D]"}`}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {isEmpty ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E8D9B8]">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-[#5C4230] mb-6">Add stays, transport or plan a trip to get started.</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Link to="/" className="bg-[#C4622D] text-white px-8 py-3 rounded-full text-sm font-medium">Explore Listings</Link>
              <Link to="/plan" className="border border-[#C4622D] text-[#C4622D] px-8 py-3 rounded-full text-sm font-medium">Plan a Trip</Link>
            </div>
          </div>
        ) : (
          <>

            {/* ── A. Cart Items ── */}
            {items.length > 0 && (
              <section>
                <h2 className="font-semibold text-[#3D2B1A] mb-3">Cart Items</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    {items.map((item) => {
                      const isEditing = editingItem === item.id;
                      return (
                        <div key={item.id} className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
                          <div className="flex">
                            {item.images?.[0]
                              ? <img src={item.images[0]} alt={item.title} className="w-28 object-cover shrink-0" />
                              : <div className="w-28 bg-[#E8D9B8] flex items-center justify-center text-2xl shrink-0">{item.type === "transport" ? "🚐" : "🏡"}</div>}
                            <div className="p-4 flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-[#3D2B1A] text-sm truncate">{item.title}</h3>
                                  <p className="text-[#5C4230] text-xs">{item.location}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button onClick={() => isEditing ? setEditingItem(null) : startEdit(item)} className="text-xs text-[#C4622D] hover:underline">
                                    {isEditing ? "Cancel" : "Edit"}
                                  </button>
                                  <button onClick={() => handleRemove(item.id)} disabled={removing === item.id} className="text-xs text-red-400 hover:text-red-600">
                                    {removing === item.id ? "…" : "Remove"}
                                  </button>
                                </div>
                              </div>
                              {!isEditing && (
                                <>
                                  <div className="mt-2 text-xs text-[#5C4230]">
                                    {new Date(item.check_in).toLocaleDateString()} → {new Date(item.check_out).toLocaleDateString()}
                                    {" · "}{item.nights} night{item.nights !== 1 ? "s" : ""} · {item.quantity} guest{item.quantity !== 1 ? "s" : ""}
                                  </div>
                                  <div className="mt-2 font-semibold text-[#C4622D] text-sm">{fmt(item.subtotal)}</div>
                                </>
                              )}
                            </div>
                          </div>
                          {isEditing && (
                            <div className="border-t border-[#E8D9B8] bg-[#FAF6EF] px-4 py-4 space-y-3">
                              <div className="grid grid-cols-3 gap-3">
                                {[["check_in","Check-in","date"], ["check_out","Check-out","date"], ["quantity","Guests","number"]].map(([key, label, type]) => (
                                  <div key={key}>
                                    <label className="text-xs text-[#5C4230] font-medium">{label}</label>
                                    <input type={type} value={editForm[key]} min={type === "date" ? editForm.check_in : 1} max={type === "number" ? 20 : undefined}
                                      onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                                      className="w-full border border-[#E8D9B8] rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#C4622D]" />
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-end">
                                <button onClick={() => handleSaveEdit(item.id)} disabled={savingEdit === item.id}
                                  className="bg-[#C4622D] text-white px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50">
                                  {savingEdit === item.id ? "Saving…" : "Save changes"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Order summary */}
                  <div className="md:col-span-1">
                    <div className="bg-white rounded-2xl border border-[#E8D9B8] p-5 sticky top-24">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[#3D2B1A]">Order Summary</h3>
                        {currency === "USD" && <span className="text-[10px] text-[#5C4230]">1 USD ≈ KES {kesPerUsd.toFixed(0)}</span>}
                      </div>
                      {(() => {
                        const actTotal = pendingActivities.reduce((s, a) => s + Number(a.total_fee), 0);
                        const grandTotal = Number(cart.total) + actTotal;
                        return (
                          <div className="space-y-2 text-sm text-[#5C4230]">
                            <div className="flex justify-between"><span>Stays &amp; transport</span><span>{fmt(cart.subtotal)}</span></div>
                            <div className="flex justify-between"><span>Platform fee (12%)</span><span>{fmt(cart.platform_fee)}</span></div>
                            {actTotal > 0 && (
                              <div className="flex justify-between"><span>Activities ({pendingActivities.length})</span><span>{fmt(actTotal)}</span></div>
                            )}
                            <div className="border-t border-[#E8D9B8] pt-2 mt-2 flex justify-between font-semibold text-[#3D2B1A]">
                              <span>Total</span>
                              <div className="text-right">
                                <div className="text-[#C4622D]">{fmt(grandTotal)}</div>
                                <div className="text-[10px] font-normal text-[#5C4230]">
                                  {currency === "KES" ? `≈ $${(grandTotal / kesPerUsd).toFixed(2)} USD` : `= KES ${Number(grandTotal).toLocaleString()}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      <button onClick={handleCheckout} disabled={checkingOut}
                        className="mt-5 w-full bg-[#C4622D] text-white py-3 rounded-full text-sm font-medium disabled:opacity-50">
                        {checkingOut ? "Creating bookings…" : "Proceed to Payment"}
                      </button>
                      <p className="text-[10px] text-center text-[#5C4230] mt-2">
                        Creates bookings — pay each one below
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── B. Pending Payments ── */}
            {(pendingBookings.length > 0 || pendingActivities.length > 0) && (
              <section>
                <h2 className="font-semibold text-[#3D2B1A] mb-1">Awaiting Payment</h2>
                <p className="text-xs text-[#5C4230] mb-3">Complete payment to confirm these bookings.</p>
                <div className="space-y-3">

                  {pendingBookings.map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
                      <div className="flex">
                        <div className="w-24 bg-[#E8D9B8] flex items-center justify-center text-2xl shrink-0">
                          {b.service_images?.[0] ? <img src={b.service_images[0]} alt="" className="w-full h-full object-cover" /> : "🏡"}
                        </div>
                        <div className="p-4 flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#5C4230]">Stay / Transport</p>
                              <h3 className="font-semibold text-[#3D2B1A] text-sm">{b.service_title || "Booking"}</h3>
                              {b.service_location && <p className="text-xs text-[#5C4230]">📍 {b.service_location}</p>}
                              <p className="text-xs text-[#5C4230] mt-1">{formatDate(b.start_time)} → {formatDate(b.end_time)}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-semibold text-[#C4622D] text-sm">{fmt(b.total_price)}</div>
                              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
                            </div>
                          </div>
                          {payTarget?.id !== b.id && (
                            <button onClick={() => setPayTarget({ id: b.id, type: "booking", name: b.service_title || "Booking", amount: b.total_price })}
                              className="mt-3 bg-[#C4622D] text-white px-4 py-1.5 rounded-full text-xs font-medium">
                              Pay Now →
                            </button>
                          )}
                        </div>
                      </div>
                      {payTarget?.id === b.id && (
                        <PayWidget target={payTarget} onClose={() => setPayTarget(null)} onPaid={() => { setPayTarget(null); fetchAll(); }} />
                      )}
                    </div>
                  ))}

                  {pendingActivities.map((ab) => (
                    <div key={ab.id} className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
                      <div className="flex">
                        <div className="w-24 bg-[#FDF0E8] flex items-center justify-center text-2xl shrink-0">🎫</div>
                        <div className="p-4 flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#C4622D]">Activity</p>
                              <h3 className="font-semibold text-[#3D2B1A] text-sm">{ab.activity_name}</h3>
                              <p className="text-xs text-[#5C4230]">📍 {ab.activity_location}</p>
                              <p className="text-xs text-[#5C4230] mt-1">{formatDate(ab.date)} at {ab.time} · {ab.participants} visitor{ab.participants !== 1 ? "s" : ""}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-semibold text-[#C4622D] text-sm">{fmt(ab.total_fee)}</div>
                              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Awaiting payment</span>
                            </div>
                          </div>
                          {payTarget?.id !== ab.id && (
                            <button onClick={() => setPayTarget({ id: ab.id, type: "activity", name: ab.activity_name, amount: ab.total_fee })}
                              className="mt-3 bg-[#C4622D] text-white px-4 py-1.5 rounded-full text-xs font-medium">
                              Pay Now →
                            </button>
                          )}
                        </div>
                      </div>
                      {payTarget?.id === ab.id && (
                        <PayWidget target={payTarget} onClose={() => setPayTarget(null)} onPaid={() => { setPayTarget(null); fetchAll(); }} />
                      )}
                    </div>
                  ))}

                </div>
              </section>
            )}

            {/* ── C. Saved Trips ── */}
            {savedTrips.length > 0 && (
              <section>
                <h2 className="font-semibold text-[#3D2B1A] mb-1">Saved Trips</h2>
                <p className="text-xs text-[#5C4230] mb-3">Your planned itineraries — expand to see the day-by-day schedule.</p>
                <div className="space-y-3">
                  {savedTrips.map((trip) => <TripSummaryCard key={trip.id} trip={trip} onRefresh={fetchAll} />)}
                </div>
              </section>
            )}

          </>
        )}
      </div>
    </div>
  );
}
