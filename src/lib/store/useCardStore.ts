import { create } from 'zustand';
import { Card } from '../types';
import { DANA_UMUM_CARDS, KESEMPATAN_CARDS } from '../cards';
import { shuffleDeck } from '../utils';

interface CardState {
  danaUmumDeck: Card[];
  danaUmumDiscard: Card[];
  kesempatanDeck: Card[];
  kesempatanDiscard: Card[];
  currentCard: Card | null;
}

interface CardActions {
  initDecks: () => void;
  drawCard: (type: 'danaUmum' | 'kesempatan') => Card | null;
  discardCurrentCard: () => void;
  setCurrentCard: (card: Card | null) => void;
  resetCards: () => void;
}

export const useCardStore = create<CardState & CardActions>()((set, get) => ({
  danaUmumDeck: [],
  danaUmumDiscard: [],
  kesempatanDeck: [],
  kesempatanDiscard: [],
  currentCard: null,

  initDecks: () =>
    set({
      danaUmumDeck: shuffleDeck(DANA_UMUM_CARDS),
      danaUmumDiscard: [],
      kesempatanDeck: shuffleDeck(KESEMPATAN_CARDS),
      kesempatanDiscard: [],
      currentCard: null,
    }),

  drawCard: (type) => {
    const state = get();
    const deckKey = type === 'danaUmum' ? 'danaUmumDeck' : 'kesempatanDeck';
    const discardKey = type === 'danaUmum' ? 'danaUmumDiscard' : 'kesempatanDiscard';

    let deck = [...state[deckKey]];
    let discard = [...state[discardKey]];

    if (deck.length === 0) {
      deck = shuffleDeck(discard);
      discard = [];
    }

    if (deck.length === 0) return null;

    const card = deck.shift()!;
    set({
      [deckKey]: deck,
      [discardKey]: discard,
      currentCard: card,
    });
    return card;
  },

  discardCurrentCard: () => {
    const state = get();
    if (!state.currentCard) return;

    const type = state.currentCard.type;
    const discardKey = type === 'danaUmum' ? 'danaUmumDiscard' : 'kesempatanDiscard';

    set((s) => ({
      [discardKey]: [...(s[discardKey] as Card[]), s.currentCard],
      currentCard: null,
    }));
  },

  setCurrentCard: (card) => set({ currentCard: card }),

  resetCards: () =>
    set({
      danaUmumDeck: [],
      danaUmumDiscard: [],
      kesempatanDeck: [],
      kesempatanDiscard: [],
      currentCard: null,
    }),
}));
