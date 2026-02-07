import React, { useState, useEffect } from 'react';
import { Flame, Shield, Zap, Sparkles, Wind, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { io } from "socket.io-client";

// Spell and Movement Configuration
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
  const [currentMove, setCurrentMove] = useState("");    // Current move command by right hand
  const [currentSpell, setCurrentSpell] = useState("");  // Current spell letter by left hand
  const [spellBuffer, setSpellBuffer] = useState("");    // Buffer of recent letters for spell casting
  const [videoFrame, setVideoFrame] = useState(null);    // Latest video frame from webcam
  const [activeSpells, setActiveSpells] = useState([]);  // Current active spells

  useEffect(() => {
      const socket = io("http://localhost:8000");

      socket.on("video_data", (data) => {
          setVideoFrame("data:image/jpeg;base64," + data.image);
          console.log(data);
          setCurrentMove(data.left);
          setCurrentSpell(data.right);
          setSpellBuffer(data.buffer);
      });

      return () => socket.disconnect();
  }, []);

  return (
    <div className="relative w-screen h-screen bg-slate-900 overflow-hidden font-sans">
      
      {/* 1. THE GAME GRID (Background) */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(#334155 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      >
        {/* You would render your game entities (player/enemies) here */}
        <div className="absolute top-1/2 left-1/2 w-10 h-10 bg-blue-500 rounded shadow-lg shadow-blue-500/50 -translate-x-1/2 -translate-y-1/2 border border-blue-300">
          {/* Player Avatar */}
        </div>
      </div>

      {/* 2. WIZARD VISION (Camera Corner) */}
      <div className="absolute top-6 right-6 w-64 group">
        <div className="bg-black/80 border-2 border-purple-500/50 rounded-xl overflow-hidden shadow-2xl transition-all group-hover:border-purple-400">
          <div className="bg-purple-900/30 px-3 py-1 text-xs font-bold text-purple-300 uppercase tracking-widest border-b border-purple-500/30">
            Wizard Vision
          </div>
          <div className="aspect-video bg-slate-800 flex items-center justify-center">
            {videoFrame ? (
              <img src={videoFrame} alt="Hand Tracking" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-500 text-[10px] animate-pulse">CONNECTING TO CAMERA...</div>
            )}
          </div>
          <div className="bg-slate-800/60 px-4 py-3 border-t border-purple-500/20 text-xs">
            <div className="flex gap-4 justify-between">
              <div className="flex flex-col items-center flex-1">
                <span className="text-purple-300 mb-1">Left Hand</span>
                <span className="text-white font-mono text-lg">{currentMove.letter || "—"}</span>
                <span className="text-purple-300 mb-1">Movement</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-purple-200 mb-1">Right Hand</span>
                <span className="text-white font-mono text-lg">{currentSpell.letter || "—"}</span>
                <span className="text-purple-200 mb-1">Spell Casting</span>
              </div>
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

      {/* 4. SPELL TOOLBAR (Bottom Center) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
        
        {/* Active Spelling Buffer */}
        <div className="flex gap-2">
          {"FIRE".split("").map((char, i) => (
            <div 
              key={i}
              className={`w-12 h-16 rounded-lg flex items-center justify-center text-2xl font-black border-2 transition-all duration-300 ${
                spellBuffer.includes(char) 
                ? "bg-orange-500 border-orange-300 text-white shadow-[0_0_20px_rgba(249,115,22,0.6)]" 
                : "bg-black/40 border-slate-700 text-slate-600"
              }`}
            >
              {char}
            </div>
          ))}
        </div>

        {/* Spell Quickbar */}
        <div className="bg-slate-900/90 border border-slate-700 p-2 rounded-2xl flex gap-4 shadow-2xl backdrop-blur-md">
          {Object.entries(SPELL_CONFIG).map(([name, config]) => (
            <SpellIcon 
              key={name}
              icon={<config.icon size={24}/>} 
              label={name}
              letters={config.letters}
              color={config.color}
              spellBuffer={spellBuffer}
            />
          ))}
        </div>
      </div>

    </div>
  );
};

const MovementKey = ({ direction, config, currentMove }) => {
  const Icon = config.icon;
  const isActive = currentMove.letter === config.letter;
  
  return (
    <div className={`relative w-14 h-14 rounded-lg flex flex-col items-center justify-center border-2 transition-all ${
      isActive 
        ? "bg-purple-500 border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.6)]" 
        : "bg-slate-800 border-slate-600 hover:border-slate-500"
    }`}>
      <Icon size={20} className={isActive ? "text-white" : "text-slate-400"} />
      <span className={`text-xs font-mono font-bold mt-1 ${isActive ? "text-white" : "text-slate-500"}`}>
        {config.letter}
      </span>
    </div>
  );
};

const SpellIcon = ({ icon, label, letters, color, spellBuffer }) => (
  <div className="group relative flex flex-col items-center p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-help">
    <div className={`${color} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    {/* Required Letters */}
    <div className="flex gap-0.5 mt-2">
      {letters.split("").map((letter, i) => (
        <span 
          key={i}
          className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded transition-all ${
            spellBuffer.includes(letter)
              ? `${color} opacity-100`
              : "text-slate-600 opacity-60"
          }`}
        >
          {letter}
        </span>
      ))}
    </div>
    {/* Hover Tooltip */}
    <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-black text-white text-[10px] px-2 py-1 rounded border border-slate-700 whitespace-nowrap">
      {label}
    </span>
  </div>
);

export default SignRPG;