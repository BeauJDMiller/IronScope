import React from 'react';
import axios from 'axios';

const Payment = () => {
  const handleCheckout = async () => {
    const type = localStorage.getItem('membershipType');
    const res = await axios.post('http://localhost:3001/create-checkout-session', { type });
    window.location.href = res.data.url;
  };

  return (
    <div className="text-white p-8 max-w-md mx-auto text-center">
      <h2 className="text-3xl font-bold mb-8">Payment</h2>
      <button
        onClick={handleCheckout}
        className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl shadow transition"
      >
        Pay Now
      </button>
    </div>
  );
};

export default Payment;
