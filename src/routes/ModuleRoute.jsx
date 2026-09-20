import { Navigate, Outlet } from "react-router-dom";
import { getDefaultAuthenticatedPath, hasModuleAccess } from "../api/auth.js";

function ModuleRoute({ moduleName }) {
  if (!hasModuleAccess(moduleName)) {
    return <Navigate to={getDefaultAuthenticatedPath()} replace />;
  }

  return <Outlet />;
}

export default ModuleRoute;
