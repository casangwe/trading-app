// src/components/nav/LandingNavigation.js

import React from "react";
import { Link } from "react-router-dom";
import "../../styles/styles.css";
import Logo from "../../assets/T-bg.png";

const LandingNavigation = () => {
  return (
    <header className="navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/start" aria-label="Wealth Trade">
            <img
              src={Logo}
              alt="Wealth Trade Logo"
              className="logo-image"
            />
          </Link>
        </div>

        {/* intentionally empty */}
        <div className="nav-links" />
      </div>
    </header>
  );
};

export default LandingNavigation;
