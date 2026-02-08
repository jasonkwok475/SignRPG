import React, { useState, useEffect, useRef } from 'react';
import { Flame, Shield, Zap, Sparkles, Wind, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { io } from "socket.io-client";
import SpellIcon from './components/SpellIcon';
import MovementKey from './components/MovementKey';
import RenderMap from './components/RenderMap';
import PlayerSprite from './components/PlayerSprite';
import { Monster, MONSTER_CONFIGS } from './components/MonsterSprites';

const SPELL_HOLD_TIME = 500; // milliseconds
const MOVE_SPEED = 5; // pixels per frame

const SPELL_CONFIG = {
  FIRE: { letters: "FIRE", icon: Flame, color: "text-orange-500", bgColor: "bg-orange-500" },
  SHOCK: { letters: "SHOCK", icon: Zap, color: "text-yellow-400", bgColor: "bg-yellow-400" },
  WARD: { letters: "WARD", icon: Shield, color: "text-blue-400", bgColor: "bg-blue-400" },
  GUST: { letters: "GUST", icon: Wind, color: "text-teal-400", bgColor: "bg-teal-400" },
  HEAL: { letters: "HEAL", icon: Sparkles, color: "text-pink-400", bgColor: "bg-pink-400" }
};

const MOVE_CONFIG = {
  UP: { letter: "W", icon: ArrowUp, key: "↑" },
  DOWN: { letter: "S", icon: ArrowDown, key: "↓" },
  LEFT: { letter: "A", icon: ArrowLeft, key: "←" },
  RIGHT: { letter: "D", icon: ArrowRight, key: "→" }
};

const SignRPG = () => {
  const [currentMove, setCurrentMove] = useState("");
  const [currentSpell, setCurrentSpell] = useState(""); 
  const [spellBuffer, setSpellBuffer] = useState(""); 
  const [videoFrame, setVideoFrame] = useState(null);
  const [lastCastSpell, setLastCastSpell] = useState(null); // For animation
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [monsters, setMonsters] = useState([]);
  
  // Ref to track the timer for the hold requirement
  const holdTimerRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:8000");
    socket.on("video_data", (data) => {
      setVideoFrame("data:image/jpeg;base64," + data.image);
      setCurrentMove(data.left?.letter || "");
      setCurrentSpell(data.right?.letter || "");
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!currentMove) return;
    
    const interval = setInterval(() => {
      setPlayerPos(prev => ({
        x: currentMove === "A" ? prev.x - MOVE_SPEED : currentMove === "D" ? prev.x + MOVE_SPEED : prev.x,
        y: currentMove === "W" ? prev.y - MOVE_SPEED : currentMove === "S" ? prev.y + MOVE_SPEED : prev.y,
      }));
    }, 32); // ~30 FPS

    console.log(playerPos);

    return () => clearInterval(interval);
  }, [currentMove]);

  // Logic to handle the 0.5s hold and buffer updates
  useEffect(() => {
    if (!currentSpell || currentSpell === "None") {
      clearTimeout(holdTimerRef.current);
      return;
    }

    // Start a timer when a letter is detected
    holdTimerRef.current = setTimeout(() => {
      const letter = currentSpell.toUpperCase();
      
      setSpellBuffer(prev => {
        const newBuffer = prev + letter;
        
        // Check if the buffer matches any spell COMPLETELY
        const completedSpell = Object.keys(SPELL_CONFIG).find(
          key => SPELL_CONFIG[key].letters === newBuffer
        );

        if (completedSpell) {
          triggerSpellEffect(completedSpell);
          return ""; // Clear buffer on completion
        }

        // Check if the buffer is still a valid start of ANY spell
        const isStillValid = Object.values(SPELL_CONFIG).some(
          spell => spell.letters.startsWith(newBuffer)
        );

        return isStillValid ? newBuffer : letter; // Clear and start new if invalid
      });
    }, SPELL_HOLD_TIME);

    return () => clearTimeout(holdTimerRef.current);
  }, [currentSpell]);

  // Spawning Logic
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (monsters.length < 5) { // Cap monster count
        const newMonster = {
          id: Math.random(),
          type: Math.random() > 0.5 ? 'GOBLIN' : 'SKELETON',
          // Spawn randomly around the player
          x: playerPos.x + (Math.random() * 800 - 400),
          y: playerPos.y + (Math.random() * 800 - 400),
          hp: 30
        };
        setMonsters(prev => [...prev, newMonster]);
      }
    }, 3000); // Spawn every 3 seconds
    return () => clearInterval(spawnInterval);
  }, [monsters.length, playerPos]);

  // AI Movement Logic (Chasing the player)
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setMonsters(prev => prev.map(m => {
        const config = MONSTER_CONFIGS[m.type];
        // Basic vector math: move toward player
        const dx = playerPos.x - m.x;
        const dy = playerPos.y - m.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only move if far away (don't overlap perfectly)
        if (distance > 20) {
          return {
            ...m,
            x: m.x + (dx / distance) * config.moveSpeed,
            y: m.y + (dy / distance) * config.moveSpeed,
            isFlipped: dx < 0 // Flip sprite based on direction
          };
        }
        return m;
      }));
    }, 32); // 30fps movement
    return () => clearInterval(moveInterval);
  }, [playerPos]);

  const triggerSpellEffect = (spellKey) => {
    setLastCastSpell(spellKey);
    setTimeout(() => setLastCastSpell(null), 1000); // Animation duration
    console.log(`CASTING: ${spellKey}`);
  };

  // Dynamically decide which word to display in the UI slots
  const getTargetSpell = () => {
    if (!spellBuffer) return "FIRE"; // Default display
    const match = Object.values(SPELL_CONFIG).find(s => s.letters.startsWith(spellBuffer));
    return match ? match.letters : "FIRE";
  };

  const targetLetters = getTargetSpell();

  return (
    <div className="relative w-screen h-screen bg-slate-900 overflow-hidden font-sans">
      {/* 1. THE GAME GRID */}
      {RenderMap({ playerPos: playerPos })}
      {monsters.map(m => (
        <Monster key={m.id} data={m} playerPos={playerPos} />
      ))}
      {<PlayerSprite currentMove={currentMove} lastCastSpell={lastCastSpell} />}

      {/* 2. WIZARD VISION */}
      <div className="absolute top-6 right-6 w-64 group">
        <div className="bg-black/80 border-2 border-purple-500/50 rounded-xl overflow-hidden shadow-2xl">
          <div className="aspect-video bg-slate-800 flex items-center justify-center">
            {videoFrame ? <img src={videoFrame} alt="Tracking" className="w-full h-full object-cover" /> : <div className="text-slate-500 text-[10px]">CONNECTING...</div>}
          </div>
          <div className="bg-slate-800/60 px-4 py-3 text-xs flex justify-between">
             <div className="text-center">
                <p className="text-purple-300">Move</p>
                <p className="text-white text-lg font-mono">{currentMove || "—"}</p>
             </div>
             <div className="text-center">
                <p className="text-purple-300">Spell</p>
                <p className="text-white text-lg font-mono">{currentSpell || "—"}</p>
             </div>
          </div>
        </div>
      </div>

      {/* 3. MOVEMENT CONTROLS (Bottom Left) */}
      <div className="absolute bottom-10 left-10">
        <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
          <div className="text-purple-300 text-xs font-bold mb-3 text-center uppercase tracking-wider">Movement</div>
          <div className="grid grid-cols-3 gap-1">
            <div className="col-start-2">
              <MovementKey direction="UP" config={MOVE_CONFIG.UP} currentMove={currentMove} />
            </div>
            <div />    
            <MovementKey direction="LEFT" config={MOVE_CONFIG.LEFT} currentMove={currentMove} />
            <MovementKey direction="DOWN" config={MOVE_CONFIG.DOWN} currentMove={currentMove} />
            <MovementKey direction="RIGHT" config={MOVE_CONFIG.RIGHT} currentMove={currentMove} />
          </div>
        </div>
      </div>

      {/* 4. SPELL TOOLBAR */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
        
        {/* Dynamic Visual Buffer */}
        <div className="flex gap-2">
          {targetLetters.split("").map((char, i) => {
            const isFilled = spellBuffer.length > i && spellBuffer[i] === char;
            return (
              <div 
                key={i}
                className={`w-8 h-12 rounded-lg flex items-center justify-center text-lg font-black border-2 transition-all duration-300 ${
                  isFilled 
                  ? "bg-orange-500 border-orange-300 text-white shadow-[0_0_20px_rgba(249,115,22,0.6)] scale-110" 
                  : "bg-slate-700 border-slate-600 text-slate-400"
                }`}
              >
                {char}
              </div>
            );
          })}
        </div>

        {/* Spell Quickbar */}
        <div className="bg-slate-900/90 border border-slate-700 p-2 rounded-xl flex gap-3 shadow-2xl backdrop-blur-md">
          {Object.entries(SPELL_CONFIG).map(([name, config]) => (
            <SpellIcon 
              key={name}
              icon={<config.icon size={24}/>} 
              label={name}
              letters={config.letters}
              color={config.color}
              spellBuffer={spellBuffer}
              isGlowing={lastCastSpell === name} // Light up on success
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignRPG;