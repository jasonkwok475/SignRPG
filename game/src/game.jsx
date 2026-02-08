import { useState, useEffect, useRef } from 'react';
import { Flame, Shield, Zap, Sparkles, Wind, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X, Save } from 'lucide-react';
import { io } from "socket.io-client";
import SpellIcon from './components/SpellIcon';
import MovementKey from './components/MovementKey';
import RenderMap from './components/RenderMap';
import PlayerSprite from './components/PlayerSprite';
import { Monster, MONSTER_CONFIGS } from './components/MonsterSprites';

const SPELL_HOLD_TIME = 500; // milliseconds
const MOVE_SPEED = 5; // pixels per frame

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
  const [lastCastSpell, setLastCastSpell] = useState(null); // For animation

  const [videoFrame, setVideoFrame] = useState(null);
  
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [monsters, setMonsters] = useState([]);
  const [kills, setKills] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spells, setSpells] = useState({
    FIRE: { letters: "FIRE", icon: Flame, radius: 200, color: "text-orange-500", bgColor: "bg-orange-500" },
    SHOCK: { letters: "SHOCK", icon: Zap, radius: 100, color: "text-yellow-400", bgColor: "bg-yellow-400" },
    WARD: { letters: "WARD", icon: Shield, color: "text-blue-400", bgColor: "bg-blue-400" },
    GUST: { letters: "GUST", icon: Wind, radius: 150, color: "text-teal-400", bgColor: "bg-teal-400" },
    HEAL: { letters: "HEAL", icon: Sparkles, color: "text-pink-400", bgColor: "bg-pink-400" }
  });

  const handleSpellChange = (index, newValue) => {
    const updatedSpells = [...spells];
    updatedSpells[index] = newValue;
    setSpells(updatedSpells);
  };
  
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
        const completedSpell = Object.keys(spells).find(
          key => spells[key].letters === newBuffer
        );

        if (completedSpell) {
          triggerSpellEffect(completedSpell);
          return ""; // Clear buffer on completion
        }

        // Check if the buffer is still a valid start of ANY spell
        const isStillValid = Object.values(spells).some(
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
  const spell = spells[spellKey];

  setMonsters(currentMonsters => {
    return currentMonsters.filter(monster => {
      const dx = monster.x - playerPos.x;
      const dy = monster.y - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const isHit = distance <= spell.radius;

      if (isHit) {
        setKills(prev => prev + 1);
        return false; 
        
        // TODO: Add HP reduction logic later
        // monster.hp -= spell.damage;
        // return monster.hp > 0;
      }

      return true; // Monster was not hit, keep it in the array
    });
  });

  setTimeout(() => setLastCastSpell(null), 1000);
};

  // Dynamically decide which word to display in the UI slots
  const getTargetSpell = () => {
    if (!spellBuffer) return "FIRE"; // Default display
    const match = Object.values(spells).find(s => s.letters.startsWith(spellBuffer));
    return match ? match.letters : "FIRE";
  };

  const targetLetters = getTargetSpell();

  return (
    <div className="relative w-screen h-screen bg-slate-900 overflow-hidden font-sans">
      {/* Game Grid */}
      <RenderMap playerPos={playerPos} />      
      {monsters.map(m => (
        <Monster key={m.id} data={m} playerPos={playerPos} />
      ))}
      {<PlayerSprite currentMove={currentMove} lastCastSpell={lastCastSpell} />}
      {lastCastSpell && (
        <div 
          className="absolute rounded-full border-2 animate-out fade-out zoom-in duration-500"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: spells[lastCastSpell].radius * 2,
            height: spells[lastCastSpell].radius * 2,
            backgroundColor: 'rgba(255, 100, 0, 0.1)',
            borderColor: 'rgba(255, 100, 0, 0.5)',
          }}
        />
      )}

      {/* Webcam */}
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

      {/* Movement Controls */}
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

      {/* Kill Count Display */}
      <div className="absolute top-10 left-10 bg-slate-900/80 border border-slate-700 px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-slate-300 text-sm">Monsters Defeated</p>
        <p className="text-white text-2xl font-bold">{kills}</p>
      </div>

      {/* Spell Toolbar */}
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
          {Object.entries(spells).map(([name, config]) => (
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

      {/* Settings Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="absolute right-10 bottom-10 flex items-center gap-2 bg-slate-800/50 border border-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl transition-all hover:bg-slate-700 hover:text-white hover:border-slate-500 shadow-lg backdrop-blur-sm z-40"        >
        <Sparkles size={16} />
        Change Spells!
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-yellow-400" size={20} />
                Modify Spell Incantations
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {Object.entries(spells).map(([key, config]) => (
                <div key={key} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <config.icon size={16} className={config.color} />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{key}</span>
                  </div>
                  
                  <input
                    type="text"
                    value={config.letters}
                    onChange={(e) => {
                      setSpells({
                        ...spells,
                        [key]: { ...config, letters: e.target.value.toUpperCase() }
                      });
                    }}
                    className="bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    placeholder="Enter incantation..."
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              Save Grimoire
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SignRPG;