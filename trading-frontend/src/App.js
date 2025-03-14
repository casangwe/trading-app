import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "./components/styles/styles.css";
import Home from "./components/pages/Home";
import Trades from "./components/pages/Trades";
import Context from "./components/pages/Context";
import Analysis from "./components/pages/Analysis";
import Accounts from "./components/pages/Accounts";
import Landing from "./components/pages/Landing";
import Networth from "./components/pages/Networth";
import Navigation from "./components/nav/Navigation";
import LandingNavigation from "./components/nav/LandingNavigation";
import { ProtectedRoute } from "./components/controllers/func/functions";

const AppContent = () => {
  const location = useLocation();
  const isLandingPage =
    location.pathname === "/start" || location.pathname === "/register";

  return (
    <div className="app">
      {isLandingPage ? <LandingNavigation /> : <Navigation />}
      <main>
        <Routes>
          <Route path="/start" element={<Landing />} />
          <Route path="/register" element={<Landing />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trades"
            element={
              <ProtectedRoute>
                <Trades />
              </ProtectedRoute>
            }
          />{" "}
          <Route
            path="/context"
            element={
              <ProtectedRoute>
                <Context />
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
            path="/accounts"
            element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/networth"
            element={
              <ProtectedRoute>
                <Networth />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
