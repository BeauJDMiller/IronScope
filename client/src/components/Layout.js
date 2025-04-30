import React from 'react';
import SidebarMenu from './SidebarMenu';
import { useNavigate } from 'react-router-dom';

function Layout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0A0A0A] min-h-screen flex">
      <SidebarMenu />
      {/* Fixed Logout Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 right-4 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-md transition z-50"
      >
        Log Out
      </button>
      <main className="flex-1 flex items-center justify-center relative p-4">
        {children}
      </main>
    </div>
  );
}

export default Layout;
