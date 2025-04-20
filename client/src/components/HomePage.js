import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-6">IronScope</h1>
      <button onClick={() => navigate('/form-analysis')} className="bg-primary px-6 py-2 rounded mb-4">Login</button>
      <button onClick={() => navigate('/create-account')} className="border px-6 py-2 rounded">Create Account</button>
    </div>
  );
};

export default HomePage;
