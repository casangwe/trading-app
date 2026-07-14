//src/components/layout/EquityCurve.jsx

import React from "react";

const EquityCurve = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No equity data</div>;
  }

  return (
    <div>
      Equity points: {data.length}
    </div>
  );
};

export default EquityCurve;
