import dayjs from 'dayjs';
import { BILLING_CYCLES } from '../constants/categories';

export const toMonthly = (amount, billingCycle) => {
  switch (billingCycle) {
    case 'weekly':    return amount * 4.33;
    case 'monthly':   return amount;
    case 'quarterly': return amount / 3;
    case 'yearly':    return amount / 12;
    default:          return amount;
  }
};

export const toYearly = (amount, billingCycle) => {
  const cycle = BILLING_CYCLES.find(c => c.id === billingCycle);
  return cycle ? amount * cycle.multiplier : amount * 12;
};

export const getNextRenewal = (startDate, billingCycle) => {
  const start = dayjs(startDate);
  const now = dayjs();
  let next = start;

  const addUnit = (d) => {
    switch (billingCycle) {
      case 'weekly':    return d.add(1, 'week');
      case 'monthly':   return d.add(1, 'month');
      case 'quarterly': return d.add(3, 'month');
      case 'yearly':    return d.add(1, 'year');
      default:          return d.add(1, 'month');
    }
  };

  // Advance until strictly in the future (not today — today means it renews now)
  while (!next.isAfter(now, 'day')) {
    next = addUnit(next);
  }
  return next.toDate();
};

export const getDaysUntilRenewal = (startDate, billingCycle) => {
  const next = dayjs(getNextRenewal(startDate, billingCycle));
  return next.diff(dayjs(), 'day');
};

export const getTotalMonthly = (subscriptions) =>
  subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + toMonthly(s.amount, s.billingCycle), 0);

export const getTotalYearly = (subscriptions) =>
  subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + toYearly(s.amount, s.billingCycle), 0);

// Returns [{currency, monthly, yearly}] — one entry per distinct currency
export const getTotalsByCurrency = (subscriptions) => {
  const map = {};
  subscriptions
    .filter(s => s.status === 'active')
    .forEach(s => {
      const c = s.currency || 'USD';
      if (!map[c]) map[c] = { currency: c, monthly: 0, yearly: 0 };
      map[c].monthly += toMonthly(s.amount, s.billingCycle);
      map[c].yearly  += toYearly(s.amount, s.billingCycle);
    });
  return Object.values(map);
};

export const getMonthlyByCategory = (subscriptions) => {
  const map = {};
  subscriptions
    .filter(s => s.status === 'active')
    .forEach(s => {
      const key = s.category;
      map[key] = (map[key] || 0) + toMonthly(s.amount, s.billingCycle);
    });
  return map;
};

export const getUpcomingRenewals = (subscriptions, days = 7) =>
  subscriptions
    .filter(s => s.status === 'active')
    .map(s => ({ ...s, daysLeft: getDaysUntilRenewal(s.startDate, s.billingCycle) }))
    .filter(s => s.daysLeft <= days)
    .sort((a, b) => a.daysLeft - b.daysLeft);

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const getSpendingTrend = (subscriptions) => {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const month = dayjs().subtract(i, 'month');
    const label = month.format('MMM');
    const total = subscriptions
      .filter(s => {
        const start = dayjs(s.startDate);
        return start.isBefore(month.endOf('month')) && s.status === 'active';
      })
      .reduce((sum, s) => sum + toMonthly(s.amount, s.billingCycle), 0);
    months.push({ label, total });
  }
  return months;
};
