import React, { useState } from 'react';
import { Play, Settings, Sparkles, X, Volume2, Video } from 'lucide-react';

const TitleScreen = ({ onStart }) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="relative w-screen h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />

      {/* Main Title Content */}
      <div className={`transition-all duration-500 flex flex-col items-center ${showSettings ? 'scale-90 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}>
        <div className="mb-6 p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)] animate-pulse">
          <Sparkles className="text-purple-400 w-16 h-16" />
        </div>
        
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tighter mb-2">
          SIGN<span className="text-purple-500">RPG</span>
        </h1>
        <p className="text-slate-400 font-mono tracking-[0.3em] uppercase text-xs mb-12">
          Master the Arcane Gestures
        </p>

        <div className="flex flex-col gap-4 w-64">
          <button 
            onClick={onStart}
            className="group relative flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-xl transition-all hover:bg-purple-500 hover:text-white hover:scale-105 active:scale-95"
          >
            <Play className="fill-current" size={20} />
            START GAME
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center gap-3 bg-slate-800/50 border border-slate-700 text-slate-300 font-bold py-4 rounded-xl transition-all hover:bg-slate-700 hover:text-white hover:border-slate-500"
          >
            <Settings size={20} />
            SETTINGS
          </button>
        </div>
      </div>

      {/* Settings Overlay */}
      {showSettings && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="text-purple-500" /> Settings
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <Video size={14} /> Camera Input
                </label>
                <select className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg outline-none focus:border-purple-500 transition-colors">
                  <option>Default Webcam</option>
                  <option>Secondary Camera</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <Volume2 size={14} /> Arcane Audio
                </label>
                <input type="range" className="w-full accent-purple-500" />
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl mt-4 hover:bg-purple-500 transition-colors"
              >
                SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TitleScreen;