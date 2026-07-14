// src/pages/auth/Register.js

import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerRequest, loginRequest } from "../../api/auth";
import { AuthContext } from "../../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    fname: "",
    lname: "",
    username: "",
    email: "",
    phone_number: "",
    account_type: "personal",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerRequest(form);

      const tokenResponse = await loginRequest(
        form.username,
        form.password
      );

      login(tokenResponse.access_token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-page-container">
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">
          Set up your account to start tracking your portfolio.
        </p>

        <form onSubmit={handleRegister} className="auth-form">
          {error && <p className="error-message">{error}</p>}

          <input name="fname" placeholder="First name" value={form.fname} onChange={handleChange} required />
          <input name="lname" placeholder="Last name" value={form.lname} onChange={handleChange} required />
          <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="phone_number" placeholder="Phone number" value={form.phone_number} onChange={handleChange} />

          <select name="account_type" value={form.account_type} onChange={handleChange}>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
          </select>

          <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <Link to="/login" className="link-btn">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;
