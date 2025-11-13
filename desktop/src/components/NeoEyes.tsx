import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Emotion = 'calm' | 'curious' | 'angry' | 'happy' | 'thinking' | 'neutral';

interface NeoEyesProps {
  emotion?: Emotion;
  isSpeaking?: boolean;
  audioLevel?: number; // 0-1 for voice amplitude
}

// Emotion → Eye Color Mapping
const emotionColors = {
  calm: '#00d9ff',      // Cyan
  curious: '#ffffff',   // White
  angry: '#ff6600',     // Orange
  happy: '#0099ff',     // Blue
  thinking: '#9966ff',  // Purple
  neutral: '#00d9ff',   // Cyan (default)
};

export default function NeoEyes({ 
  emotion = 'calm', 
  isSpeaking = false,
  audioLevel = 0 
}: NeoEyesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blinkState, setBlinkState] = useState(1); // 1 = open, 0 = closed
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 }); // Eye movement
  
  const eyeColor = emotionColors[emotion];

  // Eye movement based on emotion and audio
  useEffect(() => {
    let moveInterval: NodeJS.Timeout;
    
    if (isSpeaking) {
      // Move eyes while speaking
      moveInterval = setInterval(() => {
        setEyePosition({
          x: (Math.random() - 0.5) * 15,
          y: (Math.random() - 0.5) * 20 // More vertical movement
        });
      }, 200);
    } else {
      // Gentle idle movement
      moveInterval = setInterval(() => {
        setEyePosition({
          x: Math.sin(Date.now() / 2000) * 8,
          y: Math.sin(Date.now() / 1500) * 12 // Vertical sine wave
        });
      }, 50);
    }

    return () => clearInterval(moveInterval);
  }, [isSpeaking, emotion]);

  // Natural blinking - slower for curious emotion
  useEffect(() => {
    const blinkDelay = emotion === 'curious' ? 5000 : 3000;
    const blinkInterval = setInterval(() => {
      setBlinkState(0);
      setTimeout(() => setBlinkState(1), 150);
    }, blinkDelay + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [emotion]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    
    // Eye positions with movement
    const leftEyeX = width * 0.35 + eyePosition.x;
    const rightEyeX = width * 0.65 + eyePosition.x;

    let animationFrame: number;
    let time = 0;

    const render = () => {
      time += 0.016;
      
      // Clear with pure black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Calculate intensity based on audio or emotion
      const baseIntensity = emotion === 'angry' ? 1.3 : 1.0;
      const intensity = isSpeaking 
        ? baseIntensity + audioLevel * 0.5 
        : baseIntensity + Math.sin(time * 1.5) * 0.15;

      // Bounce effect for happy + eye movement
      const bounceY = emotion === 'happy' 
        ? Math.sin(time * 3) * 8 
        : 0;
      
      const eyeY = centerY + bounceY + eyePosition.y;

      // Draw eyes
      drawEye(ctx, leftEyeX, eyeY, intensity, blinkState, eyeColor);
      drawEye(ctx, rightEyeX, eyeY, intensity, blinkState, eyeColor);

      animationFrame = requestAnimationFrame(render);
    };

    const drawEye = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      intensity: number,
      blink: number,
      color: string
    ) => {
      const eyeWidth = 50 * intensity;
      const eyeHeight = 60 * blink * intensity;

      // Outer glow (largest)
      const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, eyeWidth * 2.5);
      outerGlow.addColorStop(0, color + '40');
      outerGlow.addColorStop(0.3, color + '20');
      outerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.ellipse(x, y, eyeWidth * 2.5, eyeHeight * 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Middle glow
      const middleGlow = ctx.createRadialGradient(x, y, 0, x, y, eyeWidth * 1.5);
      middleGlow.addColorStop(0, color + '80');
      middleGlow.addColorStop(0.5, color + '40');
      middleGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = middleGlow;
      ctx.beginPath();
      ctx.ellipse(x, y, eyeWidth * 1.5, eyeHeight * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main eye
      const mainGlow = ctx.createRadialGradient(x, y, 0, x, y, eyeWidth);
      mainGlow.addColorStop(0, '#ffffff');
      mainGlow.addColorStop(0.3, color);
      mainGlow.addColorStop(1, color + '00');
      ctx.fillStyle = mainGlow;
      ctx.beginPath();
      ctx.ellipse(x, y, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // Core highlight
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.ellipse(x, y - 5, eyeWidth * 0.4, eyeHeight * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [emotion, isSpeaking, audioLevel, blinkState, eyeColor]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Ambient neon glow background */}
      <motion.div
        animate={{ 
          scale: isSpeaking ? [1, 1.1, 1] : [1, 1.05, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ 
          background: `radial-gradient(circle, ${eyeColor}40, transparent)`,
        }}
      />

      {/* Main canvas */}
      <motion.div
        animate={{
          scale: emotion === 'happy' ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 0.5,
          repeat: emotion === 'happy' ? Infinity : 0,
        }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          className="relative z-10"
        />
      </motion.div>

      {/* Subtle scan line effect */}
      {isSpeaking && (
        <motion.div
          animate={{ y: [-300, 300] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(transparent, ${eyeColor}15, transparent)`,
            height: '50px',
          }}
        />
      )}

      {/* Emotion label (optional, can remove) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                   text-xs uppercase tracking-widest opacity-50"
        style={{ color: eyeColor }}
      >
        {emotion}
      </motion.div>
    </div>
  );
}

// Emotion Controller (same API as before)
export class EmotionController {
  private emotion: Emotion = 'calm';
  private callbacks: Set<(emotion: Emotion) => void> = new Set();

  setEmotion(emotion: Emotion) {
    this.emotion = emotion;
    this.callbacks.forEach(cb => cb(emotion));
  }

  getEmotion(): Emotion {
    return this.emotion;
  }

  subscribe(callback: (emotion: Emotion) => void) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
}

export const emotionController = new EmotionController();
