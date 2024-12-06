// const API_BASE_URL = "http://localhost:8000";
// const API_BASE_URL = "http://54.158.155.144:8000";
const API_BASE_URL = "http://174.129.175.116:8000";
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

// Fetch all trades for a specific user
export const fetchTrades = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/trades?user_id=${userId}`);
    if (!response.ok) throw new Error("Error fetching trades");
    return await response.json();
  } catch (error) {
    console.error("Fetch Trades Error:", error);
    throw error;
  }
};

// Create a new trade for a specific user
export const createTrade = async (tradeData) => {
  const response = await fetch(`${API_BASE_URL}/trades?user_id=${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...tradeData, user_id: userId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error creating trade");
  }

  return await response.json();
};

// Update an existing trade for a specific user
export const updateTrade = async (tradeId, tradeData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/trades/${tradeId}?user_id=${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeData),
      }
    );
    if (!response.ok) throw new Error("Error updating trade");
    return await response.json();
  } catch (error) {
    console.error("Update Trade Error:", error);
    throw error;
  }
};

// Delete a trade for a specific user
export const deleteTrade = async (tradeId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/trades/${tradeId}?user_id=${userId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Error deleting trade");
    return await response.json();
  } catch (error) {
    console.error("Delete Trade Error:", error);
    throw error;
  }
};

// Fetch a single trade by ID for a specific user
export const fetchTradeById = async (tradeId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/trades/${tradeId}?user_id=${userId}`
    );
    if (!response.ok) throw new Error("Trade not found");
    return await response.json();
  } catch (error) {
    console.error("Fetch Trade Error:", error);
    throw error;
  }
};
