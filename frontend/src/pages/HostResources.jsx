import { Link } from "react-router-dom";

const GUIDES = [
  {
    icon: "📸",
    title: "Photography Tips",
    desc: "Learn how to take stunning photos that attract more bookings. Natural light, wide angles, and story-driven shots make the difference.",
  },
  {
    icon: "💰",
    title: "Smart Pricing",
    desc: "Set competitive rates using seasonal demand, local events, and our pricing recommendations to maximize your earnings.",
  },
  {
    icon: "🗓️",
    title: "Managing Availability",
    desc: "Keep your calendar up to date to avoid double bookings and improve your search ranking on AfriStayHub.",
  },
  {
    icon: "💬",
    title: "Guest Communication",
    desc: "Respond quickly and warmly. Guests who receive fast replies are far more likely to complete a booking.",
  },
  {
    icon: "⭐",
    title: "Earning 5-Star Reviews",
    desc: "Small touches — welcome drinks, local tips, clean towels — create memorable stays and glowing reviews.",
  },
  {
    icon: "🔒",
    title: "Safety & Security",
    desc: "Best practices for vetting guests, protecting your property, and handling disputes through AfriStayHub's resolution centre.",
  },
];

const FAQS = [
  {
    q: "How do I get paid?",
    a: "Payments are released to your M-Pesa or bank account within 24 hours of guest check-in, after a short holding period for dispute protection.",
  },
  {
    q: "Can I set minimum stay requirements?",
    a: "Yes. You can set minimum and maximum night requirements from your host dashboard under listing settings.",
  },
  {
    q: "What fees does AfriStayHub charge hosts?",
    a: "AfriStayHub charges a 3% host service fee on each confirmed booking. Guests pay a separate guest service fee.",
  },
  {
    q: "How does the review system work?",
    a: "After each stay, both guests and hosts can leave reviews. Reviews are published only after both parties submit, or after 14 days.",
  },
];

export default function HostResources() {
  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      {/* Hero */}
      <div className="bg-[#3D2B1A] text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Host Resources</h1>
        <p className="text-white/60 max-w-xl mx-auto text-lg">
          Everything you need to run a successful listing on AfriStayHub.
        </p>
        <Link
          to="/host"
          className="inline-block mt-6 bg-[#C4622D] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition"
        >
          Become a Host
        </Link>
      </div>

      {/* Guides */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[#3D2B1A] mb-8">Hosting Guides</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GUIDES.map((g) => (
            <div
              key={g.title}
              className="bg-white border border-[#E8D9B8] rounded-2xl p-6"
            >
              <span className="text-3xl mb-3 block">{g.icon}</span>
              <h3 className="font-semibold text-[#3D2B1A] mb-2">{g.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-[#3D2B1A] mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQS.map((f) => (
            <div
              key={f.q}
              className="bg-white border border-[#E8D9B8] rounded-2xl p-6"
            >
              <p className="font-semibold text-[#3D2B1A] mb-2">{f.q}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
