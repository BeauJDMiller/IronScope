import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

const menuItems = [
  { label: "Video Analysis", path: "/form-analysis" },
  { label: "Workout Suggestion", path: "/workout-suggestion" },
];

export default function SidebarMenu() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <React.Fragment>
      {/* Top Navbar for Mobile */}
      <div className="fixed top-0 left-0 w-full h-14 bg-[#0A0A0A] flex items-center px-4 z-20 md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="text-white text-2xl focus:outline-none"
          aria-label="Open sidebar"
        >
          <FiMenu />
        </button>
      </div>

      {/* Overlay */}
      {open ? (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-60 bg-[#1C1C1E] flex flex-col pt-20 transition-transform z-30
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:flex
        `}
      >
        {/* Logo */}
        <div className="flex justify-center items-center mb-6">
          <img
            src="/IronScopeLogo.png"
            alt="IronScope Logo"
            className="w-28 h-28 object-contain"
            draggable="false"
          />
        </div>

        <hr className="border-t border-gray-700 mx-6 mb-4" />

        {/* Menu Items */}
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)}
            className={`text-left px-8 py-4 w-full font-bold text-white text-lg transition
              ${isActive(item.path) ? "bg-pink-600" : "hover:bg-[#2C2C2E]"}
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
