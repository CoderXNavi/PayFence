import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { Playground } from './pages/Playground';
import { RedTeam } from './pages/RedTeam';
import { BlueTeam } from './pages/BlueTeam';
import { AuditLogs } from './pages/AuditLogs';

export const App = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/red-team" element={<RedTeam />} />
        <Route path="/blue-team" element={<BlueTeam />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
export default App;
