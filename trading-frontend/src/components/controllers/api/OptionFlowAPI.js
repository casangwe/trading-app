// const API_BASE_URL = "http://localhost:8000";
const API_BASE_URL = "http://54.209.237.174:8000";

// Upload Option Flow CSV File
export const uploadOptionFlow = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_BASE_URL}/upload-option-flow/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error uploading file");
    }

    return await response.json();
  } catch (error) {
    console.error("Upload Option Flow Error:", error);
    throw error;
  }
};

// Fetch Option Flow Analysis
export const fetchOptionFlowAnalysis = async (symbol, dateRange = 30) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/analysis/?symbol=${symbol}&date_range=${dateRange}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error fetching analysis");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Option Flow Analysis Error:", error);
    throw error;
  }
};

export const fetchWatchlistAnalysis = async (symbol) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/watchlists/${symbol}/analysis`
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error fetching watchlist analysis");
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch Watchlist Analysis Error:", error);
    throw error;
  }
};

export const fetchGlobalSetups = async (
  dateRange = 1,
  limit = 50,
  alignedOnly = false
) => {
  try {
    let url = `${API_BASE_URL}/setups/global?date_range=${dateRange}&limit=${limit}`;
    if (alignedOnly) url += "&aligned_only=true"; // append only when needed

    const response = await fetch(url); // ← use the built URL

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error fetching global setups");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Global Setups Error:", error);
    throw error;
  }
};

// export const fetchGlobalSetups = async (
//   dateRange = 1,
//   limit = 50,
//   alignedOnly = false
// ) => {
//   try {
//     let url = `${API_BASE_URL}/setups/global?date_range=${dateRange}&limit=${limit}`;
//     if (alignedOnly) url += "&aligned_only=true";
//     const response = await fetch(
//       `${API_BASE_URL}/setups/global?date_range=${dateRange}&limit=${limit}`
//     );

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.detail || "Error fetching global setups");
//     }

//     return await response.json();
//   } catch (error) {
//     console.error("Fetch Global Setups Error:", error);
//     throw error;
//   }
// };
