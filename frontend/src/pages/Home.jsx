import { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Hero from "../components/Hero";
import ListingCard from "../components/ListingCard";
import { SearchBar } from "../components/SearchBar";

export default function Home() {
  const { listings, loading, destinations, categories } = useContext(AppContext);

  const expCategories = categories.filter(c => c.category_type === "experience");

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
            {destinations.length > 0 ? destinations.map((dest) => (
              <Link
                key={dest.id}
                to={`/search?category=${dest.slug}`}
                className="relative flex-shrink-0 w-44 h-60 rounded-2xl overflow-hidden snap-start group"
              >
                {dest.image_url ? (
                  <img
                    src={dest.image_url}
                    alt={dest.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#C4622D] to-[#3D2B1A]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-3 text-white">
                  <div className="text-[10px] font-medium opacity-75 mb-0.5">{dest.subtitle}</div>
                  <div className="text-base font-bold leading-tight">{dest.name}</div>
                </div>
              </Link>
            )) : (
              <p className="text-sm text-gray-400 py-4">No destinations configured yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10 px-4 md:px-10 max-w-[1280px] mx-auto">
        <p className="text-[#C4622D] font-semibold text-xs uppercase tracking-widest mb-1">Browse by type</p>
        <h2 className="text-2xl font-bold text-[#3D2B1A] mb-6">Explore by category</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {expCategories.length > 0 ? expCategories.map((cat) => (
            <Link
              key={cat.id}
              to={`/search?category=${cat.slug}`}
              className={`${cat.display_bg || "bg-amber-50"} border ${cat.display_border || "border-amber-200"} rounded-2xl p-4 text-center hover:shadow-md transition-all hover:-translate-y-0.5`}
            >
              <div className="text-2xl mb-2">{cat.icon}</div>
              <p className={`font-semibold text-xs ${cat.display_text || "text-amber-800"}`}>{cat.name}</p>
            </Link>
          )) : (
            <p className="col-span-6 text-sm text-gray-400 py-4">No categories configured yet.</p>
          )}
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
