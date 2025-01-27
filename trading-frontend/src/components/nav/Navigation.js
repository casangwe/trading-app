// src/components/nav/Navigation.js

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import "../styles/styles.css";
import Logo from "../assets/T-bg.png";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");
    navigate("/start", { replace: true });
  };

  return (
    <div className="navigation">
      <div className="nav-container">
        {/* Logo Section */}
        <div className="nav-logo">
          <Link to="/">
            <img src={Logo} alt="Logo" className="logo-image" />
          </Link>
        </div>
        <div className="search">
          <input type="text" placeholder="Search..." />
        </div>
        <div className="nav-links">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            Home
          </Link>
          <Link
            to="/trades"
            className={location.pathname === "/trades" ? "active" : ""}
          >
            Trades
          </Link>
          <Link
            to="/analysis"
            className={location.pathname === "/analysis" ? "active" : ""}
          >
            Analysis
          </Link>
          <Link
            to="/networth"
            className={location.pathname === "/networth" ? "active" : ""}
          >
            Networth
          </Link>
          <Link
            to="/accounts"
            className={location.pathname === "/accounts" ? "active" : ""}
          >
            Profile
          </Link>

          <button className="logout-btn" title="Logout" onClick={handleLogout}>
            <FaSignOutAlt className="logout-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
