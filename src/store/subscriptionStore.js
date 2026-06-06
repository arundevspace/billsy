import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { scheduleRenewalNotification, scheduleTrialEndNotification, cancelNotificationsForSubscription } from '../utils/notifications';

const STORAGE_KEY = 'subtracker_subscriptions';

const persist = async (subscriptions) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
};

export const useSubscriptionStore = create((set, get) => ({
  subscriptions: [],
  currency: 'INR',
  loaded: false,

  loadSubscriptions: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const subscriptions = raw ? JSON.parse(raw) : [];
      set({ subscriptions, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  addSubscription: async (sub) => {
    const newSub = {
      ...sub,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: sub.status || 'active',
    };
    const updated = [...get().subscriptions, newSub];
    set({ subscriptions: updated });
    await persist(updated);
    if (newSub.status === 'active') {
      await scheduleRenewalNotification(newSub);
      if (newSub.isTrial) await scheduleTrialEndNotification(newSub);
    }
    return newSub;
  },

  updateSubscription: async (id, changes) => {
    const updated = get().subscriptions.map((s) =>
      s.id === id ? { ...s, ...changes } : s
    );
    set({ subscriptions: updated });
    await persist(updated);
    const sub = updated.find(s => s.id === id);
    if (sub) {
      await cancelNotificationsForSubscription(id);
      if (sub.status === 'active') await scheduleRenewalNotification(sub);
    }
  },

  deleteSubscription: async (id) => {
    await cancelNotificationsForSubscription(id);
    const updated = get().subscriptions.filter((s) => s.id !== id);
    set({ subscriptions: updated });
    await persist(updated);
  },

  toggleStatus: async (id) => {
    const sub = get().subscriptions.find(s => s.id === id);
    if (!sub) return;
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    await get().updateSubscription(id, { status: newStatus });
  },

  markUnused: async (id) => {
    const sub = get().subscriptions.find(s => s.id === id);
    if (!sub) return;
    await get().updateSubscription(id, { unused: !sub.unused });
  },

  setCurrency: (currency) => set({ currency }),
}));
