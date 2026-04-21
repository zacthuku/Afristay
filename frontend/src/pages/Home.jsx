import { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Hero from "../components/Hero";
import ListingCard from "../components/ListingCard";
import { SearchBar } from "../components/SearchBar";

const DESTINATIONS = [
  { name: "Nairobi",      subtitle: "City Stays",        stays: "320+ stays", image: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?auto=format&fit=crop&w=800&q=80", slug: "city"    },
  { name: "Diani Beach",  subtitle: "Beach Escapes",     stays: "180+ stays", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", slug: "beach"   },
  { name: "Maasai Mara",  subtitle: "Safari Lodges",     stays: "95+ stays",  image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80", slug: "safari"  },
  { name: "Zanzibar",     subtitle: "Island Retreats",   stays: "210+ stays", image: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=800&q=80", slug: "beach"   },
  { name: "Kigali",       subtitle: "City Breaks",       stays: "140+ stays", image: "https://images.unsplash.com/photo-1591018533852-37b68de0e80b?auto=format&fit=crop&w=800&q=80", slug: "city"    },
  { name: "Nanyuki",      subtitle: "Mountain Escapes",  stays: "60+ stays",  image: "https://images.unsplash.com/photo-1589308454676-22da0e8a8312?auto=format&fit=crop&w=800&q=80", slug: "weekend" },
];

const CATEGORIES = [
  { name: "Safari Lodges",    icon: "🦁", slug: "safari",  bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800"   },
  { name: "Beach Escapes",    icon: "🏖️", slug: "beach",   bg: "bg-sky-50",     border: "border-sky-200",     text: "text-sky-800"     },
  { name: "City Stays",       icon: "🏙️", slug: "city",    bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-800"   },
  { name: "Weekend Getaways", icon: "🌄", slug: "weekend", bg: "bg-green-50",   border: "border-green-200",   text: "text-green-800"   },
  { name: "Mountain Escapes", icon: "⛰️", slug: "weekend", bg: "bg-stone-50",   border: "border-stone-200",   text: "text-stone-800"   },
  { name: "Bush Camps",       icon: "🌿", slug: "safari",  bg: "bg-emerald-50", border: "border-emerald-200",  text: "text-emerald-800" },
];

export default function Home() {
  const { listings, loading } = useContext(AppContext);

  const topListings = [...listings]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return (
    <div className="bg-[#FAF6EF] min-h-screen">

      {/* Hero */}
      <Hero />

      {/* Floating search */}
      <div className="relative z-20 -mt-8 px-4 md:px-10 max-w-5xl mx-auto">
        <SearchBar />
      </div>

      {/* Popular destinations */}
      <section className="py-12 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[#C4622D] font-semibold text-xs uppercase tracking-widest mb-1">Top Picks</p>
              <h2 className="text-2xl font-bold text-[#3D2B1A]">Popular destinations</h2>
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
                className="relative flex-shrink-0 w-44 h-60 rounded-2xl overflow-hidden snap-start group"
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-3 text-white">
                  <div className="text-[10px] font-medium opacity-75 mb-0.5">{dest.subtitle}</div>
                  <div className="text-base font-bold leading-tight">{dest.name}</div>
                  <div className="text-[10px] opacity-60 mt-0.5">{dest.stays}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10 px-4 md:px-10 max-w-[1280px] mx-auto">
        <p className="text-[#C4622D] font-semibold text-xs uppercase tracking-widest mb-1">Browse by type</p>
        <h2 className="text-2xl font-bold text-[#3D2B1A] mb-6">Explore by category</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={i}
              to={`/search?category=${cat.slug}`}
              className={`${cat.bg} border ${cat.border} rounded-2xl p-4 text-center hover:shadow-md transition-all hover:-translate-y-0.5`}
            >
              <div className="text-2xl mb-2">{cat.icon}</div>
              <p className={`font-semibold text-xs ${cat.text}`}>{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured stays */}
      <section className="py-10 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[#C4622D] font-semibold text-xs uppercase tracking-widest mb-1">Highest Rated</p>
              <h2 className="text-2xl font-bold text-[#3D2B1A]">Featured stays</h2>
            </div>
            <Link to="/search" className="text-[#C4622D] font-medium text-sm hover:underline hidden md:block">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="text-center mt-6 md:hidden">
            <Link to="/search" className="inline-block border border-[#C4622D] text-[#C4622D] px-6 py-2 rounded-full text-sm font-medium">
              View all stays
            </Link>
          </div>
        </div>
      </section>

      {/* Host CTA — slim banner */}
      <section className="py-10 px-4 md:px-10" style={{ background: "linear-gradient(135deg, #3D2B1A 0%, #6B3A1F 60%, #C4622D 100%)" }}>
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-1">For hosts</p>
            <h3 className="text-xl font-bold">Turn your space into income</h3>
            <p className="text-white/70 text-sm mt-1">Join 1,200+ hosts earning with AfriStay — list in under 10 minutes.</p>
          </div>
          <Link
            to="/host"
            className="shrink-0 bg-white text-[#C4622D] font-semibold px-7 py-2.5 rounded-full hover:bg-[#FAF6EF] transition-colors text-sm"
          >
            Become a Host
          </Link>
        </div>
      </section>

    </div>
  );
}
