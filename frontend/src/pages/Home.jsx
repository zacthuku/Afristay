import { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Hero from "../components/Hero";
import ListingCard from "../components/ListingCard";
import { SearchBar } from "../components/SearchBar";

const HOW_IT_WORKS = [
  {
    icon: "🔍",
    title: "Search Your Destination",
    desc: "Browse thousands of hand-picked stays across East Africa — from city apartments to safari lodges.",
  },
  {
    icon: "📅",
    title: "Book Instantly",
    desc: "Secure your stay in seconds. Real-time availability, transparent pricing, no hidden fees.",
  },
  {
    icon: "📱",
    title: "Pay with M-Pesa",
    desc: "Checkout natively with M-Pesa. No cards needed — just your phone number and PIN.",
  },
];

const DESTINATIONS = [
  {
    name: "Nairobi",
    subtitle: "City Stays",
    stays: "320+ stays",
    image: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?auto=format&fit=crop&w=800&q=80",
    slug: "city",
  },
  {
    name: "Diani Beach",
    subtitle: "Beach Escapes",
    stays: "180+ stays",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    slug: "beach",
  },
  {
    name: "Maasai Mara",
    subtitle: "Safari Lodges",
    stays: "95+ stays",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
    slug: "safari",
  },
  {
    name: "Zanzibar",
    subtitle: "Island Retreats",
    stays: "210+ stays",
    image: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=800&q=80",
    slug: "beach",
  },
  {
    name: "Kigali",
    subtitle: "City Breaks",
    stays: "140+ stays",
    image: "https://images.unsplash.com/photo-1591018533852-37b68de0e80b?auto=format&fit=crop&w=800&q=80",
    slug: "city",
  },
  {
    name: "Nanyuki",
    subtitle: "Mountain Escapes",
    stays: "60+ stays",
    image: "https://images.unsplash.com/photo-1589308454676-22da0e8a8312?auto=format&fit=crop&w=800&q=80",
    slug: "weekend",
  },
];

const CATEGORIES = [
  { name: "Safari Lodges",     icon: "🦁", slug: "safari",  bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-800"  },
  { name: "Beach Escapes",     icon: "🏖️", slug: "beach",   bg: "bg-sky-50",     border: "border-sky-200",    text: "text-sky-800"    },
  { name: "City Stays",        icon: "🏙️", slug: "city",    bg: "bg-slate-50",   border: "border-slate-200",  text: "text-slate-800"  },
  { name: "Weekend Getaways",  icon: "🌄", slug: "weekend", bg: "bg-green-50",   border: "border-green-200",  text: "text-green-800"  },
  { name: "Mountain Escapes",  icon: "⛰️", slug: "weekend", bg: "bg-stone-50",   border: "border-stone-200",  text: "text-stone-800"  },
  { name: "Bush Camps",        icon: "🌿", slug: "safari",  bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800" },
];

const WHY_FEATURES = [
  { icon: "🌍", title: "Africa-first platform",  desc: "Built for African travellers, not adapted from Western platforms." },
  { icon: "📱", title: "M-Pesa native",           desc: "Pay with mobile money — no international card required." },
  { icon: "✅", title: "Verified hosts",           desc: "Every host is vetted and approved before going live." },
  { icon: "⭐", title: "Trusted reviews",          desc: "Genuine reviews from real guests who've stayed on-site." },
];

const TESTIMONIALS = [
  {
    quote: "Booked a safari lodge in the Mara in minutes. The M-Pesa payment was seamless — no card hassle at all. Best experience ever.",
    name: "Amara Osei",
    role: "Traveller · Accra",
    initials: "AO",
    color: "bg-[#C4622D]",
  },
  {
    quote: "AfriStay found me a beachfront villa in Diani at half the price of other platforms. The host was incredible and the reviews were spot on.",
    name: "Zara Mwangi",
    role: "Travel Blogger · Nairobi",
    initials: "ZM",
    color: "bg-[#2D6B4A]",
  },
  {
    quote: "As a host, I've had amazing guests through AfriStay. The platform understands the African hospitality market like no other.",
    name: "David Kamau",
    role: "Host · Nanyuki",
    initials: "DK",
    color: "bg-[#1A3D5C]",
  },
];

export default function Home() {
  const { listings, loading } = useContext(AppContext);

  const topListings = [...listings]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  return (
    <div className="bg-[#FAF6EF] min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <Hero />

      {/* ── FLOATING SEARCH ──────────────────────────────────── */}
      <div className="relative z-20 -mt-8 px-4 md:px-10 max-w-5xl mx-auto">
        <SearchBar />
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-10 max-w-[1280px] mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#C4622D] font-semibold text-xs uppercase tracking-widest mb-2">Simple & Fast</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#3D2B1A]">How AfriStay works</h2>
          <p className="text-[#5C4230]/70 mt-3 max-w-xl mx-auto text-sm md:text-base">
            From search to check-in — the whole journey takes minutes, not hours.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[#E8D9B8] hover:shadow-md transition-shadow"
            >
              <div className="text-5xl mb-4">{step.icon}</div>
              <div className="w-7 h-7 rounded-full bg-[#C4622D] text-white text-xs font-bold flex items-center justify-center mx-auto mb-3">
                {i + 1}
              </div>
              <h3 className="text-base font-bold text-[#3D2B1A] mb-2">{step.title}</h3>
              <p className="text-[#5C4230]/70 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── POPULAR DESTINATIONS ─────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[#C4622D] font-semibold text-xs uppercase tracking-widest mb-1">Top Picks</p>
              <h2 className="text-3xl font-bold text-[#3D2B1A]">Popular destinations</h2>
            </div>
            <Link to="/search" className="text-[#C4622D] font-medium text-sm hover:underline hidden md:block">
              View all →
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {DESTINATIONS.map((dest, i) => (
              <Link
                key={i}
                to={`/search?category=${dest.slug}`}
                className="relative flex-shrink-0 w-52 h-72 rounded-2xl overflow-hidden snap-start group"
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <div className="text-[11px] font-medium opacity-75 mb-0.5">{dest.subtitle}</div>
                  <div className="text-lg font-bold leading-tight">{dest.name}</div>
                  <div className="text-[11px] opacity-60 mt-1">{dest.stays}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-10 max-w-[1280px] mx-auto">
        <div className="text-center mb-10">
          <p className="text-[#C4622D] font-semibold text-xs uppercase tracking-widest mb-1">Browse by type</p>
          <h2 className="text-3xl font-bold text-[#3D2B1A]">Explore by category</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={i}
              to={`/search?category=${cat.slug}`}
              className={`${cat.bg} border ${cat.border} rounded-2xl p-5 text-center hover:shadow-md transition-all hover:-translate-y-0.5`}
            >
              <div className="text-3xl mb-3">{cat.icon}</div>
              <p className={`font-semibold text-xs ${cat.text}`}>{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED STAYS ───────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[#C4622D] font-semibold text-xs uppercase tracking-widest mb-1">Highest Rated</p>
              <h2 className="text-3xl font-bold text-[#3D2B1A]">Featured stays</h2>
            </div>
            <Link to="/search" className="text-[#C4622D] font-medium text-sm hover:underline hidden md:block">
              View all stays →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link
              to="/search"
              className="inline-block border border-[#C4622D] text-[#C4622D] px-6 py-2 rounded-full text-sm font-medium"
            >
              View all stays
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY AFRISTAY ─────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-10 max-w-[1280px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <p className="text-[#C4622D] font-semibold text-xs uppercase tracking-widest mb-2">Why choose us</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#3D2B1A] mb-4 leading-snug">
              Built for Africa.<br />By Africans.
            </h2>
            <p className="text-[#5C4230]/70 mb-8 leading-relaxed text-sm md:text-base">
              AfriStay isn't a global platform retrofitted for Africa. We were built here, for the unique needs
              of African travellers and hosts — from mobile money payments to local language support.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {WHY_FEATURES.map((f, i) => (
                <div key={i} className="flex gap-3">
                  <div className="text-2xl mt-0.5 flex-shrink-0">{f.icon}</div>
                  <div>
                    <div className="font-semibold text-[#3D2B1A] text-sm">{f.title}</div>
                    <div className="text-[#5C4230]/70 text-xs mt-0.5 leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/about"
              className="inline-block mt-8 bg-[#C4622D] text-white px-7 py-3 rounded-full font-medium hover:bg-[#a94e20] transition-colors text-sm"
            >
              Learn more about us
            </Link>
          </div>

          {/* Stat mosaic */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#C4622D] rounded-2xl p-6 text-white flex flex-col justify-between min-h-[140px]">
              <div className="text-4xl font-bold">2,400+</div>
              <div className="text-white/70 text-xs mt-2">Verified stays across East Africa</div>
            </div>
            <div className="bg-[#3D2B1A] rounded-2xl p-6 text-white flex flex-col justify-between min-h-[140px]">
              <div className="text-4xl font-bold">8</div>
              <div className="text-white/70 text-xs mt-2">Countries covered &amp; growing</div>
            </div>
            <div className="bg-[#FAF6EF] border border-[#E8D9B8] rounded-2xl p-6 flex flex-col justify-between min-h-[140px]">
              <div className="text-4xl font-bold text-[#3D2B1A]">98%</div>
              <div className="text-[#5C4230]/70 text-xs mt-2">Guest satisfaction rate</div>
            </div>
            <div className="bg-[#2D6B4A] rounded-2xl p-6 text-white flex flex-col justify-between min-h-[140px]">
              <div className="text-4xl font-bold">M-Pesa</div>
              <div className="text-white/70 text-xs mt-2">Native mobile money checkout</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BECOME A HOST CTA ────────────────────────────────── */}
      <section
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #3D2B1A 0%, #6B3A1F 55%, #C4622D 100%)" }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="relative max-w-[1280px] mx-auto px-4 md:px-10 text-center text-white">
          <p className="text-white/60 font-semibold text-xs uppercase tracking-widest mb-3">For hosts</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Turn your space into income</h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8 text-sm md:text-base">
            Join 1,200+ hosts earning with AfriStay. List your property in under 10 minutes and
            start receiving M-Pesa bookings today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/host"
              className="bg-white text-[#C4622D] font-semibold px-8 py-3 rounded-full hover:bg-[#FAF6EF] transition-colors text-sm"
            >
              Become a Host
            </Link>
            <Link
              to="/host-resources"
              className="border border-white/30 text-white px-8 py-3 rounded-full hover:bg-white/10 transition-colors text-sm"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-10 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C4622D] font-semibold text-xs uppercase tracking-widest mb-2">Happy guests</p>
            <h2 className="text-3xl font-bold text-[#3D2B1A]">What travellers are saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-[#FAF6EF] border border-[#E8D9B8] rounded-2xl p-6 flex flex-col gap-3"
              >
                <div className="text-[#C4622D] text-4xl font-serif leading-none select-none">"</div>
                <p className="text-[#3D2B1A] leading-relaxed text-sm flex-1">{t.quote}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#E8D9B8]">
                  <div
                    className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                  >
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[#3D2B1A] text-sm truncate">{t.name}</div>
                    <div className="text-[#5C4230]/60 text-xs">{t.role}</div>
                  </div>
                  <div className="ml-auto text-yellow-400 text-xs flex-shrink-0">★★★★★</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-10 bg-[#FAF6EF]">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#3D2B1A] mb-4">
            Ready to explore Africa?
          </h2>
          <p className="text-[#5C4230]/70 mb-8 text-sm md:text-base">
            Find your perfect stay — from city apartments to bush camps — and book in seconds with M-Pesa.
          </p>
          <Link
            to="/search"
            className="inline-block bg-[#C4622D] text-white px-10 py-4 rounded-full font-semibold text-base hover:bg-[#a94e20] transition-colors"
          >
            Start exploring
          </Link>
        </div>
      </section>

    </div>
  );
}
