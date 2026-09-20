import { useRef, useState } from 'react';

function TiltCard({ children, style, maxTilt = 10 }) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)');
  const [shine, setShine] = useState({ opacity: 0, x: '50%', y: '50%' });

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = x / rect.width - 0.5;
    const normY = y / rect.height - 0.5;

    const rotateY = normX * maxTilt * 2;
    const rotateX = normY * -maxTilt * 2;

    setTransform(
      `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`
    );
    setShine({ opacity: 0.12, x: `${(x / rect.width) * 100}%`, y: `${(y / rect.height) * 100}%` });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)');
    setShine({ opacity: 0, x: '50%', y: '50%' });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transform,
        transition: 'transform 0.15s ease-out',
        transformStyle: 'preserve-3d',
        position: 'relative',
        willChange: 'transform',
      }}
    >
      {children}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          background: `radial-gradient(circle at ${shine.x} ${shine.y}, rgba(255,255,255,${shine.opacity}), transparent 60%)`,
          transition: 'opacity 0.2s ease',
        }}
      />
    </div>
  );
}

export default TiltCard;