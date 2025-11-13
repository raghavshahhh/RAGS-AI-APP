import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function VoiceVisualizer() {
  const [bars, setBars] = useState<number[]>(Array(20).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
      setBars(Array(20).fill(0).map(() => Math.random()));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1 h-16">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          animate={{
            height: `${20 + height * 40}px`,
          }}
          transition={{
            duration: 0.1,
          }}
          className="w-1 bg-gradient-to-t from-primary to-secondary rounded-full"
        />
      ))}
    </div>
  );
}

