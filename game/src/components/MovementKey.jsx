const MovementKey = ({ direction, config, currentMove }) => {
  const Icon = config.icon;
  const isActive = currentMove === config.letter;
  
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

export default MovementKey;