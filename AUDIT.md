# Termonopoly - Bug Audit & Multiplayer Plan

## Bug & Issues

### Critical

- [x] **Transport rent crash** — `engine.ts:15` — Fixed: added guard for transport count === 0.
- [x] **checkBankruptAndEndTurn infinite loop** — `ActionPanel.tsx:377` — Fixed: added safety counter (max 40 iterations).
- [x] **doublesCount stale closure** — `ActionPanel.tsx:258` — Fixed: read fresh doublesCount from store inside timeout.
- [x] **GameBoard dice roll duplikat** — `GameBoard.tsx:146-151` — Verified: setDiceValues in store already increments rollGeneration. Not a bug.

### High

- [ ] **Net worth ignore buildings** — `engine.ts:338-347` — `getNetWorth` cuma hitung 50% harga properti, gak include nilai bangunan.
- [ ] **PlayerPanel out of bounds** — `PlayerPanel.tsx:83` — `TILES[player.position]` bisa crash kalau position out of bounds. Tambah `% 40` atau null check.
- [ ] **formatMoney negative/zero** — `utils.ts:3-12` — Gak handle `amount === 0` (return "Rp0rb") atau negative dengan bener.
- [ ] **Sultan infinite debt** — Sultan bisa beli terus meski minus tanpa batas. Perlu limit atau mekanisme jual paksa.
- [ ] **No turn limit win condition** — Game bisa berlangsung tanpa batas. Perlu max turns, richest player menang.
- [ ] **increaseBuilding no validation** — `useBoardStore.ts:58` — `increaseBuilding` gak cek `canBuild()` dulu, bisa di-increment tanpa monopoly/even-build rule.

### Medium

- [ ] **Jail turn display bisa negative** — `ActionModal.tsx:409` — `(jailTurns ?? 1) - 1` bisa jadi `-1`. Pakai `Math.max(0, ...)`.
- [ ] **sellProperty always sells last** — `engine.ts:234` — Selalu jual properti terakhir, seharusnya jual yang termurah.
- [ ] **PlayerModifier type is string** — `types.ts:48` — `type: string` terlalu loose. Harus jadi union type `'noSalary' | 'rentMultiplier' | ...`.
- [ ] **Hardcoded magic numbers** — Salary 2M, starting money 5M, hotel multiplier 2x, dll tersebar di banyak file. Pindah ke constants.
- [ ] **No centralized game reset** — Masing-masing store punya reset sendiri, tapi gak ada satu fungsi yang reset semua sekaligus.
- [ ] **Auction system incomplete** — `useBoardStore.ts:85` — `endAuction` gak cek winner bisa bayar bid atau gak.
- [ ] **Floating money timer leak** — `ActionPanel.tsx:237` — setTimeout buat hapus floating money gak di-cleanup pas unmount.
- [ ] **DicePanel local isRolling vs parent rolling** — `DicePanel.tsx:93-102` — Local state `isRolling` bisa conflict sama parent `rolling` prop.

### Low

- [ ] **Missing ARIA attributes** — Modal popups gak punya `role="dialog"`, `aria-modal="true"`.
- [ ] **No player name validation** — SetupScreen gak validasi empty/duplicate names.
- [ ] **GameOverModal sorts every render** — `[...players].sort()` tiap render, should memoize.
- [ ] **No error boundary** — Kalau komponen crash, white screen.
- [ ] **No building sell-back** — Monopoly rules biasanya allow jual bangunan setengah harga. Belum ada mekanisme ini.
- [ ] **Mortgaged tiles still collect rent** — `calculateRent` gak cek `isMortgaged`. Properti yang dijaminkan seharusnya gak narik sewa.

---

## Multiplayer Plan (via Link)

Arsitektur: **Socket.io + Express server**, state in-memory (no DB).

### Phase 1: Server Setup

- [ ] Install dependencies: `socket.io`, `express`, `cors`
- [ ] Create `server/` folder with `index.ts` — Express + Socket.io server
- [ ] Create `server/roomManager.ts` — Room CRUD (create, join, leave, destroy)
- [ ] Create `server/gameState.ts` — In-memory game state per room
- [ ] Add `dev:server` script to package.json

### Phase 2: Game Engine Server-Side

- [ ] Extract game logic from ActionPanel.tsx into pure functions in `server/gameEngine.ts`
  - Roll dice (server-side RNG)
  - Process landing
  - Pay rent
  - Buy/build
  - Card effects
  - End turn
  - Win check
- [ ] All passive skills (Magang, Creator, Kripto, dll) implemented server-side
- [ ] AI decisions run server-side

### Phase 3: Socket.io Events

- [ ] `create-room` → host creates room, gets room code
- [ ] `join-room` → player joins with code
- [ ] `start-game` → host starts the game
- [ ] `roll-dice` → client requests roll, server returns result
- [ ] `action:buy`, `action:decline`, `action:build`, `action:pay-tax`, `action:pay-jail`, `action:wait-jail`
- [ ] `action:travel-move`, `action:travel-skip`
- [ ] `action:card-ok`, `action:pay-or-move`
- [ ] `state-update` → server broadcasts full/partial state to all clients
- [ ] `game-over` → server sends winner
- [ ] `disconnect` → handle player disconnect, auto-skip turn

### Phase 4: Client Refactor

- [ ] Create lobby page — `/` shows create/join room
- [ ] Create game page — `/game/[roomId]` with Socket.io connection
- [ ] Refactor stores — Zustand becomes "view model" updated from server events
- [ ] Only current player can interact — disable buttons for non-active players
- [ ] Card visibility: player yang ambil kartu lihat dulu, setelah close → broadcast ke semua. Semua bisa lihat tapi masing2 close sendiri.
- [ ] Player money hidden — cuma show outline/estimasi buat player lain
- [ ] Add connection status indicator (connected/reconnecting/disconnected)
- [ ] Add reconnection logic — rejoin room if refresh/disconnect

### Phase 5: UI for Multiplayer

- [ ] Mobile responsive layout — HP jadi primary device
- [ ] Board auto-scale untuk layar kecil
- [ ] Player panel: own info detail, others info simplified
- [ ] Dice roll: only active player bisa tap roll
- [ ] Action buttons: hanya muncul buat active player
- [ ] Chat/emote system — minimal biar bisa komunikasi
- [ ] Share link button — copy room URL

### Phase 6: Polish

- [ ] Turn timer (optional) — 60 detik per turn, auto-skip kalau timeout
- [ ] Spectator mode — orang bisa join sebagai penonton
- [ ] Sound effects (optional)
- [ ] Animation sync — pastikan semua client lihat animasi yang sama
