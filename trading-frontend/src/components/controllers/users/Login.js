import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/UserAPI";
import { decodeJWT } from "../func/functions";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const credentials = new URLSearchParams();
      credentials.append("username", username);
      credentials.append("password", password);

      const response = await loginUser(credentials);
      const decodedToken = decodeJWT(response.access_token);

      const userId = decodedToken.sub || decodedToken.user_id;
      console.log("User ID:", userId);
      console.log(decodedToken);

      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("user_data", JSON.stringify(decodedToken));

      setError("");
      setUsername("");
      setPassword("");
      window.location.href = "/";
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
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
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};

export default Login;
