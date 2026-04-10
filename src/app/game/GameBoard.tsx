'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { TILES } from '@/lib/tiles';
import { TILE_COLORS } from '@/lib/theme';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useBoardStore } from '@/lib/store/useBoardStore';
import { useGameStore } from '@/lib/store/useGameStore';
import { BuildingLevel } from '@/lib/types';
import DicePanel from './DicePanel';

const BOARD_SIZE = 11;

function getTileGridPosition(index: number): { row: number; col: number } {
  if (index <= 10) return { row: 10, col: 10 - index };
  if (index <= 19) return { row: 10 - (index - 10), col: 0 };
  if (index <= 30) return { row: 0, col: index - 20 };
  return { row: index - 30, col: 10 };
}

function getSideClass(row: number, col: number): string {
  if (row === 10) return 'board-tile-bottom';
  if (row === 0) return 'board-tile-top';
  if (col === 0) return 'board-tile-left';
  if (col === 10) return 'board-tile-right';
  return '';
}

function getTileBg(tile: typeof TILES[0]): string {
  if (tile.category === 'property' && tile.colorGroup) return TILE_COLORS[tile.colorGroup] ?? '#e5e7eb';
  if (tile.category === 'transport') return TILE_COLORS.transport;
  if (tile.category === 'utility') return TILE_COLORS.utility;
  if (tile.category === 'tax') return TILE_COLORS.tax;
  if (tile.category === 'corner') return TILE_COLORS.corner;
  if (tile.category === 'card') return TILE_COLORS.card;
  return '#e5e7eb';
}

function getTileImagePath(tileId: number): string | null {
  if (tileId >= 0 && tileId <= 39) {
    return `/tiles/${tileId + 1}.png`;
  }
  return null;
}

function getTileImagePosition(tileId: number): 'bottom' | 'left' | 'top' | 'right' | null {
  if (tileId >= 0 && tileId <= 10) return 'bottom';
  if (tileId >= 11 && tileId <= 19) return 'left';
  if (tileId >= 20 && tileId <= 30) return 'top';
  if (tileId >= 31 && tileId <= 39) return 'right';
  return null;
}

function BuildingIndicator({ level }: { level: BuildingLevel }) {
  if (level === 0) return null;
  if (level === 5) return <span className="text-[10px] font-bold text-red-700">HOTEL</span>;
  return <span className="text-[10px]">{'🏠'.repeat(level)}</span>;
}

function getPlayerDisplayPosition(playerId: string, realPosition: number): number {
  const { isAnimating, animatingPlayerId, animatingPath, animatingStep } = useGameStore.getState();
  if (isAnimating && animatingPlayerId === playerId && animatingPath.length > 0) {
    return animatingPath[animatingStep] ?? realPosition;
  }
  return realPosition;
}

// Floating number animation for money changes
function FloatingNumber({ value, playerColor }: { value: number; playerColor: string }) {
  const isPositive = value > 0;
  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 animate-float-up">
      <span className={`text-sm font-black ${isPositive ? 'text-daun' : 'text-sambal'} bg-white/90 rounded-full px-2 py-1 border-2`}>
        {isPositive ? '+' : ''}{(value / 1000).toFixed(0)}k
      </span>
    </div>
  );
}

export default function GameBoard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState({ w: 800, h: 800 });

  const players = usePlayerStore((s) => s.players);
  const tileOwners = useBoardStore((s) => s.tileOwners);
  const buildingLevels = useBoardStore((s) => s.buildingLevels);
  const isAnimating = useGameStore((s) => s.isAnimating);
  const animatingPlayerId = useGameStore((s) => s.animatingPlayerId);
  const animatingStep = useGameStore((s) => s.animatingStep);
  const animatingPath = useGameStore((s) => s.animatingPath);

  const phase = useGameStore((s) => s.phase);
  const diceValues = useGameStore((s) => s.diceValues);
  const setDiceValues = useGameStore((s) => s.setDiceValues);

  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const currentPlayer = players[currentPlayerIndex];
  const isAI = currentPlayer?.isAI ?? false;
  const isInactive = phase === 'setup' || phase === 'gameOver' || !currentPlayer;

  // Dynamic board sizing to fit container without scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      // Grid aspect: 11*330 / 11*237 = 330/237 ≈ 1.393
      const gridAspect = 330 / 237;
      const containerAspect = w / h;
      if (containerAspect > gridAspect) {
        // Container wider than grid → fit height
        const bh = h - 4;
        setBoardSize({ w: Math.round(bh * gridAspect), h: bh });
      } else {
        // Container taller than grid → fit width
        const bw = w - 4;
        setBoardSize({ w: bw, h: Math.round(bw / gridAspect) });
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const grid: (number | null)[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  TILES.forEach((_, i) => {
    const pos = getTileGridPosition(i);
    grid[pos.row][pos.col] = i;
  });

  const activePlayers = players.filter((p) => !p.bankrupt);

  // Map players to their display positions for rendering bidak
  const playersByTile: Record<number, typeof activePlayers> = {};
  for (const p of activePlayers) {
    const displayPos = getPlayerDisplayPosition(p.id, p.position);
    if (!playersByTile[displayPos]) playersByTile[displayPos] = [];
    playersByTile[displayPos].push(p);
  }

  const currentAnimTile = isAnimating && animatingPath.length > 0 ? animatingPath[animatingStep] : null;

  // Dice roll handler - only rolls dice, ActionPanel handles movement
  const handleRoll = () => {
    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = Math.floor(Math.random() * 6) + 1;
    setDiceValues([roll1, roll2]);
  };

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
      <div
        className="board-grid bg-lada/5 p-0.5 rounded-lg border-2 border-lada/20"
        style={{ width: boardSize.w, height: boardSize.h }}
      >
        {Array.from({ length: BOARD_SIZE }).map((_, row) =>
          Array.from({ length: BOARD_SIZE }).map((_, col) => {
            const tileId = grid[row][col];
            const isCenter = row > 0 && row < 10 && col > 0 && col < 10;

            if (isCenter) {
              if (row === 1 && col === 1) {
                return (
                  <div key="center" className="relative flex flex-col items-center justify-center rounded-lg border-2 border-lada/10 overflow-hidden" style={{ gridColumn: '2 / span 9', gridRow: '2 / span 9' }}>
                    {/* Background image */}
                    <Image
                      src="/main.png"
                      alt="Background"
                      fill
                      className="object-cover opacity-80"
                      priority
                    />

                    {/* Content overlay */}
                    <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4">
                      {/* Dice panel */}
                      <div className="mb-4">
                        <DicePanel
                          values={diceValues}
                          rolling={false}
                          onRoll={handleRoll}
                          disabled={phase !== 'rolling' || isAI || isInactive || isAnimating}
                        />
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }

            if (tileId === null) return <div key={`${row}-${col}`} />;

            const tile = TILES[tileId];
            const owner = tileOwners[tileId] ?? null;
            const ownerPlayer = owner ? activePlayers.find((p) => p.id === owner) : null;
            const building = buildingLevels[tileId] ?? 0;
            const playersHere = playersByTile[tileId] ?? [];
            const isCorner = [0, 10, 20, 30].includes(tileId);
            const isAnimatingHere = currentAnimTile === tileId;
            const sideClass = getSideClass(row, col);
            const tileImagePath = getTileImagePath(tileId);
            const tileImagePos = getTileImagePosition(tileId);
            const showPriceOnHover = tile.price !== undefined;

            return (
              <div
                key={`${row}-${col}`}
                className={`board-tile ${isCorner ? 'board-tile-corner' : 'board-tile-side'} ${sideClass} ${isAnimatingHere ? 'ring-4 ring-gula animate-pulse' : ''} relative group ${showPriceOnHover ? 'hover:ring-2 hover:ring-daun/50' : ''}`}
                style={{
                  ...(isCorner ? { backgroundColor: '#fef08a' } : { backgroundColor: `${getTileBg(tile)}30` }),
                  ...(owner && { boxShadow: `inset 0 0 0 2.5px ${ownerPlayer?.color ?? '#999'}` }),
                }}
                title={`${tile.name}${tile.description ? ' - ' + tile.description : ''}${owner ? ` (Dimiliki oleh ${ownerPlayer?.name})` : ''}`}
              >
                {/* Tile image (if available) - shown prominently */}
                {tileImagePath ? (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={tileImagePath}
                      alt={tile.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 100px) 100vw"
                    />
                  </div>
                ) : (
                  <>
                    {/* Color strip */}
                    {tile.category === 'property' && tile.colorGroup && !isCorner && (
                      <div className="absolute top-0 left-0 right-0 h-3 rounded-t-sm z-10" style={{ backgroundColor: getTileBg(tile) }} />
                    )}

                    {/* Property name - only show if no image */}
                    <span className={`font-bold leading-tight text-lada text-[10px] text-center ${tile.category === 'property' && !isCorner ? 'mt-3' : ''} relative z-10`}>
                      {tile.name}
                    </span>
                  </>
                )}

                {isCorner && tile.description && (
                  <span className="text-[8px] text-lada/50 text-center leading-tight relative z-10">{tile.description}</span>
                )}

                {/* Price - only show on hover */}
                {tile.price && !tileImagePath && (
                  <span className="text-[9px] text-lada/70 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity font-bold bg-white/80 rounded px-1">
                    Rp{(tile.price / 1000000).toFixed(tile.price % 1000000 === 0 ? 0 : 1)}Jt
                  </span>
                )}

                {tile.category === 'tax' && tile.taxAmount && (
                  <span className="text-[9px] text-red-700 font-bold relative z-10">Rp{(tile.taxAmount / 1000).toFixed(0)}rb</span>
                )}

                {building > 0 && <BuildingIndicator level={building} />}

                {/* Owner dot with player color */}
                {owner && (
                  <div className="w-3 h-3 rounded-full border-2 mt-0.5 relative z-10 shadow-sm" style={{ backgroundColor: ownerPlayer?.color ?? '#999', borderColor: ownerPlayer?.color ?? '#999' }} />
                )}

                {/* Player bidak tokens - with smooth movement animation */}
                {playersHere.length > 0 && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5 z-20">
                    {playersHere.map((p) => {
                      const isBeingAnimated = isAnimating && animatingPlayerId === p.id;
                      const isCurrentPlayer = p.id === currentPlayer?.id;
                      return (
                        <div
                          key={p.id}
                          className={`relative transition-all duration-300 ease-out ${isBeingAnimated ? 'scale-125 animate-bounce' : ''} ${isCurrentPlayer && phase === 'rolling' ? 'animate-pulse' : ''}`}
                        >
                          {/* Current player indicator ring */}
                          {isCurrentPlayer && phase === 'rolling' && (
                            <div className="absolute inset-0 -m-1 rounded-full bg-gula/50 animate-ping" />
                          )}
                          <div className={`relative ${isBeingAnimated ? 'ring-3 ring-gula rounded-full bg-white/40 p-1' : ''}`}>
                            <Image
                              src={`/bidak/${p.roleId}.png`}
                              alt={p.name}
                              width={24}
                              height={24}
                              className="object-contain drop-shadow-lg transition-transform duration-200"
                              style={{ filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.7))' }}
                              title={p.name}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
