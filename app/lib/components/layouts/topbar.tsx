import { useEffect, useRef, useState } from "react";
import { Form } from "react-router";

const Topbar = ({
  userInfo,
}: {
  userInfo: {
    id: number;
    username?: string;
    role: string;
  };
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
    <div className="h-15 w-full flex justify-end px-6 bg-white shadow-sm">
      <div className="flex gap-3 items-center relative" ref={dropdownRef}>
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
