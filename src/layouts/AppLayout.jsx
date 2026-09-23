import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getUserInitials } from "../api/auth.js";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell min-h-screen text-slate-950">
      <Navbar
        initials={getUserInitials(currentUser)}
        user={currentUser}
        onMenuToggle={() => setMobileSidebarOpen((current) => !current)}
      />
      <div className="flex h-[calc(100vh-4.25rem)] min-h-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onToggle={() => setSidebarCollapsed((current) => !current)}
          onClose={() => setMobileSidebarOpen(false)}
          modules={currentUser?.modules}
        />
        <main className="relative min-w-0 flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
