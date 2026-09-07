/**
 * Provides authentication state to the React application.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getCurrentAdmin,
  loginAdmin,
} from "../api/authApi";


export const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);


  /**
   * Restores the authenticated admin when the application loads.
   */
  const loadCurrentAdmin = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    try {
      const currentAdmin = await getCurrentAdmin();
      setAdmin(currentAdmin);
    } catch (error) {
      localStorage.removeItem("access_token");
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadCurrentAdmin();
  }, [loadCurrentAdmin]);


  /**
   * Logs in an admin and stores the returned access token.
   */
  async function login(credentials) {
    const result = await loginAdmin(credentials);

    localStorage.setItem(
      "access_token",
      result.access_token
    );

    try {
      const currentAdmin = await getCurrentAdmin();

      setAdmin(currentAdmin);

      return currentAdmin;
    } catch (error) {
      localStorage.removeItem("access_token");
      setAdmin(null);

      throw error;
    }
  }


  /**
   * Clears the local authentication session.
   */
  function logout() {
    localStorage.removeItem("access_token");
    setAdmin(null);
  }


  const contextValue = {
    admin,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(admin),
  };


  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}