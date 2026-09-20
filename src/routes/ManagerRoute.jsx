import { Navigate, Outlet } from "react-router-dom";
import { getStoredUserRole } from "../api/auth.js";

function ManagerRoute() {
  if (getStoredUserRole() === "agent") {
    return <Navigate to="/tasks" replace />;
  }

  return <Outlet />;
}

export default ManagerRoute;
