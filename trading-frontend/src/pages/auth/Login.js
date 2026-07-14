// src/pages/auth/Login.js

import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginRequest } from "../../api/auth";
import { AuthContext } from "../../context/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginRequest(username, password);
      login(data.access_token);
      navigate("/");
    } catch {
      setError("Invalid username or password");
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-page-container">
        <h2 className="auth-title">Sign in</h2>
        <p className="auth-subtitle">
          Welcome back. Enter your credentials to continue.
        </p>

        <form onSubmit={handleLogin} className="auth-form">
          {error && <p className="error-message">{error}</p>}

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <Link to="/register" className="link-btn">
          Don’t have an account? Create one
        </Link>
      </div>
    </div>
  );
};

export default Login;
