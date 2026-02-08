import React, { useState, useEffect } from 'react';

const ANIMATIONS = {
  IDLE: { src: '/assets/wizard/Idle.png', frames: 6, speed: 200 },
  WALK: { src: '/assets/wizard/Run.png', frames: 8, speed: 120 },
  CAST: { src: '/assets/wizard/Attack1.png', frames: 8, speed: 80 },
};

const PlayerSprite = ({ currentMove, lastCastSpell }) => {
  // Determine which animation state we are in
  const [action, setAction] = useState('IDLE');
  const [frameIndex, setFrameIndex] = useState(0);

  // Logic to switch actions
  useEffect(() => {
    if (lastCastSpell) {
      setAction('CAST');
    } else if (currentMove && currentMove !== "None") {
      setAction('WALK');
    } else {
      setAction('IDLE');
    }
    setFrameIndex(0); // Reset to start of animation on change
  }, [currentMove, lastCastSpell]);

  const currentAnim = ANIMATIONS[action];

  // The Animation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % currentAnim.frames);
    }, currentAnim.speed);

    return () => clearInterval(interval);
  }, [currentAnim]); // Re-run timer when speed or frame count changes

  const isFlipped = currentMove === "A";

  return (
    <div 
      className="absolute w-32 h-32 transition-transform duration-200"
      style={{ 
        left: '50%', 
        top: '50%', 
        transform: `translate(-50%, -50%) scaleX(${isFlipped ? -1 : 1})`,
        zIndex: 10,
        backgroundImage: `url(${currentAnim.src})`,
        // Math: Total width is (Single Frame Width * Dynamic Frame Count)
        backgroundSize: `${128 * currentAnim.frames}px 128px`, 
        backgroundPosition: `-${frameIndex * 128}px 0px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
  );
};  

export default PlayerSprite;