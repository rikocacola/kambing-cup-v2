import { NavLink } from "react-router";
import { Trophy } from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Tournaments", icon: Trophy },
];

const Sidebar = () => {
  return (
    <aside className="w-56 shrink-0 min-h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
        Menu
      </p>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
