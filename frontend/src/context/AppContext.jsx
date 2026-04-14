import { createContext, useState, useEffect } from "react";
import { listingService, userService } from "../services/api";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);

  // ✅ LOAD USER FROM LOCAL STORAGE
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (!token) {
      return;
    }

    const refreshUser = async () => {
      try {
        const freshUser = await userService.getCurrentUser();
        localStorage.setItem("user", JSON.stringify(freshUser));
        setUser(freshUser);
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    };

    refreshUser();
  }, []);

  // ✅ AUTH FUNCTIONS
  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // DATA DOMAINS
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Fetch listings on component mount
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const data = await listingService.getAllListings();
        setListings(data);
        setSearchResults(data);
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch listings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // SEARCH LOGIC (SMART)
  const handleSearch = ({ query, mode, type, experience }) => {
    setSearchQuery(query);
    setSearchFilters({ mode, type, experience });

    const q = query?.toLowerCase() || "";
    const m = mode?.toLowerCase() || "";
    const t = type?.toLowerCase() || "";
    const e = experience?.toLowerCase() || "";

    const results = listings.filter((item) => {
      const matchesQuery =
        !q ||
        item.location.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      const matchesType = !t || t === "accommodation";
      const matchesMode = !m;
      const matchesExperience = !e;

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
        login,
        logout,
        listings,
        loading,
        error,
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