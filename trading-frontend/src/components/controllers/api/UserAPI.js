// const API_BASE_URL = "http://localhost:8000";
const API_BASE_URL = "http://54.158.155.144:8000";

// Register Users
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/users/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorDetails = await response.json();
      throw new Error(
        `Error registering user: ${errorDetails.detail || response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Register User Error:", error);
    throw error;
  }
};

// Login Users
export const loginUser = async (credentials) => {
  try {
    console.log("Fetching login with credentials:", credentials.toString());

    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: credentials,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error logging in");
    }

    return await response.json();
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

export const fetchUsers = async (skip = 0, limit = 100) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/?skip=${skip}&limit=${limit}`
    );
    if (!response.ok) throw new Error("Error fetching users");
    return await response.json();
  } catch (error) {
    console.error("Fetch Users Error:", error);
    throw error;
  }
};

export const fetchUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!response.ok) throw new Error("User not found");
    return await response.json();
  } catch (error) {
    console.error("Fetch User Error:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error("Error updating user");
    return await response.json();
  } catch (error) {
    console.error("Update User Error:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error deleting user");
    return await response.json();
  } catch (error) {
    console.error("Delete User Error:", error);
    throw error;
  }
};

export default {
  fetchUsers,
  fetchUser,
  updateUser,
  deleteUser,
};
