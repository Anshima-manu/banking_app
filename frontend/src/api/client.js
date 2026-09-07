/**
 * Shared Axios client for communication with the FastAPI backend.
 */

import axios from "axios";


const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


/**
 * Adds the administrator JWT to authenticated API requests.
 */
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);


/**
 * Removes an invalid authentication token after a 401 response.
 */
client.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
    }

    return Promise.reject(error);
  },
);


export default client;