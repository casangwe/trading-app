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
      {/* Form Fields */}
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

// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { registerUser } from "../api/UserAPI";

// const Register = ({ onRegisterSuccess }) => {
//   const [formData, setFormData] = useState({
//     fname: "",
//     lname: "",
//     username: "",
//     email: "",
//     password: "",
//     phoneNumber: "",
//     accountType: "",
//   });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate(); // For navigation

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     const {
//       fname,
//       lname,
//       username,
//       email,
//       password,
//       phoneNumber,
//       accountType,
//     } = formData;

//     if (
//       !fname ||
//       !lname ||
//       !username ||
//       !email ||
//       !password ||
//       !phoneNumber ||
//       !accountType
//     ) {
//       setError("All fields are required.");
//       setLoading(false);
//       return;
//     }

//     try {
//       await registerUser({
//         fname,
//         lname,
//         username,
//         email,
//         password,
//         phone_number: phoneNumber,
//         account_type: accountType,
//       });

//       // Navigate to home upon successful registration
//       navigate("/", { replace: true });

//       if (onRegisterSuccess) onRegisterSuccess();
//     } catch (err) {
//       setError(err.message || "Error registering user");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleRegister} className="auth-form">
//       {error && <p className="error-message">{error}</p>}

//       <input
//         type="text"
//         name="fname"
//         placeholder="First Name"
//         value={formData.fname}
//         onChange={handleInputChange}
//         required
//       />
//       <input
//         type="text"
//         name="lname"
//         placeholder="Last Name"
//         value={formData.lname}
//         onChange={handleInputChange}
//         required
//       />
//       <input
//         type="text"
//         name="username"
//         placeholder="Username"
//         value={formData.username}
//         onChange={handleInputChange}
//         required
//       />
//       <input
//         type="email"
//         name="email"
//         placeholder="Email"
//         value={formData.email}
//         onChange={handleInputChange}
//         required
//       />
//       <input
//         type="password"
//         name="password"
//         placeholder="Password"
//         value={formData.password}
//         onChange={handleInputChange}
//         required
//       />
//       <input
//         type="text"
//         name="phoneNumber"
//         placeholder="Phone Number"
//         value={formData.phoneNumber}
//         onChange={handleInputChange}
//         required
//       />
//       <select
//         name="accountType"
//         value={formData.accountType}
//         onChange={handleInputChange}
//         required
//       >
//         <option value="" disabled>
//           Select Account Type
//         </option>
//         <option value="personal">Personal</option>
//         <option value="business">Business</option>
//       </select>

//       <button type="submit" className="btn" disabled={loading}>
//         {loading ? "Registering..." : "Register"}
//       </button>
//     </form>
//   );
// };

// export default Register;

// // import React, { useState } from "react";
// // import { registerUser } from "../api/UserAPI";

// // const Register = ({ onRegisterSuccess }) => {
// //   const [formData, setFormData] = useState({
// //     fname: "",
// //     lname: "",
// //     username: "",
// //     email: "",
// //     password: "",
// //     phoneNumber: "",
// //     accountType: "",
// //   });
// //   const [error, setError] = useState("");
// //   const [loading, setLoading] = useState(false);

// //   const handleInputChange = (e) => {
// //     const { name, value } = e.target;
// //     setFormData((prev) => ({ ...prev, [name]: value }));
// //   };

// //   const handleRegister = async (e) => {
// //     e.preventDefault();
// //     setLoading(true);
// //     setError("");

// //     const {
// //       fname,
// //       lname,
// //       username,
// //       email,
// //       password,
// //       phoneNumber,
// //       accountType,
// //     } = formData;

// //     if (
// //       !fname ||
// //       !lname ||
// //       !username ||
// //       !email ||
// //       !password ||
// //       !phoneNumber ||
// //       !accountType
// //     ) {
// //       setError("All fields are required.");
// //       setLoading(false);
// //       return;
// //     }

// //     try {
// //       await registerUser({
// //         fname,
// //         lname,
// //         username,
// //         email,
// //         password,
// //         phone_number: phoneNumber,
// //         account_type: accountType,
// //       });
// //       if (onRegisterSuccess) onRegisterSuccess();
// //     } catch (err) {
// //       setError(err.message || "Error registering user");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <form onSubmit={handleRegister} className="auth-form">
// //       {error && <p className="error-message">{error}</p>}

// //       <input
// //         type="text"
// //         name="fname"
// //         placeholder="First Name"
// //         value={formData.fname}
// //         onChange={handleInputChange}
// //         required
// //       />
// //       <input
// //         type="text"
// //         name="lname"
// //         placeholder="Last Name"
// //         value={formData.lname}
// //         onChange={handleInputChange}
// //         required
// //       />
// //       <input
// //         type="text"
// //         name="username"
// //         placeholder="Username"
// //         value={formData.username}
// //         onChange={handleInputChange}
// //         required
// //       />
// //       <input
// //         type="email"
// //         name="email"
// //         placeholder="Email"
// //         value={formData.email}
// //         onChange={handleInputChange}
// //         required
// //       />
// //       <input
// //         type="password"
// //         name="password"
// //         placeholder="Password"
// //         value={formData.password}
// //         onChange={handleInputChange}
// //         required
// //       />
// //       <input
// //         type="text"
// //         name="phoneNumber"
// //         placeholder="Phone Number"
// //         value={formData.phoneNumber}
// //         onChange={handleInputChange}
// //         required
// //       />
// //       <select
// //         name="accountType"
// //         value={formData.accountType}
// //         onChange={handleInputChange}
// //         required
// //       >
// //         <option value="" disabled>
// //           Select Account Type
// //         </option>
// //         <option value="personal">Personal</option>
// //         <option value="business">Business</option>
// //       </select>

// //       <button type="submit" className="btn" disabled={loading}>
// //         {loading ? "Registering..." : "Register"}
// //       </button>
// //     </form>
// //   );
// // };

// // export default Register;

// // // import React, { useState } from "react";
// // // import { registerUser } from "../api/UserAPI";

// // // const Register = ({ onRegisterSuccess }) => {
// // //   const [fname, setFname] = useState("");
// // //   const [lname, setLname] = useState("");
// // //   const [username, setUsername] = useState("");
// // //   const [email, setEmail] = useState("");
// // //   const [password, setPassword] = useState("");
// // //   const [phoneNumber, setPhoneNumber] = useState("");
// // //   const [accountType, setAccountType] = useState("");
// // //   const [error, setError] = useState("");
// // //   const [loading, setLoading] = useState(false);

// // //   const handleRegister = async (e) => {
// // //     e.preventDefault();
// // //     setLoading(true);

// // //     try {
// // //       const userData = {
// // //         fname,
// // //         lname,
// // //         username,
// // //         email,
// // //         password,
// // //         phone_number: phoneNumber,
// // //         account_type: accountType,
// // //       };
// // //       await registerUser(userData);
// // //       setError("");
// // //       if (onRegisterSuccess) onRegisterSuccess();
// // //     } catch (err) {
// // //       setError(err.message || "Error registering user");
// // //     }
// // //     setLoading(false);
// // //   };

// // //   return (
// // //     <form onSubmit={handleRegister} className="auth-form">
// // //       {error && <p className="error-message">{error}</p>}
// // //       <input
// // //         type="text"
// // //         placeholder="First Name"
// // //         value={fname}
// // //         onChange={(e) => setFname(e.target.value)}
// // //         required
// // //       />
// // //       <input
// // //         type="text"
// // //         placeholder="Last Name"
// // //         value={lname}
// // //         onChange={(e) => setLname(e.target.value)}
// // //         required
// // //       />
// // //       <input
// // //         type="text"
// // //         placeholder="Username"
// // //         value={username}
// // //         onChange={(e) => setUsername(e.target.value)}
// // //         required
// // //       />
// // //       <input
// // //         type="email"
// // //         placeholder="Email"
// // //         value={email}
// // //         onChange={(e) => setEmail(e.target.value)}
// // //         required
// // //       />
// // //       <input
// // //         type="password"
// // //         placeholder="Password"
// // //         value={password}
// // //         onChange={(e) => setPassword(e.target.value)}
// // //         required
// // //       />
// // //       <input
// // //         type="text"
// // //         placeholder="Phone Number"
// // //         value={phoneNumber}
// // //         onChange={(e) => setPhoneNumber(e.target.value)}
// // //         required
// // //       />
// // //       <select
// // //         value={accountType}
// // //         onChange={(e) => setAccountType(e.target.value)}
// // //       >
// // //         <option value="" disabled>
// // //           Select Account Type
// // //         </option>
// // //         <option value="personal">Personal</option>
// // //         <option value="business">Business</option>
// // //       </select>
// // //       <button type="submit" className="btn" disabled={loading}>
// // //         {loading ? "Registering..." : "Register"}
// // //       </button>
// // //     </form>
// // //   );
// // // };

// // // export default Register;
