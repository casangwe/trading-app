//src/components/layout/Card.jsx

import React from "react";

const Card = ({ title, children }) => {
  return (
    <div className="card">
      {title && <h4 className="card-title">{title}</h4>}
      <div className="card-body">{children}</div>
    </div>
  );
};

export default Card;
