// const API_BASE_URL = "http://localhost:8000";
const API_BASE_URL = "http://54.209.237.174:8000";

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

// Fetch all daily PNLs for a specific user
export const fetchDailyPnls = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dailypnls?user_id=${userId}`);
    if (!response.ok) throw new Error("Error fetching daily PNLs");
    return await response.json();
  } catch (error) {
    console.error("Fetch Daily PNLs Error:", error);
    throw error;
  }
};

// Create a new daily PNL for a specific user
export const createDailyPnl = async (dailyPnlData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dailypnls?user_id=${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...dailyPnlData, user_id: userId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error creating daily PNL");
    }

    return await response.json();
  } catch (error) {
    console.error("Create Daily PNL Error:", error);
    throw error;
  }
};

// Update an existing daily PNL for a specific user
export const updateDailyPnl = async (pnlId, dailyPnlData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dailypnls/${pnlId}?user_id=${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dailyPnlData),
      }
    );

    if (!response.ok) throw new Error("Error updating daily PNL");
    return await response.json();
  } catch (error) {
    console.error("Update Daily PNL Error:", error);
    throw error;
  }
};

// Delete a daily PNL for a specific user
export const deleteDailyPnl = async (pnlId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dailypnls/${pnlId}?user_id=${userId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) throw new Error("Error deleting daily PNL");
    return await response.json();
  } catch (error) {
    console.error("Delete Daily PNL Error:", error);
    throw error;
  }
};

// Fetch a single daily PNL by ID for a specific user
export const fetchDailyPnlById = async (pnlId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dailypnls/${pnlId}?user_id=${userId}`
    );
    if (!response.ok) throw new Error("Daily PNL not found");
    return await response.json();
  } catch (error) {
    console.error("Fetch Daily PNL Error:", error);
    throw error;
  }
};
