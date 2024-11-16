// const API_BASE_URL = "http://localhost:8000";
const API_BASE_URL = "http://54.158.155.144:8000";

// Retrieve userId from localStorage
const getUserId = () => {
  const userDataString = localStorage.getItem("user_data");
  if (!userDataString) {
    console.error("No user data found in localStorage");
    return null;
  }

  try {
    const userData = JSON.parse(userDataString);
    return userData.sub;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

// Retrieve the userId
const userId = getUserId();

// Fetch all misc entries for a specific user
export const fetchMiscEntries = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/misc?user_id=${userId}`);
    if (!response.ok) throw new Error("Error fetching misc entries");
    return await response.json();
  } catch (error) {
    console.error("Fetch Misc Entries Error:", error);
    throw error;
  }
};

// Fetch a single misc entry by ID for a specific user
export const fetchMiscEntryById = async (miscId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/misc/${miscId}?user_id=${userId}`
    );
    if (!response.ok) throw new Error("Misc entry not found");
    return await response.json();
  } catch (error) {
    console.error("Fetch Misc Entry Error:", error);
    throw error;
  }
};

// Create a new misc entry for a specific user
export const createMiscEntry = async (miscData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/misc?user_id=${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...miscData, user_id: userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error creating misc entry");
    }

    return await response.json();
  } catch (error) {
    console.error("Create Misc Entry Error:", error);
    throw error;
  }
};

// Update an existing misc entry for a specific user
export const updateMiscEntry = async (miscId, miscData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/misc/${miscId}?user_id=${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(miscData),
      }
    );

    if (!response.ok) throw new Error("Error updating misc entry");
    return await response.json();
  } catch (error) {
    console.error("Update Misc Entry Error:", error);
    throw error;
  }
};

// Delete a misc entry for a specific user
export const deleteMiscEntry = async (miscId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/misc/${miscId}?user_id=${userId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) throw new Error("Error deleting misc entry");
    return await response.json();
  } catch (error) {
    console.error("Delete Misc Entry Error:", error);
    throw error;
  }
};
