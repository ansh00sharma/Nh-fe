import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../api/auth.js";

function ProtectedRoute() {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
