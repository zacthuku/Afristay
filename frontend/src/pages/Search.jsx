import { useContext, useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import ListingCard from "../components/ListingCard";

const TYPE_OPTIONS = [
  { value: "", label: "All types", icon: "🌍" },
  { value: "accommodation", label: "Stays", icon: "🏠" },
  { value: "transport", label: "Transport", icon: "🚌" },
  { value: "attraction", label: "Attractions", icon: "🗺️" },
  { value: "restaurant", label: "Restaurants", icon: "🍽️" },
  { value: "experience", label: "Experiences", icon: "🎭" },
  { value: "tour", label: "Tours", icon: "🧭" },
  { value: "adventure", label: "Adventures", icon: "🏔️" },
  { value: "wellness", label: "Wellness", icon: "🧘" },
  { value: "event", label: "Events", icon: "🎪" },
  { value: "cruise", label: "Cruises", icon: "🛳️" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviewed" },
];

const RATING_OPTIONS = [5, 4, 3, 2];

const AMENITY_OPTIONS = [
  "WiFi", "Parking", "Pool", "Air Conditioning", "Breakfast Included",
  "Kitchen", "Gym", "Pet Friendly", "Airport Transfer", "24hr Reception",
  "Hot Water", "Security", "Generator", "Garden", "Balcony",
];

const STAR_OPTIONS = [
  { value: 5, label: "5 Stars" },
  { value: 4, label: "4 Stars" },
  { value: 3, label: "3 Stars" },
  { value: 2, label: "2 Stars" },
  { value: 1, label: "1 Star" },
];

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#EDE0D0] pb-4 mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <span className="font-semibold text-[#3D2B1A] text-sm">{title}</span>
        <span className="text-[#C4622D] text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && children}
    </div>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchResults, loading, handleSearch, destinations, activeCities } = useContext(AppContext);

  const category  = searchParams.get("category") || "";
  const typeParam = searchParams.get("type") || "";
  const queryParam = searchParams.get("q") || "";

  // ── local filter state (client-side on top of server results) ──────────────
  const [selectedType, setSelectedType]     = useState(typeParam);
  const [priceMin, setPriceMin]             = useState("");
  const [priceMax, setPriceMax]             = useState("");
  const [minRating, setMinRating]           = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedStars, setSelectedStars]   = useState([]);
  const [selectedCity, setSelectedCity]     = useState("");
  const [sortBy, setSortBy]                 = useState("relevance");
  const [sidebarOpen, setSidebarOpen]       = useState(false);

  // ── avoid infinite re-fetch ────────────────────────────────────────────────
  const prevKey = useRef("");
  const currentKey = `${typeParam}|${queryParam}|${category}`;

  useEffect(() => {
    if (prevKey.current === currentKey) return;
    prevKey.current = currentKey;
    setSelectedType(typeParam);
    handleSearch({ type: typeParam, query: queryParam, category });
  }, [currentKey, typeParam, queryParam, category, handleSearch]);

  // ── apply type filter via URL ──────────────────────────────────────────────
  function applyTypeFilter(val) {
    setSelectedType(val);
    const next = new URLSearchParams(searchParams);
    if (val) next.set("type", val); else next.delete("type");
    setSearchParams(next);
  }

  // ── amenity toggle ─────────────────────────────────────────────────────────
  function toggleAmenity(a) {
    setSelectedAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  }

  function toggleStar(s) {
    setSelectedStars(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  // ── client-side filtering + sorting ───────────────────────────────────────
  const filtered = useMemo(() => {
    let res = [...searchResults];

    if (priceMin !== "") res = res.filter(l => (l.price ?? 0) >= Number(priceMin));
    if (priceMax !== "") res = res.filter(l => (l.price ?? 0) <= Number(priceMax));
    if (minRating > 0)   res = res.filter(l => (l.rating ?? 0) >= minRating);
    if (selectedCity)    res = res.filter(l => l.location?.toLowerCase().includes(selectedCity.toLowerCase()));

    if (selectedAmenities.length > 0) {
      res = res.filter(l =>
        selectedAmenities.every(a =>
          l.amenities?.map(x => x.toLowerCase()).includes(a.toLowerCase())
        )
      );
    }

    if (selectedStars.length > 0) {
      res = res.filter(l => selectedStars.includes(Math.round(l.rating ?? 0)));
    }

    switch (sortBy) {
      case "price_asc":  res.sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); break;
      case "price_desc": res.sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); break;
      case "rating":     res.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      case "reviews":    res.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0)); break;
      default: break;
    }

    return res;
  }, [searchResults, priceMin, priceMax, minRating, selectedCity, selectedAmenities, selectedStars, sortBy]);

  // ── active filter count (for mobile badge) ────────────────────────────────
  const activeFilterCount = [
    priceMin, priceMax,
    minRating > 0 ? minRating : null,
    selectedCity,
    ...selectedAmenities,
    ...selectedStars,
  ].filter(Boolean).length;

  function clearAll() {
    setPriceMin(""); setPriceMax(""); setMinRating(0);
    setSelectedAmenities([]); setSelectedStars([]);
    setSelectedCity(""); setSortBy("relevance");
  }

  const heading = selectedType
    ? TYPE_OPTIONS.find(t => t.value === selectedType)?.label || selectedType
    : queryParam
    ? `Results for "${queryParam}"`
    : category
    ? category.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : "All Listings";

  // ── city list: prefer activeCities from context, fallback to extracting from results ──
  const cityList = useMemo(() => {
    if (activeCities?.length > 0) return activeCities;
    const cities = [...new Set(searchResults.map(l => l.location?.split(",")[0]).filter(Boolean))];
    return cities.sort();
  }, [activeCities, searchResults]);

  // ── sidebar panel (shared between desktop + mobile drawer) ────────────────
  const Sidebar = (
    <aside className="w-full">
      {/* Sort */}
      <FilterSection title="Sort by">
        <div className="space-y-1">
          {SORT_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="sort"
                value={opt.value}
                checked={sortBy === opt.value}
                onChange={() => setSortBy(opt.value)}
                className="accent-[#C4622D]"
              />
              <span className="text-sm text-gray-600 group-hover:text-[#C4622D]">{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Type */}
      <FilterSection title="Listing type">
        <div className="space-y-1">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => applyTypeFilter(opt.value)}
              className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
                selectedType === opt.value
                  ? "bg-[#C4622D] text-white font-semibold"
                  : "hover:bg-[#FAF6EF] text-gray-600"
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price range */}
      <FilterSection title="Price range (per night)">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 block mb-0.5">Min</label>
            <input
              type="number"
              placeholder="0"
              value={priceMin}
              min={0}
              onChange={e => setPriceMin(e.target.value)}
              className="w-full border border-[#EDE0D0] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#C4622D]"
            />
          </div>
          <span className="text-gray-400 mt-4">–</span>
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 block mb-0.5">Max</label>
            <input
              type="number"
              placeholder="Any"
              value={priceMax}
              min={0}
              onChange={e => setPriceMax(e.target.value)}
              className="w-full border border-[#EDE0D0] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#C4622D]"
            />
          </div>
        </div>
        {/* Quick presets */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[["Under $50", "", "50"], ["$50–$150", "50", "150"], ["$150–$300", "150", "300"], ["$300+", "300", ""]].map(([label, mn, mx]) => (
            <button
              key={label}
              onClick={() => { setPriceMin(mn); setPriceMax(mx); }}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                priceMin === mn && priceMax === mx
                  ? "bg-[#C4622D] text-white border-[#C4622D]"
                  : "border-[#EDE0D0] text-gray-500 hover:border-[#C4622D] hover:text-[#C4622D]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Minimum rating */}
      <FilterSection title="Minimum rating">
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="rating" checked={minRating === 0} onChange={() => setMinRating(0)} className="accent-[#C4622D]" />
            <span className="text-sm text-gray-600">Any rating</span>
          </label>
          {RATING_OPTIONS.map(r => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="rating" checked={minRating === r} onChange={() => setMinRating(r)} className="accent-[#C4622D]" />
              <span className="text-yellow-500 text-sm">{"★".repeat(r)}</span>
              <span className="text-sm text-gray-600">{r}+ stars</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Star category */}
      <FilterSection title="Star category" defaultOpen={false}>
        <div className="space-y-1">
          {STAR_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStars.includes(opt.value)}
                onChange={() => toggleStar(opt.value)}
                className="accent-[#C4622D]"
              />
              <span className="text-yellow-500 text-sm">{"★".repeat(opt.value)}{"☆".repeat(5 - opt.value)}</span>
              <span className="text-sm text-gray-600">{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* City / location */}
      {cityList.length > 0 && (
        <FilterSection title="City / area" defaultOpen={false}>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="city" checked={selectedCity === ""} onChange={() => setSelectedCity("")} className="accent-[#C4622D]" />
              <span className="text-sm text-gray-600">All cities</span>
            </label>
            {cityList.map(city => (
              <label key={city} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="city" checked={selectedCity === city} onChange={() => setSelectedCity(city)} className="accent-[#C4622D]" />
                <span className="text-sm text-gray-600">{city}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Amenities */}
      <FilterSection title="Amenities" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-1 max-h-52 overflow-y-auto pr-1">
          {AMENITY_OPTIONS.map(a => (
            <label key={a} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedAmenities.includes(a)}
                onChange={() => toggleAmenity(a)}
                className="accent-[#C4622D]"
              />
              <span className="text-sm text-gray-600">{a}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Destinations quick links */}
      {destinations.length > 0 && (
        <FilterSection title="Popular destinations" defaultOpen={false}>
          <div className="space-y-1">
            {destinations.slice(0, 8).map(dest => (
              <Link
                key={dest.id}
                to={`/search?category=${dest.slug}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#C4622D] transition-colors py-0.5"
              >
                <span className="text-[#C4622D]">›</span>
                {dest.name}
              </Link>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Clear all */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          className="w-full mt-2 py-2 rounded-xl border border-[#C4622D] text-[#C4622D] text-sm font-semibold hover:bg-[#C4622D] hover:text-white transition-colors"
        >
          Clear all filters ({activeFilterCount})
        </button>
      )}
    </aside>
  );

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#3D2B1A]">{heading}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {loading ? "Searching…" : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""} found`}
            </p>
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="sm:hidden flex items-center gap-2 bg-white border border-[#EDE0D0] rounded-xl px-4 py-2 text-sm font-medium text-[#3D2B1A] shadow-sm"
          >
            <span>⚙️</span>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-[#C4622D] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filter pills */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {priceMin && (
              <span className="flex items-center gap-1 bg-[#C4622D]/10 text-[#C4622D] text-xs px-3 py-1 rounded-full border border-[#C4622D]/20">
                Min ${priceMin}
                <button onClick={() => setPriceMin("")} className="ml-1 font-bold hover:text-red-600">×</button>
              </span>
            )}
            {priceMax && (
              <span className="flex items-center gap-1 bg-[#C4622D]/10 text-[#C4622D] text-xs px-3 py-1 rounded-full border border-[#C4622D]/20">
                Max ${priceMax}
                <button onClick={() => setPriceMax("")} className="ml-1 font-bold hover:text-red-600">×</button>
              </span>
            )}
            {minRating > 0 && (
              <span className="flex items-center gap-1 bg-[#C4622D]/10 text-[#C4622D] text-xs px-3 py-1 rounded-full border border-[#C4622D]/20">
                {"★".repeat(minRating)}+
                <button onClick={() => setMinRating(0)} className="ml-1 font-bold hover:text-red-600">×</button>
              </span>
            )}
            {selectedCity && (
              <span className="flex items-center gap-1 bg-[#C4622D]/10 text-[#C4622D] text-xs px-3 py-1 rounded-full border border-[#C4622D]/20">
                📍 {selectedCity}
                <button onClick={() => setSelectedCity("")} className="ml-1 font-bold hover:text-red-600">×</button>
              </span>
            )}
            {selectedAmenities.map(a => (
              <span key={a} className="flex items-center gap-1 bg-[#C4622D]/10 text-[#C4622D] text-xs px-3 py-1 rounded-full border border-[#C4622D]/20">
                {a}
                <button onClick={() => toggleAmenity(a)} className="ml-1 font-bold hover:text-red-600">×</button>
              </span>
            ))}
            {selectedStars.map(s => (
              <span key={s} className="flex items-center gap-1 bg-[#C4622D]/10 text-[#C4622D] text-xs px-3 py-1 rounded-full border border-[#C4622D]/20">
                {"★".repeat(s)} star
                <button onClick={() => toggleStar(s)} className="ml-1 font-bold hover:text-red-600">×</button>
              </span>
            ))}
            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 underline">
              Clear all
            </button>
          </div>
        )}

        {/* Body: sidebar + results */}
        <div className="flex gap-6 items-start">

          {/* Desktop sidebar */}
          <div className="hidden sm:block w-64 shrink-0 bg-white rounded-2xl border border-[#EDE0D0] p-5 sticky top-6 shadow-sm max-h-[calc(100vh-5rem)] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#C4622D_#EDE0D0] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#EDE0D0] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#C4622D]">
            {Sidebar}
          </div>

          {/* Results grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg font-medium">No listings match your filters.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your filters or{" "}
                  <button onClick={clearAll} className="text-[#C4622D] hover:underline">clear them all</button>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(item => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative ml-auto w-80 max-w-[90vw] bg-white h-full overflow-y-auto p-5 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#3D2B1A] text-base">Filters</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
            </div>
            {Sidebar}
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-full mt-4 py-3 bg-[#C4622D] text-white rounded-xl font-semibold text-sm"
            >
              Show {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
