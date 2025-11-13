import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface AnimatedSphereProps {
  isListening: boolean;
}

function AnimatedSphere({ isListening }: AnimatedSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 100, 100]} scale={isListening ? 1.2 : 1}>
      <MeshDistortMaterial
        color={isListening ? '#ff0080' : '#00d9ff'}
        attach="material"
        distort={isListening ? 0.6 : 0.4}
        speed={isListening ? 3 : 1.5}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
}

interface AIOrbProps {
  isListening: boolean;
}

export default function AIOrb({ isListening }: AIOrbProps) {
  return (
    <motion.div
      animate={{
        scale: isListening ? [1, 1.05, 1] : 1,
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="relative w-80 h-80"
    >
      {/* Glow effect */}
      <div
        className={`
          absolute inset-0 rounded-full blur-3xl opacity-50
          ${isListening 
            ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
            : 'bg-gradient-to-r from-primary to-secondary'
          }
        `}
      />

      {/* 3D Orb */}
      <div className="relative w-full h-full">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7000ff" />
          <AnimatedSphere isListening={isListening} />
        </Canvas>
      </div>

      {/* Rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 border-2 border-primary/30 rounded-full"
        style={{ transform: 'scale(1.2)' }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 border-2 border-secondary/30 rounded-full"
        style={{ transform: 'scale(1.4)' }}
      />
    </motion.div>
  );
}

