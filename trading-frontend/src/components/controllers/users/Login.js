// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { loginUser } from "../api/UserAPI";
// import { decodeJWT } from "../../../func/functions";

// const Login = () => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       // Build request body for OAuth2PasswordRequestForm
//       const credentials = new URLSearchParams();
//       credentials.append("username", username);
//       credentials.append("password", password);

//       // Send request to backend
//       const response = await loginUser(credentials);

//       // Decode JWT to extract user info (sub = user_id)
//       const decoded = decodeJWT(response.access_token);

//       // Store token + decoded user data
//       localStorage.setItem("auth_token", response.access_token);
//       localStorage.setItem("user_data", JSON.stringify(decoded));

//       // Reset fields
//       setUsername("");
//       setPassword("");

//       // Redirect to home/dashboard
//       navigate("/");
//     } catch (err) {
//       setError(err.message || "Login failed");
//     }

//     setLoading(false);
//   };

//   return (
//     <form onSubmit={handleLogin} className="auth-form">
//       {error && <p className="error-message">{error}</p>}

//       <input
//         type="text"
//         placeholder="Username"
//         value={username}
//         onChange={(e) => setUsername(e.target.value)}
//         required
//       />

//       <input
//         type="password"
//         placeholder="Password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//         required
//       />

//       <button type="submit" className="btn" disabled={loading}>
//         {loading ? "Logging in..." : "Login"}
//       </button>
//     </form>
//   );
// };

// export default Login;


// // import React, { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { loginUser } from "../api/UserAPI";
// // import { decodeJWT } from "../func/functions";

// // const Login = () => {
// //   const [username, setUsername] = useState("");
// //   const [password, setPassword] = useState("");
// //   const [error, setError] = useState("");
// //   const [loading, setLoading] = useState(false);
// //   const navigate = useNavigate();

// //   const handleLogin = async (e) => {
// //     e.preventDefault();
// //     setLoading(true);
// //     try {
// //       const credentials = new URLSearchParams();
// //       credentials.append("username", username);
// //       credentials.append("password", password);

// //       const response = await loginUser(credentials);
// //       const decodedToken = decodeJWT(response.access_token);

// //       const userId = decodedToken.sub || decodedToken.user_id;
// //       console.log("User ID:", userId);
// //       console.log(decodedToken);

// //       // localStorage.setItem("access_token", response.access_token);

// //       // localStorage.setItem("auth_token", response.access_token);
// //       // localStorage.setItem("user_data", JSON.stringify(decodedToken));

// //       localStorage.setItem("auth_token", response.access_token);

// //       const userData = decodeJWT(response.access_token);
// //       localStorage.setItem("user_data", JSON.stringify(userData));


// //       setError("");
// //       setUsername("");
// //       setPassword("");
// //       window.location.href = "/";
// //     } catch (err) {
// //       setError(err.message);
// //     }
// //     setLoading(false);
// //   };

  

// //   return (
// //     <form onSubmit={handleLogin} className="auth-form">
// //       {error && <p className="error-message">{error}</p>}
// //       <input
// //         type="text"
// //         placeholder="Username"
// //         value={username}
// //         onChange={(e) => setUsername(e.target.value)}
// //         required
// //       />
// //       <input
// //         type="password"
// //         placeholder="Password"
// //         value={password}
// //         onChange={(e) => setPassword(e.target.value)}
// //         required
// //       />
// //       <button type="submit" className="btn" disabled={loading}>
// //         {loading ? "Logging in..." : "Login"}
// //       </button>
// //     </form>
// //   );
// // };

// // export default Login;
