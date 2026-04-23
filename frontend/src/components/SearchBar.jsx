import { useState, useEffect, useRef, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
  </svg>
);

function CountrySelect({ value, onChange, label, countries }) {
  return (
    <div className="flex-shrink-0">
      {label && (
        <p className="text-[10px] font-bold text-[#3D2B1A] uppercase tracking-widest mb-0.5">
          {label}
        </p>
      )}
      <select
        value={value?.code ?? ""}
        onChange={e => {
          const found = countries.find(c => c.code === e.target.value) ?? null;
          onChange(found);
        }}
        className="text-sm text-[#3D2B1A] outline-none bg-transparent cursor-pointer max-w-[110px]"
      >
        <option value="">🌍 All Africa</option>
        {countries.map(c => (
          <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
        ))}
      </select>
    </div>
  );
}

export function SearchBar() {
  const {
    handleSearch,
    availableCountries,
    selectedCountry, setSelectedCountry,
    routeMode, setRouteMode,
    fromCountry, setFromCountry,
    toCountry, setToCountry,
    activeCities,
    serviceTypes,
    categories,
  } = useContext(AppContext);

  const navigate = useNavigate();

  const [query, setQuery]       = useState("");
  const [type, setType]         = useState("");
  const [experience, setExp]    = useState("");
  const [showSug, setShowSug]   = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const desktopRef = useRef(null);
  const mobileRef  = useRef(null);

  const stayTypes    = serviceTypes.filter(t => t.category === "accommodation");
  const expCategories = categories.filter(c => c.category_type === "experience");

  const suggestions = query.length > 0
    ? activeCities.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : activeCities;

  useEffect(() => {
    function onClickOutside(e) {
      if (!desktopRef.current?.contains(e.target) && !mobileRef.current?.contains(e.target)) {
        setShowSug(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function useMyLocation() {
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

  const suggestionHeading = routeMode
    ? `Destinations: ${[fromCountry, toCountry].filter(Boolean).map(c => c.name).join(" → ")}`
    : selectedCountry
    ? `Popular in ${selectedCountry.name}`
    : "Popular destinations";

  function SuggestionList() {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100]">
        <div className="px-3">
          <button
            onMouseDown={e => { e.preventDefault(); useMyLocation(); }}
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
          {suggestionHeading}
        </p>
        {suggestions.length > 0 ? suggestions.map((s, i) => (
          <button
            key={i}
            onMouseDown={e => { e.preventDefault(); setQuery(s); setShowSug(false); }}
            className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-[#FAF6EF] text-left transition-colors"
          >
            <span className="text-gray-400 text-sm leading-none">📍</span>
            <span className="text-sm text-[#3D2B1A]">{s}</span>
          </button>
        )) : (
          <p className="px-6 py-3 text-sm text-gray-400">
            {activeCities.length === 0
              ? "Select a country to see city suggestions"
              : "No matches found"}
          </p>
        )}
      </div>
    );
  }

  const routeToggle = (
    <button
      onClick={() => setRouteMode(r => !r)}
      className={`flex-shrink-0 text-[9px] px-2 py-0.5 rounded-full font-bold border transition-colors mt-3 ${
        routeMode
          ? "bg-[#C4622D] text-white border-[#C4622D]"
          : "text-[#C4622D] border-[#C4622D] hover:bg-[#FAF6EF]"
      }`}
    >
      {routeMode ? "↔" : "+Route"}
    </button>
  );

  return (
    <>
      {/* ══════════════════ DESKTOP ══════════════════ */}
      <div
        ref={desktopRef}
        className="hidden md:flex items-stretch bg-white rounded-2xl shadow-2xl border border-[#E8D9B8] overflow-visible divide-x divide-gray-100"
      >
        {/* Country / Route picker */}
        <div className="flex items-center gap-2 px-4 py-4 min-w-[190px]">
          {!routeMode ? (
            <CountrySelect
              value={selectedCountry}
              onChange={setSelectedCountry}
              label="Country"
              countries={availableCountries}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <CountrySelect value={fromCountry} onChange={setFromCountry} label="From" countries={availableCountries} />
              <span className="text-[#C4622D] font-bold mt-3 flex-shrink-0">→</span>
              <CountrySelect value={toCountry} onChange={setToCountry} label="To" countries={availableCountries} />
            </div>
          )}
          {routeToggle}
        </div>

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
              <button onClick={() => setQuery("")} className="text-gray-300 hover:text-gray-500 flex-shrink-0 text-xl leading-none">×</button>
            )}
          </div>
          {showSug && <SuggestionList />}
        </div>

        {/* Stay Type */}
        <div className="flex items-center px-5 py-4 min-w-[150px]">
          <div className="w-full">
            <p className="text-[10px] font-bold text-[#3D2B1A] uppercase tracking-widest mb-0.5">Stay Type</p>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full text-sm text-gray-500 outline-none bg-transparent cursor-pointer appearance-none"
            >
              <option value="">Any type</option>
              {stayTypes.map(t => <option key={t.slug} value={t.slug}>{t.icon} {t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Experience */}
        <div className="flex items-center px-5 py-4 min-w-[150px]">
          <div className="w-full">
            <p className="text-[10px] font-bold text-[#3D2B1A] uppercase tracking-widest mb-0.5">Experience</p>
            <select
              value={experience}
              onChange={e => setExp(e.target.value)}
              className="w-full text-sm text-gray-500 outline-none bg-transparent cursor-pointer appearance-none"
            >
              <option value="">Any vibe</option>
              {expCategories.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
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
        {/* Country / route row */}
        <div className="flex items-end gap-2 flex-wrap">
          {!routeMode ? (
            <CountrySelect value={selectedCountry} onChange={setSelectedCountry} label="Country" countries={availableCountries} />
          ) : (
            <>
              <CountrySelect value={fromCountry} onChange={setFromCountry} label="From" countries={availableCountries} />
              <span className="text-[#C4622D] font-bold mb-1">→</span>
              <CountrySelect value={toCountry} onChange={setToCountry} label="To" countries={availableCountries} />
            </>
          )}
          <button
            onClick={() => setRouteMode(r => !r)}
            className={`text-[9px] px-2 py-0.5 rounded-full font-bold border transition-colors mb-1 ${
              routeMode ? "bg-[#C4622D] text-white border-[#C4622D]" : "text-[#C4622D] border-[#C4622D]"
            }`}
          >
            {routeMode ? "↔" : "+Route"}
          </button>
        </div>

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
              <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-xl leading-none">×</button>
            ) : (
              <button onClick={useMyLocation} title="Use my location" className="text-[#C4622D] flex-shrink-0 text-base leading-none">🎯</button>
            )}
          </div>
          {showSug && <SuggestionList />}
        </div>

        {/* Filters grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FAF6EF] border border-[#E8D9B8] rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-[#3D2B1A] uppercase tracking-widest mb-1">Stay Type</p>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full text-sm text-gray-500 outline-none bg-transparent cursor-pointer appearance-none"
            >
              <option value="">Any type</option>
              {stayTypes.map(t => <option key={t.slug} value={t.slug}>{t.icon} {t.label}</option>)}
            </select>
          </div>

          <div className="bg-[#FAF6EF] border border-[#E8D9B8] rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-[#3D2B1A] uppercase tracking-widest mb-1">Experience</p>
            <select
              value={experience}
              onChange={e => setExp(e.target.value)}
              className="w-full text-sm text-gray-500 outline-none bg-transparent cursor-pointer appearance-none"
            >
              <option value="">Any vibe</option>
              {expCategories.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
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
