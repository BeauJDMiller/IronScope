import React from 'react';
import axios from 'axios';

const Payment = () => {
  const handleCheckout = async () => {
    const type = localStorage.getItem('membershipType');
    const res = await axios.post('http://localhost:3001/create-checkout-session', { type });
    window.location.href = res.data.url;
  };

  return (
    <div className="text-center p-8">
      <h2 className="text-2xl mb-4">Payment</h2>
      <button onClick={handleCheckout} className="bg-primary px-4 py-2 rounded">Pay Now</button>
    </div>
  );
};

export default Payment;
