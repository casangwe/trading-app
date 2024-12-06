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

// Create a new cash entry
export async function createCash(cashAmount) {
  if (!userId) {
    throw new Error("User ID is not available. Please log in.");
  }

  const response = await fetch(`${API_BASE_URL}/cash/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      initial_cash: cashAmount.initial_cash,
      entry_date: cashAmount.entry_date,
      user_id: userId,
    }),
  });

  const data = await response.json();
  if (response.ok) {
    console.log("Cash added successfully:", data);
    return data;
  } else {
    console.error("Error adding cash:", data);
    throw new Error(data);
  }
}

// Fetch cash entries
export const getCash = async () => {
  if (!userId) {
    throw new Error("User ID is not available. Please log in.");
  }

  const response = await fetch(`${API_BASE_URL}/cash/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Error fetching cash data");
  }

  return await response.json();
};
