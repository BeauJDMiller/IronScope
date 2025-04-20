import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import axios from 'axios';
import LiftSelector from './LiftSelector';

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

const PoseCanvas = ({ videoFile, liftType }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const loopIdRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const poseBuffer = useRef([]);
  const hasAnalyzed = useRef(false);
  const SMOOTHING_FACTOR = 0.7;
  let lastPose = null;

  const smoothKeypoints = (current, previous) => {
    if (!previous) return current;
    return current.map((point, i) => ({
      ...point,
      x: point.x * (1 - SMOOTHING_FACTOR) + previous[i].x * SMOOTHING_FACTOR,
      y: point.y * (1 - SMOOTHING_FACTOR) + previous[i].y * SMOOTHING_FACTOR,
      score: point.score * (1 - SMOOTHING_FACTOR) + previous[i].score * SMOOTHING_FACTOR,
    }));
  };

  useEffect(() => {
    const setup = async () => {
      try {
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
      } catch (err) {
        console.error('❌ Initialization failed:', err);
      }
    };
    setup();
  }, []);

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

  const extractBase64Image = (video) => {
    const offscreen = document.createElement('canvas');
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    const ctx = offscreen.getContext('2d');
    ctx.drawImage(video, 0, 0);
    return offscreen.toDataURL('image/jpeg').split(',')[1];
  };

  const analyzeFullPoseSequence = async () => {
    if (hasAnalyzed.current) return;
    hasAnalyzed.current = true;
    setLoading(true);

    const video = videoRef.current;
    const imageBase64 = extractBase64Image(video);
    try {
      const response = await axios.post('http://localhost:3001/api/analyze', {
        keypointFrames: poseBuffer.current,
        liftType: liftType || 'Unknown',
      });
      if (response.data && response.data.feedback) {
        setFeedback(response.data.feedback);
      }
    } catch (err) {
      console.error('❌ Failed to get form feedback:', err);
    } finally {
      setLoading(false);
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

        if (poses.length > 0) {
          const smoothedKeypoints = smoothKeypoints(poses[0].keypoints, lastPose);
          poses[0].keypoints = smoothedKeypoints;
          lastPose = smoothedKeypoints;
        }

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
    if (videoFile && modelLoaded) {
      const video = videoRef.current;
      const waitForMetadata = () => {
        if (video.readyState >= 1 && video.videoHeight > 0) {
          initPlaybackAndTracking();
        } else {
          setTimeout(waitForMetadata, 100);
        }
      };
      waitForMetadata();
    }
  }, [videoFile, modelLoaded]);

  const handleReplay = () => {
    const video = videoRef.current;
    if (loopIdRef.current) cancelAnimationFrame(loopIdRef.current);
    if (video && detector && canvasRef.current) {
      initPlaybackAndTracking();
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 justify-center mt-4 px-4">
      <div className="relative" style={{ maxHeight: '80vh' }}>
        <video
          ref={videoRef}
          src={videoFile}
          className="absolute top-0 left-0 z-0"
          playsInline
          muted
          controls
        />
        <canvas
          ref={canvasRef}
          className="relative z-10 border"
        />
        <div className="text-center mt-2">
          <button
            onClick={handleReplay}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
          >
            Replay Video
          </button>
        </div>
      </div>
      <div className="flex-1 max-w-xl text-white bg-zinc-900 p-4 rounded shadow-lg overflow-y-auto max-h-[85vh]">
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-2"></div>
            <p className="text-sm">Analyzing form...</p>
          </div>
        ) : feedback ? (
          <div>
            <h2 className="text-xl font-bold mb-2">💬 AI Feedback</h2>
            <div
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: feedback }}
            ></div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PoseCanvas;
