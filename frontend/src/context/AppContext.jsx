import { createContext, useState } from "react";
import listingsData from "../data/listings";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);

  // DATA DOMAINS
  const [listings, setListings] = useState(listingsData);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    mode: "",
    type: "",
    experience: "",
  });
  const [searchResults, setSearchResults] = useState([]);

  // BOOKING
  const [bookings, setBookings] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // SEARCH LOGIC (SMART)
  const handleSearch = ({ query, mode, type, experience }) => {
    setSearchQuery(query);
    setSearchFilters({ mode, type, experience });

    const q = query?.toLowerCase() || "";
    const m = mode?.toLowerCase() || "";
    const t = type?.toLowerCase() || "";
    const e = experience?.toLowerCase() || "";

    const results = listings.filter((item) => {
      // Safely access modes and adventures
      const itemModes = item.modes || [];
      const itemAdventures = item.adventures || [];

      // Match location, title, description, adventures, or modes
      const matchesQuery =
        !q ||
        item.location.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        itemAdventures.some((adv) => adv.title.toLowerCase().includes(q)) ||
        itemModes.some((mod) => mod.toLowerCase().includes(q));

      // Match type exactly
      const matchesType = !t || (item.type && item.type.toLowerCase() === t);

      // Match mode
      const matchesMode = !m || itemModes.some((mod) => mod.toLowerCase() === m);

      // Match experience in adventures
      const matchesExperience =
        !e || itemAdventures.some((adv) => adv.title.toLowerCase().includes(e));

      return matchesQuery && matchesType && matchesMode && matchesExperience;
    });

    setSearchResults(results);
  };

  // BOOKING LOGIC
  const createBooking = (item, dates) => {
    const newBooking = {
      id: Date.now(),
      item,
      dates,
    };
    setBookings((prev) => [...prev, newBooking]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        listings,
        searchQuery,
        searchFilters,
        searchResults,
        handleSearch,
        bookings,
        createBooking,
        selectedItem,
        setSelectedItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}