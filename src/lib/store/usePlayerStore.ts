import { create } from 'zustand';
import { Player, PlayerModifier } from '../types';
import { getStartingMoney } from '../utils';

interface PlayerState {
  players: Player[];
}

interface PlayerActions {
  addPlayer: (id: string, name: string, color: string, roleId: string, isAI?: boolean) => void;
  removePlayer: (id: string) => void;
  updateMoney: (playerId: string, amount: number) => void;
  movePlayer: (playerId: string, steps: number) => void;
  moveToTile: (playerId: string, tileId: number) => void;
  setPosition: (playerId: string, tileId: number) => void;
  addProperty: (playerId: string, tileId: number) => void;
  removeProperty: (playerId: string, tileId: number) => void;
  jailPlayer: (playerId: string) => void;
  releasePlayer: (playerId: string) => void;
  decrementJailTurns: (playerId: string) => void;
  setSkipTurns: (playerId: string, turns: number) => void;
  decrementSkipTurns: (playerId: string) => void;
  addModifier: (playerId: string, modifier: PlayerModifier) => void;
  tickModifiers: (playerId: string) => void;
  setBankrupt: (playerId: string) => void;
  useTravelCharge: (playerId: string) => void;
  getPlayer: (playerId: string) => Player | undefined;
  resetPlayers: () => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>()((set, get) => ({
  players: [],

  addPlayer: (id, name, color, roleId, isAI = false) =>
    set((s) => ({
      players: [
        ...s.players,
        {
          id,
          name,
          money: getStartingMoney(),
          position: 0,
          color,
          roleId,
          properties: [],
          jailed: false,
          jailTurns: 0,
          bankrupt: false,
          skipTurns: 0,
          modifiers: [],
          isAI,
          travelCharges: roleId === 'travel' ? 3 : 0,
        },
      ],
    })),

  removePlayer: (id) =>
    set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

  updateMoney: (playerId, amount) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, money: p.money + amount } : p
      ),
    })),

  movePlayer: (playerId, steps) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, position: (p.position + steps) % 40 } : p
      ),
    })),

  moveToTile: (playerId, tileId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, position: tileId } : p
      ),
    })),

  setPosition: (playerId, tileId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, position: tileId } : p
      ),
    })),

  addProperty: (playerId, tileId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? { ...p, properties: [...p.properties, tileId] }
          : p
      ),
    })),

  removeProperty: (playerId, tileId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? { ...p, properties: p.properties.filter((id) => id !== tileId) }
          : p
      ),
    })),

  jailPlayer: (playerId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? { ...p, jailed: true, jailTurns: 3, position: 10 }
          : p
      ),
    })),

  releasePlayer: (playerId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, jailed: false, jailTurns: 0 } : p
      ),
    })),

  decrementJailTurns: (playerId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? { ...p, jailTurns: Math.max(0, p.jailTurns - 1) }
          : p
      ),
    })),

  setSkipTurns: (playerId, turns) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, skipTurns: turns } : p
      ),
    })),

  decrementSkipTurns: (playerId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? { ...p, skipTurns: Math.max(0, p.skipTurns - 1) }
          : p
      ),
    })),

  addModifier: (playerId, modifier) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? { ...p, modifiers: [...p.modifiers, modifier] }
          : p
      ),
    })),

  tickModifiers: (playerId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              modifiers: p.modifiers
                .map((m) => ({ ...m, turnsRemaining: m.turnsRemaining - 1 }))
                .filter((m) => m.turnsRemaining > 0),
            }
          : p
      ),
    })),

  setBankrupt: (playerId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, bankrupt: true } : p
      ),
    })),

  useTravelCharge: (playerId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? { ...p, travelCharges: Math.max(0, p.travelCharges - 1) }
          : p
      ),
    })),

  getPlayer: (playerId) => get().players.find((p) => p.id === playerId),

  resetPlayers: () => set({ players: [] }),
}));
