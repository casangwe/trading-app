import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Search = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (event) => {
    if (event.key === "Enter" && searchTerm.trim()) {
      const capitalizedSymbol = searchTerm.trim().toUpperCase();
      navigate("/context", { state: { symbol: capitalizedSymbol } });
      setSearchTerm("");
    }
  };

  return (
    <div className="search">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
        onKeyDown={handleSearch}
      />
    </div>
  );
};

export default Search;
