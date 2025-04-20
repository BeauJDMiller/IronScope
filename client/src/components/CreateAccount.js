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
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Create Account</h2>
      <input className="block w-full mb-2 p-2" placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} />
      <input className="block w-full mb-4 p-2" placeholder="Password" type="password" onChange={e => setForm({ ...form, password: e.target.value })} />
      <button onClick={handleSubmit} className="bg-primary px-4 py-2 rounded">Continue</button>
    </div>
  );
};

export default CreateAccount;
