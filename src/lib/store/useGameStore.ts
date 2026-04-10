import { create } from 'zustand';
import { GamePhase } from '../types';

interface GameState {
  phase: GamePhase;
  currentPlayerIndex: number;
  diceValues: [number, number];
  rollGeneration: number;
  doublesCount: number;
  turnNumber: number;
  winner: string | null;
  // Animation state
  animatingPlayerId: string | null;
  animatingPath: number[]; // tile IDs the token steps through
  animatingStep: number;   // current step index in the path
  isAnimating: boolean;
}

interface GameActions {
  setPhase: (phase: GamePhase) => void;
  setDiceValues: (values: [number, number]) => void;
  incrementDoubles: () => void;
  resetDoubles: () => void;
  nextPlayer: (totalPlayers: number) => void;
  nextTurn: () => void;
  setWinner: (playerId: string) => void;
  resetGame: () => void;
  // Animation
  startAnimation: (playerId: string, path: number[]) => void;
  advanceAnimation: () => void;
  finishAnimation: () => void;
}

const initialState: GameState = {
  phase: 'setup',
  currentPlayerIndex: 0,
  diceValues: [1, 1],
  rollGeneration: 0,
  doublesCount: 0,
  turnNumber: 1,
  winner: null,
  animatingPlayerId: null,
  animatingPath: [],
  animatingStep: 0,
  isAnimating: false,
};

export const useGameStore = create<GameState & GameActions>()((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setDiceValues: (values) => set((s) => ({ diceValues: values, rollGeneration: s.rollGeneration + 1 })),

  incrementDoubles: () =>
    set((s) => ({ doublesCount: s.doublesCount + 1 })),

  resetDoubles: () => set({ doublesCount: 0 }),

  nextPlayer: (totalPlayers) =>
    set((s) => ({
      currentPlayerIndex: (s.currentPlayerIndex + 1) % totalPlayers,
    })),

  nextTurn: () =>
    set((s) => ({
      turnNumber: s.turnNumber + 1,
    })),

  setWinner: (playerId) => set({ winner: playerId, phase: 'gameOver' }),

  resetGame: () => set(initialState),

  startAnimation: (playerId, path) =>
    set({
      animatingPlayerId: playerId,
      animatingPath: path,
      animatingStep: 0,
      isAnimating: true,
    }),

  advanceAnimation: () =>
    set((s) => {
      const nextStep = s.animatingStep + 1;
      if (nextStep >= s.animatingPath.length) {
        return { isAnimating: false, animatingStep: 0, animatingPath: [] };
      }
      return { animatingStep: nextStep };
    }),

  finishAnimation: () =>
    set({
      animatingPlayerId: null,
      animatingPath: [],
      animatingStep: 0,
      isAnimating: false,
    }),
}));
