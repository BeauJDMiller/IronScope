import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

const menuItems = [
  { label: "Video Analysis", path: "/form-analysis" },
  //{ label: "Lift Metrics", path: "/membership" },
  { label: "Workout Suggestion", path: "/workout-suggestion" },
];

export default function SidebarMenu() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Detect if the current path matches the menu item
  const isActive = (path) => location.pathname === path;

  return (
    <React.Fragment>
      <div className="fixed top-0 left-0 w-full h-12 bg-[#191b1e] flex items-center px-4 z-20 md:hidden">
        
        <button
          onClick={() => setOpen(true)}
          className="text-gray-300 text-2xl focus:outline-none"
          aria-label="Open sidebar"
        >
          <FiMenu />
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-10 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        className={`fixed top-0 left-0 h-full w-56 bg-[#232528] flex flex-col pt-16 transition-transform z-30
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:flex
        `}
      >
        {/* Logo */}
            <div className="flex justify-center items-center mb-4">
            <img
                src="/IronScopeLogo.png"
                alt="IronScope Logo"
                className="w-32 h-32 object-contain"
                draggable="false"
            />
            </div>
        <hr className="border-t border-gray-600 mx-6 mb-2" />
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)} // Close on mobile
            className={`text-left px-6 py-3 w-full font-medium text-gray-200 transition
              ${isActive(item.path) ? "bg-[#2c2e31] text-white" : "hover:bg-[#26272a]"}
              focus:outline-none
            `}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </React.Fragment>
  );
}
