import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import Login from "../pages/Login.jsx";
import Projects from "../pages/Projects.jsx";
import Tasks from "../pages/Tasks.jsx";
import Users from "../pages/Users.jsx";
import ManagerRoute from "./ManagerRoute.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/users" element={<Users />} />
          <Route element={<ManagerRoute />}>
            <Route path="/projects" element={<Projects />} />
          </Route>
          <Route path="/tasks" element={<Tasks />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
