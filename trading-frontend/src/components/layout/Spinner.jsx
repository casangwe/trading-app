//src/components/layout/Spinner.jsx

import React, { useEffect, useState } from "react";

const Spinner = ({
  overlay = false,
  size = 36,
  minHeight = 300,
  minDuration = 2000, 
  delay = 0,          
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let delayTimer;
    let minTimer;

    delayTimer = setTimeout(() => {
      setVisible(true);

      minTimer = setTimeout(() => {
        setVisible(false);
      }, minDuration);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(minTimer);
    };
  }, [delay, minDuration]);

  const spinnerStyle = {
    width: size,
    height: size,
    borderWidth: Math.max(3, Math.floor(size / 8)),
  };

  const Wrapper = overlay ? "div" : "div";
  const wrapperClass = overlay ? "spinner-overlay" : "spinner-inline";

  return (
    <Wrapper
      className={wrapperClass}
      style={{ minHeight }}
    >
      {visible && <div className="spinner" style={spinnerStyle} />}
    </Wrapper>
  );
};

export default Spinner;
