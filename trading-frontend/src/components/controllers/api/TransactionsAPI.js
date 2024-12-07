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

// Fetch all transactions for a specific user
export const fetchTransactions = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/transactions?user_id=${userId}`
    );
    if (!response.ok) throw new Error("Error fetching transactions");
    return await response.json();
  } catch (error) {
    console.error("Fetch Transactions Error:", error);
    throw error;
  }
};

// Create a new transaction for a specific user
export const createTransaction = async (transactionData) => {
  const response = await fetch(
    `${API_BASE_URL}/transactions?user_id=${userId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...transactionData, user_id: userId }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error creating transaction");
  }

  return await response.json();
};

// Update an existing transaction for a specific user
export const updateTransaction = async (transactionId, transactionData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/transactions/${transactionId}?user_id=${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      }
    );
    if (!response.ok) throw new Error("Error updating transaction");
    return await response.json();
  } catch (error) {
    console.error("Update Transaction Error:", error);
    throw error;
  }
};

// Delete a transaction for a specific user
export const deleteTransaction = async (transactionId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/transactions/${transactionId}?user_id=${userId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Error deleting transaction");
    return await response.json();
  } catch (error) {
    console.error("Delete Transaction Error:", error);
    throw error;
  }
};

// Fetch a single transaction by ID for a specific user
export const fetchTransactionById = async (transactionId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/transactions/${transactionId}?user_id=${userId}`
    );
    if (!response.ok) throw new Error("Transaction not found");
    return await response.json();
  } catch (error) {
    console.error("Fetch Transaction Error:", error);
    throw error;
  }
};
