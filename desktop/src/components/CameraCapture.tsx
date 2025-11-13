import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RotateCw, Check, Sparkles, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { visionService } from '../services/vision-service';
import { FaceMesh, Results as FaceMeshResults } from '@mediapipe/face_mesh';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

interface CameraCaptureProps {
  onCapture?: (imageData: string) => void;
  onClose: () => void;
}

interface FaceDetection {
  faceDetected: boolean;
  eyesDetected: boolean;
  leftEye: { x: number; y: number } | null;
  rightEye: { x: number; y: number } | null;
  faceBounds: { x: number; y: number; width: number; height: number } | null;
  landmarks: Array<{ x: number; y: number }>;
  emotion?: string;
  confidence?: number;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasPermission, setHasPermission] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [faceDetection, setFaceDetection] = useState<FaceDetection>({
    faceDetected: false,
    eyesDetected: false,
    leftEye: null,
    rightEye: null,
    faceBounds: null,
    landmarks: [],
    emotion: undefined,
    confidence: undefined,
  });
  const mediaPipeCameraRef = useRef<MediaPipeCamera | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const lastEmotionCheckRef = useRef<number>(0);
  const [liveEmotion, setLiveEmotion] = useState<string>('neutral');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Initialize MediaPipe Face Detection
  const initializeFaceDetection = async () => {
    try {
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      faceMesh.onResults((results: FaceMeshResults) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];

          // Eye landmarks (MediaPipe indices)
          // Left eye: 33, 133, 160, 159, 158, 157, 173
          // Right eye: 362, 263, 387, 386, 385, 384, 398
          const leftEyeCenter = landmarks[159]; // Left eye center
          const rightEyeCenter = landmarks[386]; // Right eye center

          // Calculate face bounds
          const xs = landmarks.map(l => l.x);
          const ys = landmarks.map(l => l.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          setFaceDetection({
            faceDetected: true,
            eyesDetected: true,
            leftEye: { x: leftEyeCenter.x, y: leftEyeCenter.y },
            rightEye: { x: rightEyeCenter.x, y: rightEyeCenter.y },
            faceBounds: {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
            },
            landmarks: landmarks.map(l => ({ x: l.x, y: l.y })),
          });

          // Draw detection overlay
          drawFaceOverlay(results);
        } else {
          setFaceDetection({
            faceDetected: false,
            eyesDetected: false,
            leftEye: null,
            rightEye: null,
            faceBounds: null,
            landmarks: [],
          });
        }
      });

      faceMeshRef.current = faceMesh;
      return faceMesh;
    } catch (error) {
      console.error('MediaPipe initialization error:', error);
      return null;
    }
  };

  // Detect emotion from facial landmarks (simple heuristic)
  const detectEmotionFromLandmarks = (landmarks: Array<{ x: number; y: number }>) => {
    // Simple emotion detection based on mouth and eyebrow positions
    // This is a basic heuristic - real AI analysis happens on capture

    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];
    const mouthTop = landmarks[13];
    const mouthBottom = landmarks[14];

    const leftEyebrow = landmarks[70];
    const rightEyebrow = landmarks[300];
    const noseTip = landmarks[1];

    // Calculate mouth openness
    const mouthHeight = Math.abs(mouthBottom.y - mouthTop.y);
    const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x);
    const mouthRatio = mouthHeight / mouthWidth;

    // Calculate smile (mouth corners vs center)
    const mouthCenter = landmarks[13];
    const smileLeft = mouthLeft.y < mouthCenter.y;
    const smileRight = mouthRight.y < mouthCenter.y;
    const isSmiling = smileLeft && smileRight;

    // Determine emotion
    if (isSmiling && mouthRatio < 0.5) {
      return { emotion: 'happy', confidence: 0.75 };
    } else if (mouthRatio > 0.8) {
      return { emotion: 'surprised', confidence: 0.7 };
    } else if (leftEyebrow.y < noseTip.y - 0.1) {
      return { emotion: 'thinking', confidence: 0.65 };
    } else {
      return { emotion: 'neutral', confidence: 0.6 };
    }
  };

  // Perform live emotion detection with AI (throttled)
  const performLiveEmotionDetection = async () => {
    const now = Date.now();
    // Only check emotion every 3 seconds to avoid overloading
    if (now - lastEmotionCheckRef.current < 3000) return;

    lastEmotionCheckRef.current = now;

    if (!videoRef.current || !canvasRef.current) return;

    try {
      // Capture current frame
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg', 0.7);

      // Analyze emotion with real AI
      const result = await visionService.analyzeEmotion(imageData);

      if (result.success && result.emotion) {
        setLiveEmotion(result.emotion);
        setFaceDetection(prev => ({
          ...prev,
          emotion: result.emotion,
          confidence: result.confidence,
        }));
      }
    } catch (error) {
      console.error('Live emotion detection error:', error);
    }
  };

  // Draw face detection overlay
  const drawFaceOverlay = (results: FaceMeshResults) => {
    if (!overlayCanvasRef.current || !videoRef.current) return;

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // Calculate face bounds
      const xs = landmarks.map(l => l.x * canvas.width);
      const ys = landmarks.map(l => l.y * canvas.height);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      // Draw face bounding box with glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ff88';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 3;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      ctx.shadowBlur = 0;

      // Draw corner markers
      const cornerSize = 20;
      ctx.lineWidth = 4;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(minX, minY + cornerSize);
      ctx.lineTo(minX, minY);
      ctx.lineTo(minX + cornerSize, minY);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(maxX - cornerSize, minY);
      ctx.lineTo(maxX, minY);
      ctx.lineTo(maxX, minY + cornerSize);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(minX, maxY - cornerSize);
      ctx.lineTo(minX, maxY);
      ctx.lineTo(minX + cornerSize, maxY);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(maxX - cornerSize, maxY);
      ctx.lineTo(maxX, maxY);
      ctx.lineTo(maxX, maxY - cornerSize);
      ctx.stroke();

      // Draw eye circles with glow
      const leftEye = landmarks[159];
      const rightEye = landmarks[386];

      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ff88';
      ctx.fillStyle = '#00ff88';

      ctx.beginPath();
      ctx.arc(leftEye.x * canvas.width, leftEye.y * canvas.height, 8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(rightEye.x * canvas.width, rightEye.y * canvas.height, 8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Draw emotion label if detected
      if (liveEmotion && liveEmotion !== 'neutral') {
        const emotionEmojis: Record<string, string> = {
          happy: '😊',
          sad: '😢',
          surprised: '😮',
          thinking: '🤔',
          excited: '🤩',
          curious: '🧐',
          angry: '😠',
          neutral: '😐',
        };

        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 18px sans-serif';
        const emoji = emotionEmojis[liveEmotion] || '😐';
        ctx.fillText(`${emoji} ${liveEmotion}`, minX, minY - 35);
      }

      // Trigger live emotion detection (throttled)
      performLiveEmotionDetection();
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = async () => {
          // Initialize face detection
          const faceMesh = await initializeFaceDetection();

          if (faceMesh && videoRef.current) {
            // Start MediaPipe camera
            const mpCamera = new MediaPipeCamera(videoRef.current, {
              onFrame: async () => {
                if (videoRef.current && faceMeshRef.current) {
                  await faceMeshRef.current.send({ image: videoRef.current });
                }
              },
              width: 1280,
              height: 720,
            });

            mediaPipeCameraRef.current = mpCamera;
            mpCamera.start();

            toast.success('🎯 Face detection active!');
          }
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Failed to access camera. Please grant permission.');
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    // Stop MediaPipe camera
    if (mediaPipeCameraRef.current) {
      mediaPipeCameraRef.current.stop();
      mediaPipeCameraRef.current = null;
    }

    // Stop media stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    // Reset face detection
    setFaceDetection({
      faceDetected: false,
      eyesDetected: false,
      leftEye: null,
      rightEye: null,
      faceBounds: null,
      landmarks: [],
    });
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);

    toast.success('📸 Photo captured!');

    // Automatically analyze with REAL AI
    setIsAnalyzing(true);
    setAnalysisResult('');

    try {
      toast.loading('🧠 Analyzing with Ollama Vision AI...', { id: 'vision-analysis' });

      const result = await visionService.analyzeImage(imageData);

      setAnalysisResult(result);
      toast.success('✅ AI Analysis complete!', { id: 'vision-analysis' });
    } catch (error: any) {
      console.error('Vision analysis error:', error);
      toast.error('❌ Analysis failed: ' + error.message, { id: 'vision-analysis' });
      setAnalysisResult('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult('');
  };

  const handleUse = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
    }
    stopCamera();
    onClose();
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!hasPermission) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="text-center">
          <Camera size={64} className="mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Camera Permission Required</h2>
          <p className="text-muted mb-4">Please grant camera access to use this feature</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary rounded-lg hover:bg-primary/80 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <button
          onClick={onClose}
          className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          <X size={24} />
        </button>

        {!capturedImage && (
          <button
            onClick={toggleCamera}
            className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <RotateCw size={24} />
          </button>
        )}
      </div>

      {/* Video/Image Display */}
      <div className="w-full h-full flex items-center justify-center relative">
        {capturedImage ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={capturedImage}
              alt="Captured"
              className="max-w-full max-h-full object-contain"
            />

            {/* AI Analysis Overlay */}
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md rounded-lg p-4 border border-primary/30"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-primary mb-1">
                      🧠 Ollama Vision AI Analysis
                    </h3>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {analysisResult}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Analyzing Indicator */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-4 right-4 bg-primary/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm text-primary font-medium">Analyzing...</span>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Video feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-w-full max-h-full object-contain"
            />

            {/* Face detection overlay canvas */}
            <canvas
              ref={overlayCanvasRef}
              className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
              style={{ mixBlendMode: 'screen' }}
            />

            {/* Face detection status indicator */}
            {faceDetection.faceDetected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-4 left-4 bg-green-500/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 border border-green-500/50"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-400 font-medium">
                  👤 Face Detected
                </span>
              </motion.div>
            )}

            {/* Eyes detection status */}
            {faceDetection.eyesDetected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-16 left-4 bg-blue-500/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 border border-blue-500/50"
              >
                <Eye className="text-blue-400" size={16} />
                <span className="text-sm text-blue-400 font-medium">
                  Eyes Tracked
                </span>
              </motion.div>
            )}

            {/* Live emotion detection */}
            {faceDetection.faceDetected && liveEmotion && liveEmotion !== 'neutral' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-28 left-4 bg-purple-500/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 border border-purple-500/50"
              >
                <Sparkles className="text-purple-400" size={16} />
                <span className="text-sm text-purple-400 font-medium">
                  Emotion: {liveEmotion}
                  {faceDetection.confidence && ` (${Math.round(faceDetection.confidence * 100)}%)`}
                </span>
              </motion.div>
            )}

            {/* No face detected warning */}
            {!faceDetection.faceDetected && hasPermission && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-4 left-4 bg-yellow-500/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 border border-yellow-500/50"
              >
                <span className="text-sm text-yellow-400 font-medium">
                  🔍 Looking for face...
                </span>
              </motion.div>
            )}

            {/* AI Detection Info */}
            {faceDetection.faceDetected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-lg p-3 border border-primary/30"
              >
                <div className="text-xs text-white/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>🎯 Real-time Face Tracking</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>👁️ Eye Detection</span>
                    <span className="text-green-400">
                      {faceDetection.eyesDetected ? 'Locked' : 'Searching...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🧠 AI Emotion Analysis</span>
                    <span className="text-blue-400">
                      {liveEmotion || 'Analyzing...'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center gap-4">
        {capturedImage ? (
          <>
            <button
              onClick={handleRetake}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              🔄 Retake
            </button>
            <button
              onClick={handleUse}
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary rounded-lg hover:scale-105 transition-transform flex items-center gap-2"
              disabled={isAnalyzing}
            >
              <Check size={20} />
              {isAnalyzing ? 'Analyzing...' : 'Use Photo'}
            </button>
          </>
        ) : (
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full bg-white border-4 border-primary hover:scale-110 transition-transform"
          >
            <div className="w-full h-full rounded-full bg-white" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

