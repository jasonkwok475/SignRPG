import { useState, useEffect } from 'react';

const MONSTER_CONFIGS = {
  GOBLIN: { 
    src: '/assets/goblin/Run.png', 
    frames: 8, 
    speed: 120, 
    size: 64,
    moveSpeed: 1.8 
  },
  SKELETON: { 
    src: '/assets/skeleton/Walk.png', 
    frames: 4, 
    speed: 100, 
    size: 64,
    moveSpeed: 1.3
  },
  EYE: {
    src: '/assets/flying_eye/Flight.png', 
    frames: 8, 
    speed: 135, 
    size: 64,
    moveSpeed: 2.1 
  },
  MUSHROOM: {
    src: '/assets/mushroom/Run.png', 
    frames: 8, 
    speed: 80, 
    size: 64,
    moveSpeed: 1.0 
  }
};

const Monster = ({ data, playerPos }) => {
  const config = MONSTER_CONFIGS[data.type];
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % config.frames);
    }, config.speed);
    return () => clearInterval(interval);
  }, [config]);

  return (
    <div 
      className="absolute transition-opacity duration-300"
      style={{
        width: config.size,
        height: config.size,
        // The Camera Logic: Screen Center + (World Object - World Player)
        left: `calc(50% + ${data.x - playerPos.x}px)`,
        top: `calc(50% + ${data.y - playerPos.y}px)`,
        transform: `translate(-50%, -50%) scaleX(${data.isFlipped ? -1 : 1})`,
        backgroundImage: `url(${config.src})`,
        backgroundSize: `${config.size * config.frames}px ${config.size}px`,
        backgroundPosition: `-${frameIndex * config.size}px 0px`,
        imageRendering: 'pixelated',
      }}
    />
  );
};

export { Monster, MONSTER_CONFIGS };