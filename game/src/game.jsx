  import React, { useState, useEffect } from 'react';
  import { Flame, Shield, Zap, Sparkles, Wind } from 'lucide-react';
  import { io } from "socket.io-client";

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
                </div>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-purple-300 mb-1">Right Hand</span>
                  <span className="text-white font-mono text-lg">{currentSpell.letter || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SPELL TOOLBAR (Bottom UI) */}
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
            <SpellIcon icon={<Flame size={24}/>} label="Fire" color="text-orange-500" />
            <SpellIcon icon={<Zap size={24}/>} label="Shock" color="text-yellow-400" />
            <SpellIcon icon={<Shield size={24}/>} label="Ward" color="text-blue-400" />
            <SpellIcon icon={<Wind size={24}/>} label="Gust" color="text-teal-400" />
            <SpellIcon icon={<Sparkles size={24}/>} label="Heal" color="text-pink-400" />
          </div>
        </div>

      </div>
    );
  };

  const SpellIcon = ({ icon, label, color }) => (
    <div className="group relative flex flex-col items-center p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-help">
      <div className={`${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-black text-white text-[10px] px-2 py-1 rounded border border-slate-700">
        {label}
      </span>
    </div>
  );

  export default SignRPG;