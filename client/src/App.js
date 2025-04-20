import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import CreateAccount from './components/CreateAccount';
import Membership from './components/Membership';
import Payment from './components/Payment';
import FormAnalysis from './components/FormAnalysis';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/form-analysis" element={<FormAnalysis />} />
      </Routes>
    </Router>
  );
}

export default App;