import { useEffect, useState, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { hostService, userService } from "../services/api";

// ─── Static data ─────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  {
    value: "accommodation",
    label: "Accommodation",
    icon: "🏠",
    desc: "Homes, villas, apartments, lodges",
    pricingTypes: ["per_night", "fixed"],
  },
  {
    value: "transport",
    label: "Ground Transport",
    icon: "🚗",
    desc: "Taxis, shuttles, private hire",
    pricingTypes: ["per_km", "per_hour", "fixed"],
  },
  {
    value: "flight",
    label: "Flight / Air Charter",
    icon: "✈️",
    desc: "Domestic flights, air charters",
    pricingTypes: ["fixed", "per_person"],
  },
  {
    value: "tour",
    label: "Tour & Experience",
    icon: "🗺️",
    desc: "Safari, city tours, day trips",
    pricingTypes: ["per_person", "fixed"],
  },
  {
    value: "car_rental",
    label: "Car Rental",
    icon: "🔑",
    desc: "Self-drive hire, fleet rentals",
    pricingTypes: ["per_day", "fixed"],
  },
];

const PRICING_LABELS = {
  per_night: "Per Night",
  per_hour: "Per Hour",
  fixed: "Fixed Price",
  per_km: "Per KM",
  per_person: "Per Person",
  per_day: "Per Day",
};

const STEPS = ["Choose Type", "Service Details", "API / Integration", "Review"];

const APPLICATION_STEPS = ["Business Info", "Contact", "Services", "Verification"];

const BUSINESS_TYPES = [
  { value: "accommodation", label: "Accommodation", icon: "🏠", desc: "Hotels, lodges, apartments" },
  { value: "transport", label: "Transport", icon: "🚗", desc: "Taxis, car hire, transfers" },
  { value: "tour", label: "Tours & Experiences", icon: "🗺️", desc: "Safari, city tours, day trips" },
  { value: "other", label: "Other Services", icon: "⚡", desc: "Any other travel services" },
];

const EMPTY_APPLICATION = {
  company_name: "",
  business_type: "accommodation",
  business_description: "",
  business_email: "",
  phone: "",
  location: "",
  services_offered: "",
  operating_areas: "",
  pricing_range: "",
  doc_links: "",
  social_links: "",
};

const APPROVAL_BADGE = {
  pending:  "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ step, steps }) {
  const labels = steps || STEPS;
  return (
    <div className="flex items-center gap-2 mb-8">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < step
                ? "bg-[#C4622D] text-white"
                : i === step
                ? "bg-[#C4622D] text-white ring-4 ring-[#F2D5C5]"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < step ? "✓" : i + 1}
          </div>
          <span
            className={`text-xs font-medium hidden sm:block ${
              i === step ? "text-[#C4622D]" : i < step ? "text-gray-500" : "text-gray-300"
            }`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-0.5 ${i < step ? "bg-[#C4622D]" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function ServiceTypeCard({ type, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(type.value)}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
        selected
          ? "border-[#C4622D] bg-[#FFF5EE] shadow-md"
          : "border-[#E8D9B8] bg-white hover:border-[#C4622D]/50"
      }`}
    >
      <div className="text-2xl mb-1">{type.icon}</div>
      <div className="font-semibold text-[#3D2B1A] text-sm">{type.label}</div>
      <div className="text-xs text-gray-500 mt-0.5">{type.desc}</div>
    </button>
  );
}

// ─── Host application form (multi-step, logged-in not-yet-host) ──────────────

function HostApplicationForm({ user, loading, onSubmit, onBack }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    ...EMPTY_APPLICATION,
    business_email: user.email || "",
    phone: user.phone || "",
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: false }));
  };

  const REQUIRED = {
    0: ["company_name", "business_description"],
    1: ["phone", "location"],
    2: ["services_offered"],
  };

  const tryNext = (target) => {
    const required = REQUIRED[step] || [];
    const newErrors = {};
    required.forEach((k) => {
      if (!form[k].trim()) newErrors[k] = true;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setStep(target);
  };

  const fieldClass = (key) =>
    `w-full rounded-2xl border p-3 focus:outline-none transition-colors ${
      errors[key]
        ? "border-red-400 bg-red-50 focus:border-red-500"
        : "border-gray-200 focus:border-[#C4622D]"
    }`;

  const FieldError = ({ fieldKey }) =>
    errors[fieldKey] ? (
      <p className="text-xs text-red-500 mt-1">This field is required.</p>
    ) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={onBack}
          className="mt-1 text-sm text-gray-400 hover:text-[#C4622D] flex items-center gap-1 shrink-0"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-2xl font-semibold text-[#3D2B1A]">Apply to Become a Verified Host</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Provide accurate information about your business. All hosts are reviewed before going live.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-[#E8D9B8] bg-white p-8 shadow-sm">
        <StepIndicator step={step} steps={APPLICATION_STEPS} />

        {/* Step 0: Business Information */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-[#3D2B1A]">Business Information</h3>
              <p className="text-sm text-gray-500 mt-0.5">Tell us about your company or service.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.company_name}
                onChange={(e) => set("company_name", e.target.value)}
                placeholder="e.g., Savanna Tours Ltd"
                className={fieldClass("company_name")}
              />
              <FieldError fieldKey="company_name" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Business Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set("business_type", t.value)}
                    className={`text-left rounded-2xl border-2 p-3 transition-all ${
                      form.business_type === t.value
                        ? "border-[#C4622D] bg-[#FFF5EE]"
                        : "border-[#E8D9B8] bg-white hover:border-[#C4622D]/40"
                    }`}
                  >
                    <div className="text-xl mb-1">{t.icon}</div>
                    <div className="font-semibold text-sm text-[#3D2B1A]">{t.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Business Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.business_description}
                onChange={(e) => set("business_description", e.target.value)}
                rows={4}
                placeholder="Describe what your business offers, your target customers, and where you operate."
                className={`${fieldClass("business_description")} resize-none`}
              />
              <FieldError fieldKey="business_description" />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => tryNext(1)}
                className="rounded-full bg-[#C4622D] px-8 py-2.5 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Contact Information */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-[#3D2B1A]">Contact Information</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Used for verification and customer communication.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Business Email</label>
              <input
                value={form.business_email}
                onChange={(e) => set("business_email", e.target.value)}
                type="email"
                placeholder="business@example.com"
                className={fieldClass("business_email")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+254 700 000 000"
                className={fieldClass("phone")}
              />
              {errors.phone ? (
                <FieldError fieldKey="phone" />
              ) : (
                <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +254 for Kenya.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Business Location <span className="text-red-500">*</span>
              </label>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g., Nairobi, Kenya"
                className={fieldClass("location")}
              />
              {errors.location ? (
                <FieldError fieldKey="location" />
              ) : (
                <p className="text-xs text-gray-400 mt-1">City and country where your business is based.</p>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="rounded-full border border-gray-200 px-6 py-2.5 text-gray-600 hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => tryNext(2)}
                className="rounded-full bg-[#C4622D] px-8 py-2.5 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Service Details */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-[#3D2B1A]">Service Details</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                List your key services clearly so our team and guests understand what you offer.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Services Offered <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.services_offered}
                onChange={(e) => set("services_offered", e.target.value)}
                rows={3}
                placeholder="e.g., Airport transfers, guided tours, hotel bookings"
                className={`${fieldClass("services_offered")} resize-none`}
              />
              <FieldError fieldKey="services_offered" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Operating Areas</label>
              <input
                value={form.operating_areas}
                onChange={(e) => set("operating_areas", e.target.value)}
                placeholder="e.g., Nairobi, Mombasa, Maasai Mara"
                className={fieldClass("operating_areas")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Pricing Range{" "}
                <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <input
                value={form.pricing_range}
                onChange={(e) => set("pricing_range", e.target.value)}
                placeholder="e.g., KES 2,000 – 15,000 per service"
                className={fieldClass("pricing_range")}
              />
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-gray-200 px-6 py-2.5 text-gray-600 hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => tryNext(3)}
                className="rounded-full bg-[#C4622D] px-8 py-2.5 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verification + Review */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-[#3D2B1A]">Verification</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Providing valid documentation increases your chances of approval.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Supporting Document Links{" "}
                <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <input
                value={form.doc_links}
                onChange={(e) => set("doc_links", e.target.value)}
                placeholder="Link to business registration, license, or proof of operation"
                className={fieldClass("doc_links")}
              />
              <p className="text-xs text-gray-400 mt-1">
                Business registration certificate, trade license, or similar documents.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Website or Social Media{" "}
                <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <input
                value={form.social_links}
                onChange={(e) => set("social_links", e.target.value)}
                placeholder="https://yourwebsite.com or @yourhandle"
                className={fieldClass("social_links")}
              />
            </div>

            {/* Review summary */}
            <div className="rounded-2xl border border-[#E8D9B8] divide-y divide-[#E8D9B8]">
              <div className="px-4 py-2 bg-[#FAF6EF] rounded-t-2xl">
                <p className="text-xs font-semibold text-[#3D2B1A] uppercase tracking-wide">
                  Application Summary
                </p>
              </div>
              {[
                { label: "Company", value: form.company_name },
                { label: "Type", value: BUSINESS_TYPES.find((t) => t.value === form.business_type)?.label },
                { label: "Location", value: form.location },
                { label: "Phone", value: form.phone },
                { label: "Services", value: form.services_offered },
              ].map((row) => (
                <div key={row.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-[#3D2B1A] text-right max-w-[60%] truncate">
                    {row.value || "—"}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[#C4622D]/30 bg-[#FFF5EE] p-4 text-sm text-[#7B4A2D]">
              Your application will be reviewed within <strong>24–48 hours</strong>. You'll be
              notified at <strong>{user.email}</strong> once a decision is made.
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-full border border-gray-200 px-6 py-2.5 text-gray-600 hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => onSubmit(form)}
                disabled={loading}
                className="rounded-full bg-[#C4622D] px-8 py-2.5 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? "Submitting…" : "Submit for Review →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Unauthenticated landing ─────────────────────────────────────────────────

function GuestLanding() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#3D2B1A] to-[#7B4A2D] p-10 md:p-16 text-white"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#3D2B1A]/80 to-[#7B4A2D]/70 rounded-3xl" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-block bg-white/20 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Join 2,400+ hosts across Africa
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Turn your space or service into income on AfriStay
          </h1>
          <p className="mt-4 text-white/80 text-lg">
            List your accommodation, transport, tours, or flights. Reach thousands of travellers
            across the continent — on your own terms.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-full bg-[#C4622D] px-8 py-3 font-semibold text-white hover:bg-[#a84f24] transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/50 px-8 py-3 font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active hosts", value: "2,400+" },
          { label: "Countries covered", value: "18" },
          { label: "Bookings monthly", value: "12K+" },
          { label: "Avg. host earnings", value: "KES 45K" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[#E8D9B8] bg-white p-5 text-center"
          >
            <div className="text-2xl font-bold text-[#C4622D]">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* What you can list */}
      <div>
        <h2 className="text-2xl font-semibold text-[#3D2B1A] mb-4">What can you list?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {SERVICE_TYPES.map((t) => (
            <div
              key={t.value}
              className="rounded-2xl border border-[#E8D9B8] bg-white p-4 text-center"
            >
              <div className="text-3xl mb-2">{t.icon}</div>
              <div className="text-sm font-semibold text-[#3D2B1A]">{t.label}</div>
              <div className="text-xs text-gray-400 mt-1">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-2xl font-semibold text-[#3D2B1A] mb-4">How it works</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: "1", title: "Create account", desc: "Register and apply to be a host in minutes." },
            { step: "2", title: "List your service", desc: "Fill in your details and connect your booking systems." },
            { step: "3", title: "Admin review", desc: "Our team reviews and approves your listing." },
            { step: "4", title: "Start earning", desc: "Guests book and you get paid via M-Pesa." },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-[#E8D9B8] bg-white p-5">
              <div className="w-8 h-8 rounded-full bg-[#C4622D] text-white text-sm font-bold flex items-center justify-center mb-3">
                {s.step}
              </div>
              <div className="font-semibold text-[#3D2B1A]">{s.title}</div>
              <div className="text-sm text-gray-500 mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA footer */}
      <div className="rounded-3xl bg-[#3D2B1A] text-white p-10 text-center">
        <h2 className="text-3xl font-bold">Ready to start hosting?</h2>
        <p className="mt-3 text-white/70 max-w-lg mx-auto">
          Join thousands of African hosts and start earning from your property or services today.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="rounded-full bg-[#C4622D] px-8 py-3 font-semibold hover:bg-[#a84f24] transition-colors"
          >
            Create an Account
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-white/40 px-8 py-3 font-semibold hover:bg-white/10 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Apply-to-host section (logged in, not yet host) ─────────────────────────

function ApplySection({ user, loading, onApply }) {
  const status = user.host_application_status;
  const [showForm, setShowForm] = useState(false);

  if (status === "pending") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center text-4xl mx-auto">
          ⏳
        </div>
        <h2 className="text-2xl font-semibold text-[#3D2B1A]">Application Submitted</h2>
        <p className="text-gray-500">
          Thank you for applying to become a host. Our team is reviewing your application to ensure
          it meets our quality and authenticity standards. You'll be notified at{" "}
          <strong>{user.email}</strong> once a decision is made.
        </p>
        <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-5 py-3 rounded-full">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          Review time: 24–48 hours
        </div>
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-900 text-sm text-left space-y-1">
          <p className="font-semibold">While you wait:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Make sure your profile name is set correctly</li>
            <li>Gather photos of your property or service</li>
            <li>Prepare your M-Pesa number for payouts</li>
          </ul>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    if (showForm) {
      return (
        <HostApplicationForm
          user={user}
          loading={loading}
          onSubmit={onApply}
          onBack={() => setShowForm(false)}
        />
      );
    }
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-3xl mx-auto mb-4">
            ✕
          </div>
          <h2 className="text-2xl font-semibold text-[#3D2B1A]">Application Not Approved</h2>
          <p className="text-gray-500 mt-2">
            Your application did not meet our verification requirements.
          </p>
        </div>

        {user.host_rejection_reason && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Reason</p>
            <p className="text-sm text-red-900">{user.host_rejection_reason}</p>
          </div>
        )}

        <div className="rounded-2xl border border-[#E8D9B8] bg-[#FFFBF5] p-5 text-sm text-gray-600">
          <p className="font-semibold text-[#3D2B1A] mb-2">What you can do:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Review the reason above and address any issues</li>
            <li>Ensure your contact details are accurate</li>
            <li>Provide valid supporting documentation</li>
          </ul>
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-[#C4622D] px-8 py-3 text-white font-semibold hover:bg-[#a84f24] transition-colors"
          >
            Edit and Reapply
          </button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <HostApplicationForm
        user={user}
        loading={loading}
        onSubmit={onApply}
        onBack={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#3D2B1A] to-[#7B4A2D] p-8 text-white flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">
            Hi {user.name || user.email.split("@")[0]}, start hosting today
          </h2>
          <p className="mt-2 text-white/80">
            Apply to become a verified host and list your services for travellers across Africa.
          </p>
          <p className="mt-1 text-white/60 text-sm">
            Every host is verified to ensure trust, safety, and quality for all users.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="shrink-0 rounded-full bg-white text-[#C4622D] px-8 py-3 font-semibold hover:bg-[#FFF5EE] transition-colors"
        >
          Become a Host →
        </button>
      </div>

      {/* How it works */}
      <div>
        <h3 className="text-lg font-semibold text-[#3D2B1A] mb-3">How It Works</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          {[
            { step: "1", title: "Create an account or log in", desc: "You're already logged in!" },
            { step: "2", title: "Submit your service details", desc: "Fill in your business information." },
            { step: "3", title: "Get verified by our team", desc: "We review within 24–48 hours." },
            { step: "4", title: "Start receiving bookings", desc: "Create listings and earn via M-Pesa." },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-[#E8D9B8] bg-white p-4">
              <div className="w-8 h-8 rounded-full bg-[#C4622D] text-white text-sm font-bold flex items-center justify-center mb-2">
                {s.step}
              </div>
              <div className="font-semibold text-sm text-[#3D2B1A]">{s.title}</div>
              <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* What you can offer + Trust */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#E8D9B8] bg-white p-6">
          <h3 className="font-semibold text-[#3D2B1A] mb-3">What would you like to offer?</h3>
          <div className="space-y-2.5">
            {BUSINESS_TYPES.map((t) => (
              <div key={t.value} className="flex items-center gap-3 text-sm text-gray-600">
                <span className="text-lg">{t.icon}</span>
                <div>
                  <span className="font-medium text-[#3D2B1A]">{t.label}</span>
                  <span className="text-gray-400"> — {t.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#C4622D]/30 bg-[#FFF5EE] p-6">
          <h3 className="font-semibold text-[#3D2B1A] mb-2">Trust &amp; Safety</h3>
          <p className="text-sm text-gray-600 mb-3">
            All hosts are reviewed before going live. This ensures only legitimate and high-quality
            services are listed on Afristay.
          </p>
          <ul className="space-y-1.5 text-sm text-gray-600">
            {[
              "Identity and business verification",
              "Quality standards review",
              "Ongoing performance monitoring",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[#C4622D] mt-0.5">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Host dashboard: service form (multi-step) ────────────────────────────────

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "accommodation",
  pricing_type: "per_night",
  price_base: "",
  location: "",
  amenities: "",
  images: "",
  host_avatar: "",
  superhost: false,
  // accommodation
  rooms: "",
  check_in_time: "",
  check_out_time: "",
  // transport / car_rental
  vehicle_type: "",
  capacity: "",
  pickup_location: "",
  dropoff_location: "",
  // flight
  airline_name: "",
  departure_city: "",
  arrival_city: "",
  // tour
  tour_duration: "",
  group_size: "",
  // API integration
  external_booking_url: "",
  api_key: "",
  webhook_url: "",
};

function HostDashboard({ user, services, loading, onSubmit, onEdit, editingService, onCancelEdit }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(editingService ? buildFormFromService(editingService) : { ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState({});

  function buildFormFromService(s) {
    const meta = s.service_metadata || {};
    return {
      title: s.title || "",
      description: s.description || "",
      type: s.type || "accommodation",
      pricing_type: s.pricing_type || "per_night",
      price_base: s.price || "",
      location: meta.location || s.location || "",
      amenities: (meta.amenities || []).join(", "),
      images: (meta.images || []).join(", "),
      host_avatar: meta.host_avatar || "",
      superhost: meta.superhost || false,
      rooms: meta.rooms || "",
      check_in_time: meta.check_in_time || "",
      check_out_time: meta.check_out_time || "",
      vehicle_type: meta.vehicle_type || "",
      capacity: meta.capacity || "",
      pickup_location: meta.pickup_location || "",
      dropoff_location: meta.dropoff_location || "",
      airline_name: meta.airline_name || "",
      departure_city: meta.departure_city || "",
      arrival_city: meta.arrival_city || "",
      tour_duration: meta.tour_duration || "",
      group_size: meta.group_size || "",
      external_booking_url: meta.external_booking_url || "",
      api_key: meta.api_key || "",
      webhook_url: meta.webhook_url || "",
    };
  }

  useEffect(() => {
    if (editingService) {
      setForm(buildFormFromService(editingService));
      setStep(0);
    }
  }, [editingService]);

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setFormErrors((e) => ({ ...e, [field]: false }));
  };

  const selectedType = SERVICE_TYPES.find((t) => t.value === form.type) || SERVICE_TYPES[0];

  const sfc = (key) =>
    `w-full rounded-2xl border p-3 focus:outline-none transition-colors ${
      formErrors[key]
        ? "border-red-400 bg-red-50 focus:border-red-500"
        : "border-gray-200 focus:border-[#C4622D]"
    }`;

  const SFE = ({ fieldKey }) =>
    formErrors[fieldKey] ? (
      <p className="text-xs text-red-500 mt-1">This field is required.</p>
    ) : null;

  const tryNextServiceStep = () => {
    const required = ["title", "description", "price_base", "location"];
    if (form.type === "accommodation") required.push("rooms");
    if (form.type === "transport" || form.type === "car_rental") required.push("vehicle_type", "capacity");
    if (form.type === "flight") required.push("departure_city", "arrival_city");

    const newErrors = {};
    required.forEach((k) => {
      if (!String(form[k] ?? "").trim()) newErrors[k] = true;
    });
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});
    setStep(2);
  };

  const handleSubmit = async () => {
    await onSubmit(form, editingService);
    setForm({ ...EMPTY_FORM });
    setFormErrors({});
    setStep(0);
  };

  const handleCancelEdit = () => {
    onCancelEdit();
    setForm({ ...EMPTY_FORM });
    setFormErrors({});
    setStep(0);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr,360px]">
      {/* Form */}
      <div className="rounded-3xl border border-[#E8D9B8] bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-[#3D2B1A]">
            {editingService ? "Edit Service" : "List a Service"}
          </h2>
          {editingService && (
            <button
              onClick={handleCancelEdit}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              ✕ Cancel edit
            </button>
          )}
        </div>
        <p className="text-gray-500 text-sm mb-6">
          {editingService
            ? "Update your service details below."
            : "Fill in the details to submit your service for admin approval."}
        </p>

        <StepIndicator step={step} />

        {/* Step 0: Choose type */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#3D2B1A]">What type of service are you listing?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICE_TYPES.map((t) => (
                <ServiceTypeCard
                  key={t.value}
                  type={t}
                  selected={form.type === t.value}
                  onClick={(v) => { set("type", v); set("pricing_type", SERVICE_TYPES.find(x => x.value === v).pricingTypes[0]); }}
                />
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(1)}
                className="rounded-full bg-[#C4622D] px-8 py-2.5 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Service details */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#3D2B1A] flex items-center gap-2">
              <span>{selectedType.icon}</span> {selectedType.label} Details
            </h3>

            {/* Common fields */}
            <div>
              <label className="block text-sm font-medium mb-1">Service Title <span className="text-red-500">*</span></label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)}
                className={sfc("title")}
                placeholder={`e.g., ${selectedType.value === "accommodation" ? "Cozy Beach Villa in Mombasa" : selectedType.value === "transport" ? "Airport Transfer — Nairobi CBD" : selectedType.value === "flight" ? "Nairobi to Mombasa Daily Charter" : selectedType.value === "tour" ? "Maasai Mara Safari 3-Day Trip" : "Toyota Prado — Self Drive Nairobi"}`}
              />
              <SFE fieldKey="title" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description <span className="text-red-500">*</span></label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                className={`${sfc("description")} min-h-[120px]`}
                placeholder="Describe what makes your service unique…"
              />
              <SFE fieldKey="description" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Pricing Type <span className="text-red-500">*</span></label>
                <select value={form.pricing_type} onChange={(e) => set("pricing_type", e.target.value)}
                  className={sfc("pricing_type")}
                >
                  {selectedType.pricingTypes.map((pt) => (
                    <option key={pt} value={pt}>{PRICING_LABELS[pt]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base Price (KES) <span className="text-red-500">*</span></label>
                <input value={form.price_base} onChange={(e) => set("price_base", e.target.value)}
                  type="number" placeholder="e.g., 5000"
                  className={sfc("price_base")}
                />
                <SFE fieldKey="price_base" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location / Base City <span className="text-red-500">*</span></label>
              <input value={form.location} onChange={(e) => set("location", e.target.value)}
                placeholder="e.g., Diani Beach, Kwale County"
                className={sfc("location")}
              />
              <SFE fieldKey="location" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image URLs</label>
              <input value={form.images} onChange={(e) => set("images", e.target.value)}
                placeholder="Comma-separated image URLs"
                className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
              />
            </div>

            {/* Accommodation-specific */}
            {form.type === "accommodation" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Amenities</label>
                  <input value={form.amenities} onChange={(e) => set("amenities", e.target.value)}
                    placeholder="e.g., WiFi, Pool, Breakfast (comma separated)"
                    className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rooms <span className="text-red-500">*</span></label>
                    <input value={form.rooms} onChange={(e) => set("rooms", e.target.value)}
                      type="number" placeholder="2"
                      className={sfc("rooms")}
                    />
                    <SFE fieldKey="rooms" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Check-in</label>
                    <input value={form.check_in_time} onChange={(e) => set("check_in_time", e.target.value)}
                      type="time"
                      className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Check-out</label>
                    <input value={form.check_out_time} onChange={(e) => set("check_out_time", e.target.value)}
                      type="time"
                      className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Transport / Car rental */}
            {(form.type === "transport" || form.type === "car_rental") && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Vehicle Type <span className="text-red-500">*</span></label>
                    <input value={form.vehicle_type} onChange={(e) => set("vehicle_type", e.target.value)}
                      placeholder="e.g., Sedan, SUV, Minibus"
                      className={sfc("vehicle_type")}
                    />
                    <SFE fieldKey="vehicle_type" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Capacity <span className="text-red-500">*</span></label>
                    <input value={form.capacity} onChange={(e) => set("capacity", e.target.value)}
                      type="number" placeholder="Number of passengers"
                      className={sfc("capacity")}
                    />
                    <SFE fieldKey="capacity" />
                  </div>
                </div>
                {form.type === "transport" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Pickup Location</label>
                      <input value={form.pickup_location} onChange={(e) => set("pickup_location", e.target.value)}
                        placeholder="Pickup address"
                        className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Dropoff Location</label>
                      <input value={form.dropoff_location} onChange={(e) => set("dropoff_location", e.target.value)}
                        placeholder="Dropoff address"
                        className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Flight */}
            {form.type === "flight" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Airline / Charter Name</label>
                  <input value={form.airline_name} onChange={(e) => set("airline_name", e.target.value)}
                    placeholder="e.g., Fly540"
                    className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Departure City <span className="text-red-500">*</span></label>
                  <input value={form.departure_city} onChange={(e) => set("departure_city", e.target.value)}
                    placeholder="e.g., Nairobi"
                    className={sfc("departure_city")}
                  />
                  <SFE fieldKey="departure_city" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Arrival City <span className="text-red-500">*</span></label>
                  <input value={form.arrival_city} onChange={(e) => set("arrival_city", e.target.value)}
                    placeholder="e.g., Mombasa"
                    className={sfc("arrival_city")}
                  />
                  <SFE fieldKey="arrival_city" />
                </div>
              </div>
            )}

            {/* Tour */}
            {form.type === "tour" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Amenities / Inclusions</label>
                  <input value={form.amenities} onChange={(e) => set("amenities", e.target.value)}
                    placeholder="e.g., Meals, Transport, Guide (comma separated)"
                    className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration</label>
                    <input value={form.tour_duration} onChange={(e) => set("tour_duration", e.target.value)}
                      placeholder="e.g., 3 days 2 nights"
                      className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Group Size</label>
                    <input value={form.group_size} onChange={(e) => set("group_size", e.target.value)}
                      type="number" placeholder="e.g., 12"
                      className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(0)} className="rounded-full border border-gray-200 px-6 py-2.5 text-gray-600 hover:bg-gray-50">
                ← Back
              </button>
              <button type="button" onClick={tryNextServiceStep} className="rounded-full bg-[#C4622D] px-8 py-2.5 text-white font-semibold hover:opacity-90 transition-opacity">
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: API / Integration */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-[#3D2B1A]">Connect your booking system <span className="text-gray-400 font-normal text-sm">(optional)</span></h3>
              <p className="text-sm text-gray-500 mt-1">
                If you already manage bookings through an external platform (e.g., Amadeus, Beds24,
                your own website), enter the connection details below. AfriStay will sync your
                availability automatically.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { id: "flight", icon: "✈️", name: "Amadeus / Flight API", hint: "For airlines and air charters" },
                { id: "hotel", icon: "🏨", name: "Beds24 / Channel Manager", hint: "For accommodation providers" },
                { id: "sabre", icon: "🖥️", name: "Sabre / GDS", hint: "For travel agents and GDS users" },
                { id: "custom", icon: "⚙️", name: "Custom REST API", hint: "Your own booking endpoint" },
              ].map((api) => (
                <div key={api.id} className="rounded-2xl border border-[#E8D9B8] p-4 flex items-start gap-3">
                  <span className="text-2xl">{api.icon}</span>
                  <div>
                    <div className="font-medium text-sm text-[#3D2B1A]">{api.name}</div>
                    <div className="text-xs text-gray-400">{api.hint}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[#E8D9B8] bg-[#FFFBF5] p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">External Booking URL</label>
                <input value={form.external_booking_url} onChange={(e) => set("external_booking_url", e.target.value)}
                  placeholder="https://your-booking-system.com/availability"
                  className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  The API endpoint where AfriStay can query your real-time availability.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API Key / Token</label>
                <input value={form.api_key} onChange={(e) => set("api_key", e.target.value)}
                  type="password"
                  placeholder="Your API key or access token"
                  className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Stored securely — only used for availability sync requests.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Webhook URL (for booking notifications)</label>
                <input value={form.webhook_url} onChange={(e) => set("webhook_url", e.target.value)}
                  placeholder="https://your-system.com/webhooks/booking"
                  className="w-full rounded-2xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4622D]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  We'll POST booking events here so your system stays in sync.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="rounded-full border border-gray-200 px-6 py-2.5 text-gray-600 hover:bg-gray-50">
                ← Back
              </button>
              <button onClick={() => setStep(3)} className="rounded-full bg-[#C4622D] px-8 py-2.5 text-white font-semibold hover:opacity-90 transition-opacity">
                Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="font-semibold text-[#3D2B1A]">Review your listing</h3>
            <div className="rounded-2xl border border-[#E8D9B8] divide-y divide-[#E8D9B8]">
              {[
                { label: "Type", value: selectedType.label + " " + selectedType.icon },
                { label: "Title", value: form.title },
                { label: "Location", value: form.location },
                { label: "Price", value: form.price_base ? `KES ${Number(form.price_base).toLocaleString()} / ${PRICING_LABELS[form.pricing_type]}` : "—" },
                { label: "External API", value: form.external_booking_url || "Not connected" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-[#3D2B1A] text-right max-w-[60%] truncate">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-[#C4622D]/30 bg-[#FFF5EE] p-4 text-sm text-[#7B4A2D]">
              <strong>What happens next:</strong> After you submit, our admin team will review your
              listing. You'll receive an email at <strong>{user.email}</strong> once it's approved
              (usually within 24 hours). Your service will then be visible to guests.
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)} className="rounded-full border border-gray-200 px-6 py-2.5 text-gray-600 hover:bg-gray-50">
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-full bg-[#C4622D] px-8 py-2.5 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? "Submitting…" : editingService ? "Update Service" : "Submit for Approval →"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Listings sidebar */}
      <aside className="rounded-3xl border border-[#E8D9B8] bg-white p-6 shadow-sm h-fit">
        <h2 className="text-lg font-semibold text-[#3D2B1A] mb-1">Your Listings</h2>
        <p className="text-xs text-gray-400 mb-4">All submitted services and their status</p>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-[#C4622D] border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && services.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">
            <div className="text-4xl mb-2">📋</div>
            No listings yet. Submit your first service above.
          </div>
        )}

        <div className="space-y-3">
          {services.map((service) => {
            const badgeClass = APPROVAL_BADGE[service.approval_status] || "bg-gray-100 text-gray-500";
            const typeInfo = SERVICE_TYPES.find((t) => t.value === service.type);
            return (
              <div key={service.id} className="rounded-2xl border border-gray-100 p-4 hover:border-[#C4622D]/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{typeInfo?.icon || "📌"}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#3D2B1A] truncate">{service.title}</p>
                      <p className="text-xs text-gray-400 truncate">{service.location}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${badgeClass}`}>
                    {service.approval_status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>KES {Number(service.price).toLocaleString()} / {PRICING_LABELS[service.pricing_type] || service.pricing_type}</span>
                  <button
                    onClick={() => onEdit(service)}
                    className="text-[#C4622D] font-semibold hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Host() {
  const { user, setUser } = useContext(AppContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const loadServices = useCallback(async () => {
    if (!user || user.role !== "host") return;
    try {
      setLoading(true);
      const data = await hostService.getMyServices();
      setServices(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Failed to load your services.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleApply = async (formData) => {
    try {
      setLoading(true);
      const res = await userService.becomeHost(formData);
      toast.success(res.message || "Application submitted! We'll review it shortly.");
      setUser({ ...user, host_application_status: res.host_application_status });
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (form, editingService) => {
    if (!form.title || !form.description || !form.price_base || !form.location) {
      toast.error("Please fill in all required fields (Title, Description, Price, Location).");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      type: form.type,
      pricing_type: form.pricing_type,
      price_base: Number(form.price_base),
      location: form.location,
      amenities: form.amenities.split(",").map((s) => s.trim()).filter(Boolean),
      images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
      host_avatar: form.host_avatar || undefined,
      superhost: form.superhost,
      ...(form.type === "accommodation" && {
        rooms: Number(form.rooms) || undefined,
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
      }),
      ...(["transport", "car_rental"].includes(form.type) && {
        vehicle_type: form.vehicle_type,
        capacity: Number(form.capacity) || undefined,
        pickup_location: form.pickup_location,
        dropoff_location: form.dropoff_location,
      }),
      ...(form.type === "flight" && {
        airline_name: form.airline_name,
        departure_city: form.departure_city,
        arrival_city: form.arrival_city,
      }),
      ...(form.type === "tour" && {
        tour_duration: form.tour_duration,
        group_size: Number(form.group_size) || undefined,
      }),
      // API integration fields
      external_booking_url: form.external_booking_url || undefined,
      api_key: form.api_key || undefined,
      webhook_url: form.webhook_url || undefined,
    };

    try {
      setLoading(true);
      if (editingService) {
        await hostService.updateService(editingService.id, payload);
        toast.success("Service updated successfully.");
      } else {
        await hostService.createService(payload);
        toast.success("Service submitted! Awaiting admin approval — you'll be emailed once reviewed.");
      }
      setEditingService(null);
      loadServices();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Unauthenticated ──
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <GuestLanding />
      </div>
    );
  }

  const isHost = user.role === "host";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {!isHost ? (
        <ApplySection user={user} loading={loading} onApply={handleApply} />
      ) : (
        <>
          {/* Host welcome bar */}
          <div className="rounded-2xl bg-gradient-to-r from-[#3D2B1A] to-[#6B3A1F] text-white p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm">Welcome back,</p>
              <h2 className="text-xl font-bold">{user.name || user.email.split("@")[0]}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-xl font-bold">{services.length}</div>
                <div className="text-xs text-white/60">Listings</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{services.filter((s) => s.approval_status === "approved").length}</div>
                <div className="text-xs text-white/60">Live</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{services.filter((s) => s.approval_status === "pending").length}</div>
                <div className="text-xs text-white/60">Pending</div>
              </div>
            </div>
          </div>

          <HostDashboard
            user={user}
            services={services}
            loading={loading}
            onSubmit={handleSubmit}
            onEdit={setEditingService}
            editingService={editingService}
            onCancelEdit={() => setEditingService(null)}
          />
        </>
      )}
    </div>
  );
}
