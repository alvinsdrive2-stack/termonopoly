import { Tile, Player, Card, CardEffect, BuildingLevel, ColorGroup } from '../types';
import { TILES } from '../tiles';
import { getSalary } from '../utils';

// ========= RENT CALCULATION =========

export function calculateRent(
  tile: Tile,
  buildingLevel: BuildingLevel,
  ownerPlayerCount: { transport: number; utility: number },
  diceTotal: number,
  hasMonopoly: boolean
): number {
  if (tile.category === 'transport') {
    if (ownerPlayerCount.transport === 0) return 0;
    const counts = [250000, 500000, 1000000, 2000000];
    return counts[Math.min(ownerPlayerCount.transport - 1, 3)];
  }

  if (tile.category === 'utility') {
    const multiplier = ownerPlayerCount.utility >= 2 ? 20000 : 10000;
    return diceTotal * multiplier;
  }

  if (tile.category !== 'property') return 0;

  if (buildingLevel === 0) {
    return hasMonopoly ? (tile.baseRent ?? 0) * 2 : (tile.baseRent ?? 0);
  }

  if (buildingLevel === 5) {
    // Hotel rent = 2x the 4-house rent
    return (tile.rentWithBuildings?.[3] ?? 0) * 2;
  }

  return tile.rentWithBuildings?.[buildingLevel - 1] ?? 0;
}

export function hasColorMonopoly(
  playerProperties: number[],
  colorGroup: ColorGroup
): boolean {
  const groupTiles = TILES.filter(
    (t) => t.category === 'property' && t.colorGroup === colorGroup
  );
  return groupTiles.every((t) => playerProperties.includes(t.id));
}

export function countOwnedType(
  playerProperties: number[],
  category: 'transport' | 'utility'
): number {
  return TILES.filter(
    (t) => t.category === category && playerProperties.includes(t.id)
  ).length;
}

// ========= MOVEMENT =========

export function movePlayer(
  currentPosition: number,
  steps: number
): { newPosition: number; passedStart: boolean } {
  const newPos = (currentPosition + steps) % 40;
  const passedStart = currentPosition + steps >= 40;
  return { newPosition: newPos, passedStart };
}

export function shouldGoToJail(position: number): boolean {
  return position === 30;
}

// ========= BUILDING =========

export function canBuild(
  tileId: number,
  playerProperties: number[],
  buildingLevels: Record<number, BuildingLevel>
): boolean {
  const tile = TILES.find((t) => t.id === tileId);
  if (!tile || tile.category !== 'property' || !tile.colorGroup) return false;

  const currentLevel = buildingLevels[tileId] ?? 0;
  if (currentLevel >= 5) return false;

  if (!hasColorMonopoly(playerProperties, tile.colorGroup)) return false;

  const groupTiles = TILES.filter(
    (t) => t.category === 'property' && t.colorGroup === tile.colorGroup
  );

  const maxDiff = currentLevel;
  for (const gt of groupTiles) {
    const otherLevel = buildingLevels[gt.id] ?? 0;
    if (gt.id !== tileId && otherLevel < maxDiff) {
      return false;
    }
  }

  return true;
}

export function getBuildCost(tileId: number): number {
  const tile = TILES.find((t) => t.id === tileId);
  return tile?.buildCost ?? 0;
}

// ========= CARD EFFECTS =========

export function processCardEffect(
  effect: CardEffect,
  playerId: string,
  players: Player[],
  currentPosition: number,
  tileOwners?: Record<number, string | null>
): CardEffectResult {
  const result: CardEffectResult = {
    moneyChange: 0,
    newPosition: null,
    collectSalary: false,
    skipTurns: 0,
    goToJail: false,
    message: '',
  };

  switch (effect.type) {
    case 'gainMoney':
      result.moneyChange = effect.amount;
      result.message = `Mendapat Rp${effect.amount.toLocaleString('id-ID')}`;
      break;

    case 'loseMoney':
      result.moneyChange = -effect.amount;
      result.message = `Kehilangan Rp${effect.amount.toLocaleString('id-ID')}`;
      break;

    case 'payEachPlayer':
      const activeCount = players.filter((p) => !p.bankrupt && p.id !== playerId).length;
      result.moneyChange = -effect.amount * activeCount;
      result.message = `Bayar Rp${effect.amount.toLocaleString('id-ID')} ke ${activeCount} pemain`;
      break;

    case 'payBank':
      result.moneyChange = -effect.amount;
      result.message = `Bayar Rp${effect.amount.toLocaleString('id-ID')} ke Bank`;
      break;

    case 'moveTo':
      result.newPosition = effect.position;
      result.collectSalary = effect.collectSalary;
      const targetTile = TILES[effect.position];
      result.message = `Pindah ke ${targetTile?.name ?? effect.position}`;
      break;

    case 'moveBackward':
      result.newPosition = (currentPosition - effect.steps + 40) % 40;
      result.message = `Mundur ${effect.steps} langkah`;
      break;

    case 'moveForward':
      result.newPosition = (currentPosition + effect.steps) % 40;
      result.message = `Maju ${effect.steps} langkah`;
      break;

    case 'skipTurns':
      result.skipTurns = effect.turns;
      result.message = `Lewati ${effect.turns} giliran`;
      break;

    case 'gotoJail':
      result.goToJail = true;
      result.message = 'Masuk Operasi Zebra!';
      break;

    case 'gainMoneySkipTurn':
      result.moneyChange = effect.amount;
      result.skipTurns = 1;
      result.message = `Mendapat Rp${effect.amount.toLocaleString('id-ID')}, lewati 1 giliran`;
      break;

    case 'noSalary':
      result.addModifier = { type: 'noSalary', turnsRemaining: 1, value: 0 };
      result.message = 'Tidak mendapat gaji START kali ini!';
      break;

    case 'freeRent':
      result.message = 'Sewa gratis di petak ini!';
      break;

    case 'takeFromRichest': {
      const others = players.filter((p) => !p.bankrupt && p.id !== playerId);
      if (others.length === 0) { result.message = 'Tidak ada target'; break; }
      const richest = others.reduce((a, b) => (a.money > b.money ? a : b), others[0]);
      if (richest) {
        result.moneyChange = effect.amount;
        result.targetPlayerId = richest.id;
        result.targetAmount = -effect.amount;
        result.message = `Ambil Rp${effect.amount.toLocaleString('id-ID')} dari ${richest.name}`;
      }
      break;
    }

    case 'takeFromNearest': {
      const othersN = players.filter((p) => !p.bankrupt && p.id !== playerId);
      if (othersN.length === 0) { result.message = 'Tidak ada target'; break; }
      const nearest = othersN.reduce((best, p) => {
        const distBest = Math.min(Math.abs(best.position - currentPosition), 40 - Math.abs(best.position - currentPosition));
        const distP = Math.min(Math.abs(p.position - currentPosition), 40 - Math.abs(p.position - currentPosition));
        return distP < distBest ? p : best;
      }, othersN[0]);
      if (nearest) {
        result.moneyChange = effect.amount;
        result.targetPlayerId = nearest.id;
        result.targetAmount = -effect.amount;
        result.message = `Ambil Rp${effect.amount.toLocaleString('id-ID')} dari ${nearest.name}`;
      }
      break;
    }

    case 'payOrMove':
      result.message = `Bayar Rp${effect.amount.toLocaleString('id-ID')} atau pindah ke petak ${effect.position}`;
      result.payOrMove = { amount: effect.amount, position: effect.position };
      break;

    case 'rentMultiplier':
      result.addModifier = { type: 'rentMultiplier', turnsRemaining: effect.turns, value: effect.multiplier };
      result.message = `Sewa propertimu x${effect.multiplier} selama ${effect.turns} putaran`;
      break;

    case 'rentIncrease':
      result.addModifier = { type: 'rentIncrease', turnsRemaining: effect.turns, value: effect.percentage };
      result.message = `Sewa naik ${effect.percentage}% selama ${effect.turns} putaran`;
      break;

    case 'sellProperty': {
      const player = players.find((p) => p.id === playerId);
      if (player && player.properties.length > 0) {
        const sellTileId = player.properties[player.properties.length - 1];
        const sellTile = TILES.find((t) => t.id === sellTileId);
        const sellPrice = Math.floor((sellTile?.price ?? 0) * effect.priceMultiplier);
        result.moneyChange = sellPrice;
        result.removePropertyTileId = sellTileId;
        result.message = `Jual ${sellTile?.name} seharga Rp${sellPrice.toLocaleString('id-ID')}`;
      } else {
        result.message = 'Tidak ada properti untuk dijual';
      }
      break;
    }

    case 'buildDiscount':
      result.addModifier = { type: 'buildDiscount', turnsRemaining: 1, value: effect.discount };
      result.message = `Bangun rumah diskon ${effect.discount}%`;
      break;

    case 'swapPosition': {
      const othersS = players.filter((p) => !p.bankrupt && p.id !== playerId);
      const lastPlayer = othersS[othersS.length - 1];
      if (lastPlayer) {
        result.swapWithPlayerId = lastPlayer.id;
        result.message = `Tukar posisi dengan ${lastPlayer.name}`;
      }
      break;
    }

    case 'nearestEmpty': {
      let pos = currentPosition;
      for (let i = 1; i <= 40; i++) {
        const checkPos = (currentPosition + i) % 40;
        const tile = TILES[checkPos];
        if (tile && ['property', 'transport', 'utility'].includes(tile.category) && tile.price) {
          // Check if unowned using tileOwners map
          const isOwned = tileOwners ? tileOwners[checkPos] != null : false;
          if (!isOwned) {
            pos = checkPos;
            break;
          }
        }
      }
      result.newPosition = pos;
      result.message = `Maju ke petak kosong terdekat`;
      break;
    }

    case 'mustBuyNext':
      result.addModifier = { type: 'mustBuyNext', turnsRemaining: 1, value: 1 };
      result.message = 'Wajib beli petak selanjutnya!';
      break;

    case 'shiftPropertiesRight':
      result.shiftProperties = true;
      result.message = 'Semua pemain geser 1 properti ke kanan';
      break;

    case 'destroyAllHotels':
      result.destroyHotels = true;
      result.hotelCompensationPercent = effect.compensationPercent;
      result.message = `Semua hotel hancur! Kompensasi ${effect.compensationPercent}%`;
      break;

    default:
      result.message = 'Efek khusus aktif';
      break;
  }

  return result;
}

export interface CardEffectResult {
  moneyChange: number;
  newPosition: number | null;
  collectSalary: boolean;
  skipTurns: number;
  goToJail: boolean;
  message: string;
  // Extended results for complex card effects
  targetPlayerId?: string;
  targetAmount?: number;
  payOrMove?: { amount: number; position: number };
  addModifier?: { type: string; turnsRemaining: number; value: number };
  removePropertyTileId?: number;
  swapWithPlayerId?: string;
  shiftProperties?: boolean;
  destroyHotels?: boolean;
  hotelCompensationPercent?: number;
}

// ========= WIN CONDITION =========

export function checkWinCondition(players: Player[]): string | null {
  const active = players.filter((p) => !p.bankrupt);
  if (active.length === 1) return active[0].id;
  return null;
}

export function checkBankruptcy(player: Player): boolean {
  return player.money < 0 && player.properties.length === 0;
}

export function getNetWorth(player: Player, tileOwners: Record<number, string | null>): number {
  let worth = player.money;
  for (const tileId of player.properties) {
    const tile = TILES.find((t) => t.id === tileId);
    if (tile) {
      worth += (tile.price ?? 0) / 2;
    }
  }
  return worth;
}
