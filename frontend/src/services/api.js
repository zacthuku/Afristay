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

// M-Pesa Payment Service
export const paymentService = {
  initiateMpesa: (data) =>
    apiCall("/payments/mpesa/stk-push", {
      method: "POST",
      body: JSON.stringify(data),
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
};

// Jobs Service
export const jobService = {
  listActive: () => apiCall("/jobs"),
  listAll: () => apiCall("/jobs/all"),
  create: (data) => apiCall("/jobs", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/jobs/${id}`, { method: "DELETE" }),
};
