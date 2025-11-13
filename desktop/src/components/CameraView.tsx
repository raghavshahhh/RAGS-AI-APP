import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240 } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.log('Camera not available');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="absolute top-20 right-6 w-48 h-36 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl z-10"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover mirror"
      />
      <div className="absolute bottom-2 left-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
        📷 Camera View
      </div>
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </motion.div>
  );
}
