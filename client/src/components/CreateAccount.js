import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateAccount = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async () => {
    await axios.post('http://localhost:3001/create-account', form);
    navigate('/membership');
  };

  return (
    <div className="p-8 max-w-md mx-auto text-white">
      <h2 className="text-3xl font-bold mb-6 text-center">Create Your Account</h2>
      
      <input
        className="block w-full mb-4 p-3 rounded-lg bg-[#1C1C1E] text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
        placeholder="Username"
        onChange={e => setForm({ ...form, username: e.target.value })}
      />
      
      <input
        className="block w-full mb-6 p-3 rounded-lg bg-[#1C1C1E] text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
        placeholder="Password"
        type="password"
        onChange={e => setForm({ ...form, password: e.target.value })}
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl transition"
      >
        Continue
      </button>
    </div>
  );
};

export default CreateAccount;
