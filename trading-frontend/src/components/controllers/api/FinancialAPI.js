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

// Fetch all financial records for a specific user
export const fetchFinancials = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/financials?user_id=${userId}`
    );
    if (!response.ok) throw new Error("Error fetching financial records");
    return await response.json();
  } catch (error) {
    console.error("Fetch Financials Error:", error);
    throw error;
  }
};

// Create a new financial record for a specific user
export const createFinancial = async (financialData) => {
  const response = await fetch(`${API_BASE_URL}/financials?user_id=${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...financialData, user_id: userId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error creating financial record");
  }

  return await response.json();
};

// Update an existing financial record for a specific user
export const updateFinancial = async (financialId, financialData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/financials/${financialId}?user_id=${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(financialData),
      }
    );
    if (!response.ok) throw new Error("Error updating financial record");
    return await response.json();
  } catch (error) {
    console.error("Update Financial Error:", error);
    throw error;
  }
};

// Delete a financial record for a specific user
export const deleteFinancial = async (financialId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/financials/${financialId}?user_id=${userId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Error deleting financial record");
    return await response.json();
  } catch (error) {
    console.error("Delete Financial Error:", error);
    throw error;
  }
};

// Fetch a single financial record by ID for a specific user
export const fetchFinancialById = async (financialId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/financials/${financialId}?user_id=${userId}`
    );
    if (!response.ok) throw new Error("Financial record not found");
    return await response.json();
  } catch (error) {
    console.error("Fetch Financial Record Error:", error);
    throw error;
  }
};
