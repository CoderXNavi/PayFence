import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const SecurityContext = createContext(null);

export const SecurityProvider = ({ children }) => {
  const [walletBalance, setWalletBalance] = useState(500.00);
  const [dailyBudget, setDailyBudget] = useState(200.00);
  const [spentToday, setSpentToday] = useState(12.50);
  const [perTxCap, setPerTxCap] = useState(50.00);
  const [guardActive, setGuardActive] = useState(true);
  const [blockedCount, setBlockedCount] = useState(15);
  const [totalInspected, setTotalInspected] = useState(16);
  const [policy, setPolicy] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  // Load initial policy and logs
  useEffect(() => {
    const initData = async () => {
      try {
        const pol = await api.getPolicy();
        setPolicy(pol);
        if (pol.walletBalance !== undefined) setWalletBalance(pol.walletBalance);
        if (pol.dailyBudget !== undefined) setDailyBudget(pol.dailyBudget);
        if (pol.perTxCap !== undefined) setPerTxCap(pol.perTxCap);
        if (pol.spentToday !== undefined) setSpentToday(pol.spentToday);

        const logs = await api.getAuditLogs();
        setRecentLogs(logs);
        const blocked = logs.filter(l => l.verdict === 'BLOCKED' || l.status === 403).length;
        if (blocked > 0) {
          setBlockedCount(Math.max(15, blocked));
          setTotalInspected(Math.max(16, logs.length));
        }
      } catch (e) {
        console.error('Failed to initialize security state:', e);
      }
    };
    initData();
  }, []);

  const incrementStats = (verdict, amount = 0) => {
    setTotalInspected(prev => prev + 1);
    if (verdict === 'BLOCKED') {
      setBlockedCount(prev => prev + 1);
    } else if (verdict === 'APPROVED') {
      const numAmount = parseFloat(amount) || 0;
      setSpentToday(prev => +(prev + numAmount).toFixed(2));
      setWalletBalance(prev => +(prev - numAmount).toFixed(2));
    }
  };

  const updatePolicies = async (updated) => {
    const res = await api.updatePolicy(updated);
    setPolicy(res);
    if (res.walletBalance !== undefined) setWalletBalance(res.walletBalance);
    if (res.dailyBudget !== undefined) setDailyBudget(res.dailyBudget);
    if (res.perTxCap !== undefined) setPerTxCap(res.perTxCap);
    return res;
  };

  const refreshLogs = async () => {
    const logs = await api.getAuditLogs();
    setRecentLogs(logs);
    return logs;
  };

  return (
    <SecurityContext.Provider value={{
      walletBalance,
      dailyBudget,
      spentToday,
      remainingDailyBudget: Math.max(0, +(dailyBudget - spentToday).toFixed(2)),
      perTxCap,
      guardActive,
      setGuardActive,
      blockedCount,
      totalInspected,
      policy,
      updatePolicies,
      recentLogs,
      refreshLogs,
      incrementStats
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error('useSecurity must be used within SecurityProvider');
  return ctx;
};
