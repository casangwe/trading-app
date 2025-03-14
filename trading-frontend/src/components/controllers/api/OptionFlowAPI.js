const API_BASE_URL = "http://localhost:8000";
// const API_BASE_URL = "http://54.209.237.174:8000";

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
