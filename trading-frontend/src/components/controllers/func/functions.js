//components/controllers/func/functions.js

import React from "react";
import { Navigate } from "react-router-dom";

export const formatDate = (dateStr) => {
  if (!dateStr || !dateStr.includes("-")) return "";
  const dateParts = dateStr.split("-");
  const month = dateParts[1];
  const day = dateParts[2];
  return `${month}/${day}`;
};
// export const formatDate = (date) => {
//   if (typeof date === "string" && date.includes("-")) {
//     const [year, month, day] = date.split("-");
//     return `${month}/${day}`;
//   }

//   if (date instanceof Date && !isNaN(date)) {
//     const options = { month: "2-digit", day: "2-digit" };
//     return date.toLocaleDateString(undefined, options);
//   }

//   return "";
// };

// export const ProtectedRoute = ({ children }) => {
//   const token = localStorage.getItem("access_token");

//   if (!token) {
//     return <Navigate to="/start" replace />;
//   }

//   return children;
// };

export const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/start" replace />;
};

export const decodeJWT = (token) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  return JSON.parse(jsonPayload);
};

export const getUserId = () => {
  const userDataString = localStorage.getItem("user_data");
  if (!userDataString) {
    console.error("No user data found in localStorage");
    return null;
  }

  try {
    const userData = JSON.parse(userDataString);
    return userData.sub;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

export const formatCash = (amount) => {
  if (typeof amount === "string") {
    amount = parseFloat(amount);
  }
  if (typeof amount !== "number") return "";

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
export const splitText = (text) => {
  return text.split("|").map((part, index) => (
    <p key={index} style={{ marginTop: "10px", marginBottom: "10px" }}>
      {part.trim()}
    </p>
  ));
};
