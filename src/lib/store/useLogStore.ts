import { create } from 'zustand';
import { LogEntry } from '../types';

interface LogState {
  log: LogEntry[];
}

interface LogActions {
  addLog: (turn: number, playerId: string, message: string) => void;
  clearLog: () => void;
}

export const useLogStore = create<LogState & LogActions>()((set) => ({
  log: [],

  addLog: (turn, playerId, message) =>
    set((s) => ({
      log: [
        ...s.log,
        { turn, playerId, message, timestamp: Date.now() },
      ],
    })),

  clearLog: () => set({ log: [] }),
}));
