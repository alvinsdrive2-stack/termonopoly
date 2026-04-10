'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ROLES } from '@/lib/roles';
import { Role } from '@/lib/types';
import { getPlayerColor } from '@/lib/theme';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useBoardStore } from '@/lib/store/useBoardStore';
import { useCardStore } from '@/lib/store/useCardStore';
import { useGameStore } from '@/lib/store/useGameStore';
import { useLogStore } from '@/lib/store/useLogStore';

const PLAYER_NAMES = ['Budi', 'Siti', 'Andi', 'Dewi', 'Rizal', 'Mega'];
type PlayerMode = 'manusia' | 'ai';

interface PlayerSetup {
  name: string;
  roleId: string;
  mode: PlayerMode;
}

// ========== CHARACTER CARD ==========
function CharacterCard({
  role,
  selected,
  taken,
  onClick,
}: {
  role: Role;
  selected: boolean;
  taken: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={taken}
      className={`
        relative card-retro p-3 text-left transition-all
        ${selected ? 'ring-3 ring-daun bg-daun/10 scale-[1.02]' : 'bg-white hover:bg-kelapa/50'}
        ${taken ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer'}
      `}
    >
      {/* Character image */}
      <div className="w-full rounded-lg overflow-hidden bg-garam mb-2 border border-lada/20">
        <Image
          src={`/charselect/${role.id}.png`}
          alt={role.name}
          width={200}
          height={200}
          className="w-full h-auto"
          style={{ display: 'block' }}
        />
      </div>

      {/* Name */}
      <h3 className="font-bold text-sm text-lada leading-tight">{role.name}</h3>
      <p className="text-[10px] text-lada/50 italic">{role.nickname}</p>

      {/* Passive */}
      <p className="text-[11px] text-daun mt-1 leading-tight">
        {role.passive}
      </p>

      {/* Debuff */}
      {role.debuff && (
        <p className="text-[10px] text-sambal mt-0.5 leading-tight">
          {role.debuff}
        </p>
      )}

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-2 right-2 bg-daun text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          DIPILIH
        </div>
      )}

      {/* Taken badge */}
      {taken && !selected && (
        <div className="absolute top-2 right-2 bg-lada/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          TERPAKAI
        </div>
      )}
    </button>
  );
}

// ========== CHARACTER SELECT MODAL ==========
function CharacterSelectModal({
  playerIndex,
  currentRoleId,
  takenRoleIds,
  onSelect,
  onClose,
}: {
  playerIndex: number;
  currentRoleId: string;
  takenRoleIds: string[];
  onSelect: (roleId: string) => void;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState(currentRoleId);

  return (
    <div className="fixed inset-0 bg-lada/70 flex items-center justify-center z-50 p-4">
      <div className="card-retro bg-garam p-5 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-lada">
            Pilih Karakter - Pemain {playerIndex + 1}
          </h2>
          <button
            onClick={onClose}
            className="text-lada/50 hover:text-lada text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
          {ROLES.map((role) => (
            <CharacterCard
              key={role.id}
              role={role}
              selected={selectedId === role.id}
              taken={takenRoleIds.includes(role.id) && selectedId !== role.id}
              onClick={() => setSelectedId(role.id)}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            className="btn-retro bg-daun text-white flex-1 text-lg"
            onClick={() => onSelect(selectedId)}
          >
            Pilih Karakter Ini
          </button>
          <button
            className="btn-retro bg-garam text-lada"
            onClick={onClose}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== PLAYER ROW ==========
function PlayerRow({
  setup,
  index,
  onUpdate,
  onOpenCharSelect,
  allTakenRoles,
}: {
  setup: PlayerSetup;
  index: number;
  onUpdate: (field: keyof PlayerSetup, value: string) => void;
  onOpenCharSelect: () => void;
  allTakenRoles: string[];
}) {
  const role = ROLES.find((r) => r.id === setup.roleId);

  return (
    <div className="card-retro bg-white p-4">
      {/* Player header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-full border-3 border-lada flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: role?.color ?? getPlayerColor(index) }}
        >
          {index + 1}
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={setup.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            className="w-full border-2 border-lada/30 rounded-lg px-3 py-1.5 text-sm font-bold bg-white focus:outline-none focus:border-merah"
            placeholder="Nama pemain"
          />
        </div>
        <select
          value={setup.mode}
          onChange={(e) => onUpdate('mode', e.target.value)}
          className="border-2 border-lada/30 rounded-lg px-3 py-1.5 text-sm bg-white font-bold"
        >
          <option value="manusia">Manusia</option>
          <option value="ai">AI Bot</option>
        </select>
      </div>

      {/* Selected character */}
      <button
        onClick={onOpenCharSelect}
        className="w-full flex items-center gap-3 p-2 rounded-lg border-2 border-dashed border-lada/30 hover:border-daun hover:bg-daun/5 transition-colors"
      >
        {role && (
          <div className="w-14 rounded-lg overflow-hidden bg-garam flex-shrink-0 border border-lada/20">
            <Image
              src={`/charselect/${role.id}.png`}
              alt={role.name}
              width={56}
              height={56}
              className="w-full h-auto"
              style={{ display: 'block' }}
            />
          </div>
        )}
        <div className="text-left flex-1 min-w-0">
          <p className="font-bold text-sm text-lada">{role?.name ?? 'Pilih karakter...'}</p>
          <p className="text-[11px] text-daun truncate">{role?.passive ?? 'Tekan untuk memilih karakter'}</p>
          {role?.debuff && (
            <p className="text-[10px] text-sambal truncate">{role.debuff}</p>
          )}
        </div>
        <span className="text-lada/30 text-lg">›</span>
      </button>
    </div>
  );
}

// ========== MAIN SETUP SCREEN ==========
export default function SetupScreen() {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerSetups, setPlayerSetups] = useState<PlayerSetup[]>([
    { name: PLAYER_NAMES[0], roleId: 'magang', mode: 'manusia' },
    { name: PLAYER_NAMES[1], roleId: 'creator', mode: 'ai' },
  ]);
  const [charSelectOpen, setCharSelectOpen] = useState<number | null>(null);

  const addPlayer = usePlayerStore((s) => s.addPlayer);
  const initBoard = useBoardStore((s) => s.initBoard);
  const initDecks = useCardStore((s) => s.initDecks);
  const setPhase = useGameStore((s) => s.setPhase);
  const clearLog = useLogStore((s) => s.clearLog);

  // Collect all taken role IDs (excluding the player currently selecting)
  function getTakenRoleIds(excludeIndex?: number): string[] {
    return playerSetups
      .filter((_, i) => i !== excludeIndex)
      .map((s) => s.roleId);
  }

  function updatePlayerCount(count: number) {
    setPlayerCount(count);
    const newSetups: PlayerSetup[] = [];
    for (let i = 0; i < count; i++) {
      if (playerSetups[i]) {
        newSetups.push(playerSetups[i]);
      } else {
        // Pick first available role not already taken
        const taken = newSetups.map((s) => s.roleId);
        const available = ROLES.find((r) => !taken.includes(r.id));
        newSetups.push({
          name: PLAYER_NAMES[i],
          roleId: available?.id ?? ROLES[0].id,
          mode: i === 0 ? 'manusia' : 'ai',
        });
      }
    }
    setPlayerSetups(newSetups);
  }

  function updateSetup(index: number, field: keyof PlayerSetup, value: string) {
    const updated = [...playerSetups];
    updated[index] = { ...updated[index], [field]: value };
    setPlayerSetups(updated);
  }

  function handleSelectRole(playerIndex: number, roleId: string) {
    updateSetup(playerIndex, 'roleId', roleId);
    setCharSelectOpen(null);
  }

  function startGame() {
    usePlayerStore.getState().resetPlayers();
    useBoardStore.getState().resetBoard();
    useCardStore.getState().resetCards();
    useGameStore.getState().resetGame();
    clearLog();

    initBoard();
    initDecks();

    playerSetups.forEach((setup, i) => {
      const role = ROLES.find((r) => r.id === setup.roleId);
      addPlayer(
        `player-${i}`,
        setup.name,
        role?.color ?? getPlayerColor(i),
        setup.roleId,
        setup.mode === 'ai'
      );
    });

    setPhase('rolling');
  }

  return (
    <div className="min-h-screen bg-garam">
      {/* Character select modal */}
      {charSelectOpen !== null && (
        <CharacterSelectModal
          playerIndex={charSelectOpen}
          currentRoleId={playerSetups[charSelectOpen].roleId}
          takenRoleIds={getTakenRoleIds(charSelectOpen)}
          onSelect={(roleId) => handleSelectRole(charSelectOpen, roleId)}
          onClose={() => setCharSelectOpen(null)}
        />
      )}

      <div className="max-w-xl mx-auto p-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-lada tracking-tight">NASIB BANGSA</h1>
          <p className="text-sm text-lada/50 mt-1">Monopoli Indonesia - Edisi Satir</p>
          <div className="w-20 h-1 bg-merah mx-auto mt-3 rounded-full" />
        </div>

        {/* Player count */}
        <div className="card-retro bg-white p-4 mb-4">
          <label className="text-sm font-bold text-lada block mb-2">
            Jumlah Pemain
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((count) => (
              <button
                key={count}
                className={`btn-retro text-sm flex-1 ${
                  playerCount === count
                    ? 'bg-merah text-white'
                    : 'bg-garam text-lada'
                }`}
                onClick={() => updatePlayerCount(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Player setups */}
        <div className="space-y-3 mb-6">
          {playerSetups.map((setup, i) => (
            <PlayerRow
              key={i}
              setup={setup}
              index={i}
              onUpdate={(field, value) => updateSetup(i, field, value)}
              onOpenCharSelect={() => setCharSelectOpen(i)}
              allTakenRoles={getTakenRoleIds(i)}
            />
          ))}
        </div>

        {/* Start button */}
        <button
          className="btn-retro bg-daun text-white w-full text-xl py-4"
          onClick={startGame}
        >
          Mulai Bermain!
        </button>
      </div>
    </div>
  );
}
