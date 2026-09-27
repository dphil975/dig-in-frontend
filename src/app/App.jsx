import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../styles/leaflet.css';
import { pullAndMerge } from '../lib/syncService';
import AuthGate from '../components/shell/AuthGate';
import OnboardingGate from '../components/shell/OnboardingGate';
import SideRail from '../components/shell/SideRail';
import AppRouter from './router';

import AskNova from '../components/shell/AskNova';
import RunTimerBar from '../components/shell/RunTimerBar';

export default function App() {
  useEffect(() => { pullAndMerge(); }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthGate>
      <OnboardingGate />
      <div className="app-shell">
      <SideRail />
      <div className="app-main">
        <AppRouter />
      </div>
      </div>
      <RunTimerBar />
      <AskNova />
      </AuthGate>
    </BrowserRouter>
  );
}
