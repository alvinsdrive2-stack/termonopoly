import { create } from 'zustand';
import { BuildingLevel } from '../types';
import { TILES } from '../tiles';

interface BoardState {
  tiles: typeof TILES;
  tileOwners: Record<number, string | null>;
  buildingLevels: Record<number, BuildingLevel>;
  mortgagedTiles: Record<number, boolean>;
  auctionTileId: number | null;
  auctionBids: Record<string, number>;
}

interface BoardActions {
  initBoard: () => void;
  setTileOwner: (tileId: number, playerId: string | null) => void;
  setBuildingLevel: (tileId: number, level: BuildingLevel) => void;
  increaseBuilding: (tileId: number) => void;
  mortgageTile: (tileId: number) => void;
  unmortgageTile: (tileId: number) => void;
  startAuction: (tileId: number) => void;
  placeBid: (playerId: string, amount: number) => void;
  endAuction: () => { winnerId: string | null; amount: number };
  getTileOwner: (tileId: number) => string | null;
  getBuildingLevel: (tileId: number) => BuildingLevel;
  isMortgaged: (tileId: number) => boolean;
  resetBoard: () => void;
}

export const useBoardStore = create<BoardState & BoardActions>()((set, get) => ({
  tiles: TILES,
  tileOwners: {},
  buildingLevels: {},
  mortgagedTiles: {},
  auctionTileId: null,
  auctionBids: {},

  initBoard: () => {
    const owners: Record<number, string | null> = {};
    const levels: Record<number, BuildingLevel> = {};
    TILES.forEach((t) => {
      owners[t.id] = null;
      levels[t.id] = 0;
    });
    set({ tileOwners: owners, buildingLevels: levels, mortgagedTiles: {} });
  },

  setTileOwner: (tileId, playerId) =>
    set((s) => ({
      tileOwners: { ...s.tileOwners, [tileId]: playerId },
    })),

  setBuildingLevel: (tileId, level) =>
    set((s) => ({
      buildingLevels: { ...s.buildingLevels, [tileId]: level },
    })),

  increaseBuilding: (tileId) =>
    set((s) => ({
      buildingLevels: {
        ...s.buildingLevels,
        [tileId]: Math.min(5, (s.buildingLevels[tileId] || 0) + 1) as BuildingLevel,
      },
    })),

  mortgageTile: (tileId) =>
    set((s) => ({
      mortgagedTiles: { ...s.mortgagedTiles, [tileId]: true },
      buildingLevels: { ...s.buildingLevels, [tileId]: 0 },
    })),

  unmortgageTile: (tileId) =>
    set((s) => ({
      mortgagedTiles: { ...s.mortgagedTiles, [tileId]: false },
    })),

  startAuction: (tileId) =>
    set({ auctionTileId: tileId, auctionBids: {} }),

  placeBid: (playerId, amount) =>
    set((s) => ({
      auctionBids: { ...s.auctionBids, [playerId]: amount },
    })),

  endAuction: () => {
    const { auctionBids } = get();
    let winnerId: string | null = null;
    let maxBid = 0;
    for (const [pid, bid] of Object.entries(auctionBids)) {
      if (bid > maxBid) {
        maxBid = bid;
        winnerId = pid;
      }
    }
    set({ auctionTileId: null, auctionBids: {} });
    return { winnerId, amount: maxBid };
  },

  getTileOwner: (tileId) => get().tileOwners[tileId] ?? null,

  getBuildingLevel: (tileId) => get().buildingLevels[tileId] ?? 0,

  isMortgaged: (tileId) => get().mortgagedTiles[tileId] ?? false,

  resetBoard: () => {
    const owners: Record<number, string | null> = {};
    const levels: Record<number, BuildingLevel> = {};
    TILES.forEach((t) => {
      owners[t.id] = null;
      levels[t.id] = 0;
    });
    set({
      tileOwners: owners,
      buildingLevels: levels,
      mortgagedTiles: {},
      auctionTileId: null,
      auctionBids: {},
    });
  },
}));
