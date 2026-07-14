//src/components/layout/Section.jsx

import React from "react";

const Section = ({ title, children }) => {
  return (
    <section className="section">
      {title && <h3 className="section-title">{title}</h3>}
      {children}
    </section>
  );
};

export default Section;
