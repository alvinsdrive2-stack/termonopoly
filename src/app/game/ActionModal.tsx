'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store/useGameStore';
import { useCardStore } from '@/lib/store/useCardStore';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useBoardStore } from '@/lib/store/useBoardStore';
import { useLogStore } from '@/lib/store/useLogStore';
import { TILES } from '@/lib/tiles';
import { ROLES } from '@/lib/roles';
import { formatMoney, getSalary } from '@/lib/utils';
import { processCardEffect } from '@/lib/game/engine';
import { TILE_COLORS } from '@/lib/theme';
import { CardEffect } from '@/lib/types';

// Overlay backdrop animation
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// Card container animation - use inline initial/animate/exit to avoid TS variant typing issues

// Helper to get tile image path
function getTileImagePath(tileId: number): string | null {
  if (tileId >= 0 && tileId <= 39) {
    return `/tiles/${tileId + 1}.png`;
  }
  return null;
}

// Helper to get card effect info
function getCardEffectInfo(effect: CardEffect) {
  if ('amount' in effect) {
    if (effect.type === 'gainMoney' || effect.type === 'loseMoney') {
      return {
        isMoney: true,
        amount: effect.type === 'loseMoney' ? -effect.amount : effect.amount,
        icon: effect.type === 'gainMoney' ? '💰' : '💸',
        color: effect.type === 'gainMoney' ? 'text-daun' : 'text-sambal',
        bg: effect.type === 'gainMoney' ? 'bg-daun/10' : 'bg-sambal/10',
      };
    }
  }
  return { isMoney: false, amount: 0, icon: '📜', color: 'text-lada', bg: '' };
}

// ===== CARD POPUP =====
function getCardImagePath(card: { type: 'danaUmum' | 'kesempatan'; id?: string }): string {
  if (!card.id) return '';
  const num = card.id.replace(/^(du|ks)-/, '');
  const folder = card.type === 'danaUmum' ? 'dana%20umum' : 'kesempatan';
  return `/kartu/${folder}/${num}.png`;
}

function CardPopup({
  card,
  onOk,
}: {
  card: { id: string; type: 'danaUmum' | 'kesempatan'; title: string; description: string; effect: CardEffect };
  onOk: () => void;
}) {
  const isDanaUmum = card.type === 'danaUmum';
  const effectInfo = getCardEffectInfo(card.effect);
  const cardImagePath = getCardImagePath(card);

  return (
    <motion.div className="fixed inset-0 bg-lada/60 flex items-center justify-center z-50 p-4" variants={overlayVariants} initial="hidden" animate="visible" exit="exit">
      <motion.div className="card-retro bg-white max-w-md w-full overflow-hidden" initial={{ opacity: 0, scale: 0.7, y: 60 }} animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } }} exit={{ opacity: 0, scale: 0.85, y: 40 }}>
        {/* Header */}
        <motion.div
          className={`p-5 text-center ${isDanaUmum ? 'bg-teal-500' : 'bg-gula'}`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <span className="text-sm font-black text-white tracking-[0.2em]">
            {isDanaUmum ? '📋 DANA UMUM' : '🎯 KESEMPATAN'}
          </span>
        </motion.div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Card Image */}
          <motion.div
            className="mb-3 flex justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
          >
            <div className="w-48 rounded-lg overflow-hidden border-2 border-lada/20 shadow-md">
              <Image src={cardImagePath} alt={card.title} width={192} height={192} className="w-full h-full object-contain" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-2xl font-black text-lada mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {card.title}
          </motion.h3>

          {/* Description */}
          <motion.p
            className="text-sm text-lada/70 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {card.description}
          </motion.p>

          {/* Money indicator */}
          {effectInfo.isMoney && (
            <motion.div
              className={`mt-4 py-3 px-4 rounded-xl ${effectInfo.bg}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.45 }}
            >
              <span className={`text-3xl font-black ${effectInfo.color}`}>
                {effectInfo.amount > 0 ? '+' : ''}
                {formatMoney(effectInfo.amount)}
              </span>
            </motion.div>
          )}
        </div>

        {/* Button */}
        <motion.div className="p-5 pt-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <motion.button
            className={`btn-retro w-full text-lg py-3 ${isDanaUmum ? 'bg-teal-500' : 'bg-gula'} text-white font-black`}
            onClick={onOk}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            OK, MENGERTI
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ===== RENT TABLE =====
function RentTable({ baseRent, rentWithBuildings, buildCost }: { baseRent?: number; rentWithBuildings?: number[]; buildCost?: number }) {
  if (!baseRent) return null;
  return (
    <div className="mt-4 bg-kelapa rounded-lg p-3 text-xs">
      <p className="font-bold text-lada mb-2 border-b border-lada/20 pb-1">Tabel Sewa</p>
      <div className="space-y-1">
        <div className="flex justify-between"><span className="text-lada/60">Tanah:</span><span className="font-bold">{formatMoney(baseRent)}</span></div>
        {rentWithBuildings?.map((rent, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-lada/60">{i === 3 ? '4 Rumah:' : `${i + 1} Rumah:`}</span>
            <span className="font-bold">{formatMoney(rent)}</span>
          </div>
        ))}
        {rentWithBuildings && (
          <div className="flex justify-between border-t border-lada/20 pt-1 mt-1">
            <span className="text-lada font-bold">🏨 Hotel:</span>
            <span className="font-black text-sambal">{formatMoney(rentWithBuildings[3] * 2)}</span>
          </div>
        )}
        {buildCost && (
          <div className="flex justify-between border-t border-lada/20 pt-1 mt-1">
            <span className="text-lada/60">Biaya Bangun:</span>
            <span className="font-bold">{formatMoney(buildCost)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== BUY PROPERTY POPUP =====
function BuyPropertyPopup({ tile, currentPlayer, canAfford, onBuy, onSkip, ownedInGroup }: {
  tile: typeof TILES[0]; currentPlayer: { name: string; money: number; roleId: string; properties: number[] };
  canAfford: boolean; onBuy: () => void; onSkip: () => void; ownedInGroup: number;
}) {
  const totalInGroup = TILES.filter((t) => t.category === 'property' && t.colorGroup === tile.colorGroup).length;
  const hasMonopoly = ownedInGroup === totalInGroup;
  const moneyAfter = currentPlayer.money - (tile.price ?? 0);
  const tileColor = tile.colorGroup ? TILE_COLORS[tile.colorGroup] : '#9ca3af';
  const tileImagePath = getTileImagePath(tile.id);

  return (
    <motion.div className="fixed inset-0 bg-lada/60 flex items-center justify-center z-50 p-4" variants={overlayVariants} initial="hidden" animate="visible" exit="exit">
      <motion.div className="card-retro bg-white max-w-md w-full overflow-hidden" initial={{ opacity: 0, scale: 0.7, y: 60 }} animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } }} exit={{ opacity: 0, scale: 0.85, y: 40 }}>
        {/* Color banner */}
        <motion.div className="h-5" style={{ backgroundColor: tileColor }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3 }} />

        <div className="p-6">
          {/* Tile image */}
          {tileImagePath && (
            <motion.div className="flex justify-center mb-4" initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.15 }}>
              <div className="w-40 rounded-xl overflow-hidden border-2 border-lada/30 bg-kelapa shadow-md" style={{ aspectRatio: '330/237' }}>
                <Image src={tileImagePath} alt={tile.name} width={160} height={115} className="w-full h-full object-contain" />
              </div>
            </motion.div>
          )}

          {/* Name & description */}
          <motion.div className="text-center mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-2xl font-black text-lada">{tile.name}</h3>
            <p className="text-sm text-lada/60 mt-1">{tile.description}</p>
            <AnimatePresence>
              {hasMonopoly && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="inline-block mt-2 text-xs font-bold bg-daun text-white px-3 py-1 rounded-full"
                >
                  💎 MONOPOLI!
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Price */}
          <motion.div className="text-center py-3 bg-daun/10 rounded-xl mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.25 }}>
            <p className="text-xs text-lada/60 font-bold">Harga</p>
            <motion.p className="text-3xl font-black text-daun" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.35 }}>
              {formatMoney(tile.price ?? 0)}
            </motion.p>
          </motion.div>

          {/* Monopoly progress */}
          {tile.colorGroup && (
            <motion.div className="flex items-center justify-center gap-2 mb-4 text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <span className="text-lada/60">Monopoli:</span>
              <div className="flex gap-1">
                {Array.from({ length: totalInGroup }).map((_, i) => (
                  <motion.div key={i} className={`w-4 h-4 rounded ${i < ownedInGroup ? 'opacity-100' : 'opacity-25'}`} style={{ backgroundColor: tileColor }}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35 + i * 0.05 }} />
                ))}
              </div>
              <span className="font-bold text-lada">{ownedInGroup}/{totalInGroup}</span>
            </motion.div>
          )}

          {/* Money context */}
          <motion.div className="grid grid-cols-2 gap-3 mb-4 text-xs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="bg-kelapa p-2 rounded-lg text-center">
              <p className="text-lada/60">Uang Sekarang</p>
              <p className={`font-bold ${currentPlayer.money >= 0 ? 'text-daun' : 'text-sambal'}`}>{formatMoney(currentPlayer.money)}</p>
            </div>
            <div className="bg-kelapa p-2 rounded-lg text-center">
              <p className="text-lada/60">Sisa Setelah Beli</p>
              <p className={`font-bold ${moneyAfter >= 0 ? 'text-daun' : 'text-sambal'}`}>{formatMoney(moneyAfter)}</p>
            </div>
          </motion.div>

          {/* Rent table */}
          <RentTable baseRent={tile.baseRent} rentWithBuildings={tile.rentWithBuildings} buildCost={tile.buildCost} />

          {/* Buttons */}
          <motion.div className="flex gap-3 mt-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <motion.button className="btn-retro bg-daun text-white flex-1 text-lg font-black py-3 disabled:opacity-40" onClick={onBuy} disabled={!canAfford}
              whileHover={canAfford ? { scale: 1.03 } : {}} whileTap={canAfford ? { scale: 0.97 } : {}}>
              BELI
            </motion.button>
            <motion.button className="btn-retro bg-garam text-lada flex-1 text-lg font-bold py-3" onClick={onSkip}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              LEWATI
            </motion.button>
          </motion.div>

          {!canAfford && (
            <motion.p className="text-xs text-sambal text-center mt-2 font-bold" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ⚠️ Uang tidak cukup!
            </motion.p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===== TAX POPUP =====
function TaxPopup({ tileName, taxAmount, playerMoney, isCreator, onPay }: {
  tileName: string; taxAmount: number; playerMoney: number; isCreator: boolean; onPay: () => void;
}) {
  const finalTax = isCreator ? taxAmount * 2 : taxAmount;
  const moneyAfter = playerMoney - finalTax;

  return (
    <motion.div className="fixed inset-0 bg-lada/60 flex items-center justify-center z-50 p-4" variants={overlayVariants} initial="hidden" animate="visible" exit="exit">
      <motion.div className="card-retro bg-white max-w-md w-full overflow-hidden" initial={{ opacity: 0, scale: 0.7, y: 60 }} animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } }} exit={{ opacity: 0, scale: 0.85, y: 40 }}>
        {/* Header */}
        <motion.div className="bg-merah p-5 text-center" initial={{ y: -20 }} animate={{ y: 0 }}>
          <motion.div className="text-6xl mb-2" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.1 }}>🏛️</motion.div>
          <span className="text-lg font-black text-white tracking-[0.15em]">PAJAK WAJIB!</span>
        </motion.div>

        <div className="p-6 text-center">
          <p className="text-sm text-lada/60 mb-1">{tileName}</p>

          {/* Tax amount */}
          <motion.div className="py-4 bg-sambal/10 rounded-xl my-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
            <p className="text-xs text-lada/60 font-bold mb-1">Jumlah Pajak</p>
            <motion.p className="text-4xl font-black text-sambal" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}>
              {formatMoney(finalTax)}
            </motion.p>
            {isCreator && (
              <motion.p className="text-xs text-sambal mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                ⚠️ Content Creator bayar 2x!
              </motion.p>
            )}
          </motion.div>

          {/* Money context */}
          <motion.div className="grid grid-cols-2 gap-3 text-xs mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            <div className="bg-kelapa p-2 rounded-lg">
              <p className="text-lada/60">Uang Sekarang</p>
              <p className={`font-bold ${playerMoney >= 0 ? 'text-daun' : 'text-sambal'}`}>{formatMoney(playerMoney)}</p>
            </div>
            <div className="bg-kelapa p-2 rounded-lg">
              <p className="text-lada/60">Sisa Setelah Bayar</p>
              <p className={`font-bold ${moneyAfter >= 0 ? 'text-daun' : 'text-sambal'}`}>{formatMoney(moneyAfter)}</p>
            </div>
          </motion.div>

          <motion.button className="btn-retro bg-merah text-white w-full text-lg font-black py-3" onClick={onPay}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            BAYAR PAJAK
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===== MAIN COMPONENT =====
export default function ActionModal() {
  const phase = useGameStore((s) => s.phase);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const turnNumber = useGameStore((s) => s.turnNumber);
  const setPhase = useGameStore((s) => s.setPhase);

  const players = usePlayerStore((s) => s.players);
  const updateMoney = usePlayerStore((s) => s.updateMoney);
  const addProperty = usePlayerStore((s) => s.addProperty);
  const removeProperty = usePlayerStore((s) => s.removeProperty);
  const setSkipTurns = usePlayerStore((s) => s.setSkipTurns);
  const moveToTile = usePlayerStore((s) => s.moveToTile);
  const jailPlayer = usePlayerStore((s) => s.jailPlayer);
  const addModifier = usePlayerStore((s) => s.addModifier);

  const tileOwners = useBoardStore((s) => s.tileOwners);
  const setTileOwner = useBoardStore((s) => s.setTileOwner);
  const buildingLevels = useBoardStore((s) => s.buildingLevels);
  const setBuildingLevel = useBoardStore((s) => s.setBuildingLevel);

  const currentCard = useCardStore((s) => s.currentCard);
  const discardCurrentCard = useCardStore((s) => s.discardCurrentCard);

  const addLog = useLogStore((s) => s.addLog);

  const releasePlayer = usePlayerStore((s) => s.releasePlayer);
  const decrementJailTurns = usePlayerStore((s) => s.decrementJailTurns);

  if (phase !== 'action' && phase !== 'cardAction' && phase !== 'rolling' && phase !== 'travel') return null;

  const currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer) return null;

  // ===== JAIL POPUP (shown when phase is 'rolling' and player is jailed) =====
  if (phase === 'rolling' && currentPlayer.jailed) {
    const canPay = currentPlayer.money >= 500000;
    return (
      <AnimatePresence>
        <motion.div key="jail" className="fixed inset-0 bg-lada/60 flex items-center justify-center z-50 p-4" variants={overlayVariants} initial="hidden" animate="visible" exit="exit">
          <motion.div className="card-retro bg-white max-w-md w-full overflow-hidden" initial={{ opacity: 0, scale: 0.7, y: 60 }} animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } }} exit={{ opacity: 0, scale: 0.85, y: 40 }}>
            {/* Header */}
            <motion.div className="bg-sambal p-5 text-center" initial={{ y: -20 }} animate={{ y: 0 }}>
              <motion.div className="text-6xl mb-2" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.1 }}>🚔</motion.div>
              <span className="text-lg font-black text-white tracking-[0.15em]">OPERASI ZEBRA!</span>
            </motion.div>
            <div className="p-6 text-center">
              <p className="text-sm text-lada/70 mb-4">Kamu ditangkap Operasi Zebra!</p>
              <motion.div className="bg-sambal/10 py-4 px-4 rounded-xl mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                <p className="text-xs text-lada/60 font-bold mb-1">Sisa Giliran di Penjara</p>
                <span className="text-4xl font-black text-sambal">{currentPlayer.jailTurns}</span>
                <p className="text-xs text-lada/50 mt-1">giliran lagi</p>
              </motion.div>
              <motion.div className="grid grid-cols-2 gap-3 text-xs mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="bg-kelapa p-2 rounded-lg">
                  <p className="text-lada/60">Uang Kamu</p>
                  <p className={`font-bold ${currentPlayer.money >= 0 ? 'text-daun' : 'text-sambal'}`}>{formatMoney(currentPlayer.money)}</p>
                </div>
                <div className="bg-kelapa p-2 rounded-lg">
                  <p className="text-lada/60">Biaya Bebas</p>
                  <p className="font-bold text-sambal">Rp500rb</p>
                </div>
              </motion.div>
              <div className="flex gap-3">
                <motion.button
                  className="btn-retro bg-daun text-white flex-1 py-3 font-black disabled:opacity-40"
                  onClick={() => {
                    updateMoney(currentPlayer.id, -500000);
                    releasePlayer(currentPlayer.id);
                    addLog(turnNumber, currentPlayer.id, `💰 ${currentPlayer.name} bayar denda penjara Rp500rb`);
                  }}
                  disabled={!canPay}
                  whileHover={canPay ? { scale: 1.03 } : {}}
                  whileTap={canPay ? { scale: 0.97 } : {}}
                >
                  Bayar Rp500rb
                </motion.button>
                <motion.button
                  className="btn-retro bg-garam text-lada flex-1 py-3 font-bold"
                  onClick={() => {
                    decrementJailTurns(currentPlayer.id);
                    const freshPlayer = usePlayerStore.getState().players.find((p) => p.id === currentPlayer.id);
                    if (freshPlayer && freshPlayer.jailTurns <= 1) {
                      releasePlayer(currentPlayer.id);
                      addLog(turnNumber, currentPlayer.id, `🔓 ${currentPlayer.name} bebas dari penjara!`);
                    } else {
                      addLog(turnNumber, currentPlayer.id, `⏳ ${currentPlayer.name} menunggu di penjara (${(freshPlayer?.jailTurns ?? 1) - 1} giliran lagi)`);
                    }
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Tunggu ({currentPlayer.jailTurns})
                </motion.button>
              </div>
              {!canPay && (
                <motion.p className="text-xs text-sambal text-center mt-2 font-bold" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Uang tidak cukup untuk bayar denda!
                </motion.p>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Only show action/card modals for non-jail phases
  if (phase !== 'action' && phase !== 'cardAction') return null;

  const currentTile = TILES[currentPlayer.position];
  const owner = tileOwners[currentPlayer.position];
  const canBuy = currentTile?.price && !owner && ['property', 'transport', 'utility'].includes(currentTile.category);
  const role = ROLES.find((r) => r.id === currentPlayer.roleId);

  const ownedInGroup = currentTile?.colorGroup
    ? currentPlayer.properties.filter((pid) => {
        const t = TILES.find((tile) => tile.id === pid);
        return t?.category === 'property' && t.colorGroup === currentTile.colorGroup;
      }).length
    : 0;

  // Helper: apply full card result (shared between normal and payOrMove)
  function handleCardResult(result: ReturnType<typeof processCardEffect>) {
    // Penjual Gorengan: kebal kartu Dana Umum yang denda (uang keluar)
    if (role?.id === 'gorengan' && currentCard!.type === 'danaUmum' && result.moneyChange < 0) {
      addLog(turnNumber, currentPlayer.id, `🛡️ ${currentPlayer.name} kebal kartu negatif! (Penjual Gorengan)`);
      discardCurrentCard(); setPhase('done'); return;
    }

    // Olshop debuff
    if (role?.id === 'olshop' && currentCard!.type === 'danaUmum') {
      updateMoney(currentPlayer.id, -100000);
      addLog(turnNumber, currentPlayer.id, `📱 ${currentPlayer.name} kena denda Dana Umum -Rp100rb`);
    }

    // Money
    if (result.moneyChange !== 0) updateMoney(currentPlayer.id, result.moneyChange);
    if (result.targetPlayerId && result.targetAmount) updateMoney(result.targetPlayerId, result.targetAmount);

    // Collect salary for moveTo
    if (result.newPosition !== null && result.collectSalary) {
      const salary = getSalary();
      updateMoney(currentPlayer.id, salary);
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

    // Remove property
    if (result.removePropertyTileId !== undefined) {
      removeProperty(currentPlayer.id, result.removePropertyTileId);
      setTileOwner(result.removePropertyTileId, null);
    }

    // Add modifier
    if (result.addModifier) addModifier(currentPlayer.id, result.addModifier);

    // Swap position
    if (result.swapWithPlayerId) {
      const other = players.find((p) => p.id === result.swapWithPlayerId);
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

    // Shift properties right
    if (result.shiftProperties) {
      const active = players.filter((p) => !p.bankrupt);
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
    discardCurrentCard(); setPhase('done');
  }

  return (
    <AnimatePresence>
      {/* Card action */}
      {phase === 'cardAction' && currentCard && (() => {
        const result = processCardEffect(currentCard.effect, currentPlayer.id, players, currentPlayer.position);

        // payOrMove: pilihan bayar atau pindah
        if (result.payOrMove) {
          const pm = result.payOrMove;
          return (
            <motion.div key="payormove" className="fixed inset-0 bg-lada/60 flex items-center justify-center z-50 p-4" variants={overlayVariants} initial="hidden" animate="visible" exit="exit">
              <motion.div className="card-retro bg-white max-w-md w-full overflow-hidden" initial={{ opacity: 0, scale: 0.7, y: 60 }} animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } }} exit={{ opacity: 0, scale: 0.85, y: 40 }}>
                <div className="bg-jeruk p-4 text-center">
                  <span className="text-lg font-black text-white">⚔️ WAR TIKET</span>
                </div>
                <div className="p-6 text-center">
                  <p className="text-sm text-lada/70 mb-4">{currentCard.description}</p>
                  <p className="text-xs text-lada/50 mb-4">Pilih salah satu:</p>
                  <div className="flex gap-3">
                    <button className="btn-retro bg-sambal text-white flex-1 py-3" onClick={() => {
                      updateMoney(currentPlayer.id, -pm.amount);
                      addLog(turnNumber, currentPlayer.id, `💰 Bayar ${formatMoney(pm.amount)} (War Tiket)`);
                      discardCurrentCard(); setPhase('done');
                    }} disabled={currentPlayer.money < pm.amount}>
                      Bayar {formatMoney(pm.amount)}
                    </button>
                    <button className="btn-retro bg-jeruk text-white flex-1 py-3" onClick={() => {
                      moveToTile(currentPlayer.id, pm.position);
                      addLog(turnNumber, currentPlayer.id, `🏃 Pindah ke ${TILES[pm.position]?.name}`);
                      discardCurrentCard(); setPhase('done');
                    }}>
                      Pindah ke {TILES[pm.position]?.name}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        }

        // Normal card popup
        return (
          <CardPopup key="card" card={currentCard} onOk={() => handleCardResult(result)} />
        );
      })()}

      {/* Buy property */}
      {phase === 'action' && canBuy && (() => {
        const canAfford = currentPlayer.money >= (currentTile.price ?? 0) || role?.id === 'sultan';
        return (
          <BuyPropertyPopup key="buy" tile={currentTile} currentPlayer={currentPlayer} canAfford={canAfford} ownedInGroup={ownedInGroup}
            onBuy={() => {
              updateMoney(currentPlayer.id, -(currentTile.price ?? 0));
              addProperty(currentPlayer.id, currentPlayer.position);
              setTileOwner(currentPlayer.position, currentPlayer.id);
              addLog(turnNumber, currentPlayer.id, `🏠 ${currentPlayer.name} beli ${currentTile.name} (${formatMoney(currentTile.price ?? 0)})`);
              setPhase('done');
            }}
            onSkip={() => {
              addLog(turnNumber, currentPlayer.id, `🤷 ${currentPlayer.name} tidak jadi beli ${currentTile.name}`);
              setPhase('done');
            }}
          />
        );
      })()}

      {/* Tax */}
      {phase === 'action' && currentTile?.category === 'tax' && currentTile.taxAmount && (() => {
        const isCreator = role?.id === 'creator';
        const finalTax = isCreator ? currentTile.taxAmount * 2 : currentTile.taxAmount;
        return (
          <TaxPopup key="tax" tileName={currentTile.name} taxAmount={finalTax} playerMoney={currentPlayer.money} isCreator={isCreator}
            onPay={() => {
              updateMoney(currentPlayer.id, -finalTax);
              addLog(turnNumber, currentPlayer.id, `💸 ${currentPlayer.name} bayar pajak ${formatMoney(finalTax)}`);
              setPhase('done');
            }}
          />
        );
      })()}
    </AnimatePresence>
  );
}
