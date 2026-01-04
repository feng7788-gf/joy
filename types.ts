
export enum GameType {
  DICE = 'DICE',
  GOMOKU = 'GOMOKU',
  CHESS = 'CHESS',
  MAHJONG = 'MAHJONG'
}

export enum GameMode {
  SINGLE = 'SINGLE',
  AI = 'AI',
  MULTIPLAYER = 'MULTIPLAYER'
}

export type Player = 'BLACK' | 'WHITE' | 'RED' | 'NONE';

export interface GameState {
  currentGame: GameType | null;
  mode: GameMode | null;
  history: any[];
}

export interface RoomInfo {
  code: string;
  isHost: boolean;
  isJoined: boolean;
}

// Gomoku Types
export interface GomokuState {
  board: Player[][];
  turn: Player;
  winner: Player;
}

// Chess Types
export type ChessPieceType = 'K' | 'A' | 'E' | 'H' | 'C' | 'N' | 'P';
export interface ChessPiece {
  type: ChessPieceType;
  side: 'RED' | 'BLACK';
}
export type ChessPos = { r: number; c: number };

// Mahjong Types
export interface MahjongTile {
  suit: 'Wan' | 'Pin' | 'Suo' | 'Wind' | 'Dragon';
  value: string | number;
}
