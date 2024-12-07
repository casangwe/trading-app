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

// Fetch all watchlists for a specific user
export const fetchWatchlists = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/watchlists?user_id=${userId}`
    );
    if (!response.ok) throw new Error("Error fetching watchlists");
    return await response.json();
  } catch (error) {
    console.error("Fetch Watchlists Error:", error);
    throw error;
  }
};

// Create a new watchlist for a specific user
export const createWatchlist = async (watchlistData) => {
  const response = await fetch(`${API_BASE_URL}/watchlists?user_id=${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...watchlistData, user_id: userId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error creating watchlist");
  }

  return await response.json();
};

// Update an existing watchlist for a specific user
export const updateWatchlist = async (watchlistId, watchlistData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/watchlists/${watchlistId}?user_id=${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(watchlistData),
      }
    );
    if (!response.ok) throw new Error("Error updating watchlist");
    return await response.json();
  } catch (error) {
    console.error("Update Watchlist Error:", error);
    throw error;
  }
};

// Delete a watchlist for a specific user
export const deleteWatchlist = async (watchlistId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/watchlists/${watchlistId}?user_id=${userId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Error deleting watchlist");
    return await response.json();
  } catch (error) {
    console.error("Delete Watchlist Error:", error);
    throw error;
  }
};

// Fetch a single watchlist by ID for a specific user
export const fetchWatchlistById = async (watchlistId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/watchlists/${watchlistId}?user_id=${userId}`
    );
    if (!response.ok) throw new Error("Watchlist not found");
    return await response.json();
  } catch (error) {
    console.error("Fetch Watchlist Error:", error);
    throw error;
  }
};
