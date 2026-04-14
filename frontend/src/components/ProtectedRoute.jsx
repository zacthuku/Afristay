import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ user, children, role }) {
  const location = useLocation();

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