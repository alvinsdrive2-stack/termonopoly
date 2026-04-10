// Tile categories
export type TileCategory = 'property' | 'transport' | 'utility' | 'tax' | 'corner' | 'card';

// Color groups for properties
export type ColorGroup = 'brown' | 'lightBlue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'darkBlue';

// Corner types
export type CornerType = 'start' | 'jail' | 'healing' | 'goToJail';

// Card types
export type CardType = 'danaUmum' | 'kesempatan';

// Building levels: 0-4 houses, 5 = hotel
export type BuildingLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface Tile {
  id: number; // 0-39
  name: string;
  category: TileCategory;
  colorGroup?: ColorGroup;
  price?: number; // purchase price
  baseRent?: number; // rent with 0 buildings
  rentWithBuildings?: number[]; // [1house, 2house, 3house, 4house, hotel]
  cornerType?: CornerType;
  cardType?: CardType;
  taxAmount?: number;
  description?: string; // satirical description
  buildCost?: number; // cost per house
}

export interface Player {
  id: string;
  name: string;
  money: number;
  position: number;
  color: string; // player token color
  roleId: string;
  properties: number[]; // tile IDs owned
  jailed: boolean;
  jailTurns: number;
  bankrupt: boolean;
  skipTurns: number; // for "Macet Total" card etc
  modifiers: PlayerModifier[];
  isAI: boolean;
  travelCharges: number; // Supir Travel passive: 3 uses per game
}

export interface PlayerModifier {
  type: string;
  turnsRemaining: number;
  value: number;
}

export interface Card {
  id: string;
  type: CardType;
  title: string;
  description: string;
  effect: CardEffect;
}

export type CardEffect =
  | { type: 'gainMoney'; amount: number }
  | { type: 'loseMoney'; amount: number }
  | { type: 'payEachPlayer'; amount: number }
  | { type: 'moveTo'; position: number; collectSalary: boolean }
  | { type: 'moveBackward'; steps: number }
  | { type: 'moveForward'; steps: number }
  | { type: 'skipTurns'; turns: number }
  | { type: 'payOrMove'; amount: number; position: number }
  | { type: 'rentMultiplier'; multiplier: number; turns: number }
  | { type: 'sellProperty'; priceMultiplier: number }
  | { type: 'buildDiscount'; discount: number }
  | { type: 'swapPosition' }
  | { type: 'nearestEmpty'; buy: boolean }
  | { type: 'payBank'; amount: number }
  | { type: 'takeFromRichest'; amount: number }
  | { type: 'noSalary' }
  | { type: 'rentIncrease'; percentage: number; turns: number }
  | { type: 'mustBuyNext' }
  | { type: 'destroyAllHotels'; compensationPercent: number }
  | { type: 'freeRent' }
  | { type: 'gainMoneySkipTurn'; amount: number }
  | { type: 'takeFromNearest'; amount: number }
  | { type: 'gotoJail' }
  | { type: 'shiftPropertiesRight' };

export interface Role {
  id: string;
  name: string;
  nickname: string;
  description: string;
  passive: string;
  debuff?: string;
  color: string;
}

export type GamePhase = 'setup' | 'rolling' | 'moving' | 'action' | 'cardAction' | 'travel' | 'trading' | 'gameOver' | 'done';

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  diceValues: [number, number];
  doublesCount: number;
  tiles: Tile[];
  danaUmumDeck: Card[];
  kesempatanDeck: Card[];
  currentCard: Card | null;
  turnNumber: number;
  winner: string | null;
  auctionTileId: number | null;
  auctionBids: Record<string, number>;
  log: LogEntry[];
}

export interface LogEntry {
  turn: number;
  playerId: string;
  message: string;
  timestamp: number;
}
