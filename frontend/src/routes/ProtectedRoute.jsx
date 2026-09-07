/**
 * Protects pages that require administrator authentication.
 */

import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";


export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}