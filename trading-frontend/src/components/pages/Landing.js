// src/components/pages/Landing.js
import React, { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../../pages/auth/Login";
import Register from "../../pages/auth/Register";
import { AuthContext } from "../../context/AuthContext";

const Landing = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // If you're already logged in → go to dashboard
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="auth-container">
          {isLogin ? (
            <>
              <Login />
              <button className="link-btn" onClick={() => setIsLogin(false)}>
                Register
              </button>
            </>
          ) : (
            <>
              <Register />
              <button className="link-btn" onClick={() => setIsLogin(true)}>
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Landing;

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Login from "../controllers/users/Login";
// import Register from "../controllers/users/Register";

// const Landing = () => {
//   const [isLogin, setIsLogin] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const token = localStorage.getItem("access_token");
//     if (token) {
//       navigate("/", { replace: true });
//     }
//   }, [navigate]);

//   const toggleAuthMode = () => setIsLogin(!isLogin);
//   const handleRegisterSuccess = () => setIsLogin(true);

//   return (
//     <div className="landing-container">
//       <div className="landing-content">
//         <div className="auth-container">
//           {isLogin ? (
//             <>
//               <Login />
//               <div className="auth-options">
//                 <button className="link-btn" onClick={toggleAuthMode}>
//                   Register
//                 </button>
//               </div>
//             </>
//           ) : (
//             <>
//               <Register onRegisterSuccess={handleRegisterSuccess} />
//               <button className="link-btn" onClick={toggleAuthMode}>
//                 Log In
//               </button>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Landing;
