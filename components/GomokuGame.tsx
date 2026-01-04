
import React, { useState, useEffect, useCallback } from 'react';
import { Player, GameMode } from '../types';
import { getGameAIResponse } from '../services/geminiService';

interface GomokuProps {
  mode: GameMode;
  onBack: () => void;
}

export const GomokuGame: React.FC<GomokuProps> = ({ mode, onBack }) => {
  const SIZE = 13;
  const [board, setBoard] = useState<Player[][]>(Array(SIZE).fill(null).map(() => Array(SIZE).fill('NONE')));
  const [turn, setTurn] = useState<Player>('BLACK');
  const [winner, setWinner] = useState<Player>('NONE');
  const [winLine, setWinLine] = useState<{r: number, c: number}[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{r: number, c: number} | null>(null);
  const [aiComment, setAiComment] = useState("");

  const checkWin = (r: number, c: number, p: Player, currentBoard: Player[][]) => {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (let [dr, dc] of directions) {
      let line = [{r, c}];
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && currentBoard[nr][nc] === p) {
        line.push({r: nr, c: nc}); nr += dr; nc += dc;
      }
      nr = r - dr; nc = c - dc;
      while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && currentBoard[nr][nc] === p) {
        line.push({r: nr, c: nc}); nr -= dr; nc -= dc;
      }
      if (line.length >= 5) return line;
    }
    return null;
  };

  // Heuristic Evaluator for rapid strategic decision making
  const evaluateMove = (r: number, c: number, player: Player, currentBoard: Player[][]) => {
    const opponent = player === 'BLACK' ? 'WHITE' : 'BLACK';
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    let totalScore = 0;

    const getScore = (count: number, openEnds: number, isSelf: boolean) => {
      if (count >= 5) return 100000;
      if (isSelf) {
        if (count === 4 && openEnds >= 1) return 10000;
        if (count === 3 && openEnds === 2) return 1000;
        if (count === 3 && openEnds === 1) return 500;
        if (count === 2 && openEnds === 2) return 100;
      } else {
        // Opponent blocking scores - slightly higher weight to force interception
        if (count === 4 && openEnds >= 1) return 9000; // Urgent block
        if (count === 3 && openEnds === 2) return 8000; // Strong intercept 3-row
        if (count === 3 && openEnds === 1) return 400;
        if (count === 2 && openEnds === 2) return 50;
      }
      return count * 10;
    };

    const checkDir = (dr: number, dc: number, p: Player) => {
      let count = 1;
      let openEnds = 0;
      
      // Forward
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && currentBoard[nr][nc] === p) {
        count++; nr += dr; nc += dc;
      }
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && currentBoard[nr][nc] === 'NONE') openEnds++;

      // Backward
      nr = r - dr; nc = c - dc;
      while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && currentBoard[nr][nc] === p) {
        count++; nr -= dr; nc -= dc;
      }
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && currentBoard[nr][nc] === 'NONE') openEnds++;

      return { count, openEnds };
    };

    for (const [dr, dc] of directions) {
      const self = checkDir(dr, dc, player);
      const opp = checkDir(dr, dc, opponent);
      totalScore += getScore(self.count, self.openEnds, true);
      totalScore += getScore(opp.count, opp.openEnds, false);
    }

    return totalScore;
  };

  const findBestMoveLocally = (currentBoard: Player[][]) => {
    let bestScore = -1;
    let bestMove = { r: Math.floor(SIZE/2), c: Math.floor(SIZE/2) };
    const empties: {r: number, c: number}[] = [];

    currentBoard.forEach((row, r) => row.forEach((cell, c) => {
      if (cell === 'NONE') empties.push({ r, c });
    }));

    if (empties.length === SIZE * SIZE) return bestMove;

    for (const pos of empties) {
      const score = evaluateMove(pos.r, pos.c, 'WHITE', currentBoard);
      if (score > bestScore) {
        bestScore = score;
        bestMove = pos;
      } else if (score === bestScore) {
        // Prefer center-ish moves on ties
        const distA = Math.abs(pos.r - 6) + Math.abs(pos.c - 6);
        const distB = Math.abs(bestMove.r - 6) + Math.abs(bestMove.c - 6);
        if (distA < distB) bestMove = pos;
      }
    }
    return bestMove;
  };

  const handleMove = useCallback((r: number, c: number) => {
    if (board[r][c] !== 'NONE' || winner !== 'NONE' || isThinking) return;
    
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = turn;
    setBoard(newBoard);
    setLastMove({r, c});
    
    const winningLine = checkWin(r, c, turn, newBoard);
    if (winningLine) {
      setWinner(turn);
      setWinLine(winningLine);
    } else {
      setTurn(turn === 'BLACK' ? 'WHITE' : 'BLACK');
    }
  }, [board, turn, winner, isThinking]);

  useEffect(() => {
    if (mode === GameMode.AI && turn === 'WHITE' && winner === 'NONE' && !isThinking) {
      const triggerAI = async () => {
        setIsThinking(true);
        const startTime = Date.now();

        // 1. Calculate the best move using local heuristic engine (Guaranteed response < 50ms)
        const localBest = findBestMoveLocally(board);
        
        // 2. Concurrently fetch Gemini's reasoning to add "Master" flavor if time permits
        const boardStr = board.map(row => row.map(cell => cell === 'BLACK' ? 'B' : cell === 'WHITE' ? 'W' : '.').join('')).join('\n');
        
        try {
          // Rapid prompt for commentary/validation
          const res = await getGameAIResponse('Gomoku', boardStr, 'hard');
          if (res?.reason) setAiComment(res.reason);
          
          // Use Gemini move if it seems logical, otherwise stick to local heuristic for intercept safety
          let finalR = localBest.r, finalC = localBest.c;
          if (res?.move) {
            const coords = res.move.match(/\d+/g);
            if (coords) {
              const gr = parseInt(coords[0]), gc = parseInt(coords[1]);
              // If local engine sees an immediate threat or win, it overrides Gemini's guess
              const localUrgency = evaluateMove(localBest.r, localBest.c, 'WHITE', board);
              if (localUrgency < 8000 && gr < SIZE && gc < SIZE && board[gr][gc] === 'NONE') {
                finalR = gr; finalC = gc;
              }
            }
          }

          const elapsed = Date.now() - startTime;
          setTimeout(() => {
            handleMove(finalR, finalC);
            setIsThinking(false);
          }, Math.max(0, 400 - elapsed)); // Artificial slight delay for natural feel, but within 1s limit

        } catch (e) {
          handleMove(localBest.r, localBest.c);
          setIsThinking(false);
        }
      };
      triggerAI();
    }
  }, [turn, mode, winner, board, handleMove, isThinking]);

  const reset = () => {
    setBoard(Array(SIZE).fill(null).map(() => Array(SIZE).fill('NONE')));
    setWinner('NONE');
    setWinLine([]);
    setTurn('BLACK');
    setLastMove(null);
    setAiComment("");
  };

  const isWinTile = (r: number, c: number) => winLine.some(pos => pos.r === r && pos.c === c);

  return (
    <div className="flex flex-col items-center h-full py-8 bg-white font-sans overflow-hidden">
      <div className="w-full flex justify-between items-center mb-8 px-8">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-300 uppercase tracking-[0.3em] font-black mb-1">Status</span>
          <span className="text-sm font-black text-gray-800">
            {winner !== 'NONE' ? 'GAME OVER' : isThinking ? 'AI INTERCEPTING...' : `${turn === 'BLACK' ? 'PLAYER' : 'AI'} TURN`}
          </span>
        </div>
        <button onClick={onBack} className="text-[10px] text-gray-400 font-black uppercase tracking-widest border border-gray-100 px-5 py-2 rounded-full shadow-sm">Exit</button>
      </div>

      <div className="h-12 mb-6 px-10 text-center">
        {aiComment && (
          <p className="text-[10px] text-gray-400 italic font-medium leading-relaxed animate-in fade-in slide-in-from-top-1">
            " {aiComment} "
          </p>
        )}
      </div>

      <div className="relative bg-[#fcfcfc] border-2 border-gray-50 rounded-[2.5rem] p-4 shadow-2xl" style={{ width: '340px', height: '340px' }}>
        <div className="relative w-full h-full grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gridTemplateRows: `repeat(${SIZE}, 1fr)` }}>
          <div className="absolute inset-[3.8%] pointer-events-none grid" style={{ gridTemplateColumns: `repeat(${SIZE-1}, 1fr)`, gridTemplateRows: `repeat(${SIZE-1}, 1fr)` }}>
            {Array((SIZE-1)*(SIZE-1)).fill(0).map((_, i) => (
              <div key={i} className="border-[0.5px] border-gray-200/40"></div>
            ))}
          </div>
          
          {board.map((row, r) => row.map((cell, c) => (
            <div key={`${r}-${c}`} onClick={() => handleMove(r, c)} className="relative flex items-center justify-center z-10 cursor-pointer group">
              {cell !== 'NONE' ? (
                <div className={`
                  w-[85%] h-[85%] rounded-full shadow-md transition-all duration-300 relative
                  ${cell === 'BLACK' ? 'bg-gradient-to-br from-gray-700 to-black' : 'bg-gradient-to-br from-white to-gray-100 border border-gray-100'}
                  ${lastMove?.r === r && lastMove?.c === c ? 'scale-110 ring-4 ring-green-100' : 'scale-100'}
                  ${isWinTile(r, c) ? 'ring-4 ring-yellow-400 animate-pulse z-20 scale-110' : ''}
                `}>
                  {isWinTile(r, c) && <div className="absolute inset-0 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div></div>}
                </div>
              ) : (
                <div className="w-2 h-2 bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              )}
            </div>
          )))}
        </div>
      </div>

      <div className="mt-12 flex items-center gap-4">
        <button onClick={reset} className="bg-black text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition">Restart Game</button>
      </div>

      {winner !== 'NONE' && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="text-6xl mb-6">{winner === 'BLACK' ? '👤' : '🤖'}</div>
           <h3 className="text-3xl font-light text-gray-900">{winner === 'BLACK' ? '玩家胜出' : 'AI 胜出'}</h3>
           <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2 font-bold">{winner === 'BLACK' ? 'Human Victory' : 'Master Defeated You'}</p>
           <div className="mt-16 flex flex-col gap-4 w-full max-w-xs">
             <button onClick={reset} className="bg-black text-white py-5 rounded-full font-bold shadow-xl active:scale-95 transition">再战一局</button>
             <button onClick={onBack} className="text-gray-400 text-[10px] font-black uppercase tracking-widest py-2">Return to Hall</button>
           </div>
        </div>
      )}
    </div>
  );
};
