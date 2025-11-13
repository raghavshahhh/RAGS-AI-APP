/**
 * RAGS Logo Component - Consistent logo throughout the app
 */

interface RAGSLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export default function RAGSLogo({ size = 40, className = '', animated = false }: RAGSLogoProps) {
  return (
    <div 
      className={`rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ${animated ? 'animate-pulse' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <span 
        className="text-white font-bold" 
        style={{ fontSize: size * 0.5 }}
      >
        R
      </span>
    </div>
  );
}

// Alternative with more detail
export function RAGSLogoDetailed({ size = 40, className = '' }: RAGSLogoProps) {
  return (
    <div 
      className={`relative rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
      <span 
        className="text-white font-bold tracking-wider relative z-10" 
        style={{ fontSize: size * 0.5 }}
      >
        R
      </span>
    </div>
  );
}

// Small icon version for notifications
export function RAGSIcon({ size = 24 }: { size?: number }) {
  return (
    <div 
      className="rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <span 
        className="text-white font-bold" 
        style={{ fontSize: size * 0.5 }}
      >
        R
      </span>
    </div>
  );
}
