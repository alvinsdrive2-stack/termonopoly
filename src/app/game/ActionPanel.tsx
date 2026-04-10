'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store/useGameStore';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useBoardStore } from '@/lib/store/useBoardStore';
import { useCardStore } from '@/lib/store/useCardStore';
import { useLogStore } from '@/lib/store/useLogStore';
import { TILES } from '@/lib/tiles';
import { ROLES } from '@/lib/roles';
import { rollDice, isDoubles, getSalary, formatMoney } from '@/lib/utils';
import {
  movePlayer as calcMove,
  calculateRent,
  hasColorMonopoly,
  countOwnedType,
  canBuild,
  getBuildCost,
  checkWinCondition,
  processCardEffect,
} from '@/lib/game/engine';
import { aiShouldBuy, aiShouldBuild, aiJailDecision } from '@/lib/ai/bot';

const ANIM_STEP_MS = 280;
const AI_DELAY = 1200;
const AI_CARD_DELAY = 2500; // Lebih lama biar pemain lihat kartu AI

// ===== FLOATING MONEY INDICATOR =====
interface FloatingMoney {
  id: number;
  amount: number;
  playerColor: string;
  playerName: string;
  reason: string;
}

function FloatingMoneyOverlay({ items }: { items: FloatingMoney[] }) {
  return (
    <AnimatePresence>
      {items.map((item) => {
        const isPositive = item.amount > 0;
        return (
          <motion.div
            key={item.id}
            className="fixed top-1/2 left-1/2 z-40 pointer-events-none"
            initial={{ x: '-50%', y: '-50%', scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.3, 1],
              opacity: [0, 1, 1],
              y: ['-50%', '-70%', '-120%'],
            }}
            exit={{ opacity: 0, y: '-200%', scale: 0.5 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
          >
            <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl border-2 ${
              isPositive
                ? 'bg-daun/95 text-white border-daun/70'
                : 'bg-sambal/95 text-white border-sambal/70'
            }`}>
              <span className="text-2xl">{isPositive ? '💰' : '💸'}</span>
              <div>
                <div className="font-black text-lg">
                  {isPositive ? '+' : ''}{formatMoney(item.amount)}
                </div>
                <div className="text-xs opacity-80">{item.playerName} · {item.reason}</div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

// ===== HELPER: Apply full card effect result =====
function applyCardResult(
  result: ReturnType<typeof processCardEffect>,
  currentPlayer: { id: string; position: number; roleId: string; money: number; properties: number[] },
  players: typeof usePlayerStore extends { getState: () => { players: infer P } } ? P : never,
  changeMoney: (id: string, amount: number, reason: string) => void,
  updateMoney: (id: string, amount: number) => void,
  moveToTile: (id: string, pos: number) => void,
  jailPlayer: (id: string) => void,
  setSkipTurns: (id: string, turns: number) => void,
  removeProperty: (id: string, tileId: number) => void,
  setTileOwner: (tileId: number, owner: string | null) => void,
  addModifier: (id: string, mod: { type: string; turnsRemaining: number; value: number }) => void,
  buildingLevels: Record<number, number>,
  setBuildingLevel: (tileId: number, level: any) => void,
  addProperty: (id: string, tileId: number) => void,
  addLog: (turn: number, id: string, msg: string) => void,
  turnNumber: number,
  cardTitle: string,
) {
  // Money changes
  if (result.moneyChange !== 0) changeMoney(currentPlayer.id, result.moneyChange, cardTitle);
  if (result.targetPlayerId && result.targetAmount) changeMoney(result.targetPlayerId, result.targetAmount, cardTitle);

  // Collect salary for moveTo cards
  if (result.newPosition !== null && result.collectSalary) {
    const salary = getSalary();
    changeMoney(currentPlayer.id, salary, 'Gaji START');
    addLog(turnNumber, currentPlayer.id, `💰 Lewat START! +${formatMoney(salary)}`);
  }

  // Position
  if (result.newPosition !== null) {
    moveToTile(currentPlayer.id, result.newPosition);
    if (result.goToJail) jailPlayer(currentPlayer.id);
  }
  if (result.goToJail && result.newPosition === null) jailPlayer(currentPlayer.id);

  // Skip turns
  if (result.skipTurns > 0) setSkipTurns(currentPlayer.id, result.skipTurns);

  // Remove property (Tanah Digusur)
  if (result.removePropertyTileId !== undefined) {
    removeProperty(currentPlayer.id, result.removePropertyTileId);
    setTileOwner(result.removePropertyTileId, null);
  }

  // Add modifier
  if (result.addModifier) addModifier(currentPlayer.id, result.addModifier);

  // Swap position
  if (result.swapWithPlayerId) {
    const other = players.find((p: { id: string }) => p.id === result.swapWithPlayerId);
    if (other) {
      const myPos = currentPlayer.position;
      moveToTile(currentPlayer.id, other.position);
      moveToTile(other.id, myPos);
    }
  }

  // Destroy all hotels
  if (result.destroyHotels) {
    for (const p of players) {
      if (p.bankrupt) continue;
      for (const tileId of p.properties) {
        if ((buildingLevels[tileId] ?? 0) === 5) {
          const tile = TILES.find((t) => t.id === tileId);
          const comp = Math.floor((tile?.buildCost ?? 0) * (result.hotelCompensationPercent ?? 0) / 100);
          updateMoney(p.id, comp);
          setBuildingLevel(tileId, 0);
        }
      }
    }
  }

  // Shift properties right: each active player gives last property to next player
  if (result.shiftProperties) {
    const active = players.filter((p: { bankrupt: boolean }) => !p.bankrupt);
    const shifts: { from: string; to: string; tileId: number }[] = [];
    for (let i = 0; i < active.length; i++) {
      const nextIdx = (i + 1) % active.length;
      const from = active[i];
      const to = active[nextIdx];
      if (from.properties.length > 0) {
        shifts.push({ from: from.id, to: to.id, tileId: from.properties[from.properties.length - 1] });
      }
    }
    for (const s of shifts) {
      removeProperty(s.from, s.tileId);
      addProperty(s.to, s.tileId);
      setTileOwner(s.tileId, s.to);
    }
  }

  addLog(turnNumber, currentPlayer.id, `📦 ${result.message}`);
}

export default function ActionPanel() {
  // ===== ALL HOOKS FIRST =====
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const diceValues = useGameStore((s) => s.diceValues);
  const setDiceValues = useGameStore((s) => s.setDiceValues);
  const rollGeneration = useGameStore((s) => s.rollGeneration);
  const doublesCount = useGameStore((s) => s.doublesCount);
  const incrementDoubles = useGameStore((s) => s.incrementDoubles);
  const resetDoubles = useGameStore((s) => s.resetDoubles);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const nextPlayer = useGameStore((s) => s.nextPlayer);
  const setWinner = useGameStore((s) => s.setWinner);
  const turnNumber = useGameStore((s) => s.turnNumber);
  const startAnimation = useGameStore((s) => s.startAnimation);
  const advanceAnimation = useGameStore((s) => s.advanceAnimation);
  const finishAnimation = useGameStore((s) => s.finishAnimation);

  const players = usePlayerStore((s) => s.players);
  const updateMoney = usePlayerStore((s) => s.updateMoney);
  const movePlayerPos = usePlayerStore((s) => s.movePlayer);
  const moveToTile = usePlayerStore((s) => s.moveToTile);
  const addProperty = usePlayerStore((s) => s.addProperty);
  const removeProperty = usePlayerStore((s) => s.removeProperty);
  const jailPlayer = usePlayerStore((s) => s.jailPlayer);
  const releasePlayer = usePlayerStore((s) => s.releasePlayer);
  const decrementJailTurns = usePlayerStore((s) => s.decrementJailTurns);
  const setSkipTurns = usePlayerStore((s) => s.setSkipTurns);
  const decrementSkipTurns = usePlayerStore((s) => s.decrementSkipTurns);
  const setBankrupt = usePlayerStore((s) => s.setBankrupt);
  const tickModifiers = usePlayerStore((s) => s.tickModifiers);
  const addModifier = usePlayerStore((s) => s.addModifier);
  const useTravelCharge = usePlayerStore((s) => s.useTravelCharge);

  const tileOwners = useBoardStore((s) => s.tileOwners);
  const setTileOwner = useBoardStore((s) => s.setTileOwner);
  const buildingLevels = useBoardStore((s) => s.buildingLevels);
  const setBuildingLevel = useBoardStore((s) => s.setBuildingLevel);
  const increaseBuilding = useBoardStore((s) => s.increaseBuilding);

  const drawCard = useCardStore((s) => s.drawCard);
  const currentCard = useCardStore((s) => s.currentCard);
  const discardCurrentCard = useCardStore((s) => s.discardCurrentCard);

  const addLog = useLogStore((s) => s.addLog);

  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kriptoRolledRef = useRef(false); // Track if Kripto passive already triggered this turn
  const travelPendingRef = useRef<{ tileId: number; dice: [number, number] } | null>(null);

  // Floating money state
  const [floatingMoney, setFloatingMoney] = useState<FloatingMoney[]>([]);
  const floatIdRef = useRef(0);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  function showMoneyFloat(amount: number, playerName: string, playerColor: string, reason: string) {
    const id = ++floatIdRef.current;
    setFloatingMoney((prev) => [...prev, { id, amount, playerName, playerColor, reason }]);
    setTimeout(() => {
      setFloatingMoney((prev) => prev.filter((f) => f.id !== id));
    }, 2000);
  }

  function changeMoney(playerId: string, amount: number, reason: string) {
    updateMoney(playerId, amount);
    if (Math.abs(amount) >= 100000) {
      const p = usePlayerStore.getState().players.find((pl) => pl.id === playerId);
      if (p) showMoneyFloat(amount, p.name, p.color, reason);
    }
  }

  const currentPlayer = players[currentPlayerIndex];
  const isInactive = phase === 'setup' || phase === 'gameOver' || !currentPlayer;

  // ===== DETECT DICE ROLL → WAIT → MOVE =====
  // Only fires when rollGeneration increments (actual new roll), not on phase changes
  useEffect(() => {
    if (rollGeneration === 0) return; // Skip initial mount
    if (phase !== 'rolling') return;
    if (!currentPlayer) return;

    const timer = setTimeout(() => {
      if (!currentPlayer) return;
      const total = diceValues[0] + diceValues[1];
      const isDouble = isDoubles(diceValues);
      addLog(turnNumber, currentPlayer.id, `🎲 ${currentPlayer.name} melempar ${diceValues[0]} + ${diceValues[1]} = ${total}${isDouble ? ' (DOUBLE!)' : ''}`);

      if (isDouble) {
        incrementDoubles();
        // Read fresh doublesCount from store to avoid stale closure
        const freshDoubles = useGameStore.getState().doublesCount;
        if (freshDoubles >= 3) {
          addLog(turnNumber, currentPlayer.id, `🚔 ${currentPlayer.name} 3x double! Masuk penjara!`);
          jailPlayer(currentPlayer.id);
          resetDoubles();
          endTurn();
          return;
        }
      } else {
        resetDoubles();
      }

      // Magang passive: odd total = +50k (only when NOT in jail)
      const role = ROLES.find((r) => r.id === currentPlayer.roleId);
      if (role?.id === 'magang' && total % 2 !== 0 && !currentPlayer.jailed) {
        changeMoney(currentPlayer.id, 50000, 'Uang Lembur');
        addLog(turnNumber, currentPlayer.id, `⏰ ${currentPlayer.name} dapat uang lembur Rp50rb`);
      }

      const { passedStart } = calcMove(currentPlayer.position, total);
      animateAndLand(buildPath(currentPlayer.position, total), diceValues, passedStart);
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollGeneration]);

  // ===== GAME LOGIC =====
  function buildPath(from: number, steps: number): number[] {
    const path: number[] = [];
    for (let i = 1; i <= steps; i++) path.push((from + i) % 40);
    return path;
  }

  function endTurn() {
    if (!currentPlayer) return;

    const pState = usePlayerStore.getState().players.find((p) => p.id === currentPlayer.id);
    if (pState && pState.money < 0 && pState.properties.length === 0) {
      // Clear any remaining properties from board (shouldn't be any, but safety)
      for (const tid of pState.properties) setTileOwner(tid, null);
      setBankrupt(pState.id);
      addLog(turnNumber, pState.id, `💀 ${pState.name} BANGKRUT!`);
    } else if (pState && pState.money < 0 && pState.properties.length > 0) {
      // Player has negative money but still has assets — force sell last property
      const lastProp = pState.properties[pState.properties.length - 1];
      const tile = TILES.find((t) => t.id === lastProp);
      const sellPrice = Math.floor((tile?.price ?? 0) / 2);
      changeMoney(pState.id, sellPrice, `Jual Darurat ${tile?.name ?? ''}`);
      removeProperty(pState.id, lastProp);
      setTileOwner(lastProp, null);
      addLog(turnNumber, pState.id, `🆘 ${pState.name} jual darurat ${tile?.name ?? ''} (${formatMoney(sellPrice)})`);
      // Re-check after selling
      const afterSell = usePlayerStore.getState().players.find((p) => p.id === currentPlayer.id);
      if (afterSell && afterSell.money < 0 && afterSell.properties.length === 0) {
        setBankrupt(afterSell.id);
        addLog(turnNumber, afterSell.id, `💀 ${afterSell.name} BANGKRUT!`);
      }
    }

    tickModifiers(currentPlayer.id);
    const updatedPlayers = usePlayerStore.getState().players;
    const winner = checkWinCondition(updatedPlayers);
    if (winner) { setWinner(winner); return; }

    const role = ROLES.find((r) => r.id === currentPlayer.roleId);

    // Sultan: bunga hutang
    if (role?.id === 'sultan') {
      const p = usePlayerStore.getState().players.find((p) => p.id === currentPlayer.id);
      if (p && p.money < 0) {
        const interest = Math.floor(Math.abs(p.money) * 0.2);
        changeMoney(currentPlayer.id, -interest, 'Bunga Hutang');
        addLog(turnNumber, currentPlayer.id, `🏦 Bunga hutang Sultan: -${formatMoney(interest)}`);
      }
    }

    // Kripto: lewat START → lempar dadu buat cuan/rugi (hanya saat MELEWATI START, bukan cuma berdiri di START)
    // Kripto trigger is handled in animateAndLand via passedStart flag, tracked via kriptoRolled ref

    const activePlayers = updatedPlayers.filter((p) => !p.bankrupt);

    const wasDoubles = isDoubles(diceValues);
    if (wasDoubles) {
      addLog(turnNumber, currentPlayer.id, `🎲 ${currentPlayer.name} dapet DOUBLE! Lempar lagi!`);
      setPhase('rolling');
      return;
    }

    resetDoubles();
    nextPlayer(activePlayers.length);

    const nextP = usePlayerStore.getState().players[currentPlayerIndex];
    if (nextP && nextP.skipTurns > 0) {
      decrementSkipTurns(nextP.id);
      addLog(turnNumber, nextP.id, `⏭️ ${nextP.name} lewati giliran`);
      nextPlayer(activePlayers.length);
    }
    setPhase('rolling');
  }

  function checkBankruptAndEndTurn() {
    if (!currentPlayer) return;
    const updatedPlayers = usePlayerStore.getState().players;
    const p = updatedPlayers.find((p) => p.id === currentPlayer.id);
    if (p && p.money < 0) {
      // Force sell properties to cover debt
      let safety = 0;
      while (safety++ < 40) {
        const freshP = usePlayerStore.getState().players.find((pp) => pp.id === currentPlayer.id);
        if (!freshP || freshP.properties.length === 0 || freshP.money >= 0) break;
        const lastProp = freshP.properties[freshP.properties.length - 1];
        const tile = TILES.find((t) => t.id === lastProp);
        const sellPrice = Math.floor((tile?.price ?? 0) / 2);
        changeMoney(freshP.id, sellPrice, `Jual Darurat ${tile?.name ?? ''}`);
        removeProperty(freshP.id, lastProp);
        setTileOwner(lastProp, null);
        addLog(turnNumber, freshP.id, `🆘 ${freshP.name} jual darurat ${tile?.name ?? ''} (${formatMoney(sellPrice)})`);
      }
      // Check again after selling
      const afterSell = usePlayerStore.getState().players.find((pp) => pp.id === currentPlayer.id);
      if (afterSell && afterSell.money < 0 && afterSell.properties.length === 0) {
        setBankrupt(afterSell.id);
        addLog(turnNumber, afterSell.id, `💀 ${afterSell.name} BANGKRUT!`);
        const winner = checkWinCondition(usePlayerStore.getState().players);
        if (winner) { setWinner(winner); return; }
      }
    }
    setPhase('action');
  }

  function payRent(tileId: number, dice: [number, number]) {
    if (!currentPlayer) return;
    const tile = TILES[tileId];
    const owner = tileOwners[tileId];
    if (!owner) return;
    const ownerPlayer = players.find((p) => p.id === owner);
    if (!ownerPlayer) return;

    const transportCount = countOwnedType(ownerPlayer.properties, 'transport');
    const utilityCount = countOwnedType(ownerPlayer.properties, 'utility');
    const hasMonop = tile.colorGroup ? hasColorMonopoly(ownerPlayer.properties, tile.colorGroup) : false;
    const level = buildingLevels[tileId] ?? 0;
    let rent = calculateRent(tile, level, { transport: transportCount, utility: utilityCount }, dice[0] + dice[1], hasMonop);

    // Modifier: rentMultiplier (pemilik properti punya modifier ini)
    const rentMultMod = ownerPlayer.modifiers.find((m) => m.type === 'rentMultiplier');
    if (rentMultMod) rent = Math.floor(rent * rentMultMod.value);

    // Modifier: rentIncrease
    const rentIncMod = ownerPlayer.modifiers.find((m) => m.type === 'rentIncrease');
    if (rentIncMod) rent = Math.floor(rent * (1 + rentIncMod.value / 100));

    // Role passives
    const playerRole = ROLES.find((r) => r.id === currentPlayer.roleId);
    if (playerRole?.id === 'creator' && (tile.colorGroup === 'red' || tile.colorGroup === 'yellow')) rent = Math.floor(rent * 0.75);
    if (playerRole?.id === 'aktivis' && level >= 3) {
      addLog(turnNumber, currentPlayer.id, `🛡️ ${currentPlayer.name} kebal sewa! Level ${level} diambil alih (Ancaman Viralin)`);
      setPhase('done'); return;
    }
    if (playerRole?.id === 'rt' && (tile.colorGroup === 'brown' || tile.colorGroup === 'lightBlue')) {
      addLog(turnNumber, currentPlayer.id, `🛡️ ${currentPlayer.name} bebas sewa! (Ketua RT)`);
      setPhase('done'); return;
    }

    changeMoney(currentPlayer.id, -rent, `Sewa ke ${ownerPlayer.name}`);
    changeMoney(owner, rent, `Sewa dari ${currentPlayer.name}`);
    addLog(turnNumber, currentPlayer.id, `🏠 ${currentPlayer.name} bayar sewa ${formatMoney(rent)} ke ${ownerPlayer.name}`);
    checkBankruptAndEndTurn();
  }

  function processLanding(tileId: number, dice: [number, number]) {
    if (!currentPlayer) return;
    const tile = TILES[tileId];

    // Tukang Parkir passive: orang mendarat di transport → Tukang Parkir dapat Rp50rb
    if (tile.category === 'transport') {
      const allPlayers = usePlayerStore.getState().players;
      const parkirPlayers = allPlayers.filter((p) => !p.bankrupt && p.id !== currentPlayer.id && p.roleId === 'parkir');
      for (const pp of parkirPlayers) {
        changeMoney(pp.id, 50000, 'Pendapatan Parkir');
        changeMoney(currentPlayer.id, -50000, 'Denda Parkir');
        addLog(turnNumber, currentPlayer.id, `🅿️ ${pp.name} (Tukang Parkir) ambil Rp50rb dari ${currentPlayer.name}`);
      }
      // Check if Tukang Parkir fee pushed current player to bankruptcy
      const afterParkir = usePlayerStore.getState().players.find((p) => p.id === currentPlayer.id);
      if (afterParkir && afterParkir.money < 0 && afterParkir.properties.length === 0) {
        setBankrupt(afterParkir.id);
        addLog(turnNumber, afterParkir.id, `💀 ${afterParkir.name} BANGKRUT karena denda parkir!`);
        const winner = checkWinCondition(usePlayerStore.getState().players);
        if (winner) { setWinner(winner); return; }
        endTurn();
        return;
      }
    }

    // Ketua RT passive: kalau orang mendarat di properti RT, RT dapat Rp50rb
    if (['property', 'transport', 'utility'].includes(tile.category)) {
      const owner = tileOwners[tileId];
      if (owner) {
        const ownerPlayer = usePlayerStore.getState().players.find((p) => p.id === owner);
        if (ownerPlayer && ownerPlayer.roleId === 'rt' && owner !== currentPlayer.id) {
          changeMoney(ownerPlayer.id, 50000, 'Pendapatan RT');
          addLog(turnNumber, ownerPlayer.id, `🏘️ ${ownerPlayer.name} (Ketua RT) dapat Rp50rb dari ${currentPlayer.name} yang mendarat di propertinya`);
        }
      }
    }

    if (tileId === 30) {
      addLog(turnNumber, currentPlayer.id, `🚔 ${currentPlayer.name} masuk Operasi Zebra!`);
      jailPlayer(currentPlayer.id); endTurn(); return;
    }
    if (tile.category === 'card' && tile.cardType) {
      const card = drawCard(tile.cardType);
      if (card) {
        setPhase('cardAction');
        addLog(turnNumber, currentPlayer.id, `📦 ${currentPlayer.name} ambil kartu: ${card.title}`);
        return;
      }
    }
    if (tile.category === 'tax' && tile.taxAmount) { setPhase('action'); return; }
    if (['property', 'transport', 'utility'].includes(tile.category)) {
      const owner = tileOwners[tileId];
      if (!owner) {
        // mustBuyNext modifier: wajib beli
        const mustBuy = currentPlayer.modifiers.find((m) => m.type === 'mustBuyNext');
        if (mustBuy && tile.price) {
          const role = ROLES.find((r) => r.id === currentPlayer.roleId);
          if (currentPlayer.money >= tile.price || role?.id === 'sultan') {
            doBuy();
            return;
          }
        }
        setPhase('action'); return;
      }
      if (owner !== currentPlayer.id) { payRent(tileId, dice); return; }
      if (tile.category === 'property' && canBuild(tileId, currentPlayer.properties, buildingLevels)) {
        setPhase('action'); return;
      }
    }
    setPhase('done');
  }

  function animateAndLand(path: number[], dice: [number, number], passedStart: boolean) {
    if (!currentPlayer) return;
    kriptoRolledRef.current = false; // Reset each turn
    startAnimation(currentPlayer.id, path);
    let step = 0;
    function tick() {
      step++;
      movePlayerPos(currentPlayer.id, 1);
      advanceAnimation();

      const newPos = usePlayerStore.getState().players.find((p) => p.id === currentPlayer.id)?.position ?? 0;
      if (newPos === 0 && passedStart) {
        // Cek noSalary modifier
        const cp = usePlayerStore.getState().players.find((p) => p.id === currentPlayer.id);
        const noSalaryMod = cp?.modifiers.find((m) => m.type === 'noSalary');
        if (!noSalaryMod) {
          const role = ROLES.find((r) => r.id === cp?.roleId);
          let salaryBonus = 0;
          if (role?.id === 'olshop') salaryBonus = 200000;
          const salary = getSalary() + salaryBonus;
          changeMoney(currentPlayer.id, salary, 'Gaji START');
          addLog(turnNumber, currentPlayer.id, `💰 ${currentPlayer.name} lewat START! +${formatMoney(salary)}`);
        } else {
          addLog(turnNumber, currentPlayer.id, `🚫 ${currentPlayer.name} tidak dapat gaji START! (Kartu Gaji Telat)`);
        }
        passedStart = false;

        // Kripto passive: lewat START → lempar dadu buat cuan/rugi (hanya sekali per turn)
        if (!kriptoRolledRef.current) {
          const kriptoRole = ROLES.find((r) => r.id === cp?.roleId);
          if (kriptoRole?.id === 'kripto') {
            kriptoRolledRef.current = true;
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            const total = d1 + d2;
            if (total <= 6) {
              changeMoney(currentPlayer.id, -500000, 'Kripto Rugi');
              addLog(turnNumber, currentPlayer.id, `📉 Kripto: ${currentPlayer.name} rugi Rp500rb (dadu ${d1}+${d2}=${total})`);
            } else {
              changeMoney(currentPlayer.id, 1000000, 'Kripto Cuan');
              addLog(turnNumber, currentPlayer.id, `📈 Kripto: ${currentPlayer.name} cuan Rp1Jt (dadu ${d1}+${d2}=${total})`);
            }
          }
        }
      }

      if (step < path.length) {
        animTimerRef.current = setTimeout(tick, ANIM_STEP_MS);
      } else {
        finishAnimation();
        // Supir Travel passive: offer to adjust position ±1 before landing
        const cp = usePlayerStore.getState().players.find((p) => p.id === currentPlayer.id);
        if (cp && cp.roleId === 'travel' && cp.travelCharges > 0) {
          travelPendingRef.current = { tileId: path[path.length - 1], dice };
          setPhase('travel');
        } else {
          processLanding(path[path.length - 1], dice);
        }
      }
    }
    animTimerRef.current = setTimeout(tick, ANIM_STEP_MS);
  }

  // ===== ACTIONS =====
  function doRoll() {
    if (!currentPlayer || !currentPlayer.isAI) return;
    const dice = rollDice();
    setDiceValues(dice);
  }

  function doBuy() {
    if (!currentPlayer) return;
    const tile = TILES[currentPlayer.position];
    if (!tile.price) return;
    // buildDiscount modifier
    // (beli tanpa diskon — diskon cuma untuk bangun)
    changeMoney(currentPlayer.id, -tile.price, `Beli ${tile.name}`);
    addProperty(currentPlayer.id, currentPlayer.position);
    setTileOwner(currentPlayer.position, currentPlayer.id);
    addLog(turnNumber, currentPlayer.id, `🏠 ${currentPlayer.name} beli ${tile.name} (${formatMoney(tile.price)})`);
    setPhase('done');
  }

  function doDecline() {
    if (!currentPlayer) return;
    addLog(turnNumber, currentPlayer.id, `🤷 ${currentPlayer.name} tidak jadi beli ${TILES[currentPlayer.position]?.name}`);
    setPhase('done');
  }

  function doPayTax() {
    if (!currentPlayer) return;
    const tile = TILES[currentPlayer.position];
    if (!tile.taxAmount) return;
    const role = ROLES.find((r) => r.id === currentPlayer.roleId);
    const tax = role?.id === 'creator' ? tile.taxAmount * 2 : tile.taxAmount;
    changeMoney(currentPlayer.id, -tax, 'Pajak');
    addLog(turnNumber, currentPlayer.id, `💸 ${currentPlayer.name} bayar pajak ${formatMoney(tax)}`);
    setPhase('done');
  }

  function doCardEffect() {
    if (!currentPlayer || !currentCard) return;
    const result = processCardEffect(currentCard.effect, currentPlayer.id, players, currentPlayer.position, useBoardStore.getState().tileOwners);
    const role = ROLES.find((r) => r.id === currentPlayer.roleId);

    // Penjual Gorengan: kebal kartu Dana Umum yang denda (uang keluar)
    if (role?.id === 'gorengan' && currentCard.type === 'danaUmum' && result.moneyChange < 0) {
      addLog(turnNumber, currentPlayer.id, `🛡️ ${currentPlayer.name} kebal kartu negatif! (Penjual Gorengan)`);
      discardCurrentCard(); setPhase('done'); return;
    }

    // Olshop debuff: denda Rp100rb kalau masuk Dana Umum
    if (role?.id === 'olshop' && currentCard.type === 'danaUmum') {
      changeMoney(currentPlayer.id, -100000, 'Denda Dana Umum');
      addLog(turnNumber, currentPlayer.id, `📱 ${currentPlayer.name} kena denda Dana Umum -Rp100rb`);
    }

    // payOrMove: AI auto-decide (bayar kalau mampu, pindah kalau tidak)
    if (result.payOrMove) {
      if (currentPlayer.money >= result.payOrMove.amount) {
        changeMoney(currentPlayer.id, -result.payOrMove.amount, 'War Tiket');
        addLog(turnNumber, currentPlayer.id, `💰 ${currentPlayer.name} bayar ${formatMoney(result.payOrMove.amount)} (War Tiket)`);
      } else {
        moveToTile(currentPlayer.id, result.payOrMove.position);
        addLog(turnNumber, currentPlayer.id, `🏃 ${currentPlayer.name} pindah ke ${TILES[result.payOrMove.position]?.name} (War Tiket)`);
      }
    }

    applyCardResult(
      result, currentPlayer, players, changeMoney, updateMoney, moveToTile,
      jailPlayer, setSkipTurns, removeProperty, setTileOwner, addModifier,
      buildingLevels, setBuildingLevel, addProperty, addLog, turnNumber, currentCard.title
    );

    discardCurrentCard(); setPhase('done');
  }

  function doBuild(tileId?: number) {
    if (!currentPlayer) return;
    const buildTileId = tileId ?? currentPlayer.position;
    if (!canBuild(buildTileId, currentPlayer.properties, buildingLevels)) return;
    let cost = getBuildCost(buildTileId);
    // buildDiscount modifier
    const discountMod = currentPlayer.modifiers.find((m) => m.type === 'buildDiscount');
    if (discountMod) cost = Math.floor(cost * (100 - discountMod.value) / 100);
    if (currentPlayer.money < cost) return;
    changeMoney(currentPlayer.id, -cost, `Bangun di ${TILES[buildTileId].name}`);
    increaseBuilding(buildTileId);
    addLog(turnNumber, currentPlayer.id, `🏗️ ${currentPlayer.name} bangun di ${TILES[buildTileId].name} (${formatMoney(cost)}${discountMod ? ` diskon ${discountMod.value}%!` : ''})`);
  }

  function doPayJail() {
    if (!currentPlayer) return;
    changeMoney(currentPlayer.id, -500000, 'Denda Penjara');
    releasePlayer(currentPlayer.id);
    addLog(turnNumber, currentPlayer.id, `💰 ${currentPlayer.name} bayar denda penjara Rp500rb`);
    setPhase('rolling');
  }

  function doWaitJail() {
    if (!currentPlayer) return;
    decrementJailTurns(currentPlayer.id);
    const player = players.find((p) => p.id === currentPlayer.id);
    if (player && player.jailTurns <= 1) {
      releasePlayer(currentPlayer.id);
      addLog(turnNumber, currentPlayer.id, `🔓 ${currentPlayer.name} bebas dari penjara!`);
    } else {
      addLog(turnNumber, currentPlayer.id, `⏳ ${currentPlayer.name} menunggu di penjara (${(player?.jailTurns ?? 1) - 1} giliran lagi)`);
    }
    endTurn();
  }

  function doTravelMove(direction: 1 | -1) {
    if (!currentPlayer || !travelPendingRef.current) return;
    const { dice } = travelPendingRef.current;
    const newPos = (currentPlayer.position + direction + 40) % 40;
    moveToTile(currentPlayer.id, newPos);
    useTravelCharge(currentPlayer.id);
    addLog(turnNumber, currentPlayer.id, `🚐 ${currentPlayer.name} ${direction > 0 ? 'maju' : 'mundur'} 1 langkah ke ${TILES[newPos].name} (sisa ${currentPlayer.travelCharges - 1}x)`);
    travelPendingRef.current = null;
    processLanding(newPos, dice);
  }

  function doTravelSkip() {
    if (!currentPlayer || !travelPendingRef.current) return;
    const { tileId, dice } = travelPendingRef.current;
    travelPendingRef.current = null;
    processLanding(tileId, dice);
  }

  // ===== HANDLE 'done' PHASE =====
  useEffect(() => {
    if (phase !== 'done') return;
    const timer = setTimeout(() => { endTurn(); }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ===== AI AUTO-PLAY =====
  const isAI = currentPlayer?.isAI ?? false;

  useEffect(() => {
    if (!isAI || !currentPlayer) return;
    if (phase !== 'rolling' && phase !== 'action' && phase !== 'cardAction' && phase !== 'travel') return;
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

    // Delay lebih lama untuk kartu biar manusia bisa baca
    const delay = phase === 'cardAction' ? AI_CARD_DELAY : AI_DELAY;

    aiTimerRef.current = setTimeout(() => {
      const state = useGameStore.getState();
      const cp = usePlayerStore.getState().players[state.currentPlayerIndex];
      if (!cp || !cp.isAI) return;
      // Guard: verify phase hasn't changed while we waited
      if (state.phase !== phase) return;

      if (state.phase === 'rolling') {
        if (cp.jailed) {
          if (aiJailDecision(cp.money) === 'pay' && cp.money >= 500000) doPayJail();
          else doWaitJail();
        } else { doRoll(); }
      } else if (state.phase === 'action') {
        const tile = TILES[cp.position];
        if (tile.category === 'tax' && tile.taxAmount) { doPayTax(); return; }
        const owner = useBoardStore.getState().tileOwners[cp.position];
        if (!owner && tile.price && ['property', 'transport', 'utility'].includes(tile.category)) {
          if (aiShouldBuy(cp.position, cp.money)) doBuy(); else doDecline();
          return;
        }
        const bl = useBoardStore.getState().buildingLevels;
        const buildTileId = aiShouldBuild(cp.properties, cp.money, bl);
        if (buildTileId !== null) { doBuild(buildTileId); }
        endTurn();
      } else if (state.phase === 'cardAction') { doCardEffect(); }
      else if (state.phase === 'travel') {
        // AI Travel: simple heuristic — move if avoids danger, skip otherwise
        const curPos = cp.position;
        const fwd = (curPos + 1) % 40;
        const bwd = (curPos - 1 + 40) % 40;
        const fwdTile = TILES[fwd];
        const bwdTile = TILES[bwd];
        const owners = useBoardStore.getState().tileOwners;
        // Prefer moving to unowned buyable tile, or own property; avoid tax/jail
        const isGoodTile = (t: typeof TILES[0], pos: number) => {
          if (t.category === 'tax' || pos === 30) return -2;
          const own = owners[pos];
          if (!own && t.price) return 2; // unowned buyable
          if (own === cp.id) return 1; // own property
          if (own) return -1; // owned by other (pay rent)
          return 0;
        };
        const fwdScore = isGoodTile(fwdTile, fwd);
        const bwdScore = isGoodTile(bwdTile, bwd);
        if (fwdScore > 0 && fwdScore >= bwdScore) { doTravelMove(1); }
        else if (bwdScore > 0) { doTravelMove(-1); }
        else { doTravelSkip(); }
      }
    }, delay);

    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentPlayerIndex, isAI]);

  // ===== EARLY RETURN AFTER ALL HOOKS =====
  if (isInactive) {
    return (
      <div className="text-center text-lada/50 p-4">
        <p className="text-sm">Menunggu giliran...</p>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <>
        <FloatingMoneyOverlay items={floatingMoney} />
        <div className="text-center text-lada/50 p-4">
          <p className="text-sm">Memproses...</p>
        </div>
      </>
    );
  }

  // ===== RENDER =====
  const currentTile = TILES[currentPlayer.position];
  const canBuildHere =
    currentTile?.category === 'property' &&
    tileOwners[currentPlayer.position] === currentPlayer.id &&
    canBuild(currentPlayer.position, currentPlayer.properties, buildingLevels);
  const isInJail = currentPlayer.jailed;

  // Hitung build cost dengan diskon modifier
  const buildCost = (() => {
    const base = getBuildCost(currentPlayer.position);
    const discountMod = currentPlayer.modifiers.find((m) => m.type === 'buildDiscount');
    return discountMod ? Math.floor(base * (100 - discountMod.value) / 100) : base;
  })();

  // ===== TRAVEL POPUP (Supir Travel passive) =====
  if (phase === 'travel' && currentPlayer.travelCharges > 0 && !isAI) {
    const curPos = currentPlayer.position;
    const fwdPos = (curPos + 1) % 40;
    const bwdPos = (curPos - 1 + 40) % 40;
    const fwdTile = TILES[fwdPos];
    const bwdTile = TILES[bwdPos];

    return (
      <>
        <FloatingMoneyOverlay items={floatingMoney} />
        <AnimatePresence>
          <motion.div className="fixed inset-0 bg-lada/60 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="card-retro bg-white max-w-md w-full overflow-hidden" initial={{ opacity: 0, scale: 0.7, y: 60 }} animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } }} exit={{ opacity: 0, scale: 0.85, y: 40 }}>
              <div className="bg-blue-500 p-5 text-center">
                <div className="text-5xl mb-2">🚐</div>
                <span className="text-lg font-black text-white tracking-[0.15em]">SUPIR TRAVEL</span>
              </div>
              <div className="p-6 text-center">
                <p className="text-sm text-lada/70 mb-3">Geser bidak 1 langkah sebelum mendarat!</p>
                {/* Charges */}
                <div className="bg-blue-500/10 py-3 px-4 rounded-xl mb-4">
                  <p className="text-xs text-lada/60 font-bold mb-1">Sisa Pakai</p>
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className={`w-6 h-6 rounded-full border-2 ${i < currentPlayer.travelCharges ? 'bg-blue-500 border-blue-500' : 'bg-gray-200 border-gray-300'}`} />
                    ))}
                  </div>
                </div>
                {/* Position preview */}
                <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                  <div className="bg-kelapa p-2 rounded-lg">
                    <p className="text-lada/50">Mundur</p>
                    <p className="font-bold text-lada text-[11px] leading-tight">{bwdTile.name}</p>
                  </div>
                  <div className="bg-blue-500/10 p-2 rounded-lg border-2 border-blue-500">
                    <p className="text-blue-500 font-bold">Sekarang</p>
                    <p className="font-bold text-lada text-[11px] leading-tight">{TILES[curPos].name}</p>
                  </div>
                  <div className="bg-kelapa p-2 rounded-lg">
                    <p className="text-lada/50">Maju</p>
                    <p className="font-bold text-lada text-[11px] leading-tight">{fwdTile.name}</p>
                  </div>
                </div>
                {/* Buttons */}
                <div className="flex gap-3">
                  <button className="btn-retro bg-amber-500 text-white flex-1 py-3 font-black" onClick={() => doTravelMove(-1)}>
                    ⬅️ Mundur
                  </button>
                  <button className="btn-retro bg-garam text-lada flex-1 py-3 font-bold" onClick={doTravelSkip}>
                    ✋ Lewati
                  </button>
                  <button className="btn-retro bg-blue-500 text-white flex-1 py-3 font-black" onClick={() => doTravelMove(1)}>
                    Maju ➡️
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <FloatingMoneyOverlay items={floatingMoney} />

      <div className="flex flex-col gap-4">
        {/* Build - human only */}
        {phase === 'action' && !isAI && canBuildHere && (
          <div className="flex flex-col gap-1.5">
            <button className="btn-retro bg-jeruk text-white text-xs" onClick={() => { doBuild(); setPhase('done'); }} disabled={currentPlayer.money < buildCost}>
              Bangun ({formatMoney(buildCost)})
            </button>
            <button className="btn-retro bg-garam text-lada/60 text-xs" onClick={() => setPhase('done')}>
              Lewati
            </button>
          </div>
        )}

        {/* Info saat AI jalan */}
        {isAI && (phase === 'cardAction' || phase === 'travel') && (
          <div className="text-center text-lada/50 text-xs p-2">
            <p>🤖 {currentPlayer.name} sedang berpikir...</p>
          </div>
        )}
      </div>
    </>
  );
}
