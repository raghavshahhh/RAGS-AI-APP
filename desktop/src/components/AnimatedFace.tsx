/**
 * 3D Animated Face Component
 * Modern face with emotions, eyebrow movements, eye tracking
 */

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedFaceProps {
  emotion?: 'neutral' | 'happy' | 'thinking' | 'speaking' | 'listening';
  isListening?: boolean;
  isSpeaking?: boolean;
}

export const AnimatedFace: React.FC<AnimatedFaceProps> = ({
  emotion = 'neutral',
  isListening = false,
  isSpeaking = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [blinkTimer, setBlinkTimer] = useState(0);
  const animationRef = useRef<number>();

  // Track mouse for eye movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      
      setMousePos({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let isBlinking = false;
    let blinkFrame = 0;

    const animate = () => {
      frame++;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Center point
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      // Blink logic
      if (frame % 180 === 0) {
        isBlinking = true;
        blinkFrame = 0;
      }
      if (isBlinking) {
        blinkFrame++;
        if (blinkFrame > 10) isBlinking = false;
      }

      // Draw face
      drawFace(ctx, cx, cy, frame, isBlinking, emotion, isSpeaking, isListening);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [emotion, isSpeaking, isListening, mousePos]);

  const drawFace = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    frame: number,
    isBlinking: boolean,
    emotion: string,
    isSpeaking: boolean,
    isListening: boolean
  ) => {
    // Face glow
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 150);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Head (3D sphere effect)
    const headGradient = ctx.createRadialGradient(cx - 20, cy - 20, 0, cx, cy, 100);
    headGradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
    headGradient.addColorStop(1, 'rgba(99, 102, 241, 0.6)');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, 100, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows
    drawEyebrows(ctx, cx, cy, emotion, frame);

    // Eyes
    drawEyes(ctx, cx, cy, isBlinking, mousePos, isListening);

    // Mouth
    drawMouth(ctx, cx, cy, emotion, isSpeaking, frame);

    // Listening indicator
    if (isListening) {
      drawListeningWaves(ctx, cx, cy, frame);
    }

    // Speaking indicator
    if (isSpeaking) {
      drawSpeakingWaves(ctx, cx, cy, frame);
    }
  };

  const drawEyebrows = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    emotion: string,
    frame: number
  ) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    let leftY = cy - 40;
    let rightY = cy - 40;
    let curve = 0;

    // Emotion-based eyebrow positions
    switch (emotion) {
      case 'happy':
        curve = 5;
        break;
      case 'thinking':
        leftY -= 5;
        curve = -3;
        break;
      case 'speaking':
        curve = Math.sin(frame * 0.1) * 2;
        break;
    }

    // Left eyebrow
    ctx.beginPath();
    ctx.moveTo(cx - 50, leftY);
    ctx.quadraticCurveTo(cx - 30, leftY + curve, cx - 10, leftY);
    ctx.stroke();

    // Right eyebrow
    ctx.beginPath();
    ctx.moveTo(cx + 10, rightY);
    ctx.quadraticCurveTo(cx + 30, rightY + curve, cx + 50, rightY);
    ctx.stroke();
  };

  const drawEyes = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    isBlinking: boolean,
    mousePos: { x: number; y: number },
    isListening: boolean
  ) => {
    const eyeY = cy - 10;
    const eyeSize = isBlinking ? 2 : 12;
    const pupilSize = 6;

    // Eye tracking
    const eyeOffsetX = mousePos.x * 8;
    const eyeOffsetY = mousePos.y * 8;

    // Listening effect - eyes glow
    if (isListening) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(139, 92, 246, 0.8)';
    }

    // Left eye
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(cx - 30, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    if (!isBlinking) {
      // Left pupil
      ctx.fillStyle = 'rgba(99, 102, 241, 1)';
      ctx.beginPath();
      ctx.arc(cx - 30 + eyeOffsetX, eyeY + eyeOffsetY, pupilSize, 0, Math.PI * 2);
      ctx.fill();

      // Pupil highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(cx - 30 + eyeOffsetX - 2, eyeY + eyeOffsetY - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Right eye
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(cx + 30, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    if (!isBlinking) {
      // Right pupil
      ctx.fillStyle = 'rgba(99, 102, 241, 1)';
      ctx.beginPath();
      ctx.arc(cx + 30 + eyeOffsetX, eyeY + eyeOffsetY, pupilSize, 0, Math.PI * 2);
      ctx.fill();

      // Pupil highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(cx + 30 + eyeOffsetX - 2, eyeY + eyeOffsetY - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  };

  const drawMouth = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    emotion: string,
    isSpeaking: boolean,
    frame: number
  ) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const mouthY = cy + 30;
    let curve = 0;
    let width = 40;

    // Emotion-based mouth
    switch (emotion) {
      case 'happy':
        curve = 20;
        break;
      case 'thinking':
        curve = -5;
        width = 30;
        break;
      case 'neutral':
        curve = 0;
        break;
    }

    // Speaking animation
    if (isSpeaking) {
      curve = Math.sin(frame * 0.3) * 15;
      width = 40 + Math.abs(Math.sin(frame * 0.3)) * 10;
    }

    ctx.beginPath();
    ctx.moveTo(cx - width, mouthY);
    ctx.quadraticCurveTo(cx, mouthY + curve, cx + width, mouthY);
    ctx.stroke();
  };

  const drawListeningWaves = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    frame: number
  ) => {
    for (let i = 0; i < 3; i++) {
      const radius = 120 + i * 20 + (frame % 30);
      const alpha = 0.3 - i * 0.1 - (frame % 30) / 100;
      
      ctx.strokeStyle = `rgba(139, 92, 246, ${Math.max(0, alpha)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const drawSpeakingWaves = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    frame: number
  ) => {
    const waveCount = 5;
    for (let i = 0; i < waveCount; i++) {
      const angle = (i / waveCount) * Math.PI * 2 + frame * 0.05;
      const distance = 130 + Math.sin(frame * 0.1 + i) * 10;
      const x = cx + Math.cos(angle) * distance;
      const y = cy + Math.sin(angle) * distance;
      
      ctx.fillStyle = `rgba(99, 102, 241, ${0.6 - (frame % 20) / 40})`;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="w-full h-full"
      style={{ maxWidth: '400px', maxHeight: '400px' }}
    />
  );
};

export default AnimatedFace;

