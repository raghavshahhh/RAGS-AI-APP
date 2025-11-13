import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Hands } from '@mediapipe/hands';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

interface RobotFaceProps {
  isListening: boolean;
  isSpeaking: boolean;
}

interface FaceData {
  position: { x: number; y: number };
  mouthOpen: number;
  eyebrowRaise: number;
  smile: number;
  handRaised: boolean;
}

function Eyes({ isListening, faceData }: { isListening: boolean; faceData: FaceData }) {
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!leftPupilRef.current || !rightPupilRef.current) return;

    // Track face position
    const lookX = faceData.position.x * 0.3;
    const lookY = -faceData.position.y * 0.3;
    
    leftPupilRef.current.position.x = lookX;
    leftPupilRef.current.position.y = lookY;
    rightPupilRef.current.position.x = lookX;
    rightPupilRef.current.position.y = lookY;

    // React to smile - eyes squint
    if (leftEyeRef.current && rightEyeRef.current) {
      const squint = 1 - (faceData.smile * 0.3);
      leftEyeRef.current.scale.y = squint;
      rightEyeRef.current.scale.y = squint;
    }

    // Listening glow
    if (isListening && leftEyeRef.current && rightEyeRef.current) {
      const glow = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
      (leftEyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
      (rightEyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
    }
  });

  return (
    <group position={[0, 0.5, 0]}>
      {/* Left Eye */}
      <mesh ref={leftEyeRef} position={[-0.4, 0, 0.5]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={isListening ? "#00ff88" : "#ffffff"}
          emissiveIntensity={0.5}
        />
        <mesh ref={leftPupilRef} position={[0, 0, 0.2]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </mesh>

      {/* Right Eye */}
      <mesh ref={rightEyeRef} position={[0.4, 0, 0.5]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive={isListening ? "#00ff88" : "#ffffff"}
          emissiveIntensity={0.5}
        />
        <mesh ref={rightPupilRef} position={[0, 0, 0.2]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </mesh>
    </group>
  );
}

function Eyebrows({ faceData }: { faceData: FaceData }) {
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!leftBrowRef.current || !rightBrowRef.current) return;
    
    // Raise eyebrows based on user expression
    const raiseAmount = faceData.eyebrowRaise * 0.3;
    leftBrowRef.current.position.y = 0.8 + raiseAmount;
    rightBrowRef.current.position.y = 0.8 + raiseAmount;
  });

  return (
    <group>
      <mesh ref={leftBrowRef} position={[-0.4, 0.8, 0.5]}>
        <boxGeometry args={[0.4, 0.08, 0.05]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh ref={rightBrowRef} position={[0.4, 0.8, 0.5]}>
        <boxGeometry args={[0.4, 0.08, 0.05]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </group>
  );
}

function Mouth({ isSpeaking, faceData }: { isSpeaking: boolean; faceData: FaceData }) {
  const mouthRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!mouthRef.current) return;

    if (isSpeaking) {
      // Lip sync when speaking
      const openAmount = Math.abs(Math.sin(Date.now() * 0.015)) * 0.3 + 0.1;
      mouthRef.current.scale.y = openAmount;
    } else {
      // Mirror user's mouth
      const userMouthOpen = faceData.mouthOpen;
      mouthRef.current.scale.y = 0.15 + userMouthOpen * 0.3;
      
      // Smile reaction
      const smileWidth = 1 + faceData.smile * 0.5;
      mouthRef.current.scale.x = smileWidth;
    }
  });

  return (
    <mesh ref={mouthRef} position={[0, -0.3, 0.5]}>
      <boxGeometry args={[0.6, 0.2, 0.1]} />
      <meshStandardMaterial 
        color="#ff3366"
        emissive="#ff0044"
        emissiveIntensity={isSpeaking ? 0.5 : 0.2}
      />
    </mesh>
  );
}

function Head({ isListening, isSpeaking, faceData }: { isListening: boolean; isSpeaking: boolean; faceData: FaceData }) {
  const headRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!headRef.current) return;

    // Track face with head rotation
    headRef.current.rotation.y = faceData.position.x * 0.4;
    headRef.current.rotation.x = -faceData.position.y * 0.3;

    // React to hand raise - nod
    if (faceData.handRaised) {
      headRef.current.rotation.x = Math.sin(Date.now() * 0.01) * 0.2;
    }

    // Listening animation
    if (isListening) {
      headRef.current.position.y = Math.sin(Date.now() * 0.002) * 0.05;
    }
  });

  return (
    <group ref={headRef}>
      {/* Head */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.8, 1]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Head glow */}
      <mesh position={[0, 0, 0]} scale={1.05}>
        <boxGeometry args={[1.5, 1.8, 1]} />
        <meshStandardMaterial 
          color={faceData.handRaised ? "#ffaa00" : (isListening ? "#00ff88" : "#6366f1")}
          transparent
          opacity={0.1}
          emissive={faceData.handRaised ? "#ffaa00" : (isListening ? "#00ff88" : "#6366f1")}
          emissiveIntensity={0.5}
        />
      </mesh>

      <Eyebrows faceData={faceData} />
      <Eyes isListening={isListening} faceData={faceData} />
      <Mouth isSpeaking={isSpeaking} faceData={faceData} />

      {/* Antenna */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color={faceData.handRaised ? "#ffaa00" : (isListening ? "#00ff88" : "#6366f1")}
          emissive={faceData.handRaised ? "#ffaa00" : (isListening ? "#00ff88" : "#6366f1")}
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}

export default function RobotFace({ isListening, isSpeaking }: RobotFaceProps) {
  const [faceData, setFaceData] = useState<FaceData>({
    position: { x: 0, y: 0 },
    mouthOpen: 0,
    eyebrowRaise: 0,
    smile: 0,
    handRaised: false,
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let camera: MediaPipeCamera | null = null;

    const startTracking = async () => {
      if (!videoRef.current) return;

      try {
        // Face Mesh for facial expressions
        const faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
            const landmarks = results.multiFaceLandmarks[0];
            
            // Face position (nose tip)
            const nose = landmarks[1];
            const posX = (nose.x - 0.5) * 2;
            const posY = (nose.y - 0.5) * 2;

            // Mouth open (distance between upper and lower lip)
            const upperLip = landmarks[13];
            const lowerLip = landmarks[14];
            const mouthOpen = Math.abs(upperLip.y - lowerLip.y) * 10;

            // Eyebrow raise (distance from eye to eyebrow)
            const leftEye = landmarks[159];
            const leftBrow = landmarks[70];
            const eyebrowRaise = Math.abs(leftBrow.y - leftEye.y) * 20;

            // Smile (mouth corners)
            const leftMouth = landmarks[61];
            const rightMouth = landmarks[291];
            const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
            const smile = Math.max(0, (mouthWidth - 0.15) * 5);

            setFaceData(prev => ({
              ...prev,
              position: { x: posX, y: posY },
              mouthOpen: Math.min(mouthOpen, 1),
              eyebrowRaise: Math.min(eyebrowRaise, 1),
              smile: Math.min(smile, 1),
            }));
          }
        });

        // Hand tracking
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const hand = results.multiHandLandmarks[0];
            const wrist = hand[0];
            
            // Hand raised if wrist is in upper half
            const handRaised = wrist.y < 0.5;
            
            setFaceData(prev => ({
              ...prev,
              handRaised
            }));
          } else {
            setFaceData(prev => ({
              ...prev,
              handRaised: false
            }));
          }
        });

        // Start camera
        camera = new MediaPipeCamera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await faceMesh.send({ image: videoRef.current });
              await hands.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        camera.start();
      } catch (error) {
        console.log('Camera/MediaPipe error:', error);
      }
    };

    startTracking();

    return () => {
      if (camera) {
        camera.stop();
      }
    };
  }, []);

  return (
    <div className="relative w-[400px] h-[400px]">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
        
        <Head isListening={isListening} isSpeaking={isSpeaking} faceData={faceData} />
      </Canvas>
      
      {/* Hidden video for tracking */}
      <video ref={videoRef} className="hidden" />
      
      {/* Debug info */}
      <div className="absolute bottom-2 left-2 text-xs text-white/50 space-y-1">
        <div>👁️ Eyes: {faceData.position.x.toFixed(2)}, {faceData.position.y.toFixed(2)}</div>
        <div>😮 Mouth: {(faceData.mouthOpen * 100).toFixed(0)}%</div>
        <div>😊 Smile: {(faceData.smile * 100).toFixed(0)}%</div>
        <div>🤚 Hand: {faceData.handRaised ? 'Raised' : 'Down'}</div>
      </div>
    </div>
  );
}
