import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PoseCanvas from './PoseCanvas';
import LiftSelector from './LiftSelector';

const FormAnalysis = () => {
  const [videoURL, setVideoURL] = useState(null);
  const [selectedLift, setSelectedLift] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState('squat');
  const [runDemo, setRunDemo] = useState(false);
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
    setRunDemo(false); // disable demo if file is uploaded
  };

  const handleRunDemo = () => {
    setRunDemo(true);
    setVideoURL(null); // ensure we don't reuse old upload
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

      {/* Always visible toggle */}
      <button
        onClick={() => {
          setDemoMode(!demoMode);
          setRunDemo(false);
          setVideoURL(null);
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
      >
        {demoMode ? 'Switch to Upload Mode' : 'Switch to Demo Mode'}
      </button>

      {/* Demo Mode */}
      {demoMode && (
        <div className="flex flex-col items-center gap-2">
          <select
            className="bg-zinc-800 text-white border border-white p-1 rounded"
            value={selectedDemo}
            onChange={(e) => setSelectedDemo(e.target.value)}
          >
            <option value="squat">Squat</option>
            <option value="deadlift">Deadlift</option>
          </select>
          <button
            onClick={handleRunDemo}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded"
          >
            Run Demo
          </button>
        </div>
      )}

      {/* Upload Mode */}
      {!demoMode && (
        <>
          <p className="text-lg font-medium">Select a lift:</p>
          <LiftSelector selectedLift={selectedLift} onSelect={setSelectedLift} />
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="mb-4"
          />
        </>
      )}

      {(videoURL || runDemo) && (
        <PoseCanvas
          videoFile={videoURL}
          liftType={selectedLift}
          demoMode={demoMode}
          selectedDemo={selectedDemo}
        />
      )}
    </div>
  );
};

export default FormAnalysis;
