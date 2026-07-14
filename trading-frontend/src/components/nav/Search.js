import React, { useState } from "react";

const Search = ({ onSymbolSubmit }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (event) => {
    if (event.key === "Enter" && searchTerm.trim()) {
      const capitalizedSymbol = searchTerm.trim().toUpperCase();
      onSymbolSubmit(capitalizedSymbol);
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
