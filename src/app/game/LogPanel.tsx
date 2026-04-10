'use client';

import { useLogStore } from '@/lib/store/useLogStore';

export default function LogPanel() {
  const log = useLogStore((s) => s.log);
  const lastEntries = log.slice(-20).reverse();

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-bold text-lada border-b border-lada/30 pb-1 mb-2">
        Log Permainan
      </h3>
      <div className="flex-1 overflow-y-auto space-y-1 max-h-48">
        {lastEntries.length === 0 && (
          <p className="text-xs text-lada/40 italic">Belum ada aktivitas...</p>
        )}
        {lastEntries.map((entry, i) => (
          <div key={`${entry.timestamp}-${i}`} className="text-[11px] text-lada/80 leading-tight">
            <span className="text-lada/40">[#{entry.turn}]</span>{' '}
            {entry.message}
          </div>
        ))}
      </div>
    </div>
  );
}
