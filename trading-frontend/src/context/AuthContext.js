//src/context/AuthContext.js
import React, { createContext, useEffect, useState } from "react";
import { decodeJWT } from "../func/auth";



export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load token on app start
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      const decoded = decodeJWT(token);
      setUser(decoded);
    }
  }, []);

  const login = (token) => {
    localStorage.setItem("auth_token", token);
    const decoded = decodeJWT(token);
    localStorage.setItem("user_data", JSON.stringify(decoded));
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    setUser(null);
    window.location.href = "/start";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


// // src/context/AuthContext.js
// import { createContext, useEffect, useState } from "react";
// import { decodeJWT } from "../func/functions";

// export const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);

//   // Load any existing token on startup
//   useEffect(() => {
//     const token = localStorage.getItem("auth_token");
//     if (token) {
//       const decoded = decodeJWT(token);
//       setUser(decoded);
//     }
//   }, []);

//   const login = (token) => {
//     localStorage.setItem("auth_token", token);
//     const decoded = decodeJWT(token);
//     localStorage.setItem("user_data", JSON.stringify(decoded));
//     setUser(decoded);
//   };

//   const logout = () => {
//     localStorage.removeItem("auth_token");
//     localStorage.removeItem("user_data");
//     setUser(null);
//     window.location.href = "/start";
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
