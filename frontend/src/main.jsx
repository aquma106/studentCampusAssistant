// Import React - the main React library
import React from "react";
// Import ReactDOM - helps render React to the browser
import ReactDOM from "react-dom/client";
// Import our main App component
import App from "./App.jsx";
// Import our CSS styles
import "./index.css";

// Import Bootstrap JavaScript - this makes dropdowns, modals, etc. work
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Import React Hot Toast - for showing notifications
import { Toaster } from "react-hot-toast";

// This is where React gets "mounted" into the HTML
// It finds the <div id="root"> in index.html and puts our React app there
ReactDOM.createRoot(document.getElementById("root")).render(
  // React.StrictMode helps catch bugs during development
  <React.StrictMode>
    {/* Our main App component */}
    <App />

    {/* Toast notification component */}
    {/* This shows success/error messages anywhere in the app */}
    <Toaster
      position="top-right" // Where notifications appear
      toastOptions={{
        duration: 4000, // How long notifications stay (4 seconds)
        style: {
          background: "#363636", // Default background color
          color: "#fff", // Default text color
          borderRadius: "10px", // Rounded corners
          padding: "12px", // Internal spacing
          fontSize: "14px", // Text size
        },
        success: {
          style: {
            background: "#198754", // Green background for success messages
          },
        },
        error: {
          style: {
            background: "#dc3545", // Red background for error messages
          },
        },
      }}
    />
  </React.StrictMode>
);
