'use client';

import { useGameStore } from '@/lib/store/useGameStore';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { ROLES } from '@/lib/roles';
import { formatMoney } from '@/lib/utils';

export default function GameOverModal() {
  const winner = useGameStore((s) => s.winner);
  const players = usePlayerStore((s) => s.players);
  const resetGame = useGameStore((s) => s.resetGame);

  if (!winner) return null;

  const winnerPlayer = players.find((p) => p.id === winner);
  if (!winnerPlayer) return null;

  const winnerRole = ROLES.find((r) => r.id === winnerPlayer.roleId);

  return (
    <div className="fixed inset-0 bg-lada/50 flex items-center justify-center z-50">
      <div className="card-retro bg-white p-6 max-w-md w-full mx-4 text-center">
        <div className="text-4xl mb-3">🏆</div>
        <h2 className="text-2xl font-bold text-merah mb-2">PERMAINAN SELESAI!</h2>
        <div
          className="w-12 h-12 rounded-full border-3 border-lada mx-auto mb-3"
          style={{ backgroundColor: winnerPlayer.color }}
        />
        <h3 className="text-xl font-bold text-lada mb-1">{winnerPlayer.name}</h3>
        <p className="text-sm text-lada/60 mb-1">{winnerRole?.name}</p>
        <p className="text-lg font-bold text-daun mb-4">{formatMoney(winnerPlayer.money)}</p>
        <p className="text-sm text-lada/70 mb-4">
          Memenangkan permainan dengan {winnerPlayer.properties.length} properti!
        </p>

        {/* Scoreboard */}
        <div className="text-left mb-4">
          <h4 className="text-sm font-bold text-lada mb-2 border-b border-lada/20 pb-1">
            Peringkat:
          </h4>
          {[...players]
            .sort((a, b) => b.money - a.money)
            .map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 py-1 text-sm">
                <span className="w-5 text-lada/40 font-bold">{i + 1}.</span>
                <div
                  className="w-4 h-4 rounded-full border border-lada/50"
                  style={{ backgroundColor: p.color }}
                />
                <span className={`flex-1 ${p.id === winner ? 'font-bold text-daun' : 'text-lada/70'}`}>
                  {p.name}
                </span>
                <span className="text-lada/60">{formatMoney(p.money)}</span>
              </div>
            ))}
        </div>

        <button
          className="btn-retro bg-merah text-white w-full text-lg"
          onClick={resetGame}
        >
          Main Lagi
        </button>
      </div>
    </div>
  );
}
