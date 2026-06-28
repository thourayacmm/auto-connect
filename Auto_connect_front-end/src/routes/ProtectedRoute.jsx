import { Navigate, Outlet } from "react-router-dom";
import { getStoredUser } from "../utils/helpers";

function ProtectedRoute({ allowedRoles }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
