
import React, { useState, useEffect, useCallback, useRef } from 'react';

const TILE_TYPES = {
  WAN: ['一万', '二万', '三万', '四万', '五万', '六万', '七万', '八万', '九万'],
  SUO: ['一条', '二条', '三条', '四条', '五条', '六条', '七条', '八条', '九条'],
  TONG: ['一饼', '二饼', '三饼', '四饼', '五饼', '六饼', '七饼', '八饼', '九饼'],
  FENG: ['东', '南', '西', '北'],
  JIAN: ['中', '发', '白']
};

const getTileWeight = (tile: string): number => {
  if (TILE_TYPES.WAN.includes(tile)) return 10 + TILE_TYPES.WAN.indexOf(tile);
  if (TILE_TYPES.SUO.includes(tile)) return 20 + TILE_TYPES.SUO.indexOf(tile);
  if (TILE_TYPES.TONG.includes(tile)) return 30 + TILE_TYPES.TONG.indexOf(tile);
  if (TILE_TYPES.FENG.includes(tile)) return 40 + TILE_TYPES.FENG.indexOf(tile);
  if (TILE_TYPES.JIAN.includes(tile)) return 50 + TILE_TYPES.JIAN.indexOf(tile);
  return 0;
};

const FULL_DECK = [
  ...Array(4).fill(TILE_TYPES.WAN).flat(),
  ...Array(4).fill(TILE_TYPES.SUO).flat(),
  ...Array(4).fill(TILE_TYPES.TONG).flat(),
  ...Array(4).fill(TILE_TYPES.FENG).flat(),
  ...Array(4).fill(TILE_TYPES.JIAN).flat()
];

interface PlayerState {
  hand: string[];
  revealed: string[][]; // 碰、杠的牌组
  discards: string[];
  name: string;
  isAI: boolean;
}

const MahjongTile: React.FC<{ 
  tile: string; 
  onClick?: () => void; 
  highlight?: boolean; 
  isNew?: boolean;
  mini?: boolean;
  isTable?: boolean; // 桌面上已经打出的或亮出的牌
}> = ({ tile, onClick, highlight, isNew, mini, isTable }) => {
  const getStyle = (t: string) => {
    if (t.includes('万') || t === '中') return 'text-red-600';
    if (t.includes('条') || t === '发') return 'text-green-700';
    if (t.includes('饼') || ['东', '南', '西', '北'].includes(t)) return 'text-blue-700';
    return 'text-gray-800';
  };

  return (
    <div 
      onClick={onClick} 
      className={`
        rounded-[2px] relative transition-all cursor-pointer select-none flex-shrink
        bg-white border border-gray-300 shadow-[0_1.5px_0_0_#cccccc]
        ${highlight ? '-translate-y-2 ring-2 ring-green-400 shadow-xl z-10' : ''}
        ${isNew ? 'ml-[1vw] border-yellow-500 ring-2 ring-yellow-200' : 'ml-[0.5px]'}
        ${mini ? 'w-[3.2vw] max-w-[20px] aspect-[3/4]' : isTable ? 'w-[4vw] max-w-[28px] aspect-[3/4]' : 'w-[6.6vw] max-w-[46px] aspect-[3/4.2]'}
      `}
    >
      <div className={`flex flex-col items-center justify-center h-full w-full font-black ${getStyle(tile)}`}>
         {tile.length > 1 ? (
           <div className={`flex flex-col leading-none items-center ${mini || isTable ? 'text-[7px]' : 'text-[clamp(10px,2.4vw,14px)]'}`}>
             <span>{tile[0]}</span>
             <span className="opacity-60 scale-75 origin-top">{tile[1]}</span>
           </div>
         ) : <span className={mini || isTable ? 'text-[9px]' : 'text-[clamp(12px,3.4vw,19px)]'}>{tile}</span>}
      </div>
    </div>
  );
};

export const MahjongGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [deck, setDeck] = useState<string[]>([]);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [turn, setTurn] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [lastDiscard, setLastDiscard] = useState<{ tile: string, playerIdx: number } | null>(null);
  const [showActions, setShowActions] = useState<{ pong: boolean, hu: boolean, kong: boolean }>({ pong: false, hu: false, kong: false });
  const [newlyDrawnTile, setNewlyDrawnTile] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const sortHand = (hand: string[]) => [...hand].sort((a, b) => getTileWeight(a) - getTileWeight(b));

  const checkHu = useCallback((hand: string[]): boolean => {
    if (hand.length % 3 !== 2) return false;
    const weights = hand.map(getTileWeight).sort((a, b) => a - b);
    
    const checkSets = (rem: number[]): boolean => {
      if (rem.length === 0) return true;
      const first = rem[0];
      if (rem.filter(w => w === first).length >= 3) {
        const next = [...rem];
        for (let i = 0; i < 3; i++) next.splice(next.indexOf(first), 1);
        if (checkSets(next)) return true;
      }
      if (first < 40 && rem.includes(first + 1) && rem.includes(first + 2)) {
        const next = [...rem];
        next.splice(next.indexOf(first), 1);
        next.splice(next.indexOf(first + 1), 1);
        next.splice(next.indexOf(first + 2), 1);
        if (checkSets(next)) return true;
      }
      return false;
    };

    const uniqueWeights = Array.from(new Set(weights));
    for (const w of uniqueWeights) {
      if (weights.filter(x => x === w).length >= 2) {
        const remaining = [...weights];
        remaining.splice(remaining.indexOf(w), 2);
        if (checkSets(remaining)) return true;
      }
    }
    return false;
  }, []);

  const init = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const s = [...FULL_DECK].sort(() => Math.random() - 0.5);
    const initialPlayers: PlayerState[] = [
      { name: '玩家', hand: sortHand(s.slice(0, 13)), revealed: [], discards: [], isAI: false },
      { name: '老王', hand: sortHand(s.slice(13, 26)), revealed: [], discards: [], isAI: true },
      { name: '老张', hand: sortHand(s.slice(26, 39)), revealed: [], discards: [], isAI: true },
      { name: '老李', hand: sortHand(s.slice(39, 52)), revealed: [], discards: [], isAI: true },
    ];
    setPlayers(initialPlayers);
    setDeck(s.slice(52));
    setWinner(null);
    setLastDiscard(null);
    setNewlyDrawnTile(null);
    setShowActions({ pong: false, hu: false, kong: false });
    
    const drawn = s[52];
    setDeck(s.slice(53));
    setTurn(0);
    setNewlyDrawnTile(drawn);
    initialPlayers[0].hand.push(drawn);
    setPlayers([...initialPlayers]);
    
    const canHu = checkHu(initialPlayers[0].hand);
    const canKong = initialPlayers[0].hand.filter(t => t === drawn).length === 4;
    if (canHu || canKong) setShowActions({ pong: false, hu: canHu, kong: canKong });
  }, [checkHu]);

  useEffect(() => { init(); }, [init]);

  const startNextTurn = useCallback((pIdx: number) => {
    if (winner !== null || deck.length === 0) {
      if (deck.length === 0 && winner === null) setWinner(-1);
      return;
    }
    const next = (pIdx + 1) % 4;
    setTurn(next);
    const drawn = deck[0];
    setDeck(prev => prev.slice(1));
    setNewlyDrawnTile(drawn);

    setPlayers(prev => {
      const n = [...prev];
      n[next].hand.push(drawn);
      if (checkHu(n[next].hand)) {
        setWinner(next);
        return n;
      }
      if (next !== 0) {
        n[next].hand = sortHand(n[next].hand);
        // AI 逻辑：检查是否有暗杠或补杠
        const fourCount = n[next].hand.filter(t => t === drawn).length === 4;
        const canBuKong = n[next].revealed.some(set => set[0] === drawn);
        if (fourCount || canBuKong) {
          // AI 简单处理直接杠
          const tileToKong = drawn;
          n[next].hand = n[next].hand.filter(t => t !== tileToKong);
          if (fourCount) n[next].revealed.push([tileToKong, tileToKong, tileToKong, tileToKong]);
          else n[next].revealed.find(s => s[0] === tileToKong)?.push(tileToKong);
          // AI 杠完后需要补牌，此处简化逻辑重新开始摸牌 turn
          timerRef.current = window.setTimeout(() => startNextTurn(next), 1000);
          return n;
        }
        processAITurn(next);
      } else {
        const canHu = checkHu(n[0].hand);
        const canAnKong = n[0].hand.filter(t => t === drawn).length === 4;
        const canBuKong = n[0].revealed.some(set => set[0] === drawn);
        if (canHu || canAnKong || canBuKong) {
          setShowActions({ pong: false, hu: canHu, kong: canAnKong || canBuKong });
        }
      }
      return n;
    });
  }, [deck, winner, checkHu]);

  const processAITurn = (idx: number) => {
    setIsThinking(true);
    timerRef.current = window.setTimeout(() => {
      setPlayers(prev => {
        if (winner !== null) return prev;
        const p = prev[idx];
        const tIdx = Math.floor(Math.random() * p.hand.length);
        const tile = p.hand[tIdx];
        setIsThinking(false);
        handleDiscard(idx, tile);
        return prev;
      });
    }, 1500 + Math.random() * 500);
  };

  const handleDiscard = (pIdx: number, tile: string) => {
    if (winner !== null) return;
    setPlayers(prev => {
      const n = [...prev];
      const tIdx = n[pIdx].hand.indexOf(tile);
      if (tIdx === -1) return prev;
      n[pIdx].hand.splice(tIdx, 1);
      n[pIdx].hand = sortHand(n[pIdx].hand);
      n[pIdx].discards.push(tile);
      
      setLastDiscard({ tile, playerIdx: pIdx });
      setNewlyDrawnTile(null);
      
      if (pIdx !== 0) {
        const canUserHu = checkHu([...n[0].hand, tile]);
        const canUserPong = n[0].hand.filter(t => t === tile).length >= 2;
        const canUserKong = n[0].hand.filter(t => t === tile).length === 3;
        if (canUserHu || canUserPong || canUserKong) {
          setShowActions({ hu: canUserHu, pong: canUserPong, kong: canUserKong });
        } else {
          // AI 互碰逻辑简化：其他AI是否有碰的机会（暂时省略，以玩家体验为主）
          timerRef.current = window.setTimeout(() => startNextTurn(pIdx), 1000);
        }
      } else {
        timerRef.current = window.setTimeout(() => startNextTurn(pIdx), 1000);
      }
      return n;
    });
  };

  const performAction = (action: 'PONG' | 'HU' | 'KONG' | 'PASS') => {
    if (winner !== null) return;
    if (action === 'HU') {
      setWinner(0);
      return;
    }
    if (action === 'PASS') {
      setShowActions({ pong: false, hu: false, kong: false });
      if (turn !== 0 || (lastDiscard && lastDiscard.playerIdx !== turn)) {
        startNextTurn(lastDiscard?.playerIdx ?? turn);
      }
      return;
    }

    setPlayers(prev => {
      const n = [...prev];
      const targetTile = lastDiscard?.tile || newlyDrawnTile;
      if (!targetTile) return prev;

      if (action === 'KONG') {
        if (lastDiscard) {
          // 明杠
          n[lastDiscard.playerIdx].discards.pop();
          n[0].hand = n[0].hand.filter(t => t !== targetTile);
          n[0].revealed.push([targetTile, targetTile, targetTile, targetTile]);
        } else {
          // 暗杠或补杠
          const count = n[0].hand.filter(t => t === targetTile).length;
          if (count === 4) {
             n[0].hand = n[0].hand.filter(t => t !== targetTile);
             n[0].revealed.push([targetTile, targetTile, targetTile, targetTile]);
          } else {
             n[0].hand = n[0].hand.filter(t => t !== targetTile);
             const rIdx = n[0].revealed.findIndex(set => set[0] === targetTile);
             n[0].revealed[rIdx].push(targetTile);
          }
        }
        setTurn(0);
        setLastDiscard(null);
        setShowActions({ pong: false, hu: false, kong: false });
        // 杠完后从牌库尾部补一张牌（此处简化为开始新回合摸牌）
        timerRef.current = window.setTimeout(() => startNextTurn(0), 500);
      } else if (action === 'PONG') {
        n[lastDiscard!.playerIdx].discards.pop();
        let removed = 0;
        n[0].hand = n[0].hand.filter(t => {
          if (t === targetTile && removed < 2) { removed++; return false; }
          return true;
        });
        n[0].revealed.push([targetTile, targetTile, targetTile]);
        setTurn(0);
        setLastDiscard(null);
        setShowActions({ pong: false, hu: false, kong: false });
        setNewlyDrawnTile(null);
      }
      return n;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfbf7] relative overflow-hidden select-none font-sans">
      
      {/* 退出按钮 */}
      <div className="absolute top-4 left-4 z-[60]">
        <button 
          onClick={onBack} 
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-md border border-gray-100 flex items-center justify-center text-gray-500 active:scale-90 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* 状态栏 */}
      <div className="h-14 flex items-center justify-center shrink-0">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-400 font-black tracking-[0.3em] uppercase">雀王争霸 · 棋牌中心</span>
          <div className="flex items-center gap-3">
             <span className="text-[9px] font-bold text-gray-500 bg-white shadow-sm border border-gray-100 px-3 py-0.5 rounded-full">东风局</span>
             <span className="text-[9px] font-bold text-gray-500 bg-white shadow-sm border border-gray-100 px-3 py-0.5 rounded-full">牌库 {deck.length}</span>
          </div>
        </div>
      </div>

      {/* 中央主竞技场 */}
      <div className="flex-1 relative flex items-center justify-center">
        
        {/* 指示盘 */}
        <div className="relative w-24 h-24 bg-white border border-gray-50 rounded-[2rem] flex items-center justify-center shadow-2xl z-20">
           <div className="grid grid-cols-2 gap-4 text-[12px] font-black text-gray-200">
             <span className={`transition-all ${turn === 0 ? 'text-green-500 scale-125' : ''}`}>东</span>
             <span className={`transition-all ${turn === 1 ? 'text-green-500 scale-125' : ''}`}>南</span>
             <span className={`transition-all ${turn === 3 ? 'text-green-500 scale-125' : ''}`}>北</span>
             <span className={`transition-all ${turn === 2 ? 'text-green-500 scale-125' : ''}`}>西</span>
           </div>
           {isThinking && (
             <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-[8px] font-bold px-4 py-1.5 rounded-full animate-bounce shadow-xl">
               {players[turn].name}思考中...
             </div>
           )}
        </div>

        {/* 桌面布局：弃牌区 + 亮牌区 (Revealed Area) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
           {players.map((p, idx) => (
             <React.Fragment key={idx}>
               {/* 弃牌区 - 此时移除透明度，调大尺寸 */}
               <div className={`absolute flex flex-wrap gap-[1.5px] items-center justify-center transition-opacity duration-300 ${
                 idx === 0 ? 'bottom-[22%] w-[50vw] max-w-[220px] flex-row-reverse' :
                 idx === 1 ? 'right-[15%] h-[30vh] flex-col' :
                 idx === 2 ? 'top-[18%] w-[50vw] max-w-[220px] flex-row' :
                 'left-[15%] h-[30vh] flex-col-reverse'
               }`}>
                 {p.discards.map((t, i) => (
                   <MahjongTile 
                    key={i} 
                    tile={t} 
                    isTable 
                    highlight={lastDiscard?.tile === t && lastDiscard?.playerIdx === idx} 
                   />
                 ))}
               </div>

               {/* 亮牌区 (Revealed: 碰/杠的牌) - 置于各玩家弃牌区外侧或内侧 */}
               <div className={`absolute flex gap-1 items-center transition-all ${
                 idx === 0 ? 'bottom-[12%] right-4 flex-row' :
                 idx === 1 ? 'right-[6%] top-[25%] flex-col' :
                 idx === 2 ? 'top-[10%] left-4 flex-row-reverse' :
                 'left-[6%] bottom-[25%] flex-col-reverse'
               }`}>
                 {p.revealed.map((set, si) => (
                   <div key={si} className="flex gap-[0.5px] bg-white/50 p-1 rounded-sm border border-gray-100 shadow-sm">
                      {set.map((t, ti) => <MahjongTile key={ti} tile={t} mini />)}
                   </div>
                 ))}
               </div>
             </React.Fragment>
           ))}
        </div>
      </div>

      {/* 底部玩家操作区 */}
      <div className="shrink-0 bg-white/95 border-t border-gray-100 pb-12 pt-4 z-40 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        
        {/* 操作按钮组 */}
        {(showActions.pong || showActions.hu || showActions.kong) && winner === null && (
          <div className="absolute -top-20 left-0 w-full flex justify-center items-center gap-4 px-4 animate-in slide-in-from-bottom-3 duration-500">
             {showActions.hu && (
               <button onClick={() => performAction('HU')} className="h-16 px-10 rounded-full bg-red-600 text-white font-black text-lg shadow-2xl border-4 border-red-50 animate-bounce">胡牌</button>
             )}
             <div className="flex gap-2">
               {showActions.kong && (
                 <button onClick={() => performAction('KONG')} className="h-12 px-6 rounded-full bg-blue-600 text-white font-black text-sm shadow-xl border-4 border-blue-50">杠牌</button>
               )}
               {showActions.pong && (
                 <button onClick={() => performAction('PONG')} className="h-12 px-6 rounded-full bg-orange-500 text-white font-black text-sm shadow-xl border-4 border-orange-50">碰牌</button>
               )}
             </div>
             <button onClick={() => performAction('PASS')} className="h-10 px-6 rounded-full bg-gray-100 text-gray-500 font-bold text-xs shadow-sm active:bg-gray-200">过</button>
          </div>
        )}

        <div className="w-full flex flex-col items-center">
          {/* 玩家手牌 - 居中显示且自动适配 */}
          <div className="flex justify-center items-end px-2 gap-[1px] w-full max-w-full">
             {players[0]?.hand.map((tile, i) => {
               const isDrawn = tile === newlyDrawnTile && i === players[0].hand.length - 1;
               return (
                <MahjongTile 
                  key={`${i}-${tile}`} 
                  tile={tile} 
                  highlight={turn === 0 && winner === null} 
                  isNew={isDrawn}
                  onClick={() => turn === 0 && winner === null && handleDiscard(0, tile)} 
                />
               );
             })}
          </div>
          <div className="mt-3 text-[8px] text-gray-300 font-black tracking-[1em] uppercase opacity-40">Family Game Center Control</div>
        </div>
      </div>

      {/* 结算 */}
      {winner !== null && (
        <div className="fixed inset-0 z-[100] bg-white/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
           <div className="text-9xl mb-8 transform hover:scale-110 transition-transform">{winner === 0 ? '🎉' : winner === -1 ? '☁️' : '🤖'}</div>
           <h3 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
             {winner === 0 ? '手气通天！胡牌' : winner === -1 ? '流局荒庄' : `${players[winner].name} 胜出`}
           </h3>
           <p className="text-[12px] text-gray-400 font-bold uppercase tracking-[0.5em] mb-16">Game Statistics Confirmed</p>
           
           <div className="flex flex-col gap-4 w-full max-w-[280px]">
             <button onClick={init} className="wechat-bg-green text-white py-5 rounded-[2.5rem] text-lg font-black shadow-2xl active:scale-95 transition-all">再战一局</button>
             <button onClick={onBack} className="text-gray-400 text-[11px] font-black uppercase tracking-widest py-2 text-center">返回游戏大厅</button>
           </div>
        </div>
      )}
    </div>
  );
};
