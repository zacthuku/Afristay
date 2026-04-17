import { Link } from "react-router-dom";

const STATS = [
  { value: "12+", label: "Countries" },
  { value: "3,400+", label: "Listings" },
  { value: "50K+", label: "Travelers" },
  { value: "1,200+", label: "Hosts" },
];

const VALUES = [
  {
    title: "Authenticity",
    desc: "We curate stays that reflect the true spirit of Africa — not just a room, but a story.",
  },
  {
    title: "Community",
    desc: "Every booking supports local hosts, families, and economies across the continent.",
  },
  {
    title: "Trust & Safety",
    desc: "Verified listings, secure payments, and 24/7 support so you travel with confidence.",
  },
  {
    title: "Sustainability",
    desc: "We champion eco-conscious properties and responsible travel practices.",
  },
];

export default function About() {
  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      {/* Hero */}
      <div className="bg-[#3D2B1A] text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
          About Afri<span className="text-[#C4622D]">Stay</span>
        </h1>
        <p className="text-white/70 max-w-2xl mx-auto text-lg">
          We're on a mission to make Africa's most extraordinary stays
          accessible to every traveler in the world.
        </p>
      </div>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[#3D2B1A] mb-4">Our Story</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          AfriStay was founded in Nairobi in 2022 by a group of travelers and
          entrepreneurs who were frustrated that Africa's most breathtaking
          properties were invisible to the world. From cliffside lodges in
          Ethiopia to beachfront villas in Mozambique, these gems deserved a
          platform built specifically for the African context.
        </p>
        <p className="text-gray-600 leading-relaxed">
          We built AfriStay to bridge that gap — combining M-Pesa payments,
          local host support, and a deep respect for African hospitality into
          one seamless marketplace.
        </p>
      </section>

      {/* Stats */}
      <section className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-[#C4622D]">{s.value}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[#3D2B1A] mb-8">Our Values</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="bg-white border border-[#E8D9B8] rounded-2xl p-6"
            >
              <h3 className="font-semibold text-[#3D2B1A] mb-2">{v.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#3D2B1A] text-white text-center py-16 px-6">
        <h2 className="text-2xl font-bold mb-3">Ready to explore Africa?</h2>
        <p className="text-white/60 mb-6">
          Join thousands of travelers discovering unforgettable stays.
        </p>
        <Link
          to="/search"
          className="inline-block bg-[#C4622D] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition"
        >
          Browse Stays
        </Link>
      </section>
    </div>
  );
}
