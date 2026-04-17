import { useEffect, useRef, useState } from "react";
import { Form } from "react-router";
import { Menu } from "lucide-react";

const Topbar = ({
  userInfo,
  onMenuClick,
}: {
  userInfo: {
    id: number;
    username?: string;
    role: string;
  };
  onMenuClick?: () => void;
}) => {
  const firstChar = userInfo?.username?.[0];
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-15 w-full flex items-center justify-between px-6 bg-white shadow-sm">
      <button
        className="md:hidden p-1 rounded-md text-gray-600 hover:bg-gray-100"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu size={22} />
      </button>
      <div className="flex gap-3 items-center relative ml-auto" ref={dropdownRef}>
        <div
          className="rounded-full bg-black text-white size-10 flex items-center justify-center uppercase text-lg cursor-pointer select-none"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {firstChar}
        </div>
        <p>{userInfo?.username || ""}</p>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userInfo?.username}
              </p>
              <p className="text-xs text-gray-500 capitalize">{userInfo?.role}</p>
            </div>
            <Form method="post" action="/logout">
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;
