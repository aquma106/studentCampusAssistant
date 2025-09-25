// Import React - needed for all React components
import React from "react";

// Import our custom components
import Navbar from "./components/Navbar";
import Welcome from "./components/Welcome";

// The main App component - this is the root of our entire application
// Everything else gets rendered inside this component
function App() {
  // This return statement contains JSX - HTML-like syntax for React
  // Rules for JSX:
  // 1. Must return a single parent element (we use a <div> wrapper)
  // 2. Use className instead of class for CSS classes
  // 3. Use camelCase for attributes (onClick instead of onclick)
  // 4. All tags must be closed (even single tags like <img />)
  return (
    <div className="App">
      {/* Our navigation bar component */}
      {/* This will appear at the top of every page */}
      <Navbar />

      {/* Main content area */}
      {/* The Welcome component will show different content based on login status */}
      <Welcome />

      {/* Footer (optional) */}
      <footer className="bg-light mt-5 py-4">
        <div className="container text-center">
          <div className="row">
            <div className="col-md-6">
              <p className="text-muted mb-0">
                <i className="fas fa-graduation-cap me-2"></i>
                Student Campus Assistant
              </p>
              <small className="text-muted">
                Connecting college communities
              </small>
            </div>
            <div className="col-md-6">
              <small className="text-muted">Built with ❤️ for students</small>
              <div className="mt-1">
                <small className="text-muted me-3">
                  <i className="fas fa-envelope me-1"></i>
                  thapahemraj141@gmail.com
                </small>
                <small className="text-muted">
                  <i className="fas fa-phone me-1"></i>
                  +91 7650021005
                </small>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Export the App component so main.jsx can import and use it
export default App;
