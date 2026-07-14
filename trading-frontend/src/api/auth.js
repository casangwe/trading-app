// src/api/auth.js
import client from "./client";

export const loginRequest = async (username, password) => {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);

  const response = await client.post("/auth/token", form, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};

export const registerRequest = async (payload) => {
  const response = await client.post("/auth/users/", payload);
  return response.data;
};


// import client from "./client";

// // LOGIN (OAuth2PasswordRequestForm)
// export const loginRequest = async (username, password) => {
//   const form = new URLSearchParams();
//   form.append("username", username);
//   form.append("password", password);

//   const res = await client.post("/auth/token", form, {
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//   });

//   return res.data;
// };

// // REGISTER
// export const registerRequest = async (payload) => {
//   const res = await client.post("/auth/users/", payload);
//   return res.data;
// };
