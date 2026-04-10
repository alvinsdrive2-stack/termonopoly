'use client';

import Image from 'next/image';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useBoardStore } from '@/lib/store/useBoardStore';
import { useGameStore } from '@/lib/store/useGameStore';
import { ROLES } from '@/lib/roles';
import { TILES } from '@/lib/tiles';
import { formatMoney } from '@/lib/utils';
import { BuildingLevel } from '@/lib/types';

export default function PlayerPanel() {
  const players = usePlayerStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const tileOwners = useBoardStore((s) => s.tileOwners);
  const buildingLevels = useBoardStore((s) => s.buildingLevels);

  return (
    <div className="flex flex-col gap-3 w-full">
      <h2 className="text-lg font-bold text-lada border-b-2 border-lada/30 pb-1">
        Pemain
      </h2>
      {players.map((player, idx) => {
        const role = ROLES.find((r) => r.id === player.roleId);
        const isCurrent = idx === currentPlayerIndex;
        const isActive = !player.bankrupt;

        return (
          <div
            key={player.id}
            className={`
              card-retro p-3 transition-all
              ${isCurrent && isActive ? 'ring-2 ring-gula bg-white' : 'bg-kelapa/50'}
              ${player.bankrupt ? 'opacity-40' : ''}
            `}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Image
                src={`/bidak/${player.roleId}.png`}
                alt={player.name}
                width={28}
                height={28}
                className="object-contain flex-shrink-0 drop-shadow"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm truncate ${isCurrent ? 'text-sambal' : 'text-lada'}`}>
                    {player.name}
                  </span>
                  {isCurrent && isActive && (
                    <span className="text-xs bg-gula text-lada px-1.5 py-0.5 rounded font-bold">
                      GILIRAN
                    </span>
                  )}
                  {player.bankrupt && (
                    <span className="text-xs bg-sambal text-white px-1.5 py-0.5 rounded font-bold">
                      BANGKRUT
                    </span>
                  )}
                  {player.isAI && !player.bankrupt && (
                    <span className="text-[10px] bg-jeruk/20 text-jeruk px-1.5 py-0.5 rounded font-bold">
                      AI
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-lada/60">{role?.name}</div>
              </div>
            </div>

            {/* Money */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-lada/70">Uang:</span>
              <span className={`font-bold text-sm ${player.money >= 0 ? 'text-daun' : 'text-sambal'}`}>
                {formatMoney(player.money)}
              </span>
            </div>

            {/* Position */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-lada/70">Petak:</span>
              <span className="text-xs font-medium text-lada">
                {TILES[player.position]?.name ?? '-'}
              </span>
            </div>

            {/* Status */}
            {player.jailed && (
              <div className="text-xs text-sambal font-bold">Penjara ({player.jailTurns} giliran)</div>
            )}
            {player.skipTurns > 0 && (
              <div className="text-xs text-jeruk font-bold">Lewati {player.skipTurns} giliran</div>
            )}

            {/* Properties */}
            {player.properties.length > 0 && (
              <div className="mt-2 border-t border-lada/20 pt-1">
                <div className="text-[10px] text-lada/60 mb-1">Properti ({player.properties.length}):</div>
                <div className="flex flex-wrap gap-1">
                  {player.properties.map((tileId) => {
                    const tile = TILES.find((t) => t.id === tileId);
                    const level: BuildingLevel = buildingLevels[tileId] ?? 0;
                    return (
                      <span
                        key={tileId}
                        className="text-[9px] px-1 py-0.5 rounded bg-white border border-lada/20"
                        title={`${tile?.name} (${level} bangunan)`}
                      >
                        {tile?.name.slice(0, 8)}{level > 0 ? ` ${'■'.repeat(Math.min(level, 4))}${level === 5 ? 'H' : ''}` : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
