import { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const travelModes = ["Flight", "Train", "PSV", "Uber"];
const stayTypes = ["Hotel", "Villa", "Lodge", "Apartment"];
const experiences = ["Safari", "Beach", "City", "Adventure"];

export function SearchBar() {
  const { handleSearch } = useContext(AppContext);
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [mode, setMode] = useState("");
  const [type, setType] = useState("");
  const [experience, setExperience] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");

  // Get user's current location using Geolocation API
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(`Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`);
      },
      (err) => console.warn("Geolocation error:", err),
      { enableHighAccuracy: true }
    );
  }, []);

  // Suggestion logic
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    const mockSuggestions = ["Nairobi", "Mombasa", "Diani Beach", "Maasai Mara", "Kisumu"];
    setSuggestions(mockSuggestions.filter(item => item.toLowerCase().includes(query.toLowerCase())));
  }, [query]);

  const onSearch = () => {
    handleSearch({ query, mode, type, experience });
    navigate("/search");
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 max-w-4xl mx-auto flex flex-col md:flex-row gap-3">
      {/* Start from current location */}
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder={currentLocation ? `From: ${currentLocation}` : "Enter start location"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border p-3 rounded-xl"
        />
        {suggestions.length > 0 && (
          <div className="absolute bg-white border mt-1 w-full rounded-xl shadow-lg z-10">
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => setQuery(s)} className="p-2 hover:bg-gray-100 cursor-pointer">
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <select value={mode} onChange={e => setMode(e.target.value)} className="border p-2 rounded-lg">
        <option value="">Travel Mode</option>
        {travelModes.map(m => <option key={m}>{m}</option>)}
      </select>

      <select value={type} onChange={e => setType(e.target.value)} className="border p-2 rounded-lg">
        <option value="">Stay Type</option>
        {stayTypes.map(t => <option key={t}>{t}</option>)}
      </select>

      <select value={experience} onChange={e => setExperience(e.target.value)} className="border p-2 rounded-lg">
        <option value="">Experience</option>
        {experiences.map(e => <option key={e}>{e}</option>)}
      </select>

      {/* Search button */}
      <button onClick={onSearch} className="bg-clay text-white rounded-lg px-6 py-3 hover:bg-[#a94e20] transition">
        Search
      </button>
    </div>
  );
}