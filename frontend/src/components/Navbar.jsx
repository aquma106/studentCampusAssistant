// Import React - this is needed in every React component file
import React from "react";
import { getCurrentUser, isAuthenticated, clearAuth } from "../utils/api";
import toast from "react-hot-toast";

// This is a React FUNCTIONAL COMPONENT
// It's a JavaScript function that returns JSX (HTML-like code)
function Navbar() {
  // Check if user is logged in and get their data
  const isLoggedIn = isAuthenticated();
  const currentUser = getCurrentUser();

  // Function to handle logout
  const handleLogout = () => {
    // Clear authentication data
    clearAuth();

    // Show success message
    toast.success("Logged out successfully!");

    // Refresh the page to update UI
    // In a real app, you'd use React Router to navigate
    window.location.href = "/";
  };

  // This function returns JSX - it looks like HTML but it's actually JavaScript
  // JSX Rules:
  // 1. Use className instead of class
  // 2. Use onClick instead of onclick
  // 3. Wrap everything in a single parent element
  // 4. Use {} to include JavaScript expressions
  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-custom">
      <div className="container">
        {/* Brand/Logo Section */}
        <a className="navbar-brand navbar-brand-custom" href="/">
          <i className="fas fa-graduation-cap me-2"></i>
          Campus Assistant
        </a>

        {/* Mobile Menu Toggle Button */}
        {/* Bootstrap JavaScript handles the collapse functionality */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Menu */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Left Side Menu */}
          <ul className="navbar-nav me-auto">
            {/* Home Link */}
            <li className="nav-item">
              <a className="nav-link nav-link-custom" href="/">
                <i className="fas fa-home me-1"></i>
                Home
              </a>
            </li>

            {/* Questions Link - only show if user is logged in */}
            {isLoggedIn && (
              <li className="nav-item">
                <a className="nav-link nav-link-custom" href="/questions">
                  <i className="fas fa-question-circle me-1"></i>
                  Questions
                </a>
              </li>
            )}

            {/* Ask Question Link - only show if user is logged in */}
            {isLoggedIn && (
              <li className="nav-item">
                <a className="nav-link nav-link-custom" href="/ask">
                  <i className="fas fa-plus me-1"></i>
                  Ask Question
                </a>
              </li>
            )}
          </ul>

          {/* Right Side Menu */}
          <ul className="navbar-nav">
            {/* If user is NOT logged in, show Login/Register buttons */}
            {!isLoggedIn ? (
              <>
                <li className="nav-item">
                  <a className="nav-link nav-link-custom" href="/login">
                    <i className="fas fa-sign-in-alt me-1"></i>
                    Login
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link nav-link-custom" href="/register">
                    <i className="fas fa-user-plus me-1"></i>
                    Register
                  </a>
                </li>
              </>
            ) : (
              /* If user IS logged in, show user menu */
              <li className="nav-item dropdown">
                <a
                  className="nav-link nav-link-custom dropdown-toggle"
                  href="#"
                  id="navbarDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fas fa-user me-1"></i>
                  {/* Show user's name if available, otherwise show "User" */}
                  {currentUser?.name || "User"}
                </a>

                {/* Dropdown Menu */}
                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li>
                    <a className="dropdown-item" href="/profile">
                      <i className="fas fa-user-circle me-2"></i>
                      My Profile
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/my-questions">
                      <i className="fas fa-question me-2"></i>
                      My Questions
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/my-answers">
                      <i className="fas fa-comment me-2"></i>
                      My Answers
                    </a>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    {/* onClick calls our logout function when clicked */}
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

// Export the component so other files can import and use it
export default Navbar;
