import React from 'react';
import { useNavigate } from 'react-router-dom';


const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
      {/* Logo */}
      <div className="mb-6">
        <img src="/IronScopeLogo.png" alt="IronScope Logo" className="w-40 h-40 object-contain" />

      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button onClick={() => navigate('/form-analysis')} className="w-full py-3 bg-red-600 text-white text-lg font-semibold rounded-md shadow hover:bg-red-700 transition">
          Login
        </button>
        <button onClick={() => navigate('/create-account')} className="w-full py-3 border border-gray-300 text-white text-lg font-semibold rounded-md bg-transparent hover:bg-gray-900 transition">
          Create Account
        </button>
      </div>
    </div>
  );
};

export default HomePage;
