import { Link } from "react-router-dom";

const TOPICS = [
  {
    icon: "🏡",
    title: "Host Lounge",
    desc: "Tips, wins, and challenges from hosts across Africa. Share your experience and learn from others.",
    posts: 142,
  },
  {
    icon: "✈️",
    title: "Traveler Stories",
    desc: "Memorable trips, hidden gems, and travel tips from AfriStay guests. Inspire and be inspired.",
    posts: 318,
  },
  {
    icon: "📍",
    title: "Destination Guides",
    desc: "Community-written guides to the best neighborhoods, local food spots, and things to do.",
    posts: 87,
  },
  {
    icon: "🤝",
    title: "Host Meetups",
    desc: "Find in-person and virtual host meetups in your city to connect and grow together.",
    posts: 29,
  },
];

const HIGHLIGHTS = [
  {
    name: "Wanjiru M.",
    location: "Nairobi, Kenya",
    quote: "AfriStay helped me turn my spare cottage into a full income. The host community gave me the confidence to start.",
    avatar: "W",
  },
  {
    name: "Chidi O.",
    location: "Lagos, Nigeria",
    quote: "I've stayed at 12 AfriStay properties. Every one felt like a local experience, not a hotel. That's irreplaceable.",
    avatar: "C",
  },
  {
    name: "Amara D.",
    location: "Accra, Ghana",
    quote: "The host forum answered every question I had before I even listed. This community is genuinely supportive.",
    avatar: "A",
  },
];

export default function Community() {
  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      {/* Hero */}
      <div className="bg-[#3D2B1A] text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
          The AfriStay Community
        </h1>
        <p className="text-white/60 max-w-xl mx-auto text-lg">
          A home for travelers and hosts who believe in the power of authentic African hospitality.
        </p>
      </div>

      {/* Forum Topics */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[#3D2B1A] mb-8">Community Forums</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {TOPICS.map((t) => (
            <div
              key={t.title}
              className="bg-white border border-[#E8D9B8] rounded-2xl p-6 flex gap-4"
            >
              <span className="text-3xl flex-shrink-0">{t.icon}</span>
              <div>
                <h3 className="font-semibold text-[#3D2B1A] mb-1">{t.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">{t.desc}</p>
                <p className="text-xs text-gray-400">{t.posts} posts</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-8">
          Full forum launching soon — join the waitlist by emailing{" "}
          <a href="mailto:community@afristay.co.ke" className="text-[#C4622D]">
            community@afristay.co.ke
          </a>
        </p>
      </section>

      {/* Member Highlights */}
      <section className="bg-[#3D2B1A] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Voices from the Community
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {HIGHLIGHTS.map((h) => (
              <div
                key={h.name}
                className="bg-white/10 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#C4622D] flex items-center justify-center text-white font-bold">
                    {h.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{h.name}</p>
                    <p className="text-white/50 text-xs">{h.location}</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed italic">
                  "{h.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto text-center px-6 py-16">
        <h2 className="text-2xl font-bold text-[#3D2B1A] mb-3">
          Ready to be part of the story?
        </h2>
        <p className="text-gray-600 mb-6">
          Join as a traveler or host and become part of Africa's fastest-growing
          travel community.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="bg-[#C4622D] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Join AfriStay
          </Link>
          <Link
            to="/host"
            className="border-2 border-[#C4622D] text-[#C4622D] px-8 py-3 rounded-xl font-semibold hover:bg-[#C4622D] hover:text-white transition"
          >
            Become a Host
          </Link>
        </div>
      </section>
    </div>
  );
}
