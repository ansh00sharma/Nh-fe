import { NavLink } from "react-router-dom";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    module: "dashboard",
    accent: "from-teal-400 to-cyan-300",
    icon: (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 13.5h6.5V4H4v9.5ZM13.5 20H20v-9.5h-6.5V20ZM4 20h6.5v-3.5H4V20ZM13.5 7.5H20V4h-6.5v3.5Z"
        />
      </svg>
    ),
  },
  {
    label: "Users",
    path: "/users",
    module: "users",
    accent: "from-amber-300 to-orange-300",
    icon: (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 19v-1.5A3.5 3.5 0 0 0 12.5 14h-5A3.5 3.5 0 0 0 4 17.5V19"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 19v-1a3 3 0 0 0-2.25-2.9M17 4.2a3.5 3.5 0 0 1 0 6.6"
        />
      </svg>
    ),
  },
  {
    label: "Projects",
    path: "/projects",
    module: "projects",
    accent: "from-emerald-300 to-teal-300",
    icon: (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v6A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5v-8Z"
        />
      </svg>
    ),
  },
  {
    label: "Tasks",
    path: "/tasks",
    module: "tasks",
    accent: "from-sky-300 to-indigo-300",
    icon: (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m5 7 1.8 1.8L10 5.6M13 7h6M5 13l1.8 1.8L10 11.6M13 13h6M5 19l1.8 1.8L10 17.6M13 19h6"
        />
      </svg>
    ),
  },
];

function Sidebar({ collapsed, mobileOpen, onToggle, onClose, modules = [] }) {
  const visibleNavItems = navItems.filter((item) => modules.includes(item.module));

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 top-[4.25rem] z-30 bg-slate-950/45 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      <aside
        className={[
          "app-sidebar fixed bottom-0 left-0 top-[4.25rem] z-40 flex min-h-0 w-72 flex-col overflow-hidden border-r border-white/10 bg-slate-950 text-white shadow-2xl shadow-slate-950/30 transition-[transform,width] duration-300 ease-out lg:static lg:z-auto lg:shadow-none",
          collapsed ? "lg:w-20" : "lg:w-[17rem]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/80">
              Workspace
            </p>
          </div>

          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={onToggle}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:-translate-y-0.5 hover:border-teal-300/40 hover:bg-teal-300/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-300/30 lg:inline-flex"
          >
            <svg
              aria-hidden="true"
              className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 6-6 6 6 6" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-300/30 lg:hidden"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-3" aria-label="Main navigation">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "sidebar-link group relative flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold outline-none transition duration-200 focus:ring-2 focus:ring-teal-300/30",
                  collapsed ? "lg:justify-center" : "",
                  isActive
                    ? "bg-white text-slate-950 shadow-lg shadow-slate-950/20"
                    : "text-slate-300 hover:bg-white/[0.08] hover:text-white",
                ].join(" ")
              }
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition",
                      isActive ? `bg-gradient-to-b ${item.accent} opacity-100` : "opacity-0",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                      isActive
                        ? `bg-gradient-to-br ${item.accent} text-slate-950 shadow-inner`
                        : "bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>
                  <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
