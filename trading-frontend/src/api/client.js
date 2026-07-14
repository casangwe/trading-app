// src/api/client.js
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";


const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

// Attach token automatically
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global error handler
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      window.location.href = "/start";
    }
    return Promise.reject(error);
  }
);

export default client;



// // src/api/client.js
// import axios from "axios";

// // const API_BASE_URL = "http://127.0.0.1:8000";
// const API_BASE_URL = "http://localhost:3000";

// const client = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 8000,
// });

// // Attach token automatically
// client.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("auth_token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Global error handler
// client.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem("auth_token");
//       localStorage.removeItem("user_data");
//       window.location.href = "/start";
//     }
//     return Promise.reject(error);
//   }
// );

// export default client;
