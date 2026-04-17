import { NavLink } from "react-router";
import { Trophy, Users, X } from "lucide-react";

const Sidebar = ({
  role,
  isOpen,
  onClose,
}: {
  role?: string;
  isOpen?: boolean;
  onClose?: () => void;
}) => {
  const navItems = [
    ...(role === "SUPERADMIN"
      ? [{ to: "/dashboard", label: "Tournaments", icon: Trophy }]
      : []),
    ...(role === "ADMIN"
      ? [{ to: "/dashboard/tournament", label: "Tournament", icon: Trophy }]
      : []),
    ...(role === "SUPERADMIN"
      ? [{ to: "/dashboard/management-user", label: "Management User", icon: Users }]
      : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed z-30 top-0 left-0 h-full w-56 bg-white border-r border-gray-100 flex flex-col py-6 px-3 transition-transform duration-200
          md:static md:z-auto md:translate-x-0 md:shrink-0 md:min-h-screen
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-3 mb-3 md:justify-start">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menu
          </p>
          <button
            className="md:hidden p-1 rounded-md text-gray-400 hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onClose}
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
    </>
  );
};

export default Sidebar;
