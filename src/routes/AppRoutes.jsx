import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import Login from "../pages/Login.jsx";
import Projects from "../pages/Projects.jsx";
import Tasks from "../pages/Tasks.jsx";
import Users from "../pages/Users.jsx";
import ModuleRoute from "./ModuleRoute.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<ModuleRoute moduleName="users" />}>
            <Route path="/users" element={<Users />} />
          </Route>
          <Route element={<ModuleRoute moduleName="projects" />}>
            <Route path="/projects" element={<Projects />} />
          </Route>
          <Route element={<ModuleRoute moduleName="tasks" />}>
            <Route path="/tasks" element={<Tasks />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
