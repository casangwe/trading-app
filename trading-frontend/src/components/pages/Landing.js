import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../controllers/users/Login";
import Register from "../controllers/users/Register";

const Landing = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const toggleAuthMode = () => setIsLogin(!isLogin);
  const handleRegisterSuccess = () => setIsLogin(true);

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="auth-container">
          {isLogin ? (
            <>
              <Login />
              <div className="auth-options">
                <button className="link-btn" onClick={toggleAuthMode}>
                  Register
                </button>
              </div>
            </>
          ) : (
            <>
              <Register onRegisterSuccess={handleRegisterSuccess} />
              <button className="link-btn" onClick={toggleAuthMode}>
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
