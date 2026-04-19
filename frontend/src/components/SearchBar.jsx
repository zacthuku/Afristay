import { useState, useEffect, useRef, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const STAY_TYPES   = ["Hotel", "Villa", "Lodge", "Apartment", "Camp", "Cottage"];
const EXPERIENCES  = ["Safari", "Beach", "City", "Adventure", "Mountain", "Cultural"];
const ALL_PLACES   = ["Nairobi", "Mombasa", "Diani Beach", "Maasai Mara", "Kisumu",
                      "Zanzibar", "Kigali", "Nanyuki", "Lamu", "Amboseli"];

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
  </svg>
);

export function SearchBar() {
  const { handleSearch } = useContext(AppContext);
  const navigate = useNavigate();

  const [query, setQuery]         = useState("");
  const [type, setType]           = useState("");
  const [experience, setExp]      = useState("");
  const [showSug, setShowSug]     = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const desktopRef = useRef(null);
  const mobileRef  = useRef(null);

  const suggestions = query.length > 0
    ? ALL_PLACES.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : ALL_PLACES;

  // Close suggestion dropdown when clicking outside both panels
  useEffect(() => {
    function onClickOutside(e) {
      const inDesktop = desktopRef.current?.contains(e.target);
      const inMobile  = mobileRef.current?.contains(e.target);
      if (!inDesktop && !inMobile) setShowSug(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function useLocation() {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => { setQuery("Current location"); setLocLoading(false); setShowSug(false); },
      () => setLocLoading(false),
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }

  function onSearch() {
    handleSearch({ query, type, experience });
    navigate("/search");
    setShowSug(false);
  }

  function pickSuggestion(place) {
    setQuery(place);
    setShowSug(false);
  }

  // Shared suggestion dropdown content
  function SuggestionList() {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100]">
        <div className="px-3">
          <button
            onMouseDown={e => { e.preventDefault(); useLocation(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FAF6EF] text-left transition-colors"
          >
            <span className="text-[#C4622D] text-base leading-none">🎯</span>
            <span className="text-sm font-medium text-[#3D2B1A]">
              {locLoading ? "Getting your location…" : "Use current location"}
            </span>
          </button>
        </div>
        <div className="h-px bg-gray-100 mx-3 my-2" />
        <p className="px-6 pb-1 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          Popular destinations
        </p>
        {suggestions.length > 0 ? suggestions.map((s, i) => (
          <button
            key={i}
            onMouseDown={e => { e.preventDefault(); pickSuggestion(s); }}
            className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-[#FAF6EF] text-left transition-colors"
          >
            <span className="text-gray-400 text-sm leading-none">📍</span>
            <span className="text-sm text-[#3D2B1A]">{s}</span>
          </button>
        )) : (
          <p className="px-6 py-3 text-sm text-gray-400">No matches found</p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* ══════════════════ DESKTOP ══════════════════ */}
      <div
        ref={desktopRef}
        className="hidden md:flex items-stretch bg-white rounded-2xl shadow-2xl border border-[#E8D9B8] overflow-visible divide-x divide-gray-100"
      >
        {/* Where */}
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-3 px-5 py-4 h-full">
            <span className="text-[#C4622D] text-lg flex-shrink-0 leading-none">📍</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#3D2B1A] uppercase tracking-widest mb-0.5">Where</p>
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setShowSug(true); }}
                onFocus={() => setShowSug(true)}
                placeholder="Search destinations…"
                className="w-full text-sm text-[#3D2B1A] placeholder-gray-400 outline-none bg-transparent"
              />
            </div>
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-gray-300 hover:text-gray-500 flex-shrink-0 text-xl leading-none"
              >
                ×
              </button>
            )}
          </div>
          {showSug && <SuggestionList />}
        </div>

        {/* Stay Type */}
        <div className="flex items-center px-5 py-4 min-w-[160px]">
          <div className="w-full">
            <p className="text-[10px] font-bold text-[#3D2B1A] uppercase tracking-widest mb-0.5">Stay Type</p>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full text-sm text-gray-500 outline-none bg-transparent cursor-pointer appearance-none"
            >
              <option value="">Any type</option>
              {STAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Experience */}
        <div className="flex items-center px-5 py-4 min-w-[160px]">
          <div className="w-full">
            <p className="text-[10px] font-bold text-[#3D2B1A] uppercase tracking-widest mb-0.5">Experience</p>
            <select
              value={experience}
              onChange={e => setExp(e.target.value)}
              className="w-full text-sm text-gray-500 outline-none bg-transparent cursor-pointer appearance-none"
            >
              <option value="">Any vibe</option>
              {EXPERIENCES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>
        </div>

        {/* Search button */}
        <button
          onClick={onSearch}
          className="bg-[#C4622D] text-white px-7 rounded-r-2xl flex items-center gap-2 hover:bg-[#a94e20] transition-colors font-semibold text-sm flex-shrink-0"
        >
          <SearchIcon />
          Search
        </button>
      </div>

      {/* ══════════════════ MOBILE ══════════════════ */}
      <div
        ref={mobileRef}
        className="md:hidden bg-white rounded-2xl shadow-2xl border border-[#E8D9B8] p-4 flex flex-col gap-3"
      >
        {/* Destination */}
        <div className="relative">
          <div className="flex items-center gap-3 bg-[#FAF6EF] border border-[#E8D9B8] rounded-xl px-4 py-3 focus-within:border-[#C4622D] transition-colors">
            <span className="text-[#C4622D] flex-shrink-0 leading-none">📍</span>
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSug(true); }}
              onFocus={() => setShowSug(true)}
              placeholder="Where are you going?"
              className="flex-1 text-sm text-[#3D2B1A] placeholder-gray-400 outline-none bg-transparent"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-xl leading-none"
              >
                ×
              </button>
            ) : (
              <button
                onClick={useLocation}
                title="Use my location"
                className="text-[#C4622D] flex-shrink-0 text-base leading-none"
              >
                🎯
              </button>
            )}
          </div>
          {showSug && <SuggestionList />}
        </div>

        {/* Filters grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FAF6EF] border border-[#E8D9B8] rounded-xl px-4 py-3 focus-within:border-[#C4622D] transition-colors">
            <p className="text-[10px] font-bold text-[#3D2B1A] uppercase tracking-widest mb-1">Stay Type</p>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full text-sm text-gray-500 outline-none bg-transparent cursor-pointer appearance-none"
            >
              <option value="">Any type</option>
              {STAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="bg-[#FAF6EF] border border-[#E8D9B8] rounded-xl px-4 py-3 focus-within:border-[#C4622D] transition-colors">
            <p className="text-[10px] font-bold text-[#3D2B1A] uppercase tracking-widest mb-1">Experience</p>
            <select
              value={experience}
              onChange={e => setExp(e.target.value)}
              className="w-full text-sm text-gray-500 outline-none bg-transparent cursor-pointer appearance-none"
            >
              <option value="">Any vibe</option>
              {EXPERIENCES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>
        </div>

        {/* Search button */}
        <button
          onClick={onSearch}
          className="w-full bg-[#C4622D] text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#a94e20] transition-colors text-sm"
        >
          <SearchIcon />
          Search stays
        </button>
      </div>
    </>
  );
}
