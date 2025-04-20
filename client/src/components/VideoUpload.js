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

      // Load FFmpeg if it's not already
      if (!ffmpeg.loaded) await ffmpeg.load();

      // Convert video to buffer and write to FFmpeg FS
      const buffer = await file.arrayBuffer();
      ffmpeg.writeFile('input.mov', new Uint8Array(buffer));

      // Compress the video (reduce resolution and framerate)
      await ffmpeg.exec([
        '-i', 'input.mov',
        '-vf', 'scale=360:-2,fps=10',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        'output.mp4'
      ]);

      // Read back the compressed video
      const outputData = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([outputData.buffer], { type: 'video/mp4' });

      // Send as multipart/form-data to the server
      const formData = new FormData();
      formData.append('video', blob);

      const res = await axios.post('http://localhost:3001/analyze-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
    <div className="flex flex-col items-center">
      <input
        type="file"
        accept="video/*"
        onChange={handleVideo}
        className="bg-gray-800 text-white px-4 py-2 rounded mb-4"
      />
      {loading && (
        <p className="text-sm text-gray-400">
          Compressing & uploading video... please wait
        </p>
      )}
    </div>
  );
};

export default VideoUpload;
