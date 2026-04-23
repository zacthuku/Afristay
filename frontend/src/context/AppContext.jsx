import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { listingService, userService, cartService, countryService, configService } from "../services/api";

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

  // LOAD USER FROM LOCAL STORAGE
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
        if (err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    refreshUser();
  }, []);

  // AUTH FUNCTIONS
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

  // ─── CONFIG FROM BACKEND ───────────────────────────────────────────────────
  const [availableCountries, setAvailableCountries] = useState([]);
  const [categories, setCategories]                 = useState([]);
  const [destinations, setDestinations]             = useState([]);
  const [serviceTypes, setServiceTypes]             = useState([]);
  const [configLoading, setConfigLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      countryService.getActive().catch(() => []),
      configService.getCategories().catch(() => []),
      configService.getDestinations().catch(() => []),
      configService.getServiceTypes().catch(() => []),
    ]).then(([countries, cats, dests, types]) => {
      setAvailableCountries(countries);
      setCategories(cats);
      setDestinations(dests);
      setServiceTypes(types);
    }).finally(() => setConfigLoading(false));
  }, []);

  // ─── COUNTRY / ROUTE SELECTION ────────────────────────────────────────────
  const [selectedCountry, setSelectedCountry] = useState(null);   // null = "All Africa"
  const [routeMode, setRouteMode]             = useState(false);
  const [fromCountry, setFromCountry]         = useState(null);
  const [toCountry, setToCountry]             = useState(null);
  const [activeCities, setActiveCities]       = useState([]);

  const activeCountryCodes = useMemo(() => {
    if (routeMode) return [fromCountry?.code, toCountry?.code].filter(Boolean);
    return selectedCountry ? [selectedCountry.code] : [];
  }, [routeMode, fromCountry, toCountry, selectedCountry]);

  const currency = useMemo(() => {
    if (!routeMode && selectedCountry) {
      return { code: selectedCountry.currency_code, symbol: selectedCountry.currency_symbol };
    }
    return { code: "KES", symbol: "KES" };
  }, [routeMode, selectedCountry]);

  const paymentMethods = useMemo(() => {
    if (!routeMode && selectedCountry && selectedCountry.payment_methods?.length) {
      return selectedCountry.payment_methods;
    }
    return [
      { id: "mpesa",  label: "M-Pesa",      color: "#00A650", backendId: "mpesa",  available: true },
      { id: "airtel", label: "Airtel Money", color: "#E40000", backendId: "airtel", available: true },
      { id: "card",   label: "Visa / Card",  color: "#1A1F71", backendId: "card",   available: true },
    ];
  }, [routeMode, selectedCountry]);

  // Category → location keyword map derived from fetched categories
  const categoryLocationMap = useMemo(
    () => Object.fromEntries(
      categories
        .filter(c => c.location_keyword)
        .map(c => [c.slug, c.location_keyword])
    ),
    [categories]
  );

  // Fetch active cities when selected country or route changes
  useEffect(() => {
    if (activeCountryCodes.length === 0) { setActiveCities([]); return; }
    Promise.all(activeCountryCodes.map(c => countryService.getCities(c).catch(() => [])))
      .then(results => setActiveCities([...new Set(results.flat())]));
  }, [activeCountryCodes]);

  // ─── LISTINGS / SEARCH ────────────────────────────────────────────────────
  const [listings, setListings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchFilters, setSearchFilters] = useState({ mode: "", type: "", experience: "" });
  const [searchResults, setSearchResults] = useState([]);

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

  // SERVICE TYPES that map directly to DB `type` column
  const KNOWN_SERVICE_TYPES = new Set([
    "accommodation", "transport", "attraction", "restaurant",
    "experience", "tour", "adventure", "wellness", "event", "cruise",
  ]);

  // SERVER-SIDE SEARCH
  const handleSearch = useCallback(
    ({ query = "", mode = "", type = "", experience = "", category = "" } = {}) => {
      setSearchQuery(query);
      setSearchFilters({ mode, type, experience });

      const params = {};
      if (query) params.q = query;

      // `type` is a direct DB service type filter (accommodation, transport, etc.)
      if (type && KNOWN_SERVICE_TYPES.has(type)) {
        params.type = type;
      }

      // `category` is a slug — try location keyword first, then fall back to q search
      if (category) {
        if (categoryLocationMap[category]) {
          params.location = categoryLocationMap[category];
        } else if (!params.type) {
          // Only use category as q if we don't already have a type filter
          params.q = query || category;
        }
      }

      if (activeCountryCodes.length > 0) params.countries = activeCountryCodes.join(",");

      fetchListings(params);
    },
    [fetchListings, activeCountryCodes, categoryLocationMap]
  );

  // BOOKING LOGIC
  const [bookings, setBookings] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const createBooking = useCallback((item, dates) => {
    setBookings((prev) => [...prev, { id: Date.now(), item, dates }]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        // Auth
        user, setUser, isInitializing, login, logout,
        // Cart
        cartCount, refreshCartCount,
        // Config
        availableCountries, categories, destinations, serviceTypes, configLoading,
        // Country / route
        selectedCountry, setSelectedCountry,
        routeMode, setRouteMode,
        fromCountry, setFromCountry,
        toCountry, setToCountry,
        activeCities,
        activeCountryCodes,
        currency,
        paymentMethods,
        // Listings
        listings, loading, error,
        searchQuery, searchFilters, searchResults,
        handleSearch,
        // Bookings
        bookings, createBooking, selectedItem, setSelectedItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
