import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import axios from 'axios';

const CONNECTED_KEYPOINTS = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle']
];

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-railway-url.up.railway.app'
  : 'http://localhost:3001';

const PoseCanvas = ({ videoFile, liftType, demoMode, selectedDemo }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const loopIdRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [feedback, setFeedback] = useState('');
  const poseBuffer = useRef([]);
  const hasAnalyzed = useRef(false);

  const normalizeKeypoints = (keypoints) => {
    const leftHip = keypoints.find(k => k.name === 'left_hip');
    const rightHip = keypoints.find(k => k.name === 'right_hip');
    const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
    const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');

    if (!leftHip || !rightHip || !leftShoulder || !rightShoulder) return [];

    const hipCenterX = (leftHip.x + rightHip.x) / 2;
    const hipCenterY = (leftHip.y + rightHip.y) / 2;
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    const height = Math.max(1, Math.abs(shoulderCenterY - hipCenterY));

    return keypoints.map(k => ({
      name: k.name,
      x: ((k.x - hipCenterX) / height).toFixed(3),
      y: ((k.y - hipCenterY) / height).toFixed(3),
      score: k.score.toFixed(2)
    }));
  };

  const drawSkeleton = (poses, displayWidth, displayHeight, inputWidth, inputHeight) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!poses || poses.length === 0) return;

    const scaleX = displayWidth / inputWidth;
    const scaleY = displayHeight / inputHeight;

    poses.forEach((pose) => {
      const keypoints = {};
      pose.keypoints.forEach((kp) => {
        if (kp.score > 0.4) {
          keypoints[kp.name] = {
            x: kp.x * scaleX,
            y: kp.y * scaleY,
            score: kp.score
          };
          ctx.beginPath();
          ctx.arc(kp.x * scaleX, kp.y * scaleY, 4, 0, 2 * Math.PI);
          ctx.fillStyle = 'red';
          ctx.fill();
        }
      });

      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      CONNECTED_KEYPOINTS.forEach(([from, to]) => {
        if (keypoints[from] && keypoints[to]) {
          ctx.beginPath();
          ctx.moveTo(keypoints[from].x, keypoints[from].y);
          ctx.lineTo(keypoints[to].x, keypoints[to].y);
          ctx.stroke();
        }
      });
    });
  };

  const analyzeFullPoseSequence = async () => {
    if (hasAnalyzed.current) return;
    hasAnalyzed.current = true;

    try {
        const response = await axios.post(`${API_BASE_URL}/api/analyze`, {
        keypointFrames: poseBuffer.current,
        liftType: liftType || selectedDemo || 'Unknown',
      });
      if (response.data && response.data.feedback) {
        setFeedback(response.data.feedback);
      }
    } catch (err) {
      console.error('❌ Failed to get form feedback:', err);
    }
  };

  const startRenderLoop = (video, detector, canvas, displayWidth, displayHeight) => {
    const inputWidth = 256;
    const inputHeight = 256;
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = inputWidth;
    offscreenCanvas.height = inputHeight;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    let frameCount = 0;
    poseBuffer.current = [];

    const renderLoop = async () => {
      if (!video || !detector || !modelLoaded) return;
      if (!video.paused && !video.ended) {
        offscreenCtx.drawImage(video, 0, 0, inputWidth, inputHeight);
        const imageTensor = tf.browser.fromPixels(offscreenCanvas);
        const poses = await detector.estimatePoses(imageTensor, { flipHorizontal: false });
        imageTensor.dispose();

        drawSkeleton(poses, displayWidth, displayHeight, inputWidth, inputHeight);

        if (poses.length && frameCount % 6 === 0) {
          poseBuffer.current.push(poses[0].keypoints);
        }
        frameCount++;
      } else if (video.ended) {
        await analyzeFullPoseSequence();
      }
      loopIdRef.current = requestAnimationFrame(renderLoop);
    };

    loopIdRef.current = requestAnimationFrame(renderLoop);
  };

  const initPlaybackAndTracking = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !modelLoaded) return;

    const displayHeight = Math.min(window.innerHeight * 0.8, 720);
    const displayWidth = (displayHeight / video.videoHeight) * video.videoWidth;
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    video.width = displayWidth;
    video.height = displayHeight;

    video.currentTime = 0;
    video.play().then(() => {
      console.log('▶️ Video started, launching render loop');
      startRenderLoop(video, detector, canvas, displayWidth, displayHeight);
    }).catch((err) => {
      console.warn('⚠️ Video playback failed:', err);
    });
  };

  useEffect(() => {
    const loadDetector = async () => {
      await tf.setBackend('webgl');
      await tf.ready();
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      };
      const createdDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
      );
      setDetector(createdDetector);
      setModelLoaded(true);
      console.log('✅ Pose detector loaded.');
    };
    loadDetector();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !modelLoaded) return;
  
    hasAnalyzed.current = false;
    setFeedback('');
  
    if (demoMode) {
      const demoPath = `/demo-videos/${selectedDemo}.mp4`;
      video.src = demoPath;
    } else {
      video.src = videoFile;
    }
  
    const waitForMetadata = () => {
      if (video.readyState >= 1 && video.videoHeight > 0) {
        initPlaybackAndTracking();
      } else {
        setTimeout(waitForMetadata, 100);
      }
    };
  
    video.load();
    waitForMetadata();
  }, [videoFile, modelLoaded, demoMode, selectedDemo]);
  

  const handleReplay = () => {
    const video = videoRef.current;
    if (loopIdRef.current) cancelAnimationFrame(loopIdRef.current);
    if (video && detector && canvasRef.current) {
      initPlaybackAndTracking();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center mt-4 space-y-4 lg:space-y-0 lg:space-x-4">
      <div className="relative" style={{ width: 'fit-content', maxWidth: '100%' }}>
        <video
          ref={videoRef}
          className="absolute top-0 left-0 z-0"
          playsInline
          muted
          controls
          style={{ width: '100%' }}
        />
        <canvas
          ref={canvasRef}
          className="relative z-10 border"
          style={{ display: 'block' }}
        />
        <div className="text-center mt-2">
          <button
            onClick={handleReplay}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded mt-2"
          >
            Replay Video
          </button>
        </div>
      </div>
  
      {feedback && (
        <div
          className="bg-black text-white p-4 rounded w-full lg:w-[400px] max-w-full overflow-auto"
          dangerouslySetInnerHTML={{ __html: feedback }}
        />
      )}
    </div>
  );
  
  
};

export default PoseCanvas;
