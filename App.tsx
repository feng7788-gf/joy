
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { GameType, GameMode, RoomInfo } from './types';
import { GomokuGame } from './components/GomokuGame';
import { DiceGame } from './components/DiceGame';
import { MahjongGame } from './components/MahjongGame';
import { ChineseChess } from './components/ChineseChess';
import { RoomLobby } from './components/RoomLobby';

const App: React.FC = () => {
  const [view, setView] = useState<'LOBBY' | 'MODE_SELECT' | 'ROOM_LOBBY' | 'GAME'>('LOBBY');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

  const games = [
    { type: GameType.DICE, name: '摇骰子', icon: '🎲', desc: '自由落骰，点数随机' },
    { type: GameType.GOMOKU, name: '五子棋', icon: '⚪', desc: '黑白博弈，五子连珠' },
    { type: GameType.CHESS, name: '中国象棋', icon: '♟️', desc: '楚河汉界，残局破解' },
    { type: GameType.MAHJONG, name: '中国麻将', icon: '🀄', desc: '雀神四方，人机竞技' },
  ];

  const allModes = [
    { type: GameMode.SINGLE, name: '残局破解', desc: '经典棋谱挑战', icon: '🧩' },
    { type: GameMode.AI, name: '人机对战', desc: '练习竞技水平', icon: '🤖' },
    { type: GameMode.MULTIPLAYER, name: '多人模式', desc: '联机房间对弈', icon: '👥' },
  ];

  const getAvailableModes = (gameType: GameType) => {
    switch (gameType) {
      case GameType.DICE: return []; 
      case GameType.CHESS: return allModes; 
      case GameType.GOMOKU: return allModes.filter(m => m.type !== GameMode.SINGLE); 
      case GameType.MAHJONG: return allModes.filter(m => m.type !== GameMode.SINGLE); 
      default: return [];
    }
  };

  const handleGameSelect = (game: GameType) => {
    setSelectedGame(game);
    const modes = getAvailableModes(game);
    if (modes.length === 0) {
      setSelectedMode(GameMode.SINGLE);
      setView('GAME');
    } else {
      setView('MODE_SELECT');
    }
  };

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
    if (mode === GameMode.MULTIPLAYER) {
      setView('ROOM_LOBBY');
    } else {
      setView('GAME');
    }
  };

  const handleJoinRoom = (room: RoomInfo) => {
    setRoomInfo(room);
    setView('GAME');
  };

  const renderContent = () => {
    if (view === 'LOBBY') {
      return (
        <div className="space-y-12 py-10 animate-in fade-in duration-700">
          <div className="px-2">
            <h2 className="text-4xl font-light text-gray-900 tracking-tighter">家庭聚会游戏中心</h2>
            <p className="text-gray-400 text-sm mt-2 font-light tracking-widest uppercase">Family Gathering Hub</p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {games.map((g) => (
              <button 
                key={g.type}
                onClick={() => handleGameSelect(g.type)}
                className="group flex items-center justify-between p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm active:scale-[0.98] transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-center gap-6">
                   <span className="text-5xl">{g.icon}</span>
                   <div className="text-left">
                     <h4 className="text-xl font-medium text-gray-800 tracking-tight">{g.name}</h4>
                     <p className="text-xs text-gray-400 font-light mt-1">{g.desc}</p>
                   </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black transition-colors">
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (view === 'MODE_SELECT') {
      const modes = getAvailableModes(selectedGame!);
      return (
        <div className="space-y-10 py-10 animate-in slide-in-from-right-4 duration-500">
          <div className="text-center">
            <h2 className="text-2xl font-light text-gray-800">选择对战方式</h2>
            <p className="text-gray-400 text-xs mt-2 tracking-widest uppercase">Select Mode</p>
          </div>
          <div className="space-y-4">
            {modes.map((m) => (
              <button
                key={m.type}
                onClick={() => handleModeSelect(m.type)}
                className="w-full bg-white p-6 rounded-[2rem] flex items-center gap-5 border border-gray-50 shadow-sm active:bg-gray-50 transition-all hover:shadow-md"
              >
                <span className="text-3xl">{m.icon}</span>
                <div className="text-left flex-1">
                  <h3 className="font-medium text-gray-800">{m.name}</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mt-1">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (view === 'ROOM_LOBBY') {
      return <RoomLobby onJoin={handleJoinRoom} onBack={() => setView('MODE_SELECT')} />;
    }

    return (
      <div className="h-full animate-in zoom-in-95 duration-500 relative">
         {roomInfo && (
           <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[100] px-4 py-1 bg-black text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 opacity-50">
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
             Room: {roomInfo.code} ({roomInfo.isHost ? 'Host' : 'Member'})
           </div>
         )}
         {selectedGame === GameType.GOMOKU && <GomokuGame mode={selectedMode!} onBack={() => setView('LOBBY')} />}
         {selectedGame === GameType.DICE && <DiceGame onBack={() => setView('LOBBY')} />}
         {selectedGame === GameType.MAHJONG && <MahjongGame onBack={() => setView('LOBBY')} />}
         {selectedGame === GameType.CHESS && <ChineseChess mode={selectedMode!} onBack={() => setView('LOBBY')} />}
      </div>
    );
  };

  return (
    <Layout title="" onBack={view !== 'LOBBY' ? () => {
      if (view === 'GAME' && selectedMode === GameMode.MULTIPLAYER) setView('ROOM_LOBBY');
      else if (view === 'ROOM_LOBBY') setView('MODE_SELECT');
      else if (view === 'GAME') setView('MODE_SELECT');
      else setView('LOBBY');
    } : undefined}>
      {renderContent()}
    </Layout>
  );
};

export default App;
