import React from 'react';
import { useNavigate } from 'react-router-dom';

const Membership = () => {
  const navigate = useNavigate();

  const selectPlan = (type) => {
    localStorage.setItem('membershipType', type);
    navigate('/payment');
  };

  return (
    <div className="text-white p-8 max-w-lg mx-auto text-center">
      <h2 className="text-3xl font-bold mb-8">Choose Your Membership</h2>

      <div className="flex flex-col sm:flex-row justify-center gap-6">
        <button
          onClick={() => selectPlan('monthly')}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-xl shadow transition"
        >
          $5/month
        </button>
        <button
          onClick={() => selectPlan('onetime')}
          className="bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white font-bold py-3 px-6 rounded-xl border border-gray-700 transition"
        >
          $8 one-time
        </button>
      </div>
    </div>
  );
};

export default Membership;
