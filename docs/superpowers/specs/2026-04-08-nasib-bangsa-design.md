# Nasib Bangsa - Design Document

**Date**: 2026-04-08
**Type**: Board Game (Satirical Monopoly)
**Status**: Design Approved

## 1. Overview

A 40-tile board game where players navigate through Indonesian urban life, buy properties, avoid taxes, and use character-specific abilities.

### Game Modes
- **Single Player**: vs AI bots (2-4 players)
- **Local Multiplayer**: Hot-seat mode (2-4 players)

## 2. Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom Neo-Brutalism config
- **State**: Zustand (modular stores)
- **Animation**: Framer Motion
- **Database**: SQLite via better-sqlite3
- **Testing**: Playwright

## 3. Architecture

### Module Structure
```
src/
├── modules/
│   ├── board/      # Tile definitions, layout, path calculation
│   ├── player/     # Player state, position, money
│   ├── property/   # Ownership, rent, building
│   ├── card/       # Card deck management
│   ├── dice/       # Dice mechanics
│   ├── role/       # Character abilities
│   ├── game/       # Turn orchestration
│   └── ai/         # Bot decision making
├── stores/         # Zustand stores
├── components/     # UI components
├── hooks/          # Custom hooks
└── lib/            # Utilities
```

### Data Models

```typescript
type Tile = {
  id: number;
  name: string;
  type: 'property' | 'transport' | 'utility' | 'tax' | 'corner' | 'card';
  color?: string;
  price?: number;
  baseRent?: number;
  ownerId?: string;
  buildings: number;
}

type Player = {
  id: string;
  name: string;
  role: RoleId;
  position: number;
  money: number;
  properties: number[];
  jailed: boolean;
  jailTurns: number;
}

type GameState = {
  players: Player[];
  currentPlayer: number;
  phase: 'roll' | 'move' | 'action' | 'end';
  diceRolled: boolean;
  winner?: string;
}
```

## 4. Game Mechanics

### Movement
- Roll 2 dice (2-12 range)
- Move clockwise from START
- Doubles = roll again (max 3x)
- 3 doubles = go to jail (Operasi Zebra)

### Economy
- Properties can be bought when landing on unowned tiles
- Rent increases with buildings (4 houses → hotel)
- Monopoly = 2x base rent on undeveloped properties
- Mortgage = 50% value, 10% interest to redeem

### Special Tiles
- **Corners**: START (+2M), Healing (rest), Operasi Zebra (jail), Sidang (go to jail)
- **Transport**: 4 stations, rent based on ownership count
- **Utilities**: PLN/PDAM, rent = dice × multiplier
- **Cards**: Dana Umum (finance) and Kesempatan (movement/actions)

### Roles
10 unique roles with passive/active abilities (see dev.md for full list)

## 5. UI Design

Neo-Brutalism style:
- Colors: Lime-400, Pink-400, Yellow-400, Cyan-400
- Borders: `border-4 border-black`
- Shadows: `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`
- Spring animations via Framer Motion

## 6. Implementation Phases

1. **Phase 1**: Project setup, board layout, basic movement
2. **Phase 2**: Property system, buying, rent
3. **Phase 3**: Card system, special tiles
4. **Phase 4**: Role abilities, AI
5. **Phase 5**: Polish, animations, save/load
