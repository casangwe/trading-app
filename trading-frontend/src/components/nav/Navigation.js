import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import "../../styles/styles.css";
// import Logo from "../assets/T-bg.png";
import Logo from "../../assets/T-bg.png";

import Search from "./Search";
import { AuthContext } from "../../context/AuthContext";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  // const [searchSymbol, setSearchSymbol] = useState(null);

  const handleOpenModal = (symbol) => {
    // setSearchSymbol(symbol);
  };

  const handleLogout = () => {
    logout();
    navigate("/start", { replace: true });
  };

  return (
    <div className="navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">
            <img src={Logo} alt="Logo" className="logo-image" />
          </Link>
        </div>

        <Search onSymbolSubmit={handleOpenModal} />

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
            Net Worth
          </Link>

          <Link
            to="/profile"
            className={location.pathname === "/profile" ? "active" : ""}
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




// import React, { useState } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { FaSignOutAlt } from "react-icons/fa";
// import "../styles/styles.css";
// import Logo from "../assets/T-bg.png";
// import Search from "./Search";

// const Navigation = () => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [showModal, setShowModal] = useState(false);
//   const [searchSymbol, setSearchSymbol] = useState(null);

//   const handleOpenModal = (symbol) => {
//     setSearchSymbol(symbol);
//     setShowModal(true);
//   };

//   const handleCloseModal = () => {
//     setSearchSymbol(null);
//     setShowModal(false);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("access_token");
//     localStorage.removeItem("user_data");
//     navigate("/start", { replace: true });
//   };

//   return (
//     <div className="navigation">
//       <div className="nav-container">
//         <div className="nav-logo">
//           <Link to="/">
//             <img src={Logo} alt="Logo" className="logo-image" />
//           </Link>
//         </div>
//         <Search onSymbolSubmit={handleOpenModal} />
//         <div className="nav-links">
//           <Link to="/" className={location.pathname === "/" ? "active" : ""}>
//             Home
//           </Link>
//           <Link
//             to="/trades"
//             className={location.pathname === "/trades" ? "active" : ""}
//           >
//             Trades
//           </Link>
//           <Link
//             to="/analysis"
//             className={location.pathname === "/analysis" ? "active" : ""}
//           >
//             Analysis
//           </Link>
//           <Link
//             to="/networth"
//             className={location.pathname === "/networth" ? "active" : ""}
//           >
//             Networth
//           </Link>
//           <Link
//             to="/accounts"
//             className={location.pathname === "/accounts" ? "active" : ""}
//           >
//             Profile
//           </Link>
//           <button className="logout-btn" title="Logout" onClick={handleLogout}>
//             <FaSignOutAlt className="logout-icon" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Navigation;
