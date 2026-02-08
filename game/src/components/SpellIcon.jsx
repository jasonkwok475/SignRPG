const SpellIcon = ({ icon, label, letters, color, spellBuffer, isGlowing }) => (
  <div className={`group relative flex flex-col items-center p-3 rounded-xl transition-all duration-500 ${
    isGlowing ? "bg-white/20 scale-125 ring-4 ring-yellow-400" : "hover:bg-slate-800"
  }`}>
    <div className={`${color} group-hover:scale-110 transition-transform ${isGlowing ? "animate-bounce" : ""}`}>
      {icon}
    </div>
    <div className="flex gap-0.5 mt-2">
      {letters.split("").map((letter, i) => (
        <span key={i} className={`text-[12px] font-mono font-bold px-1 py-0.5 rounded ${
          spellBuffer.startsWith(letters.substring(0, i + 1)) ? `${color} opacity-100` : "text-white opacity-70"
        }`}>
          {letter}
        </span>
      ))}
    </div>
  </div>
);

export default SpellIcon;