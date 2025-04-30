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
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center space-y-6 p-6 relative text-white">
      {/* Main Content, Centered */}
      <div className="w-full flex flex-col items-center space-y-6">

        <h1 className="text-3xl font-bold text-center mb-4">Upload a Video for Form Analysis</h1>

        {/* Toggle Button */}
        <button
          onClick={() => {
            setDemoMode(!demoMode);
            setRunDemo(false);
            setVideoURL(null);
          }}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-5 rounded-xl transition"
        >
          {demoMode ? 'Switch to Upload Mode' : 'Switch to Demo Mode'}
        </button>

        {/* Demo Mode */}
        {demoMode && (
          <div className="flex flex-col items-center gap-4">
            <select
              className="bg-[#1C1C1E] border border-gray-700 text-white p-2 rounded-lg focus:outline-none"
              value={selectedDemo}
              onChange={(e) => setSelectedDemo(e.target.value)}
            >
              <option value="squat">Squat</option>
              <option value="deadlift">Deadlift</option>
            </select>
            <button
              onClick={handleRunDemo}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-5 rounded-xl transition"
            >
              Run Demo
            </button>
          </div>
        )}

        {/* Upload Mode */}
        {!demoMode && (
          <>
            <p className="text-lg font-semibold text-center">Select a Lift:</p>
            <LiftSelector selectedLift={selectedLift} onSelect={setSelectedLift} />
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="mt-4 text-sm"
            />
          </>
        )}

        {/* Video/Canvas */}
        {(videoURL || runDemo) && (
          <div className="w-full flex justify-center">
            <PoseCanvas
              videoFile={videoURL}
              liftType={selectedLift}
              demoMode={demoMode}
              selectedDemo={selectedDemo}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FormAnalysis;
