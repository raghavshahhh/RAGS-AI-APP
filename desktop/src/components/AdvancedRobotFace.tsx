import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Hands } from '@mediapipe/hands';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

interface RobotFaceProps {
  isListening: boolean;
  isSpeaking: boolean;
  emotion: 'happy' | 'thinking' | 'excited' | 'curious' | 'neutral' | 'surprised';
  onProactiveMessage?: (message: string) => void;
  onContextUpdate?: (context: string) => void;
}

interface UserData {
  position: { x: number; y: number };
  distance: number;
  gesture: string;
  details: string;
  handPosition: { x: number; y: number; z: number } | null;
}

function Eyes({ isListening, userPosition }: { isListening: boolean; userPosition: { x: number; y: number } }) {
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!leftPupilRef.current || !rightPupilRef.current) return;

    // Track user position
    const lookX = userPosition.x * 0.3;
    const lookY = -userPosition.y * 0.3;
    
    leftPupilRef.current.position.x = lookX;
    leftPupilRef.current.position.y = lookY;
    rightPupilRef.current.position.x = lookX;
    rightPupilRef.current.position.y = lookY;

    // Auto blink
    const time = Date.now() * 0.003;
    if (Math.sin(time) > 0.95) {
      if (leftEyeRef.current && rightEyeRef.current) {
        leftEyeRef.current.scale.y = 0.1;
        rightEyeRef.current.scale.y = 0.1;
      }
    } else {
      if (leftEyeRef.current && rightEyeRef.current) {
        leftEyeRef.current.scale.y = 1;
        rightEyeRef.current.scale.y = 1;
      }
    }

    // Listening glow
    if (isListening && leftEyeRef.current && rightEyeRef.current) {
      const glow = Math.sin(time * 2) * 0.3 + 0.7;
      (leftEyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
      (rightEyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
    }
  });

  return (
    <group position={[0, 0.5, 0]}>
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

function Mouth({ isSpeaking, emotion }: { isSpeaking: boolean; emotion: string }) {
  const mouthRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!mouthRef.current) return;

    if (isSpeaking) {
      // Robot's own lip sync when speaking
      const time = Date.now() * 0.015;
      const openAmount = Math.abs(Math.sin(time)) * 0.4 + 0.1;
      mouthRef.current.scale.y = openAmount;
      mouthRef.current.scale.x = 1 + openAmount * 0.2;
    } else {
      // Emotion-based mouth shape
      if (emotion === 'happy' || emotion === 'excited') {
        mouthRef.current.scale.y = 0.15;
        mouthRef.current.scale.x = 1.3; // Wide smile
      } else if (emotion === 'surprised') {
        mouthRef.current.scale.y = 0.4;
        mouthRef.current.scale.x = 0.8; // Open mouth
      } else {
        mouthRef.current.scale.y = 0.15;
        mouthRef.current.scale.x = 1;
      }
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

function HandPointer({ handPosition }: { handPosition: { x: number; y: number; z: number } | null }) {
  const pointerRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!pointerRef.current || !handPosition) return;
    
    pointerRef.current.position.x = handPosition.x;
    pointerRef.current.position.y = handPosition.y;
    pointerRef.current.position.z = handPosition.z + 3;
  });

  if (!handPosition) return null;

  return (
    <mesh ref={pointerRef}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial 
        color="#ffaa00"
        emissive="#ffaa00"
        emissiveIntensity={1}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

function Head({ isListening, isSpeaking, emotion, userPosition, handPosition }: any) {
  const headRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!headRef.current) return;

    // Track user with head rotation
    headRef.current.rotation.y = userPosition.x * 0.4;
    headRef.current.rotation.x = -userPosition.y * 0.3;

    // Emotion-based head movement
    const time = Date.now() * 0.001;
    if (emotion === 'thinking') {
      headRef.current.rotation.z = Math.sin(time) * 0.05;
    } else if (emotion === 'excited') {
      headRef.current.position.y = Math.sin(time * 3) * 0.1;
    }
  });

  return (
    <group ref={headRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.8, 1]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[0, 0, 0]} scale={1.05}>
        <boxGeometry args={[1.5, 1.8, 1]} />
        <meshStandardMaterial 
          color={isListening ? "#00ff88" : "#6366f1"}
          transparent
          opacity={0.1}
          emissive={isListening ? "#00ff88" : "#6366f1"}
          emissiveIntensity={0.5}
        />
      </mesh>

      <Eyes isListening={isListening} userPosition={userPosition} />
      <Mouth isSpeaking={isSpeaking} emotion={emotion} />

      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color={isListening ? "#00ff88" : "#6366f1"}
          emissive={isListening ? "#00ff88" : "#6366f1"}
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}

export default function AdvancedRobotFace({ isListening, isSpeaking, emotion, onProactiveMessage, onContextUpdate }: RobotFaceProps) {
  const [userData, setUserData] = useState<UserData>({
    position: { x: 0, y: 0 },
    distance: 0,
    gesture: 'none',
    details: '',
    handPosition: null
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastMovementRef = useRef<number>(Date.now());
  const proactiveTimerRef = useRef<any>(null);

  useEffect(() => {
    let camera: MediaPipeCamera | null = null;

    const startTracking = async () => {
      if (!videoRef.current) return;

      try {
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
            
            const nose = landmarks[1];
            const posX = (nose.x - 0.5) * 2;
            const posY = (nose.y - 0.5) * 2;

            // Calculate distance (face size)
            const leftEye = landmarks[33];
            const rightEye = landmarks[263];
            const faceWidth = Math.abs(rightEye.x - leftEye.x);
            const distance = Math.round((1 - faceWidth) * 100);

            // Generate details
            const details = `Position: (${posX.toFixed(2)}, ${posY.toFixed(2)}), Distance: ${distance}cm`;

            setUserData(prev => ({
              ...prev,
              position: { x: posX, y: posY },
              distance,
              details
            }));
          }
        });

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
            const thumb = hand[4];
            const index = hand[8];
            const middle = hand[12];
            const wrist = hand[0];
            
            // Hand position in 3D space
            const handPos = {
              x: (index.x - 0.5) * 4,
              y: -(index.y - 0.5) * 4,
              z: index.z * 2
            };
            
            // Detect gestures (no notifications)
            let gesture = 'none';
            
            if (thumb.y < index.y && thumb.y < middle.y) {
              gesture = 'thumbs_up';
            } else if (index.y < 0.5 && middle.y < 0.5) {
              gesture = 'peace';
            } else if (index.y < 0.4) {
              gesture = 'pointing';
            }
            
            setUserData(prev => ({
              ...prev,
              gesture,
              handPosition: handPos
            }));

            // Track movement
            lastMovementRef.current = Date.now();

            // Send context update
            if (onContextUpdate) {
              const context = `Gesture: ${gesture}, Hand active`;
              onContextUpdate(context);
            }
          } else {
            setUserData(prev => ({
              ...prev,
              gesture: 'none',
              handPosition: null
            }));
          }
        });

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
        console.log('Tracking error:', error);
      }
    };

    startTracking();

    // Proactive behavior timer
    proactiveTimerRef.current = setInterval(() => {
      const timeSinceMovement = Date.now() - lastMovementRef.current;
      
      // Ask proactive question every 30 seconds if user is active
      if (timeSinceMovement < 5000 && onProactiveMessage) {
        const questions = [
          'Sir, kya kar rahe ho? Kuch help chahiye?',
          'Koi kaam hai? Main ready hoon.',
          'Kuch sochne mein help karu?',
        ];
        const randomQ = questions[Math.floor(Math.random() * questions.length)];
        onProactiveMessage(randomQ);
      }
    }, 30000);

    return () => {
      if (camera) {
        camera.stop();
      }
      if (proactiveTimerRef.current) {
        clearInterval(proactiveTimerRef.current);
      }
    };
  }, [onProactiveMessage, onContextUpdate]);

  return (
    <div className="relative w-[400px] h-[400px]">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
        
        <Head 
          isListening={isListening} 
          isSpeaking={isSpeaking} 
          emotion={emotion}
          userPosition={userData.position}
          handPosition={userData.handPosition}
        />
        
        <HandPointer handPosition={userData.handPosition} />
      </Canvas>
      
      <video ref={videoRef} className="hidden" />
      
      {/* User tracking info */}
      <div className="absolute bottom-2 left-2 text-xs text-white/70 bg-black/80 px-3 py-2 rounded-lg space-y-1">
        <div>📍 {userData.details}</div>
        {userData.gesture !== 'none' && (
          <div className="text-yellow-400">
            {userData.gesture === 'thumbs_up' && '👍 Thumbs Up'}
            {userData.gesture === 'peace' && '✌️ Peace Sign'}
            {userData.gesture === 'pointing' && '👉 Pointing'}
          </div>
        )}
        {userData.handPosition && (
          <div className="text-orange-400">🤚 Hand Tracked</div>
        )}
      </div>
    </div>
  );
}
