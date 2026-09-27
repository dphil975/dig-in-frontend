import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';

/* A quiet identity line above the tabs: who you are, plus the three numbers
   that matter (the full breakdown lives in the tabs). */
export default function ProfileHeader() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ coins: 0, dishes: 0, badges: 0 });

  useEffect(() => {
    try {
      setStats({
        coins: parseInt(localStorage.getItem('dig_in_coins') || '0', 10),
        dishes: parseInt(localStorage.getItem('dig_in_made_count') || '0', 10),
        badges: JSON.parse(localStorage.getItem('dig_in_badges') || '[]').length,
      });
    } catch { /* ignore */ }
  }, []);

  const name = user?.user_metadata?.username || user?.email || user?.phone || 'You';

  return (
    <header className="pfh">
      <h1 className="pfh-name">{name}</h1>
      <p className="pfh-stats">
        <span><b>{stats.coins}</b> coins</span>
        <span><b>{stats.dishes}</b> dishes made</span>
        <span><b>{stats.badges}</b> badges</span>
      </p>
    </header>
  );
}
