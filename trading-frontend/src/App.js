// src/App.js

import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

/* =========================
   Context
========================= */
import { AuthContext } from "./context/AuthContext";

/* =========================
   Pages
========================= */
import Landing from "./pages/Landing/Landing";
import Home from "./pages/Home/Home";
// import Portfolio from "./pages/Profile/Profile.jsx";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Trades from "./pages/Trades/Trades";
import Analysis from "./pages/Analysis/Analysis";
import NetWorth from "./pages/NetWorth/NetWorth";



/* =========================
   Navigation
========================= */
import Navigation from "./components/nav/Navigation";
import LandingNavigation from "./components/nav/LandingNavigation";
import Profile from "./pages/Profile/Profile.jsx";

/* =========================
   Protected Route
========================= */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  if (!user) {
    return <Navigate to="/start" replace />;
  }

  return children;
};

/* =========================
   App Content
========================= */
const AppContent = () => {
  const location = useLocation();

  const isPublicPage =
    location.pathname === "/start" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div className="app">
      {/* Navigation */}
      {isPublicPage ? <LandingNavigation /> : <Navigation />}

      {/* Routes */}
      <main>
        <Routes>
          {/* Public */}
          <Route path="/start" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <Portfolio />
              </ProtectedRoute>
            }
          /> */}

          <Route
            path="/trades"
            element={
              <ProtectedRoute>
                <Trades />
              </ProtectedRoute>
            }
         />
         
          <Route
            path="/analysis"
            element={
              <ProtectedRoute>
                <Analysis />
              </ProtectedRoute>
            }
          />

          <Route
            path="/networth"
            element={
              <ProtectedRoute>
                <NetWorth />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />



          {/* Fallback */}
          <Route path="*" element={<Navigate to="/start" replace />} />
        </Routes>
      </main>
    </div>
  );
};

/* =========================
   App Root
========================= */
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
