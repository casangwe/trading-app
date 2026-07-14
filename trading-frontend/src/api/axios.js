// src/api/axios.js
import client from "./client";

/**
 * Centralized axios instance.
 * - JWT handled by client interceptors
 * - Base URL already configured
 */
export default client;
