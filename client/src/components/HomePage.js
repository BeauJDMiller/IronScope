import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A] px-4">
      {/* Logo */}
      <div className="mb-8">
        <img src="/IronScopeLogo.png" alt="IronScope Logo" className="w-32 h-32 object-contain" />
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => navigate('/form-analysis')}
          className="w-full py-3 bg-pink-600 text-white text-lg font-bold rounded-xl shadow-md hover:bg-pink-700 transition"
        >
          Log In
        </button>
        <button
          onClick={() => navigate('/create-account')}
          className="w-full py-3 bg-[#1C1C1E] border border-gray-700 text-white text-lg font-bold rounded-xl hover:bg-[#2C2C2E] transition"
        >
          Create Account
        </button>
      </div>
    </div>
  );
};

export default HomePage;
