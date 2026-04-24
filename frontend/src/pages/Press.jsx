const RELEASES = [
  {
    date: "March 2026",
    title: "AfriStayHub Raises $2M Seed Round to Expand Across East Africa",
    outlet: "TechCabal",
    excerpt:
      "AfriStayHub, the Nairobi-based accommodation marketplace, has closed a $2M seed round led by pan-African investors to fuel expansion into Uganda, Tanzania, and Rwanda.",
  },
  {
    date: "January 2026",
    title: "AfriStayHub Launches M-Pesa Instant Booking for Kenyan Travelers",
    outlet: "Business Daily Africa",
    excerpt:
      "Travelers can now book and pay for stays instantly using M-Pesa, removing the friction of international card payments for local guests.",
  },
  {
    date: "October 2025",
    title: "AfriStayHub Named Top African Travel Startup to Watch in 2026",
    outlet: "Forbes Africa",
    excerpt:
      "Forbes Africa highlighted AfriStayHub among its top 10 startups reshaping travel and hospitality across Sub-Saharan Africa.",
  },
];

const LOGOS = ["TechCabal", "Business Daily", "Forbes Africa", "The Standard", "Reuters Africa"];

export default function Press() {
  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      {/* Hero */}
      <div className="bg-[#3D2B1A] text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-serif font-bold mb-3">Press & Media</h1>
        <p className="text-white/60 max-w-xl mx-auto">
          News, announcements, and media resources from AfriStayHub.
        </p>
      </div>

      {/* Press Logos */}
      <section className="bg-white py-8 px-6">
        <p className="text-center text-sm text-gray-400 mb-5 uppercase tracking-widest">
          As Featured In
        </p>
        <div className="flex flex-wrap justify-center gap-8">
          {LOGOS.map((l) => (
            <span key={l} className="text-gray-400 font-semibold text-sm">
              {l}
            </span>
          ))}
        </div>
      </section>

      {/* Releases */}
      <section className="max-w-3xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-[#3D2B1A] mb-8">Press Releases</h2>
        <div className="space-y-6">
          {RELEASES.map((r) => (
            <div
              key={r.title}
              className="bg-white border border-[#E8D9B8] rounded-2xl p-6"
            >
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                {r.date} · {r.outlet}
              </p>
              <h3 className="font-semibold text-[#3D2B1A] mb-2">{r.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{r.excerpt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Media Kit */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-[#3D2B1A] text-white rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1">Media Kit</h3>
            <p className="text-white/60 text-sm">
              Logos, brand guidelines, and executive bios for press use.
            </p>
          </div>
          <a
            href="mailto:press@afristayhub.co.ke"
            className="flex-shrink-0 bg-[#C4622D] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition text-sm"
          >
            Request Media Kit
          </a>
        </div>
      </section>
    </div>
  );
}
