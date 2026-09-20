import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import {
  fetchCurrentUser,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  getUserInitials,
  saveAuthSession,
} from "../api/auth.js";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken || user) {
      return;
    }

    let ignore = false;

    fetchCurrentUser(accessToken)
      .then((currentUser) => {
        if (ignore) {
          return;
        }

        setUser(currentUser);
        saveAuthSession({ accessToken, refreshToken: getRefreshToken(), user: currentUser });
      })
      .catch(() => {
        if (!ignore) {
          setUser(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar initials={getUserInitials(user)} />
      <div className="flex h-[calc(100vh-4rem)] min-h-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((current) => !current)}
          role={user?.role}
        />
        <main className="min-w-0 flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
