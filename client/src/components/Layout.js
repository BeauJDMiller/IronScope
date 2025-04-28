import React from 'react';
import SidebarMenu from './SidebarMenu';
import { useNavigate } from 'react-router-dom';

function Layout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="bg-black min-h-screen flex">
      <SidebarMenu />
      {/* Fixed Logout Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 right-4 px-4 py-2 bg-red-600 rounded text-white z-50"
      >
        Logout
      </button>
      <main className="flex-1 flex items-center justify-center relative">
        {children}
      </main>
    </div>
  );
}

export default Layout;
