// Import React
import React from "react";
import { isAuthenticated, getCurrentUser } from "../utils/api";

// Welcome component - shows different content based on login status
function Welcome() {
  // Check if user is logged in
  const isLoggedIn = isAuthenticated();
  const currentUser = getCurrentUser();

  // If user is logged in, show personalized welcome
  if (isLoggedIn) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Personalized Welcome Card */}
            <div className="card card-custom mb-4">
              <div className="card-body text-center py-5">
                <h1 className="display-6 text-primary mb-3">
                  <i className="fas fa-user-circle me-3"></i>
                  Welcome back, {currentUser.name}!
                </h1>
                <p className="lead text-muted mb-4">
                  Ready to help your college community? Ask questions or help
                  others!
                </p>

                {/* User Stats */}
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="stats-card">
                      <span className="stats-number">
                        {currentUser.stats?.questionsAsked || 0}
                      </span>
                      <div className="stats-label">Questions Asked</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div
                      className="stats-card"
                      style={{
                        background: "linear-gradient(135deg, #198754, #20c997)",
                      }}
                    >
                      <span className="stats-number">
                        {currentUser.stats?.answersGiven || 0}
                      </span>
                      <div className="stats-label">Answers Given</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div
                      className="stats-card"
                      style={{
                        background: "linear-gradient(135deg, #ffc107, #fd7e14)",
                      }}
                    >
                      <span className="stats-number">
                        {currentUser.stats?.bestAnswersCount || 0}
                      </span>
                      <div className="stats-label">Best Answers</div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="d-grid gap-2 d-md-flex justify-content-center">
                  <button className="btn btn-primary btn-custom me-md-2">
                    <i className="fas fa-question-circle me-2"></i>
                    View Questions
                  </button>
                  <button className="btn btn-success btn-custom">
                    <i className="fas fa-plus me-2"></i>
                    Ask Question
                  </button>
                </div>
              </div>
            </div>

            {/* College Info */}
            <div className="card card-custom">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h5 className="text-primary mb-2">
                      <i className="fas fa-university me-2"></i>
                      Your College
                    </h5>
                    <h6 className="mb-1">{currentUser.college?.name}</h6>
                    <p className="text-muted mb-0">
                      <i className="fas fa-map-marker-alt me-1"></i>
                      {currentUser.college?.location?.city},{" "}
                      {currentUser.college?.location?.state}
                    </p>
                    <small className="text-muted">
                      {currentUser.department} • {currentUser.role}
                      {currentUser.year && ` • Year ${currentUser.year}`}
                    </small>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <button className="btn btn-outline-primary btn-custom">
                      <i className="fas fa-users me-2"></i>
                      College Community
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is NOT logged in, show general welcome
  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Main Welcome Card */}
          <div className="card card-custom mb-4">
            <div className="card-body text-center py-5">
              <h1 className="display-5 text-primary mb-3">
                <i className="fas fa-graduation-cap me-3"></i>
                Student Campus Assistant
              </h1>
              <p className="lead text-muted mb-4">
                Connect with your college community! Get help with lost items,
                find roommates, get academic assistance, and much more.
              </p>

              {/* Call to action buttons */}
              <div className="d-grid gap-2 d-md-flex justify-content-center">
                <a
                  href="/login"
                  className="btn btn-primary btn-lg btn-custom me-md-2"
                >
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Login
                </a>
                <a
                  href="/register"
                  className="btn btn-outline-primary btn-lg btn-custom"
                >
                  <i className="fas fa-user-plus me-2"></i>
                  Register Now
                </a>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="row g-4">
            {/* Lost & Found Feature */}
            <div className="col-md-6 col-lg-3">
              <div className="card card-custom h-100">
                <div className="card-body text-center">
                  <div className="text-danger mb-3">
                    <i className="fas fa-search fa-3x"></i>
                  </div>
                  <h5 className="card-title">Lost & Found</h5>
                  <p className="card-text text-muted">
                    Lost something on campus? Or found something? Help each
                    other out!
                  </p>
                </div>
              </div>
            </div>

            {/* Roommate Feature */}
            <div className="col-md-6 col-lg-3">
              <div className="card card-custom h-100">
                <div className="card-body text-center">
                  <div className="text-primary mb-3">
                    <i className="fas fa-home fa-3x"></i>
                  </div>
                  <h5 className="card-title">Find Roommates</h5>
                  <p className="card-text text-muted">
                    Looking for a roommate? Connect with fellow students near
                    campus!
                  </p>
                </div>
              </div>
            </div>

            {/* Academic Help Feature */}
            <div className="col-md-6 col-lg-3">
              <div className="card card-custom h-100">
                <div className="card-body text-center">
                  <div className="text-success mb-3">
                    <i className="fas fa-book fa-3x"></i>
                  </div>
                  <h5 className="card-title">Academic Help</h5>
                  <p className="card-text text-muted">
                    Stuck with assignments? Get help from seniors and
                    classmates!
                  </p>
                </div>
              </div>
            </div>

            {/* Campus Info Feature */}
            <div className="col-md-6 col-lg-3">
              <div className="card card-custom h-100">
                <div className="card-body text-center">
                  <div className="text-warning mb-3">
                    <i className="fas fa-info-circle fa-3x"></i>
                  </div>
                  <h5 className="card-title">Campus Info</h5>
                  <p className="card-text text-muted">
                    Need directions or campus information? Ask the community!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="card card-custom mt-4">
            <div className="card-body">
              <h4 className="text-center text-primary mb-4">
                <i className="fas fa-question-circle me-2"></i>
                How It Works
              </h4>
              <div className="row text-center">
                <div className="col-md-4 mb-3">
                  <div className="mb-3">
                    <i className="fas fa-user-plus fa-2x text-primary"></i>
                  </div>
                  <h6>1. Register with College Email</h6>
                  <small className="text-muted">
                    Sign up with your official college email to join your campus
                    community
                  </small>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="mb-3">
                    <i className="fas fa-question fa-2x text-success"></i>
                  </div>
                  <h6>2. Ask Questions</h6>
                  <small className="text-muted">
                    Post your questions in relevant categories and get help from
                    peers
                  </small>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="mb-3">
                    <i className="fas fa-hands-helping fa-2x text-warning"></i>
                  </div>
                  <h6>3. Help Others</h6>
                  <small className="text-muted">
                    Answer questions from your college mates and build community
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the component
export default Welcome;
