// src/components/FormAnalysis.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PoseCanvas from './PoseCanvas';
import LiftSelector from './LiftSelector'; // ✅ This is the correct default import


const FormAnalysis = () => {
  const [videoURL, setVideoURL] = useState(null);
  const [selectedLift, setSelectedLift] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedLift) {
      alert("Please select a lift type before uploading.");
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoURL(url);

    // Later: send selectedLift to PoseCanvas or backend if needed
    console.log("Lift selected:", selectedLift);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-6">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 right-4 px-4 py-2 bg-primary rounded text-white"
      >
        Logout
      </button>

      <h1 className="text-3xl font-bold mb-2 text-center">Upload a Video for Form Analysis</h1>

      <p className="text-lg font-medium">Select a lift:</p>
      <LiftSelector selectedLift={selectedLift} onSelect={setSelectedLift} />

      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="mb-4"
      />

      {videoURL && <PoseCanvas videoFile={videoURL} liftType={selectedLift} />
    }
    </div>
  );
};

export default FormAnalysis;
