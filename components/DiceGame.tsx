
import React, { useState, useEffect, useRef } from 'react';

interface DiceGameProps {
  onBack: () => void;
}

export const DiceGame: React.FC<DiceGameProps> = () => {
  const [numDice, setNumDice] = useState<number>(3);
  const [dice, setDice] = useState<number[]>(Array(3).fill(1));
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<number[][]>([]);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dice_history_v2');
    if (saved) setHistory(JSON.parse(saved).slice(-500));
  }, []);

  useEffect(() => {
    localStorage.setItem('dice_history_v2', JSON.stringify(history.slice(-500)));
    if (history.length > 0) {
      historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDice(prev => prev.map(() => Math.floor(Math.random() * 6) + 1));
      count++;
      if (count > 10) {
        clearInterval(interval);
        const finalResult = Array(numDice).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
        setDice(finalResult);
        setHistory(prev => [...prev, finalResult].slice(-500));
        setIsRolling(false);
      }
    }, 60);
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <h2 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.5em] mb-14">Free Roll Mode</h2>
        
        <div className="flex gap-2 mb-16 bg-gray-50 p-1.5 rounded-full border border-gray-100/50">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              onClick={() => !isRolling && setNumDice(n)}
              className={`w-10 h-10 rounded-full text-[11px] font-bold transition-all ${numDice === n ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-5 mb-20 min-h-[160px] max-w-[280px]">
          {dice.map((d, i) => (
            <div 
              key={i} 
              className={`
                w-16 h-16 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-center text-3xl font-light text-gray-800 transition-all duration-200
                ${isRolling ? 'animate-bounce' : 'scale-100'}
              `}
            >
              {d}
            </div>
          ))}
        </div>

        <button 
          onClick={rollDice} 
          disabled={isRolling}
          className="w-24 h-24 rounded-full border border-gray-100 bg-white shadow-xl active:scale-95 transition-all flex items-center justify-center group relative overflow-hidden"
        >
          <div className={`absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
          <span className={`text-4xl relative z-10 transition-transform ${isRolling ? 'animate-pulse scale-75' : 'group-hover:scale-110'}`}>🎲</span>
        </button>
        <p className="mt-8 text-[10px] text-gray-300 font-bold tracking-widest uppercase">{isRolling ? 'Rolling...' : 'Tap to Roll'}</p>
      </div>

      <div className="h-56 bg-gray-50/80 border-t border-gray-100/50 p-6 flex flex-col">
        <div className="flex justify-between items-end mb-4 px-2">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">History</span>
            <span className="text-[10px] text-gray-500 font-medium">Last 500 Rolls: {history.length}</span>
          </div>
          <button onClick={() => setHistory([])} className="text-[9px] text-gray-300 uppercase font-black hover:text-red-400 transition-colors">Clear Records</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 no-scrollbar">
          {history.length === 0 && <div className="h-full flex items-center justify-center text-[10px] text-gray-300 uppercase tracking-widest italic">No data yet</div>}
          {history.map((res, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100/50 shadow-sm animate-in slide-in-from-right-2 duration-300">
              <span className="text-[9px] font-mono text-gray-300 w-6">#{String(i + 1).padStart(3, '0')}</span>
              <div className="flex gap-1.5">
                {res.map((d, j) => (
                  <span key={j} className="w-5 h-5 bg-gray-50 rounded-md flex items-center justify-center text-xs text-gray-700 font-black">{d}</span>
                ))}
              </div>
              <span className="ml-auto text-[10px] text-gray-400 font-bold">Σ {res.reduce((a, b) => a + b, 0)}</span>
            </div>
          ))}
          <div ref={historyEndRef} />
        </div>
      </div>
    </div>
  );
};
