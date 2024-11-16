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

// Fetch all rules for a specific user
export const fetchRules = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/rules?user_id=${userId}`);
    if (!response.ok) throw new Error("Error fetching rules");
    return await response.json();
  } catch (error) {
    console.error("Fetch Rules Error:", error);
    throw error;
  }
};

// Create a new rule for a specific user
export const createRule = async (ruleData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rules?user_id=${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...ruleData, user_id: userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error creating rule");
    }

    return await response.json();
  } catch (error) {
    console.error("Create Rule Error:", error);
    throw error;
  }
};

// Update an existing rule for a specific user
export const updateRule = async (ruleId, ruleData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/rules/${ruleId}?user_id=${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleData),
      }
    );
    if (!response.ok) throw new Error("Error updating rule");
    return await response.json();
  } catch (error) {
    console.error("Update Rule Error:", error);
    throw error;
  }
};

// Delete a rule for a specific user
export const deleteRule = async (ruleId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/rules/${ruleId}?user_id=${userId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Error deleting rule");
    return await response.json();
  } catch (error) {
    console.error("Delete Rule Error:", error);
    throw error;
  }
};

// Fetch a single rule by ID for a specific user
export const fetchRuleById = async (ruleId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/rules/${ruleId}?user_id=${userId}`
    );
    if (!response.ok) throw new Error("Rule not found");
    return await response.json();
  } catch (error) {
    console.error("Fetch Rule Error:", error);
    throw error;
  }
};
