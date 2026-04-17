import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";

export default function ProtectedRoute({ user, children, role }) {
  const location = useLocation();
  const { isInitializing } = useContext(AppContext);

  // ⏳ Still initializing - show loading state
  if (isInitializing) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // ❌ Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ❌ Logged in but wrong role
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  // ✅ Authorized
  return children;
}