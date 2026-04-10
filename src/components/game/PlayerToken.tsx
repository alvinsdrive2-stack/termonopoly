'use client';

import Image from 'next/image';

interface PlayerTokenProps {
  roleId: string;
  name: string;
  size?: number;
  className?: string;
  isAnimating?: boolean;
}

export default function PlayerToken({ roleId, name, size = 20, className = '', isAnimating = false }: PlayerTokenProps) {
  return (
    <Image
      src={`/bidak/${roleId}.png`}
      alt={name}
      width={size}
      height={size}
      className={`
        object-contain drop-shadow-md
        ${isAnimating ? 'scale-125 z-20 ring-2 ring-yellow-400' : ''}
        ${className}
      `}
      style={{ transition: 'all 0.15s ease' }}
      title={name}
    />
  );
}
