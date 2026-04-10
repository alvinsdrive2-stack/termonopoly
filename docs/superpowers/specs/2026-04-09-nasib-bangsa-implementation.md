# Game Nasib Bangsa - Implementation Spec

**Tanggal:** 2026-04-09
**Scope:** Local multiplayer (hotseat + AI), semua fitur core
**Bahasa:** Full Bahasa Indonesia
**Visual Style:** Indonesian Retro

---

## Arsitektur

### Modular Zustand Stores

```
React Components
     ↓
Game Logic Layer (useGameActions, selectors, engine functions)
     ↓
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ useGameStore │ usePlayerStore│ useBoardStore│ useCardStore │
│ - phase      │ - players[]   │ - tiles[]    │ - decks[]    │
│ - turnNumber │ - money       │ - owners     │ - drawCard() │
│ - diceValues │ - position    │ - buildings  │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
┌──────────────┬──────────────┐
│ useRoleStore │ useLogStore  │
│ - roles[]    │ - log[]      │
│ - abilities  │              │
└──────────────┴──────────────┘
```

---

## Struktur Komponen

```
src/
├── app/
│   ├── page.tsx                    # Game entry point
│   └── game/
│       ├── GameBoard.tsx           # Papan game utama
│       │   ├── BoardTile.tsx       # Petak individual
│       │   ├── PlayerToken.tsx     # Bidak pemain
│       │   └── CenterArea.tsx      # Area tengah (dadu, kartu, kontrol)
│       ├── PlayerPanel.tsx         # Panel info pemain
│       │   ├── PlayerCard.tsx
│       │   ├── PropertyList.tsx
│       │   └── RoleBadge.tsx
│       └── modals/
│           ├── PropertyModal.tsx
│           ├── AuctionModal.tsx
│           ├── CardModal.tsx
│           └── GameOverModal.tsx
├── lib/
│   ├── store/
│   │   ├── useGameStore.ts
│   │   ├── usePlayerStore.ts
│   │   ├── useBoardStore.ts
│   │   ├── useCardStore.ts
│   │   ├── useRoleStore.ts
│   │   └── useLogStore.ts
│   ├── game/
│   │   ├── engine.ts               # Game logic
│   │   ├── actions.ts              # All game actions
│   │   ├── selectors.ts            # State selectors
│   │   └── mechanics/
│   │       ├── movement.ts         # Movement logic
│   │       ├── rent.ts             # Rent calculation
│   │       ├── cards.ts            # Card effects
│   │       ├── roles.ts            # Role abilities
│   │       ├── auctions.ts         # Auction logic
│   │       └── building.ts         # Building system
│   ├── ai/
│   │   └── bot.ts                  # AI decision logic
│   └── types.ts
└── components/
    ├── ui/                          # Reusable UI
    └── game/                        # Game-specific
```

---

## Alur Permainan

1. **Setup Phase**
   - Pilih jumlah pemain (2-6)
   - Set mode per pemain (Manusia/AI)
   - Pilih role per pemain
   - Set uang awal (Rp5.000.000)

2. **Turn Flow**
   ```
   Mulai Giliran
   → Cek: Dipenjara? (Skip/Bayar/Lempar dadu)
   → Lempar Dadu
   → Gerakkan Token (animasi tile by tile)
   → Cek: Lewat START? (+Rp2.000.000)
   → Cek Petak:
   - Properti: Beli/Bayar Sewa
   - Transport/Utility: Bayar sewa
   - Kartu: Ambil & eksekusi efek
   - Pajak: Bayar
   - Sudut: Jail/Healing
   → Cek Ability Role
   → Cek Bankruptcy
   → Giliran Selanjutnya
   ```

3. **Win Condition**
   - Pemain bangkrut (uang < 0 & tidak bisa jual/gadai)
   - 1 pemain tersisa = MENANG

---

## Game Mechanics

### 1. Movement
- Dadu: 2x dadu 6 sisi
- Doubles: Lempar lagi, 3x = Penjara
- Lewat START: +Rp2.000.000

### 2. Properties
- **Beli**: Harga di card, jika tidak punya pemilik
- **Sewa Tanah Kosong**: baseRent
- **Sewa dengan Bangunan**: rentWithBuildings[level]
- **Monopoli**: Punya semua warna = sewa 2x di tanah kosong
- **Bangun**: Butuh set warna lengkap, maksimal 4 rumah → 1 hotel
- **Utilitas**: 1 utilitas = dadu × 10.000, 2 = dadu × 20.000
- **Transport**: 1-4 stasiun = Rp250rb, Rp500rb, Rp1jt, Rp2jt

### 3. Cards
- 20 Dana Umum + 20 Kesempatan
- Shuffle deck di awal
- Efek beragam: gain/lose money, movement, modifiers

### 4. Role Abilities
- 10 role unik dengan passive & debuff
- Trigger otomatis saat kondisi terpenuhi

### 5. Jail (Operasi Zebra)
- Masuk: Petak 30 atau 3x doubles
- Keluar: 3 putaran, atau bayar Rp500rb, atau lempar doubles

### 6. Auction
- Jika tolak beli properti kosong
- Mulai dari Rp100.000
- Tawaran tertinggi menang

### 7. Mortgage/Selling
- Gadai: 50% harga beli
- Jual bangunan: 50% harga beli

---

## Indonesian Retro Visual Style

```typescript
const RETRO_COLORS = {
  merahBata: '#C41E3A',    // ABC sauce
  kunyit: '#D4A017',       // Turmeric
  daun: '#228B22',         // Spinach
  garam: '#F5F5DC',        // Salt
  lada: '#2F2F2F',         // Pepper
  sambal: '#DC143C',       // Chili
  jeruk: '#FF8C00',        // Orange
  kemiri: '#8B4513',       // Candlenut
};
```

- **Font**: Rokkitt (headings), Inter (body)
- **Border**: 2px solid, rounded 8px
- **Shadow**: Soft warm shadows
- **Pattern**: Subtle paper texture (optional)

---

## State Slices

### useGameStore
```typescript
{
  phase: GamePhase
  currentPlayerIndex: number
  diceValues: [number, number]
  doublesCount: number
  currentCard: Card | null
  winner: string | null
  turnNumber: number
}
```

### usePlayerStore
```typescript
{
  players: Player[]
  // Player: { id, name, money, position, color, roleId, properties, jailed, jailTurns, bankrupt, skipTurns, modifiers }
}
```

### useBoardStore
```typescript
{
  tiles: Tile[]
  tileOwners: Record<number, string>
  buildingLevels: Record<number, BuildingLevel>
  auctionTileId: number | null
  auctionBids: Record<string, number>
}
```

### useCardStore
```typescript
{
  danaUmumDeck: Card[]
  kesempatanDeck: Card[]
  currentCard: Card | null
}
```

### useRoleStore
```typescript
{
  roles: Role[]
  getRole: (id: string) => Role
  applyAbility: (playerId: string, context: GameContext) => void
}
```

### useLogStore
```typescript
{
  log: LogEntry[]
  // LogEntry: { turn, playerId, message, timestamp }
}
```

---

## Bahasa Indonesia

**Semua UI dalam Bahasa Indonesia:**
- Tombol: "Lempar Dadu", "Beli", "Bangun", "Akhiri Giliran"
- Pesan: "Giliran [Nama]", "Kamu mendapat [Kartu]!"
- Log: "🎲 Budi melempar 4 + 3 = 7", "💰 Siti membeli Kontrakan"
- Error: "Uang tidak cukup!", "Properti sudah dimiliki"

---

## Implementation Priority

### Phase 1: Foundation
1. Setup Zustand stores
2. Create base components structure
3. Render static board with tiles
4. Player tokens on board

### Phase 2: Core Gameplay
5. Dice rolling & movement
6. Property buying
7. Rent calculation
8. Turn management

### Phase 3: Advanced Features
9. Building system
10. Card effects
11. Role abilities
12. Auctions

### Phase 4: Polish
13. AI logic
14. Animations (Framer Motion)
15. Sound effects (optional)
16. Win/lose screens

---

## Tech Stack

- **Frontend**: Next.js 16.2.2, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **State**: Zustand 5
- **Animation**: Framer Motion 12
- **Icons**: Lucide React atau custom SVG

---

## Notes

- Modular code untuk kemudahan tambah fitur
- Semua teks Bahasa Indonesia
- Indonesian Retro visual style
- Siap untuk multiplayer (nanti tambah WebSocket layer)
