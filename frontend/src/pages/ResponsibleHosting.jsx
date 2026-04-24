const PRINCIPLES = [
  {
    icon: "🤝",
    title: "Respect Local Communities",
    desc: "Be mindful of local customs, noise levels, and community norms. Your property is part of a neighbourhood — ensure guests are good neighbours.",
  },
  {
    icon: "🌱",
    title: "Environmental Responsibility",
    desc: "Encourage guests to conserve water and electricity, provide recycling facilities, and use eco-friendly toiletries where possible.",
  },
  {
    icon: "🔒",
    title: "Guest Safety First",
    desc: "Ensure smoke detectors, first-aid kits, fire extinguishers, and emergency contacts are clearly accessible for every stay.",
  },
  {
    icon: "📜",
    title: "Accurate Listings",
    desc: "Only list what you can genuinely provide. Misleading descriptions damage trust and result in poor reviews and potential delisting.",
  },
  {
    icon: "🚫",
    title: "Zero Discrimination",
    desc: "AfriStayHub has a strict non-discrimination policy. All guests must be accepted without regard to race, religion, gender, nationality, or disability.",
  },
  {
    icon: "💳",
    title: "Fair Pricing",
    desc: "Keep your pricing transparent. All fees must be listed upfront — no hidden charges that surprise guests at checkout.",
  },
];

const STANDARDS = [
  "Clean, sanitised spaces for every guest",
  "Accurate photos and descriptions",
  "Timely responses (under 24 hours)",
  "Correct check-in instructions provided before arrival",
  "Working essential amenities (water, electricity, WiFi if listed)",
  "No parties or illegal activity on premises",
];

export default function ResponsibleHosting() {
  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      {/* Hero */}
      <div className="bg-[#3D2B1A] text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
          Responsible Hosting
        </h1>
        <p className="text-white/60 max-w-2xl mx-auto text-lg">
          Great hosting goes beyond a clean room. It's about care — for your
          guests, your community, and the environment.
        </p>
      </div>

      {/* Principles */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[#3D2B1A] mb-8">Core Principles</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="bg-white border border-[#E8D9B8] rounded-2xl p-6"
            >
              <span className="text-3xl mb-3 block">{p.icon}</span>
              <h3 className="font-semibold text-[#3D2B1A] mb-2">{p.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Standards Checklist */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="bg-white border border-[#E8D9B8] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-[#3D2B1A] mb-5">
            AfriStayHub Hosting Standards
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            All hosts agree to meet these minimum standards when joining the platform.
          </p>
          <ul className="space-y-3">
            {STANDARDS.map((s) => (
              <li key={s} className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-gray-700 text-sm">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Violations */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="font-semibold text-red-700 mb-2">Policy Violations</h3>
          <p className="text-red-600 text-sm leading-relaxed">
            Hosts who violate AfriStayHub's responsible hosting policies may face
            listing suspension, financial penalties, or permanent removal from the
            platform. If you witness a policy violation as a guest, please report
            it via the Help Centre.
          </p>
        </div>
      </section>
    </div>
  );
}
