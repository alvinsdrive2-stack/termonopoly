import { TILES } from '../tiles';
import { BuildingLevel } from '../types';
import { canBuild, getBuildCost } from '../game/engine';

// AI decision: should buy property?
export function aiShouldBuy(tileId: number, money: number): boolean {
  const tile = TILES[tileId];
  if (!tile.price) return false;

  // Always buy if we can afford and still have 50% left
  if (money >= tile.price * 1.5) return true;

  // Buy transport/utility always if can afford
  if (['transport', 'utility'].includes(tile.category) && money >= tile.price) return true;

  // Buy cheap properties aggressively
  if (tile.price <= 1000000 && money >= tile.price) return true;

  // 50% chance to buy if barely can afford
  if (money >= tile.price && Math.random() > 0.5) return true;

  return false;
}

// AI decision: should build?
export function aiShouldBuild(
  playerProperties: number[],
  money: number,
  buildingLevels: Record<number, BuildingLevel>
): number | null {
  // Find buildable properties, prioritize cheaper builds
  const buildable: { tileId: number; cost: number }[] = [];

  for (const tileId of playerProperties) {
    if (canBuild(tileId, playerProperties, buildingLevels)) {
      const cost = getBuildCost(tileId);
      if (money >= cost * 1.5) {
        buildable.push({ tileId, cost });
      }
    }
  }

  if (buildable.length === 0) return null;

  // Sort by cost ascending (build cheapest first)
  buildable.sort((a, b) => a.cost - b.cost);
  return buildable[0].tileId;
}

// AI decision: pay jail or wait?
export function aiJailDecision(money: number): 'pay' | 'wait' {
  if (money >= 500000 * 4) return 'pay';
  if (money >= 500000 * 2 && Math.random() > 0.5) return 'pay';
  return 'wait';
}
