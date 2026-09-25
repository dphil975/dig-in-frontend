import { useState, useCallback } from 'react';

const COIN_KEY = 'dig_in_coins';

export function useCoins() {
  const [coins, setCoins] = useState(() => parseInt(localStorage.getItem(COIN_KEY) || '0', 10));

  const refresh = useCallback(() => {
    setCoins(parseInt(localStorage.getItem(COIN_KEY) || '0', 10));
  }, []);

  const add = useCallback((n) => {
    const next = coins + n;
    localStorage.setItem(COIN_KEY, String(next));
    setCoins(next);
    return next;
  }, [coins]);

  return { coins, add, refresh };
}
