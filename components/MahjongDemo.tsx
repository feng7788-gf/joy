
import React, { useState } from 'react';
import { analyzeMahjongHand } from '../services/geminiService';

const TILE_POOL = [
  '1-Wan', '2-Wan', '3-Wan', '4-Wan', '5-Wan', '6-Wan', '7-Wan', '8-Wan', '9-Wan',
  '1-Suo', '2-Suo', '3-Suo', '4-Suo', '5-Suo', '6-Suo', '7-Suo', '8-Suo', '9-Suo',
  'East', 'South', 'West', 'North', 'Red', 'Green', 'White'
];

interface MahjongProps {
  onBack: () => void;
}

export const MahjongDemo: React.FC<MahjongProps> = ({ onBack }) => {
  const [hand, setHand] = useState(['1-Wan', '2-Wan', '3-Wan', '4-Wan', '4-Wan', 'East', 'East', 'East', '7-Pin', '8-Pin', '9-Pin', 'Red', 'Red']);
  const [draw, setDraw] = useState<string | null>(null);
  const [discardPile, setDiscardPile] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const drawTile = () => {
    if (draw) return;
    const next = TILE_POOL[Math.floor(Math.random() * TILE_POOL.length)];
    setDraw(next);
    setAnalysis(null);
  };

  const discardTile = (index: number, isDrawTile: boolean) => {
    let discarded: string;
    if (isDrawTile && draw) {
      discarded = draw;
      setDraw(null);
    } else {
      discarded = hand[index];
      const newHand = [...hand];
      if (draw) {
        newHand[index] = draw;
        setDraw(null);
      } else {
        newHand.splice(index, 1);
      }
      setHand(newHand.sort());
    }
    setDiscardPile([...discardPile, discarded]);
  };

  const getAdvice = async () => {
    setLoading(true);
    const result = await analyzeMahjongHand([...hand, ...(draw ? [draw] : [])]);
    setAnalysis(result);
    setLoading(false);
  };

  const triggerHu = () => {
    setShowResult(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#1b5e20] p-4 rounded-xl text-white select-none relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">雀神博弈</h2>
        <div className="flex gap-2">
          <button onClick={getAdvice} disabled={loading} className="text-[10px] bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition">
            {loading ? 'AI思考中...' : 'AI助攻'}
          </button>
          <button onClick={triggerHu} className="text-[10px] bg-red-500/80 px-2 py-1 rounded font-bold">胡牌!</button>
        </div>
      </div>

      <div className="bg-black/10 rounded-lg p-2 h-32 mb-4 overflow-y-auto grid grid-cols-6 gap-1 content-start">
        {discardPile.map((t, i) => (
          <div key={i} className="h-8 bg-gray-200/20 rounded flex items-center justify-center text-[8px] border border-white/10">
            {t}
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-end gap-6 pb-4">
        {analysis && (
          <div className="bg-yellow-400/90 text-black p-3 rounded-lg text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
             <div className="font-bold mb-1">建议打出: {analysis.discard}</div>
             <p className="opacity-80">{analysis.explanation}</p>
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
           {draw ? (
             <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-yellow-400">新摸牌</span>
                <div 
                  onClick={() => discardTile(-1, true)}
                  className="w-12 h-16 bg-white rounded-lg flex flex-col items-center justify-center text-gray-800 shadow-2xl border-2 border-yellow-400 cursor-pointer transform hover:-translate-y-1 transition"
                >
                  <span className="text-xs font-bold">{draw.split('-')[0]}</span>
                  <span className="text-[8px] opacity-50">{draw.split('-')[1]}</span>
                </div>
             </div>
           ) : (
             <button onClick={drawTile} className="bg-white/10 border border-white/20 px-6 py-2 rounded-full text-sm font-bold hover:bg-white/20 transition">摸牌</button>
           )}

           <div className="flex flex-wrap gap-1.5 justify-center">
             {hand.map((tile, i) => (
               <div 
                 key={i} 
                 onClick={() => discardTile(i, false)}
                 className="w-10 h-14 bg-white rounded flex flex-col items-center justify-center text-gray-800 shadow-md cursor-pointer hover:-translate-y-2 transition-transform duration-200"
               >
                 <span className="text-[10px] font-bold leading-tight text-center">{tile.split('-')[0]}</span>
                 <span className="text-[8px] opacity-60">{tile.split('-')[1]}</span>
               </div>
             ))}
           </div>
        </div>
      </div>

      {showResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="text-6xl mb-4">🀄</div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">自摸胡了！</h2>
            <p className="text-gray-500 mb-6">大三元、清一色，恭喜雀神归位！</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setShowResult(false); setHand(['1-Wan', '2-Wan', '3-Wan', '4-Wan', '4-Wan', 'East', 'East', 'East', '7-Pin', '8-Pin', '9-Pin', 'Red', 'Red']); setDiscardPile([]); }}
                className="wechat-bg-green text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition"
              >
                再来一局
              </button>
              <button 
                onClick={onBack}
                className="bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold active:bg-gray-200 transition"
              >
                返回大厅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
