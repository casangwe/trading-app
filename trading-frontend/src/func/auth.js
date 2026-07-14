// src/func/auth.js

import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/* ============================
   Protected Route
============================ */
export const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/start" replace />;
};

/* ============================
   JWT Helpers
============================ */

export const decodeJWT = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Invalid JWT", err);
    return null;
  }
};

export const getToken = () => {
  return localStorage.getItem("auth_token") || null;
};

export const getUserId = () => {
  const token = getToken();
  if (!token) return null;

  const decoded = decodeJWT(token);
  if (!decoded) return null;

  return decoded.sub || decoded.user_id || null;
};
