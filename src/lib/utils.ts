import { Card } from './types';

export function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    return millions % 1 === 0 ? `Rp${millions}Jt` : `Rp${millions.toFixed(1)}Jt`;
  }
  if (amount >= 1000) {
    return `Rp${(amount / 1000).toFixed(0)}rb`;
  }
  return `Rp${amount}`;
}

export function shuffleDeck<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function rollDice(): [number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

export function isDoubles(dice: [number, number]): boolean {
  return dice[0] === dice[1];
}

export function isOdd(dice: [number, number]): boolean {
  return (dice[0] + dice[1]) % 2 !== 0;
}

export function getSalary(): number {
  return 2000000;
}

export function getStartingMoney(): number {
  return 5000000;
}
