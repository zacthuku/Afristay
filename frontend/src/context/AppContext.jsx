import { createContext, useState, useEffect, useCallback } from "react";
import { listingService, userService } from "../services/api";

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // ✅ LOAD USER FROM LOCAL STORAGE
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (!token) {
      setIsInitializing(false);
      return;
    }

    const refreshUser = async () => {
      try {
        const freshUser = await userService.getCurrentUser();
        localStorage.setItem("user", JSON.stringify(freshUser));
        setUser(freshUser);
      } catch (err) {
        console.error("Failed to refresh user:", err);
        // Only clear if it's a 401 error
        if (err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
        // Keep the stored user if it's a different error (network, etc)
      } finally {
        setIsInitializing(false);
      }
    };

    refreshUser();
  }, []);

  // ✅ AUTH FUNCTIONS
  const login = useCallback((userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

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

  // Category keyword map for discovery filtering
  const CATEGORY_KEYWORDS = {
    safari: ["safari", "lodge", "mara", "wildlife", "amboseli", "tsavo", "game", "savanna"],
    beach: ["beach", "coastal", "ocean", "diani", "mombasa", "watamu", "malindi", "sea", "shore"],
    city: ["nairobi", "city", "apartment", "urban", "westlands", "kilimani", "cbd"],
    weekend: ["getaway", "countryside", "retreat", "nanyuki", "naivasha", "limuru", "machakos", "sagana", "mountain"],
  };

  // SEARCH LOGIC (SMART)
  const handleSearch = useCallback(({ query = "", mode = "", type = "", experience = "", category = "" } = {}) => {
    setSearchQuery(query);
    setSearchFilters({ mode, type, experience });

    const q = query.toLowerCase();
    const cat = category.toLowerCase();

    const results = listings.filter((item) => {
      const text = [
        item.title || "",
        item.description || "",
        item.location || "",
        ...(item.amenities || []),
      ].join(" ").toLowerCase();

      const matchesQuery = !q || text.includes(q);

      const matchesCategory = !cat || (() => {
        const keywords = CATEGORY_KEYWORDS[cat] || [cat];
        return keywords.some((kw) => text.includes(kw));
      })();

      return matchesQuery && matchesCategory;
    });

    setSearchResults(results);
  }, [listings]);

  // BOOKING LOGIC
  const createBooking = useCallback((item, dates) => {
    const newBooking = {
      id: Date.now(),
      item,
      dates,
    };
    setBookings((prev) => [...prev, newBooking]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isInitializing,
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