'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/lib/store/useGameStore';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { ROLES } from '@/lib/roles';
import { formatMoney } from '@/lib/utils';
import SetupScreen from './game/SetupScreen';
import GameBoard from './game/GameBoard';
import PlayerPanel from './game/PlayerPanel';
import ActionPanel from './game/ActionPanel';
import LogPanel from './game/LogPanel';
import GameOverModal from './game/GameOverModal';
import ActionModal from './game/ActionModal';

// Compact current player indicator for left panel header
function CurrentPlayerBadge() {
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const turnNumber = useGameStore((s) => s.turnNumber);
  const players = usePlayerStore((s) => s.players);
  const currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer) return null;
  const role = ROLES.find((r) => r.id === currentPlayer.roleId);

  return (
    <div className="p-2 border-b border-lada/10 bg-lada text-garam">
      <div className="flex items-center gap-1.5">
        <Image src={`/bidak/${currentPlayer.roleId}.png`} alt={currentPlayer.name} width={22} height={22} className="object-contain" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[11px] truncate">{currentPlayer.name}</span>
            {currentPlayer.isAI && <span className="text-[7px] bg-gula/30 text-gula px-1 py-0.5 rounded font-bold">AI</span>}
          </div>
          <div className="text-[9px] opacity-60">{role?.name} · #{turnNumber}</div>
        </div>
        <span className="font-black text-[11px]" style={{ color: currentPlayer.money >= 0 ? '#22c55e' : '#ef4444' }}>
          {formatMoney(currentPlayer.money)}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const phase = useGameStore((s) => s.phase);
  const [rightTab, setRightTab] = useState<'action' | 'log'>('action');

  if (phase === 'setup') {
    return <SetupScreen />;
  }

  return (
    <div className="h-screen bg-garam flex overflow-hidden">
      {/* Left sidebar - player info */}
      <div className="w-44 flex-shrink-0 flex flex-col border-r-2 border-lada/10 bg-kelapa/30 overflow-hidden">
        <CurrentPlayerBadge />
        <div className="flex-1 overflow-auto p-1.5">
          <PlayerPanel />
        </div>
      </div>

      {/* Center - board */}
      <div className="flex-1 flex items-center justify-center p-1 min-w-0 min-h-0">
        <GameBoard />
      </div>

      {/* Right sidebar - actions + log */}
      <div className="w-44 flex-shrink-0 flex flex-col border-l-2 border-lada/10 bg-kelapa/30 overflow-hidden">
        {/* Tab toggle */}
        <div className="flex border-b border-lada/10">
          <button
            className={`flex-1 text-[10px] font-bold py-1.5 transition-colors ${rightTab === 'action' ? 'bg-lada text-garam' : 'text-lada/50'}`}
            onClick={() => setRightTab('action')}
          >
            Aksi
          </button>
          <button
            className={`flex-1 text-[10px] font-bold py-1.5 transition-colors ${rightTab === 'log' ? 'bg-lada text-garam' : 'text-lada/50'}`}
            onClick={() => setRightTab('log')}
          >
            Log
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-1.5">
          {rightTab === 'action' && <ActionPanel />}
          {rightTab === 'log' && <LogPanel />}
        </div>
      </div>

      {/* Popups */}
      <ActionModal />
      <GameOverModal />
    </div>
  );
}
