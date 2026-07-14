import React from "react";
import { Link } from "react-router-dom";

import "../../styles/styles.css";
import Logo from "../../assets/T-bg.png";

const Landing = () => {
  return (
    <main className="landing">
      <div className="landing-container">
        {/* =========================
            Branding / Left Side
        ========================= */}
        <div className="landing-brand">
          <img
            src={Logo}
            alt="Wealth Trade"
            className="landing-logo"
          />

          <h1 className="landing-title">
            Wealth Trade
          </h1>

          <p className="landing-tagline">
            Track portfolio performance. Trade with clarity.
          </p>
        </div>

        {/* =========================
            Auth Entry / Right Side
        ========================= */}
        <div className="landing-auth">
          <div className="landing-auth-actions">
            <Link to="/login" className="landing-btn primary">
              Sign in
            </Link>

            <Link to="/register" className="landing-btn secondary">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Landing;
