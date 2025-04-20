import React from 'react';
import { useNavigate } from 'react-router-dom';

const Membership = () => {
  const navigate = useNavigate();

  const selectPlan = (type) => {
    localStorage.setItem('membershipType', type);
    navigate('/payment');
  };

  return (
    <div className="text-center p-8">
      <h2 className="text-2xl mb-4">Choose Your Membership</h2>
      <button onClick={() => selectPlan('monthly')} className="bg-primary m-2 px-4 py-2 rounded">$5/month</button>
      <button onClick={() => selectPlan('onetime')} className="border m-2 px-4 py-2 rounded">$8 one-time</button>
    </div>
  );
};

export default Membership;
