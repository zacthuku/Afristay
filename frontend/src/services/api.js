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

// Extract error message from various response formats
const extractErrorMessage = (data) => {
  // Simple error message
  if (data.message) return data.message;
  if (data.detail && typeof data.detail === "string") return data.detail;
  
  // Pydantic validation errors (422)
  if (Array.isArray(data.detail)) {
    const messages = data.detail.map(err => {
      // Clean up the error message by removing "Value error, " prefix
      let message = err.msg;
      if (message.startsWith("Value error, ")) {
        message = message.replace("Value error, ", "");
      }
      return message;
    });
    return messages.join(", ");
  }
  
  return "API request failed";
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

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized - clear auth and redirect
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Redirect to login if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }

      const errorMessage = extractErrorMessage(data, response.status);
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Auth Service
export const authService = {
  register: (email, password, confirmPassword) =>
    apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, confirm_password: confirmPassword }),
    }),

  login: (email, password) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  googleAuth: (token) =>
    apiCall("/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: token }),
    }),

  changePassword: (data) =>
    apiCall("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  forgotPassword: (email) =>
    apiCall("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email, origin: window.location.origin }),
    }),

  resetPassword: (token, newPassword) =>
    apiCall("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    }),

  logout: () => {
    localStorage.removeItem("token");
  },
};

// Users Service
export const userService = {
  getCurrentUser: () => apiCall("/users/me"),
  becomeHost: (data) =>
    apiCall("/users/me/become-host", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  updateProfile: (data) =>
    apiCall("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteAccount: () =>
    apiCall("/users/me", {
      method: "DELETE",
    }),

  listUsers: () => apiCall("/users"),

  deleteUser: (id) =>
    apiCall(`/users/${id}`, {
      method: "DELETE",
    }),

  blockUser: (id, isBlocked) =>
    apiCall(`/users/${id}/block`, {
      method: "PUT",
      body: JSON.stringify({ is_blocked: isBlocked }),
    }),

  getUserById: (id) => apiCall(`/users/${id}`),

  approveHost: (id) =>
    apiCall(`/users/${id}/approve-host`, { method: "PUT" }),
  rejectHost: (id, reason = "") =>
    apiCall(`/users/${id}/reject-host`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    }),
  makeAdmin: (id) => apiCall(`/users/${id}/make-admin`, { method: "PUT" }),
};

export const hostService = {
  getMyServices: () => apiCall("/services/host"),
  createService: (data) =>
    apiCall("/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateService: (id, data) =>
    apiCall(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadPhoto: async (serviceId, file) => {
    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE_URL}/services/${serviceId}/photos`, {
      method: "POST",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Upload failed");
    return data;
  },
  uploadTempPhoto: async (file) => {
    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE_URL}/services/upload`, {
      method: "POST",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Upload failed");
    return data;
  },
  getPendingServices: () => apiCall("/services/pending"),
  approveService: (id) =>
    apiCall(`/services/${id}/approve`, { method: "PUT" }),
  rejectService: (id, reason = "") =>
    apiCall(`/services/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    }),
  getHostBookings: () => apiCall("/bookings/host"),
};

// Listings Service
export const listingService = {
  getAllListings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/services${queryString ? "?" + queryString : ""}`);
  },

  getListingById: (id) => apiCall(`/services/${id}`),

  createListing: (data) =>
    apiCall("/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateListing: (id, data) =>
    apiCall(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteListing: (id) =>
    apiCall(`/services/${id}`, {
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

// Payment Service — M-Pesa, Airtel Money, Card
export const paymentService = {
  initiateMpesa: (data) =>
    apiCall("/payments/mpesa/stk-push", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  initiateAirtel: (data) =>
    apiCall("/payments/airtel/stk-push", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  initiateCard: (bookingId) =>
    apiCall("/payments/card/charge", {
      method: "POST",
      body: JSON.stringify({ booking_id: bookingId }),
    }),

  checkStatus: (checkoutRequestId) =>
    apiCall(`/payments/status/${checkoutRequestId}`),
};

// Reviews Service
export const reviewService = {
  createReview: (data) =>
    apiCall("/reviews/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getReviewsByService: (serviceId) =>
    apiCall(`/reviews/service/${serviceId}`),

  getHostReviews: () => apiCall("/reviews/host"),
};

export default {
  authService,
  userService,
  listingService,
  bookingService,
  paymentService,
  reviewService,
  hostService,
};
// Admin Service
export const adminService = {
  getStats: () => apiCall("/users/admin/stats"),
  getMonthlyStats: () => apiCall("/users/admin/monthly-stats"),
  onboardHost: (data) => apiCall("/users/admin/onboard-host", { method: "POST", body: JSON.stringify(data) }),
};

// Cart Service
export const cartService = {
  getCart: () => apiCall("/cart"),
  addItem: (data) => apiCall("/cart/add", { method: "POST", body: JSON.stringify(data) }),
  updateItem: (itemId, data) => apiCall(`/cart/${itemId}`, { method: "PUT", body: JSON.stringify(data) }),
  removeItem: (itemId) => apiCall(`/cart/${itemId}`, { method: "DELETE" }),
  clearCart: () => apiCall("/cart", { method: "DELETE" }),
};

// Trip Service
export const tripService = {
  generate: (data) => apiCall("/trips/generate", { method: "POST", body: JSON.stringify(data) }),
  getSuggestions: (destination) => apiCall(`/trips/suggestions?destination=${encodeURIComponent(destination)}`),
  save: (data) => apiCall("/trips/save", { method: "POST", body: JSON.stringify(data) }),
  getSaved: () => apiCall("/trips/saved"),
  deleteTrip: (id) => apiCall(`/trips/${id}`, { method: "DELETE" }),
  getActivities: (destination) =>
    apiCall(`/trips/activities?destination=${encodeURIComponent(destination)}`),
  bookActivity: (data) =>
    apiCall("/trips/activity-bookings", { method: "POST", body: JSON.stringify(data) }),
  getActivityBookings: () => apiCall("/trips/activity-bookings"),
  getActivityPaymentStatus: (id) => apiCall(`/trips/activity-bookings/${id}/payment-status`),
  retryActivityPayment: (id, data) => apiCall(`/trips/activity-bookings/${id}/pay`, { method: "POST", body: JSON.stringify(data) }),
  updateActivityBooking: (id, data) => apiCall(`/trips/activity-bookings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  cancelActivityBooking: (id) => apiCall(`/trips/activity-bookings/${id}`, { method: "DELETE" }),
};

// Jobs Service
export const jobService = {
  listActive: () => apiCall("/jobs"),
  listAll: () => apiCall("/jobs/all"),
  create: (data) => apiCall("/jobs", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/jobs/${id}`, { method: "DELETE" }),
};

// Country Service
export const countryService = {
  getAll:    () => apiCall("/api/v1/countries"),
  getActive: () => apiCall("/api/v1/countries/active"),
  getCities: (code) => apiCall(`/api/v1/countries/${code}/cities`),
  create:    (data) => apiCall("/api/v1/countries", { method: "POST", body: JSON.stringify(data) }),
  update:    (code, data) => apiCall(`/api/v1/countries/${code}`, { method: "PUT", body: JSON.stringify(data) }),
  deactivate:(code) => apiCall(`/api/v1/countries/${code}`, { method: "DELETE" }),
};

// Config Service (categories, destinations, service types, rejection reasons)
export const configService = {
  getCategories:       () => apiCall("/api/v1/config/categories"),
  getDestinations:     () => apiCall("/api/v1/config/destinations"),
  getServiceTypes:     () => apiCall("/api/v1/config/service-types"),
  getRejectionReasons: () => apiCall("/api/v1/config/rejection-reasons"),

  createCategory:    (d) => apiCall("/api/v1/config/categories",        { method: "POST",   body: JSON.stringify(d) }),
  updateCategory:    (id, d) => apiCall(`/api/v1/config/categories/${id}`,    { method: "PUT",    body: JSON.stringify(d) }),
  deleteCategory:    (id) => apiCall(`/api/v1/config/categories/${id}`,    { method: "DELETE" }),

  createDestination: (d) => apiCall("/api/v1/config/destinations",       { method: "POST",   body: JSON.stringify(d) }),
  updateDestination: (id, d) => apiCall(`/api/v1/config/destinations/${id}`,   { method: "PUT",    body: JSON.stringify(d) }),
  deleteDestination: (id) => apiCall(`/api/v1/config/destinations/${id}`,   { method: "DELETE" }),

  createServiceType: (d) => apiCall("/api/v1/config/service-types",      { method: "POST",   body: JSON.stringify(d) }),
  updateServiceType: (id, d) => apiCall(`/api/v1/config/service-types/${id}`,  { method: "PUT",    body: JSON.stringify(d) }),
  deleteServiceType: (id) => apiCall(`/api/v1/config/service-types/${id}`,  { method: "DELETE" }),

  createRejectionReason: (d) => apiCall("/api/v1/config/rejection-reasons",  { method: "POST",   body: JSON.stringify(d) }),
  updateRejectionReason: (id, d) => apiCall(`/api/v1/config/rejection-reasons/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  deleteRejectionReason: (id) => apiCall(`/api/v1/config/rejection-reasons/${id}`, { method: "DELETE" }),
};

// Stats Service
export const statsService = {
  getPlatformStats: () => apiCall("/api/v1/stats"),
};
