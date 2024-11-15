// src/components/nav/LandingNavigation.js

import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/styles.css";

const LandingNavigation = () => {
  const location = useLocation();

  return (
    <div className="navigation">
      <div className="nav-container">
        <div className="nav-links">
          {/* <Link
            to="/start"
            className={location.pathname === "/start" ? "active" : ""}
          >
            Login
          </Link> */}
          {/* <Link
            to="/register"
            className={location.pathname === "/register" ? "active" : ""}
          >
            Register
          </Link> */}
        </div>
      </div>
    </div>
  );
};

export default LandingNavigation;
