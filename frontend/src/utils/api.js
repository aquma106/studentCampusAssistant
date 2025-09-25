// Import axios - a library that helps us make HTTP requests to your backend
import axios from "axios";
import toast from "react-hot-toast";

// This is the URL where your backend is running
// Make sure this matches your backend server URL
const API_BASE_URL = "http://localhost:1143/api";

// Create an axios instance with default configuration
// Think of this as creating a customized way to talk to your backend
const api = axios.create({
  baseURL: API_BASE_URL, // All requests will start with this URL
  timeout: 10000, // Wait maximum 10 seconds for response
  headers: {
    "Content-Type": "application/json", // Tell backend we're sending JSON data
  },
});

// REQUEST INTERCEPTOR
// This runs BEFORE every request is sent to your backend
// It automatically adds the authentication token to every request
api.interceptors.request.use(
  (config) => {
    // Get the JWT token from localStorage (where we store it after login)
    const token = localStorage.getItem("token");

    // If user is logged in (token exists), add it to the request header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("🚀 API Request:", config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    // If there's an error setting up the request
    console.error("❌ Request setup error:", error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR
// This runs AFTER every response is received from your backend
// It handles common errors automatically
api.interceptors.response.use(
  (response) => {
    // If request was successful, just return the response
    console.log(
      "✅ API Response:",
      response.config.method.toUpperCase(),
      response.config.url,
      response.status
    );
    return response;
  },
  (error) => {
    // If there was an error, handle it based on the status code
    console.error(
      "❌ API Error:",
      error.response?.status,
      error.response?.data?.message
    );

    const message = error.response?.data?.message || "Something went wrong";

    // Handle different types of errors
    if (error.response?.status === 401) {
      // 401 = Unauthorized (invalid or expired token)
      localStorage.removeItem("token"); // Remove invalid token
      localStorage.removeItem("user"); // Remove user data
      window.location.href = "/login"; // Redirect to login page
      toast.error("Session expired. Please login again.");
    } else if (error.response?.status === 403) {
      // 403 = Forbidden (user doesn't have permission)
      toast.error("You do not have permission to perform this action.");
    } else if (error.response?.status === 404) {
      // 404 = Not Found
      toast.error("The requested resource was not found.");
    } else if (error.response?.status >= 500) {
      // 500+ = Server errors
      toast.error("Server error. Please try again later.");
    } else {
      // Other errors (400, etc.)
      toast.error(message);
    }

    // Still return the error so components can handle it if needed
    return Promise.reject(error);
  }
);

// Export the configured axios instance so other files can use it
export default api;

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return !!(token && user); // Returns true if both exist, false otherwise
};

// Helper function to get current user data from localStorage
export const getCurrentUser = () => {
  const userData = localStorage.getItem("user");
  return userData ? JSON.parse(userData) : null;
};

// Helper function to get authentication token
export const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Helper function to clear authentication data (for logout)
export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
