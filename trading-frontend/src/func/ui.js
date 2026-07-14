// src/func/ui.js

export const minDelay = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));
