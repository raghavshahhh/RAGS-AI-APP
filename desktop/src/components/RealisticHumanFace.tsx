/**
 * RAGS AI - Realistic 3D Human Face
 * Photorealistic human face with expressions, lip-sync, eye tracking, and emotions
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

interface RealisticHumanFaceProps {
  isListening: boolean;
  isSpeaking: boolean;
  emotion: 'happy' | 'sad' | 'surprised' | 'thinking' | 'excited' | 'curious' | 'neutral' | 'angry';
  audioData?: Float32Array; // For lip-sync
  onProactiveMessage?: (message: string) => void;
  onContextUpdate?: (context: string) => void;
}

interface FaceState {
  userPosition: { x: number; y: number };
  blinkProgress: number;
  mouthOpenness: number;
  smileAmount: number;
  eyebrowRaise: number;
  headRotation: { x: number; y: number; z: number };
  eyeRotation: { x: number; y: number };
  breathing: number;
}

// Phoneme to mouth shape mapping for lip-sync
const PHONEME_SHAPES = {
  'A': { openness: 0.8, width: 0.6, height: 0.9 },
  'E': { openness: 0.5, width: 0.8, height: 0.4 },
  'I': { openness: 0.3, width: 0.9, height: 0.3 },
  'O': { openness: 0.7, width: 0.4, height: 0.8 },
  'U': { openness: 0.6, width: 0.3, height: 0.7 },
  'M': { openness: 0.0, width: 0.5, height: 0.1 },
  'F': { openness: 0.2, width: 0.6, height: 0.2 },
  'S': { openness: 0.1, width: 0.7, height: 0.1 },
  'rest': { openness: 0.0, width: 0.5, height: 0.0 }
};

// Realistic Eye Component
function RealisticEye({ 
  position, 
  isLeft, 
  blinkProgress, 
  eyeRotation, 
  isListening,
  emotion 
}: any) {
  const eyeballRef = useRef<THREE.Mesh>(null);
  const pupilRef = useRef<THREE.Mesh>(null);
  const irisRef = useRef<THREE.Mesh>(null);
  const eyelidTopRef = useRef<THREE.Mesh>(null);
  const eyelidBottomRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!eyeballRef.current || !pupilRef.current || !irisRef.current) return;

    const time = state.clock.getElapsedTime();

    // Eye rotation (looking around)
    eyeballRef.current.rotation.y = eyeRotation.x * 0.5;
    eyeballRef.current.rotation.x = eyeRotation.y * 0.5;

    // Pupil dilation based on emotion
    let pupilSize = 0.15;
    if (emotion === 'surprised' || emotion === 'excited') pupilSize = 0.2;
    if (emotion === 'angry' || emotion === 'thinking') pupilSize = 0.12;
    pupilRef.current.scale.setScalar(pupilSize / 0.15);

    // Iris subtle movement
    const irisX = Math.sin(time * 0.5) * 0.02;
    const irisY = Math.cos(time * 0.7) * 0.02;
    irisRef.current.position.x = eyeRotation.x * 0.08 + irisX;
    irisRef.current.position.y = eyeRotation.y * 0.08 + irisY;

    // Eyelid blinking
    if (eyelidTopRef.current && eyelidBottomRef.current) {
      eyelidTopRef.current.position.y = 0.15 - blinkProgress * 0.3;
      eyelidBottomRef.current.position.y = -0.15 + blinkProgress * 0.15;
    }

    // Listening effect - subtle glow
    if (isListening && irisRef.current) {
      const glow = Math.sin(time * 3) * 0.3 + 0.7;
      (irisRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow * 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Eyeball (white) */}
      <mesh ref={eyeballRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff"
          roughness={0.3}
          metalness={0.1}
        />
        
        {/* Iris */}
        <mesh ref={irisRef} position={[0, 0, 0.25]}>
          <circleGeometry args={[0.18, 32]} />
          <meshStandardMaterial 
            color="#2563eb"
            emissive="#1e40af"
            emissiveIntensity={isListening ? 0.3 : 0.1}
            roughness={0.4}
          />
          
          {/* Pupil */}
          <mesh ref={pupilRef} position={[0, 0, 0.01]}>
            <circleGeometry args={[0.15, 32]} />
            <meshStandardMaterial 
              color="#000000"
              roughness={0.1}
            />
          </mesh>
        </mesh>
      </mesh>

      {/* Eyelids */}
      <mesh ref={eyelidTopRef} position={[0, 0.15, 0.28]}>
        <boxGeometry args={[0.65, 0.15, 0.1]} />
        <meshStandardMaterial 
          color="#f5d0c5"
          roughness={0.6}
        />
      </mesh>
      <mesh ref={eyelidBottomRef} position={[0, -0.15, 0.28]}>
        <boxGeometry args={[0.65, 0.1, 0.1]} />
        <meshStandardMaterial 
          color="#f5d0c5"
          roughness={0.6}
        />
      </mesh>

      {/* Eyelashes effect */}
      <mesh position={[0, 0.2, 0.3]}>
        <boxGeometry args={[0.7, 0.02, 0.02]} />
        <meshStandardMaterial color="#2d1810" />
      </mesh>
    </group>
  );
}

// Realistic Mouth Component with Lip-Sync
function RealisticMouth({ 
  mouthOpenness, 
  smileAmount, 
  isSpeaking, 
  emotion,
  audioData 
}: any) {
  const upperLipRef = useRef<THREE.Mesh>(null);
  const lowerLipRef = useRef<THREE.Mesh>(null);
  const teethRef = useRef<THREE.Mesh>(null);
  const tongueRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!upperLipRef.current || !lowerLipRef.current) return;

    const time = state.clock.getElapsedTime();

    // Calculate mouth shape based on speaking and emotion
    let targetOpenness = mouthOpenness;
    let mouthWidth = 1.0;
    let mouthHeight = 0.15;

    if (isSpeaking && audioData) {
      // Analyze audio for lip-sync
      const volume = Array.from(audioData).reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length;
      targetOpenness = Math.min(volume * 2, 0.8);
      
      // Simulate phoneme-based mouth shapes
      const phonemeIndex = Math.floor(time * 10) % 3;
      if (phonemeIndex === 0) { // 'A' sound
        mouthWidth = 0.6;
        mouthHeight = 0.25;
      } else if (phonemeIndex === 1) { // 'E' sound
        mouthWidth = 0.9;
        mouthHeight = 0.18;
      } else { // 'O' sound
        mouthWidth = 0.5;
        mouthHeight = 0.22;
      }
    } else {
      // Emotion-based mouth shapes
      if (emotion === 'happy' || emotion === 'excited') {
        smileAmount = 0.8;
        mouthWidth = 1.2;
      } else if (emotion === 'sad') {
        smileAmount = -0.3;
        mouthWidth = 0.8;
      } else if (emotion === 'surprised') {
        targetOpenness = 0.6;
        mouthWidth = 0.7;
        mouthHeight = 0.3;
      }
    }

    // Smooth transitions
    const currentOpenness = THREE.MathUtils.lerp(
      upperLipRef.current.position.y,
      targetOpenness * 0.3,
      0.2
    );

    // Upper lip
    upperLipRef.current.position.y = currentOpenness;
    upperLipRef.current.scale.x = mouthWidth + smileAmount * 0.3;
    upperLipRef.current.scale.y = mouthHeight;

    // Lower lip
    lowerLipRef.current.position.y = -currentOpenness - 0.1;
    lowerLipRef.current.scale.x = mouthWidth + smileAmount * 0.2;
    lowerLipRef.current.scale.y = mouthHeight;

    // Smile curve
    const smileCurve = smileAmount * 0.15;
    upperLipRef.current.rotation.z = smileCurve;
    lowerLipRef.current.rotation.z = -smileCurve * 0.5;

    // Teeth visibility
    if (teethRef.current) {
      teethRef.current.visible = targetOpenness > 0.1;
      teethRef.current.position.y = currentOpenness * 0.5 - 0.05;
    }

    // Tongue movement when speaking
    if (tongueRef.current && isSpeaking) {
      tongueRef.current.visible = targetOpenness > 0.3;
      tongueRef.current.position.y = -currentOpenness * 0.3;
      tongueRef.current.position.z = Math.sin(time * 8) * 0.05;
    }
  });

  return (
    <group position={[0, -0.6, 0.45]}>
      {/* Upper Lip */}
      <mesh ref={upperLipRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.2]} />
        <meshStandardMaterial 
          color="#d4958d"
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {/* Lower Lip */}
      <mesh ref={lowerLipRef} position={[0, -0.1, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.2]} />
        <meshStandardMaterial 
          color="#c98880"
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {/* Teeth */}
      <mesh ref={teethRef} position={[0, -0.05, -0.05]}>
        <boxGeometry args={[0.7, 0.12, 0.1]} />
        <meshStandardMaterial 
          color="#fffef0"
          roughness={0.3}
        />
      </mesh>

      {/* Tongue */}
      <mesh ref={tongueRef} position={[0, -0.15, -0.1]} visible={false}>
        <boxGeometry args={[0.5, 0.08, 0.15]} />
        <meshStandardMaterial 
          color="#d4696b"
          roughness={0.7}
        />
      </mesh>
    </group>
  );
}

// Eyebrows Component
function Eyebrows({ emotion, eyebrowRaise }: any) {
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!leftBrowRef.current || !rightBrowRef.current) return;

    let raiseAmount = eyebrowRaise;
    let browAngle = 0;

    // Emotion-based eyebrow positions
    if (emotion === 'surprised' || emotion === 'excited') {
      raiseAmount = 0.4;
    } else if (emotion === 'angry') {
      raiseAmount = -0.2;
      browAngle = -0.3;
    } else if (emotion === 'sad') {
      raiseAmount = 0.1;
      browAngle = 0.2;
    } else if (emotion === 'thinking') {
      raiseAmount = 0.15;
      browAngle = 0.1;
    }

    leftBrowRef.current.position.y = 0.85 + raiseAmount;
    rightBrowRef.current.position.y = 0.85 + raiseAmount;

    leftBrowRef.current.rotation.z = browAngle;
    rightBrowRef.current.rotation.z = -browAngle;
  });

  return (
    <group>
      {/* Left Eyebrow */}
      <mesh ref={leftBrowRef} position={[-0.35, 0.85, 0.45]}>
        <boxGeometry args={[0.5, 0.08, 0.08]} />
        <meshStandardMaterial color="#3d2817" />
      </mesh>

      {/* Right Eyebrow */}
      <mesh ref={rightBrowRef} position={[0.35, 0.85, 0.45]}>
        <boxGeometry args={[0.5, 0.08, 0.08]} />
        <meshStandardMaterial color="#3d2817" />
      </mesh>
    </group>
  );
}

// Realistic Head Component
function RealisticHead({
  faceState,
  isListening,
  isSpeaking,
  emotion,
  audioData
}: any) {
  const headRef = useRef<THREE.Group>(null);
  const noseRef = useRef<THREE.Mesh>(null);
  const cheekLeftRef = useRef<THREE.Mesh>(null);
  const cheekRightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!headRef.current) return;

    const time = state.clock.getElapsedTime();

    // Natural head movement - tracking user
    headRef.current.rotation.y = THREE.MathUtils.lerp(
      headRef.current.rotation.y,
      faceState.userPosition.x * 0.5,
      0.05
    );
    headRef.current.rotation.x = THREE.MathUtils.lerp(
      headRef.current.rotation.x,
      -faceState.userPosition.y * 0.4,
      0.05
    );

    // Breathing animation
    const breathingOffset = Math.sin(time * 0.5) * 0.02;
    headRef.current.position.y = breathingOffset;
    headRef.current.scale.y = 1 + breathingOffset * 0.5;

    // Emotion-based head tilts
    if (emotion === 'thinking') {
      headRef.current.rotation.z = Math.sin(time * 0.8) * 0.08;
    } else if (emotion === 'curious') {
      headRef.current.rotation.z = 0.15;
    } else if (emotion === 'excited') {
      headRef.current.position.y = breathingOffset + Math.sin(time * 3) * 0.05;
    }

    // Listening - subtle nod
    if (isListening) {
      const nod = Math.sin(time * 2) * 0.03;
      headRef.current.rotation.x += nod;
    }

    // Cheek movement when smiling
    if (cheekLeftRef.current && cheekRightRef.current) {
      const smileInfluence = faceState.smileAmount * 0.1;
      cheekLeftRef.current.position.y = 0.2 + smileInfluence;
      cheekRightRef.current.position.y = 0.2 + smileInfluence;
    }
  });

  return (
    <group ref={headRef}>
      {/* Head/Face - Realistic skin tone */}
      <mesh>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial
          color="#f5d0c5"
          roughness={0.6}
          metalness={0.05}
          emissive={isListening ? "#ffd4c8" : "#000000"}
          emissiveIntensity={isListening ? 0.1 : 0}
        />
      </mesh>

      {/* Forehead highlight */}
      <mesh position={[0, 0.6, 0.8]} scale={[0.8, 0.3, 0.2]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#ffe8dc"
          transparent
          opacity={0.3}
          roughness={0.2}
        />
      </mesh>

      {/* Nose */}
      <mesh ref={noseRef} position={[0, 0.1, 1.0]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial
          color="#f0c4b8"
          roughness={0.5}
        />
      </mesh>

      {/* Nose bridge */}
      <mesh position={[0, 0.4, 0.95]}>
        <boxGeometry args={[0.12, 0.5, 0.15]} />
        <meshStandardMaterial
          color="#f0c4b8"
          roughness={0.5}
        />
      </mesh>

      {/* Cheeks */}
      <mesh ref={cheekLeftRef} position={[-0.5, 0.2, 0.7]} scale={[0.4, 0.4, 0.3]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#ffd4c8"
          roughness={0.6}
        />
      </mesh>
      <mesh ref={cheekRightRef} position={[0.5, 0.2, 0.7]} scale={[0.4, 0.4, 0.3]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#ffd4c8"
          roughness={0.6}
        />
      </mesh>

      {/* Chin */}
      <mesh position={[0, -0.8, 0.6]} scale={[0.6, 0.4, 0.5]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#f0c4b8"
          roughness={0.6}
        />
      </mesh>

      {/* Ears */}
      <mesh position={[-1.0, 0.2, 0]} rotation={[0, 0, -0.3]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color="#f0c4b8"
          roughness={0.7}
        />
      </mesh>
      <mesh position={[1.0, 0.2, 0]} rotation={[0, 0, 0.3]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color="#f0c4b8"
          roughness={0.7}
        />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 0.9, 0]} scale={[1.3, 0.6, 1.2]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#2d1810"
          roughness={0.8}
        />
      </mesh>

      {/* Neck */}
      <mesh position={[0, -1.3, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.6, 32]} />
        <meshStandardMaterial
          color="#f0c4b8"
          roughness={0.6}
        />
      </mesh>

      {/* Add facial features */}
      <RealisticEye
        position={[-0.35, 0.5, 0.8]}
        isLeft={true}
        blinkProgress={faceState.blinkProgress}
        eyeRotation={faceState.eyeRotation}
        isListening={isListening}
        emotion={emotion}
      />
      <RealisticEye
        position={[0.35, 0.5, 0.8]}
        isLeft={false}
        blinkProgress={faceState.blinkProgress}
        eyeRotation={faceState.eyeRotation}
        isListening={isListening}
        emotion={emotion}
      />

      <Eyebrows emotion={emotion} eyebrowRaise={faceState.eyebrowRaise} />

      <RealisticMouth
        mouthOpenness={faceState.mouthOpenness}
        smileAmount={faceState.smileAmount}
        isSpeaking={isSpeaking}
        emotion={emotion}
        audioData={audioData}
      />
    </group>
  );
}

// Main Realistic Human Face Component
export default function RealisticHumanFace({
  isListening,
  isSpeaking,
  emotion,
  audioData,
  onProactiveMessage,
  onContextUpdate
}: RealisticHumanFaceProps) {
  const [faceState, setFaceState] = useState<FaceState>({
    userPosition: { x: 0, y: 0 },
    blinkProgress: 0,
    mouthOpenness: 0,
    smileAmount: 0,
    eyebrowRaise: 0,
    headRotation: { x: 0, y: 0, z: 0 },
    eyeRotation: { x: 0, y: 0 },
    breathing: 0
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const blinkTimerRef = useRef<number>(0);
  const lastBlinkRef = useRef<number>(Date.now());
  const saccadeTimerRef = useRef<number>(0);
  const lastSaccadeRef = useRef<number>(Date.now());

  // Natural blinking system
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      const timeSinceLastBlink = Date.now() - lastBlinkRef.current;
      const shouldBlink = timeSinceLastBlink > 2000 + Math.random() * 3000;

      if (shouldBlink) {
        lastBlinkRef.current = Date.now();

        // Blink animation
        let progress = 0;
        const blinkAnim = setInterval(() => {
          progress += 0.2;
          if (progress <= 1) {
            setFaceState(prev => ({
              ...prev,
              blinkProgress: Math.sin(progress * Math.PI)
            }));
          } else {
            clearInterval(blinkAnim);
            setFaceState(prev => ({ ...prev, blinkProgress: 0 }));
          }
        }, 16);
      }
    }, 100);

    return () => clearInterval(blinkInterval);
  }, []);

  // Saccadic eye movements (natural eye micro-movements)
  useEffect(() => {
    const saccadeInterval = setInterval(() => {
      const timeSinceLastSaccade = Date.now() - lastSaccadeRef.current;
      const shouldSaccade = timeSinceLastSaccade > 500 + Math.random() * 1500;

      if (shouldSaccade && !isListening) {
        lastSaccadeRef.current = Date.now();

        const targetX = (Math.random() - 0.5) * 0.4;
        const targetY = (Math.random() - 0.5) * 0.3;

        setFaceState(prev => ({
          ...prev,
          eyeRotation: { x: targetX, y: targetY }
        }));

        // Return to center after a moment
        setTimeout(() => {
          setFaceState(prev => ({
            ...prev,
            eyeRotation: { x: 0, y: 0 }
          }));
        }, 200 + Math.random() * 300);
      }
    }, 100);

    return () => clearInterval(saccadeInterval);
  }, [isListening]);

  // User face tracking with MediaPipe
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

            // Get nose position for head tracking
            const nose = landmarks[1];
            const posX = (nose.x - 0.5) * 2;
            const posY = (nose.y - 0.5) * 2;

            // Calculate smile (mouth corners)
            const leftMouth = landmarks[61];
            const rightMouth = landmarks[291];
            const mouthTop = landmarks[13];
            const mouthBottom = landmarks[14];

            const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
            const mouthHeight = Math.abs(mouthBottom.y - mouthTop.y);
            const smileAmount = (mouthWidth - 0.15) * 3;

            // Calculate eyebrow raise
            const leftEyebrow = landmarks[70];
            const leftEye = landmarks[159];
            const eyebrowDistance = Math.abs(leftEyebrow.y - leftEye.y);
            const eyebrowRaise = (eyebrowDistance - 0.03) * 10;

            setFaceState(prev => ({
              ...prev,
              userPosition: { x: posX, y: posY },
              smileAmount: Math.max(0, Math.min(1, smileAmount)),
              eyebrowRaise: Math.max(0, Math.min(1, eyebrowRaise)),
              eyeRotation: { x: posX * 0.5, y: posY * 0.5 }
            }));

            // Send context updates
            if (onContextUpdate) {
              const context = `User detected at (${posX.toFixed(2)}, ${posY.toFixed(2)})`;
              onContextUpdate(context);
            }
          }
        });

        camera = new MediaPipeCamera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await faceMesh.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        camera.start();
      } catch (error) {
        console.log('Face tracking error:', error);
      }
    };

    startTracking();

    return () => {
      if (camera) {
        camera.stop();
      }
    };
  }, [onContextUpdate]);

  // Update mouth based on speaking
  useEffect(() => {
    if (isSpeaking) {
      const speakingInterval = setInterval(() => {
        const randomOpenness = Math.random() * 0.6 + 0.2;
        setFaceState(prev => ({
          ...prev,
          mouthOpenness: randomOpenness
        }));
      }, 100);

      return () => clearInterval(speakingInterval);
    } else {
      setFaceState(prev => ({ ...prev, mouthOpenness: 0 }));
    }
  }, [isSpeaking]);

  // Emotion-based automatic expressions
  useEffect(() => {
    let smileAmount = 0;
    let eyebrowRaise = 0;

    switch (emotion) {
      case 'happy':
        smileAmount = 0.8;
        eyebrowRaise = 0.2;
        break;
      case 'excited':
        smileAmount = 1.0;
        eyebrowRaise = 0.5;
        break;
      case 'surprised':
        smileAmount = 0.3;
        eyebrowRaise = 0.9;
        break;
      case 'sad':
        smileAmount = -0.2;
        eyebrowRaise = 0.1;
        break;
      case 'thinking':
        smileAmount = 0.1;
        eyebrowRaise = 0.3;
        break;
      case 'curious':
        smileAmount = 0.4;
        eyebrowRaise = 0.4;
        break;
      case 'angry':
        smileAmount = -0.3;
        eyebrowRaise = -0.2;
        break;
      default:
        smileAmount = 0;
        eyebrowRaise = 0;
    }

    setFaceState(prev => ({
      ...prev,
      smileAmount: prev.smileAmount * 0.3 + smileAmount * 0.7,
      eyebrowRaise: prev.eyebrowRaise * 0.3 + eyebrowRaise * 0.7
    }));
  }, [emotion]);

  return (
    <div className="relative w-[500px] h-[500px]">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        shadows
      >
        {/* Lighting setup for realistic skin */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
        />
        <pointLight position={[-5, 3, -5]} intensity={0.3} color="#ffd4c8" />
        <pointLight position={[0, -3, 2]} intensity={0.2} color="#a8c5ff" />

        {/* Rim light for depth */}
        <pointLight position={[0, 0, -5]} intensity={0.4} color="#ffffff" />

        {/* The realistic human head */}
        <RealisticHead
          faceState={faceState}
          isListening={isListening}
          isSpeaking={isSpeaking}
          emotion={emotion}
          audioData={audioData}
        />

        {/* Subtle fog for atmosphere */}
        <fog attach="fog" args={['#0a0a0f', 8, 15]} />
      </Canvas>

      {/* Hidden video for face tracking */}
      <video ref={videoRef} className="hidden" />

      {/* Status overlay */}
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        {/* Emotion indicator */}
        <div className="glass px-4 py-2 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Emotion:</span>
            <span className="text-primary font-semibold capitalize">{emotion}</span>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex gap-2">
          {isListening && (
            <div className="glass px-3 py-1 rounded-full border border-green-500/30 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">Listening</span>
            </div>
          )}
          {isSpeaking && (
            <div className="glass px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-blue-400">Speaking</span>
            </div>
          )}
        </div>

        {/* User tracking info */}
        {faceState.userPosition.x !== 0 && (
          <div className="glass px-3 py-1 rounded-lg border border-primary/20">
            <span className="text-xs text-muted">
              👤 User tracked: ({faceState.userPosition.x.toFixed(2)}, {faceState.userPosition.y.toFixed(2)})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

