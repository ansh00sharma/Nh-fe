import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logout, logoutFromServer } from "../api/auth.js";

const pageMeta = {
  "/dashboard": {
    label: "Dashboard",
    description: "Operational overview",
  },
  "/users": {
    label: "Users",
    description: "People and access",
  },
  "/projects": {
    label: "Projects",
    description: "Project portfolio",
  },
  "/tasks": {
    label: "Tasks",
    description: "Assignments and delivery",
  },
};

function Navbar({ initials, user, onMenuToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const currentPage = pageMeta[location.pathname] ?? {
    label: "TaskFlow",
    description: "Workflow command center",
  };
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logoutFromServer();
    } catch {
      // Local cleanup still signs the user out if the token is already expired.
    } finally {
      logout(navigate);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-[4.25rem] items-center justify-between border-b border-white/70 bg-white/85 px-4 shadow-[0_1px_0_rgba(15,23,42,0.04),0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-200 lg:hidden"
          aria-label="Open sidebar"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden items-baseline text-lg font-black tracking-tight text-slate-950 sm:inline-flex">
              Task
              <span className="bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
                Flow
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="group flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-200"
          aria-label="Open profile menu"
          aria-expanded={isMenuOpen}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-950 via-slate-800 to-teal-700 text-sm font-bold text-white shadow-inner">
            {initials || "?"}
          </span>
          <span className="hidden max-w-36 truncate text-left text-sm font-semibold text-slate-700 sm:block">
            {displayName || user?.email || "Account"}
          </span>
          <svg
            aria-hidden="true"
            className={`hidden h-4 w-4 text-slate-400 transition sm:block ${
              isMenuOpen ? "rotate-180 text-teal-600" : "group-hover:text-slate-600"
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {isMenuOpen && (
          <div className="chrome-popover absolute right-0 top-[3.25rem] z-40 w-64 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/12">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-900">
                {displayName || "TaskFlow User"}
              </p>
              <p className="truncate text-xs font-medium text-slate-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.75A1.75 1.75 0 0 0 14 4h-7a1.75 1.75 0 0 0-1.75 1.75v12.5C5.25 19.216 6.034 20 7 20h7a1.75 1.75 0 0 0 1.75-1.75V15M18 15l3-3m0 0-3-3m3 3H10"
                />
              </svg>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
