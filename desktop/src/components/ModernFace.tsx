import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Emotion = 'neutral' | 'happy' | 'thinking' | 'angry' | 'sleepy' | 'excited' | 'sad' | 'surprised' | 'curious';

interface ModernFaceProps {
  emotion?: Emotion;
  isSpeaking?: boolean;
  audioLevel?: number; // 0-1 for voice amplitude
}

const emotionColors = {
  neutral: { primary: '#00d9ff', secondary: '#0088ff', glow: '#00d9ff40' },
  happy: { primary: '#00ff88', secondary: '#00cc66', glow: '#00ff8840' },
  thinking: { primary: '#8800ff', secondary: '#6600cc', glow: '#8800ff40' },
  angry: { primary: '#ff0044', secondary: '#cc0033', glow: '#ff004440' },
  sleepy: { primary: '#4488ff', secondary: '#3366cc', glow: '#4488ff40' },
  excited: { primary: '#ff8800', secondary: '#ffaa00', glow: '#ff880040' },
  sad: { primary: '#4444ff', secondary: '#3333cc', glow: '#4444ff40' },
  surprised: { primary: '#ffff00', secondary: '#ffcc00', glow: '#ffff0040' },
  curious: { primary: '#00ffff', secondary: '#00cccc', glow: '#00ffff40' },
};

export default function ModernFace({ 
  emotion = 'neutral', 
  isSpeaking = false,
  audioLevel = 0 
}: ModernFaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blinkState, setBlinkState] = useState(1); // 1 = open, 0 = closed
  
  const colors = emotionColors[emotion];

  // Natural blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkState(0);
      setTimeout(() => setBlinkState(1), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Canvas rendering for reactive face
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    let animationFrame: number;
    let time = 0;

    const render = () => {
      time += 0.016;
      
      // Clear canvas
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, width, height);

      // Calculate pulse based on audio or idle
      const pulse = isSpeaking 
        ? 1 + audioLevel * 0.3 
        : 1 + Math.sin(time * 2) * 0.05;

      // Draw outer glow
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 80,
        centerX, centerY, 200
      );
      gradient.addColorStop(0, colors.glow);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw face outline (half-digital grid)
      ctx.strokeStyle = colors.primary + '40';
      ctx.lineWidth = 1;
      for (let i = -5; i <= 5; i++) {
        const offset = i * 30;
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(centerX + offset, centerY - 150);
        ctx.lineTo(centerX + offset, centerY + 150);
        ctx.stroke();
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(centerX - 150, centerY + offset);
        ctx.lineTo(centerX + 150, centerY + offset);
        ctx.stroke();
      }

      // Draw energy core (center)
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, 40 * pulse
      );
      coreGradient.addColorStop(0, colors.primary);
      coreGradient.addColorStop(0.5, colors.secondary);
      coreGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Draw eyes
      drawEye(ctx, centerX - 60, centerY - 30, pulse, blinkState);
      drawEye(ctx, centerX + 60, centerY - 30, pulse, blinkState);

      // Draw mouth/voice visualizer when speaking
      if (isSpeaking) {
        drawVoiceWave(ctx, centerX, centerY + 60, audioLevel, time);
      } else {
        drawMouth(ctx, centerX, centerY + 60, emotion);
      }

      // Draw scan lines
      ctx.strokeStyle = colors.primary + '20';
      ctx.lineWidth = 2;
      const scanY = (time * 100) % height;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      animationFrame = requestAnimationFrame(render);
    };

    const drawEye = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      pulse: number,
      blink: number
    ) => {
      const eyeHeight = 40 * blink; // Blink effect
      const eyeWidth = 30 * pulse;

      // Eye glow
      const eyeGradient = ctx.createRadialGradient(x, y, 0, x, y, eyeWidth);
      eyeGradient.addColorStop(0, colors.primary);
      eyeGradient.addColorStop(0.6, colors.secondary);
      eyeGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = eyeGradient;
      ctx.beginPath();
      ctx.ellipse(x, y, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye iris
      ctx.fillStyle = colors.primary;
      ctx.beginPath();
      ctx.ellipse(x, y, eyeWidth * 0.6, eyeHeight * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye pupil
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x, y, eyeWidth * 0.3, eyeHeight * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawMouth = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      emotion: Emotion
    ) => {
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();

      switch (emotion) {
        case 'happy':
        case 'excited':
          // Smile
          ctx.arc(x, y - 10, 40, 0.2, Math.PI - 0.2);
          break;
        case 'sad':
          // Frown
          ctx.arc(x, y + 20, 40, Math.PI + 0.2, Math.PI * 2 - 0.2);
          break;
        case 'angry':
          // Angry line
          ctx.moveTo(x - 40, y);
          ctx.lineTo(x + 40, y);
          break;
        case 'thinking':
          // Wavy line
          for (let i = -40; i <= 40; i += 5) {
            const yOffset = Math.sin((i / 40) * Math.PI * 2) * 5;
            if (i === -40) ctx.moveTo(x + i, y + yOffset);
            else ctx.lineTo(x + i, y + yOffset);
          }
          break;
        default:
          // Neutral line
          ctx.moveTo(x - 30, y);
          ctx.lineTo(x + 30, y);
      }
      ctx.stroke();
    };

    const drawVoiceWave = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      level: number,
      time: number
    ) => {
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();

      const waveWidth = 80;
      const waveHeight = 20 + level * 30;

      for (let i = -waveWidth; i <= waveWidth; i += 2) {
        const yOffset = Math.sin((i / 20 + time * 5)) * waveHeight * level;
        if (i === -waveWidth) {
          ctx.moveTo(x + i, y + yOffset);
        } else {
          ctx.lineTo(x + i, y + yOffset);
        }
      }
      ctx.stroke();
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [emotion, isSpeaking, audioLevel, blinkState, colors]);

  return (
    <motion.div
      animate={{
        scale: isSpeaking ? [1, 1.02, 1] : 1,
      }}
      transition={{
        duration: 0.3,
        repeat: isSpeaking ? Infinity : 0,
      }}
      className="relative w-[500px] h-[500px]"
    >
      {/* Outer glow rings */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ 
          background: `radial-gradient(circle, ${colors.glow}, transparent)`,
        }}
      />

      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="relative z-10"
      />

      {/* Scan line overlay */}
      <motion.div
        animate={{ y: [-500, 500] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(transparent, ${colors.primary}20, transparent)`,
          height: '100px',
        }}
      />

      {/* Corner brackets (Jarvis-style) */}
      <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 opacity-30"
        style={{ borderColor: colors.primary }}
      />
      <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 opacity-30"
        style={{ borderColor: colors.primary }}
      />
      <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 opacity-30"
        style={{ borderColor: colors.primary }}
      />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 opacity-30"
        style={{ borderColor: colors.primary }}
      />

      {/* Emotion indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 
                   px-4 py-1 rounded-full text-xs uppercase tracking-widest"
        style={{ 
          background: colors.glow,
          color: colors.primary,
          border: `1px solid ${colors.primary}40`
        }}
      >
        {emotion}
      </motion.div>
    </motion.div>
  );
}

// Emotion control API
export class EmotionController {
  private emotion: Emotion = 'neutral';
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
