import { createContext, useState, useEffect, useCallback } from "react";
import { listingService, userService, cartService } from "../services/api";

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // CART COUNT
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setCartCount(0); return; }
    try {
      const items = await cartService.getCart();
      setCartCount(Array.isArray(items) ? items.length : items?.items?.length ?? 0);
    } catch { setCartCount(0); }
  }, []);

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
        refreshCartCount();
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
    setCartCount(0);
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

  // Category → location keyword map for server-side search
  const CATEGORY_LOCATION = {
    safari: "mara",
    beach: "mombasa",
    city: "nairobi",
    weekend: "naivasha",
  };

  // Fetch listings — supports server-side filters
  const fetchListings = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const data = await listingService.getAllListings(params);
      setListings(data);
      setSearchResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // SERVER-SIDE SEARCH
  const handleSearch = useCallback(({ query = "", mode = "", type = "", experience = "", category = "" } = {}) => {
    setSearchQuery(query);
    setSearchFilters({ mode, type, experience });

    const params = {};
    if (query) params.q = query;
    if (type) params.type = type;
    if (category && CATEGORY_LOCATION[category]) params.location = CATEGORY_LOCATION[category];
    else if (category) params.q = query || category;

    fetchListings(params);
  }, [fetchListings]);

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
        cartCount,
        refreshCartCount,
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