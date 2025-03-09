import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../api/UserAPI"; // import loginUser
import { decodeJWT } from "../func/functions"; // import decodeJWT if used

const Register = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
    accountType: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const {
        fname,
        lname,
        username,
        email,
        password,
        phoneNumber,
        accountType,
      } = formData;
      await registerUser({
        fname,
        lname,
        username,
        email,
        password,
        phone_number: phoneNumber,
        account_type: accountType,
      });

      const credentials = new URLSearchParams();
      credentials.append("username", username);
      credentials.append("password", password);
      const loginResponse = await loginUser(credentials);

      const decodedToken = decodeJWT(loginResponse.access_token);
      localStorage.setItem("access_token", loginResponse.access_token);
      localStorage.setItem("user_data", JSON.stringify(decodedToken));

      if (onRegisterSuccess) onRegisterSuccess();
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Error registering user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="auth-form">
      {error && <p className="error-message">{error}</p>}
      <input
        type="text"
        name="fname"
        placeholder="First Name"
        value={formData.fname}
        onChange={handleInputChange}
        required
      />
      <input
        type="text"
        name="lname"
        placeholder="Last Name"
        value={formData.lname}
        onChange={handleInputChange}
        required
      />
      <input
        type="text"
        name="username"
        placeholder="Username"
        value={formData.username}
        onChange={handleInputChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleInputChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleInputChange}
        required
      />
      <input
        type="text"
        name="phoneNumber"
        placeholder="Phone Number"
        value={formData.phoneNumber}
        onChange={handleInputChange}
        required
      />
      <select
        name="accountType"
        value={formData.accountType}
        onChange={handleInputChange}
        required
      >
        <option value="" disabled>
          Account Type
        </option>
        <option value="personal">Personal</option>
        <option value="business">Business</option>
      </select>
      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Registering..." : "Register"}
      </button>
    </form>
  );
};

export default Register;
