import React, { useState } from "react";
import { uploadOptionFlow } from "../api/OptionFlowAPI";

const OptionFlowUpload = ({ fileInputRef }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await uploadOptionFlow(file);
      setMessage(response.message);
      setFile(null);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {file && (
        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      )}

      {loading && <div className="spinner"></div>}
      {message && <p className="upload-message">{message}</p>}
    </div>
  );
};

export default OptionFlowUpload;
