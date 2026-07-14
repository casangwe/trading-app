//src/components/layout/AllocationPie.jsx

import React from "react";


const AllocationPie = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No allocation data</div>;
  }

  return (
    <ul>
      {data.map((item) => (
        <li key={item.jar}>
          {item.jar}: {item.value}
        </li>
      ))}
    </ul>
  );
};

export default AllocationPie;
