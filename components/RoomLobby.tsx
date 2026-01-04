
import React, { useState, useEffect } from 'react';
import { RoomInfo } from '../types';

interface RoomLobbyProps {
  onJoin: (room: RoomInfo) => void;
  onBack: () => void;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({ onJoin, onBack }) => {
  const [view, setView] = useState<'SELECT' | 'CREATE' | 'JOIN'>('SELECT');
  const [roomCode, setRoomCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [status, setStatus] = useState('等待玩家...');

  const startCreate = () => {
    const code = Math.floor(100 + Math.random() * 900).toString();
    setGeneratedCode(code);
    setView('CREATE');
  };

  const handleKeypad = (num: string) => {
    if (roomCode.length < 3) {
      const newCode = roomCode + num;
      setRoomCode(newCode);
      if (newCode.length === 3) {
        // 模拟验证逻辑
        setStatus('正在连接房间...');
        setTimeout(() => {
          onJoin({ code: newCode, isHost: false, isJoined: true });
        }, 800);
      }
    }
  };

  const deleteNum = () => {
    setRoomCode(roomCode.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-full py-10 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-light text-gray-800">多人联机大厅</h2>
        <p className="text-gray-400 text-[10px] mt-2 tracking-[0.3em] uppercase font-bold">Multiplayer Lobby</p>
      </div>

      {view === 'SELECT' && (
        <div className="space-y-6">
          <button 
            onClick={startCreate}
            className="w-full group p-8 rounded-[2.5rem] bg-black text-white flex items-center justify-between shadow-2xl active:scale-95 transition-transform"
          >
            <div className="text-left">
              <span className="text-sm font-black uppercase tracking-widest opacity-60">Host</span>
              <h3 className="text-xl font-bold mt-1">创建房间</h3>
            </div>
            <span className="text-3xl">🏠</span>
          </button>

          <button 
            onClick={() => setView('JOIN')}
            className="w-full group p-8 rounded-[2.5rem] bg-white border border-gray-100 flex items-center justify-between shadow-sm active:scale-95 transition-transform"
          >
            <div className="text-left">
              <span className="text-sm font-black uppercase tracking-widest text-gray-300">Client</span>
              <h3 className="text-xl font-bold text-gray-800 mt-1">加入房间</h3>
            </div>
            <span className="text-3xl">🔑</span>
          </button>
        </div>
      )}

      {view === 'CREATE' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-12">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] mb-4">Room Code</span>
            <div className="flex gap-4">
              {generatedCode.split('').map((char, i) => (
                <div key={i} className="w-16 h-20 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-3xl font-black text-gray-800 shadow-inner">
                  {char}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
            <p className="text-xs text-gray-400 font-medium animate-pulse">正在等待其他玩家通过验证码加入...</p>
          </div>

          <button 
            onClick={() => onJoin({ code: generatedCode, isHost: true, isJoined: true })}
            className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-gray-200 pb-1"
          >
            [ 调试模式：模拟玩家进入 ]
          </button>
        </div>
      )}

      {view === 'JOIN' && (
        <div className="flex-1 flex flex-col items-center">
          <div className="flex flex-col items-center mb-12">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] mb-6">Enter 3-Digit Code</span>
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${roomCode[i] ? 'border-black bg-white text-black' : 'border-gray-100 bg-gray-50 text-gray-200'}`}>
                  {roomCode[i] || '•'}
                </div>
              ))}
            </div>
            {status !== '等待玩家...' && <p className="mt-6 text-xs text-green-500 font-bold">{status}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key, i) => (
              <button
                key={i}
                disabled={key === ''}
                onClick={() => key === 'delete' ? deleteNum() : handleKeypad(key)}
                className={`h-16 rounded-2xl flex items-center justify-center text-xl font-bold transition-all ${
                  key === 'delete' ? 'bg-gray-50 text-gray-400' : 
                  key === '' ? 'opacity-0' : 'bg-white border border-gray-100 text-gray-800 active:bg-gray-100'
                }`}
              >
                {key === 'delete' ? '←' : key}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-10 text-center">
        <button 
          onClick={view === 'SELECT' ? onBack : () => { setView('SELECT'); setRoomCode(''); }}
          className="text-[10px] text-gray-300 font-black uppercase tracking-widest hover:text-gray-500 transition-colors"
        >
          {view === 'SELECT' ? 'Back to Mode Select' : 'Cancel and Back'}
        </button>
      </div>
    </div>
  );
};
