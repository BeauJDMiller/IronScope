import React, { useState } from 'react';
import axios from 'axios';
import { FFmpeg } from '@ffmpeg/ffmpeg';

const ffmpeg = new FFmpeg();

const VideoUpload = ({ setAnalysis }) => {
  const [loading, setLoading] = useState(false);

  const handleVideo = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('video/')) {
      alert('Please upload a valid video file');
      return;
    }

    try {
      setLoading(true);

      if (!ffmpeg.loaded) await ffmpeg.load();

      const buffer = await file.arrayBuffer();
      ffmpeg.writeFile('input.mov', new Uint8Array(buffer));

      await ffmpeg.exec([
        '-i', 'input.mov',
        '-vf', 'scale=360:-2,fps=10',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        'output.mp4'
      ]);

      const outputData = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([outputData.buffer], { type: 'video/mp4' });

      const formData = new FormData();
      formData.append('video', blob);

      const res = await axios.post('http://localhost:3001/analyze-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAnalysis(res.data.analysis);
      setLoading(false);
    } catch (error) {
      console.error('Video processing failed:', error);
      alert('Something went wrong while processing your video.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-white w-full max-w-md mx-auto">
      <input
        type="file"
        accept="video/*"
        onChange={handleVideo}
        className="bg-[#1C1C1E] border border-gray-700 text-white px-4 py-2 rounded-xl mb-4 w-full cursor-pointer hover:bg-[#2C2C2E] transition"
      />
      {loading && (
        <p className="text-sm text-pink-400 text-center animate-pulse">
          Compressing & uploading video... please wait
        </p>
      )}
    </div>
  );
};

export default VideoUpload;
