// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";
// Create a headers object with auth token if available
const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic fetch wrapper
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "API request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Auth Service
export const authService = {
  register: (email, password) =>
    apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email, password) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  googleAuth: (token) =>
    apiCall("/auth/google", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  logout: () => {
    localStorage.removeItem("token");
  },
};

// Users Service
export const userService = {
  getCurrentUser: () => apiCall("/users/me"),
  
  updateProfile: (data) =>
    apiCall("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getUserById: (id) => apiCall(`/users/${id}`),
};

// Listings Service
export const listingService = {
  getAllListings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/listings${queryString ? "?" + queryString : ""}`);
  },

  getListingById: (id) => apiCall(`/listings/${id}`),

  createListing: (data) =>
    apiCall("/listings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateListing: (id, data) =>
    apiCall(`/listings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteListing: (id) =>
    apiCall(`/listings/${id}`, {
      method: "DELETE",
    }),
};

// Bookings Service
export const bookingService = {
  createBooking: (data) =>
    apiCall("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getBookings: () => apiCall("/bookings"),

  getBookingById: (id) => apiCall(`/bookings/${id}`),

  cancelBooking: (id) =>
    apiCall(`/bookings/${id}`, {
      method: "DELETE",
    }),
};

export default {
  authService,
  userService,
  listingService,
  bookingService,
};