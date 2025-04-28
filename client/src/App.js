import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import CreateAccount from './components/CreateAccount';
import Membership from './components/Membership';
import Payment from './components/Payment';
import FormAnalysis from './components/FormAnalysis';
import Layout from './components/Layout';
import WorkoutSuggestion from './components/WorkoutSuggestion';

function App() {
  return (
    <Router>
      <Routes>
        {/* Login/signup pages WITHOUT sidebar */}
        <Route path="/" element={<HomePage />} />
        <Route path="/create-account" element={<CreateAccount />} />

        {/* Main app pages WITH sidebar */}
        <Route
          path="/membership"
          element={
            <Layout>
              <Membership />
            </Layout>
          }
        />
        <Route
          path="/payment"
          element={
            <Layout>
              <Payment />
            </Layout>
          }
        />
        <Route
          path="/form-analysis"
          element={
            <Layout>
              <FormAnalysis />
            </Layout>
          }
        />
        <Route
          path="/workout-suggestion"
          element={
            <Layout>
              <WorkoutSuggestion />
            </Layout>
          }
        />    

      </Routes>
    </Router>
  );
}

export default App;
