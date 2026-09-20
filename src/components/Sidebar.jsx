import { NavLink } from "react-router-dom";

const navItems = [
  {
    label: "Users",
    path: "/users",
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

function Sidebar({ collapsed, onToggle, role }) {
  const visibleNavItems =
    role === "manager" ? navItems : navItems.filter((item) => item.path === "/tasks");

  return (
    <aside
      className={`flex min-h-0 flex-col border-r border-slate-200 bg-white transition-all duration-200 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex h-14 items-center justify-end border-b border-slate-200 px-4">
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          onClick={onToggle}
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
      </div>

      <nav className="space-y-1 p-3" aria-label="Main navigation">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              [
                "flex h-11 items-center gap-3 rounded px-3 text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
