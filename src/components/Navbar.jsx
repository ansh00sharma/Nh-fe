import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout, logoutFromServer } from "../api/auth.js";

function Navbar({ initials }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-lg font-semibold text-slate-900">TaskFlow</div>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          aria-label="Open profile menu"
          aria-expanded={isMenuOpen}
        >
          {initials || "?"}
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-11 z-30 w-40 rounded border border-slate-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="block w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
