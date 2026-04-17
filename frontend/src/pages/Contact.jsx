import { useState } from "react";
import { toast } from "react-toastify";

const CONTACTS = [
  {
    icon: "📍",
    label: "Address",
    value: "The Promenade, Westlands, Nairobi, Kenya",
  },
  { icon: "✉️", label: "Email", value: "support@afristay.co.ke" },
  { icon: "📞", label: "Phone", value: "+254 700 000 000" },
  { icon: "🕐", label: "Hours", value: "Mon–Fri, 8am – 6pm EAT" },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: false }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = true;
    if (!form.email.trim()) newErrors.email = true;
    if (!form.subject.trim()) newErrors.subject = true;
    if (!form.message.trim()) newErrors.message = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  const fc = (k) =>
    `w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4622D] ${
      errors[k] ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      {/* Hero */}
      <div className="bg-[#3D2B1A] text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-serif font-bold mb-3">Contact Us</h1>
        <p className="text-white/60 max-w-xl mx-auto">
          Have a question, feedback, or need help? We're here for you.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
        {/* Info */}
        <div>
          <h2 className="text-xl font-bold text-[#3D2B1A] mb-6">Get in Touch</h2>
          <div className="space-y-5">
            {CONTACTS.map((c) => (
              <div key={c.label} className="flex items-start gap-4">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <p className="font-semibold text-[#3D2B1A] text-sm">{c.label}</p>
                  <p className="text-gray-600 text-sm">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-[#E8D9B8] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-[#3D2B1A] mb-6">Send a Message</h2>

          <div className="mb-3">
            <input
              type="text"
              placeholder="Your name *"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={fc("name")}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">Name is required.</p>}
          </div>

          <div className="mb-3">
            <input
              type="email"
              placeholder="Email address *"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={fc("email")}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">Email is required.</p>}
          </div>

          <div className="mb-3">
            <input
              type="text"
              placeholder="Subject *"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              className={fc("subject")}
            />
            {errors.subject && <p className="text-red-500 text-xs mt-1">Subject is required.</p>}
          </div>

          <div className="mb-5">
            <textarea
              rows={5}
              placeholder="Your message *"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              className={fc("message")}
            />
            {errors.message && <p className="text-red-500 text-xs mt-1">Message is required.</p>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#C4622D] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </div>
      </div>
    </div>
  );
}
