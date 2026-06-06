import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import dayjs from 'dayjs';
import { getNextRenewal } from './calculations';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NOTIFY_OPTIONS = [
  { id: 'same_day',   label: 'Same day',   daysBefore: 0 },
  { id: '1_day',      label: '1 day before',  daysBefore: 1 },
  { id: '3_days',     label: '3 days before', daysBefore: 3 },
  { id: '7_days',     label: '1 week before', daysBefore: 7 },
  { id: '14_days',    label: '2 weeks before', daysBefore: 14 },
];

export const DEFAULT_NOTIFY_DAYS = 3;

export const requestPermissions = async () => {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const cancelNotificationsForSubscription = async (subscriptionId) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content?.data?.subscriptionId === subscriptionId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
};

export const scheduleRenewalNotification = async (subscription) => {
  await cancelNotificationsForSubscription(subscription.id);

  const daysBefore = subscription.notifyDaysBefore ?? DEFAULT_NOTIFY_DAYS;
  const notifyTimes = Array.isArray(daysBefore) ? daysBefore : [daysBefore];

  const nextRenewal = dayjs(getNextRenewal(subscription.startDate, subscription.billingCycle));
  const scheduledIds = [];

  for (const days of notifyTimes) {
    const notifyDate = nextRenewal.subtract(days, 'day').toDate();
    if (dayjs(notifyDate).isBefore(dayjs())) continue;

    const label = days === 0
      ? `renews today`
      : days === 1
      ? `renews tomorrow`
      : `renews in ${days} days`;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ${subscription.name} ${label}`,
        body: `$${subscription.amount} will be charged on ${nextRenewal.format('MMM D')}. Tap to review.`,
        data: { subscriptionId: subscription.id },
        sound: 'default',
      },
      trigger: { date: notifyDate },
    });

    scheduledIds.push(id);
  }

  return scheduledIds;
};

export const scheduleTrialEndNotification = async (subscription) => {
  if (!subscription.trialEndDate) return;

  const trialEnd = dayjs(subscription.trialEndDate);
  const notifyDays = [2, 1]; // 2 days before + day before trial ends

  for (const days of notifyDays) {
    const notifyDate = trialEnd.subtract(days, 'day').toDate();
    if (dayjs(notifyDate).isBefore(dayjs())) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚠️ ${subscription.name} trial ends in ${days} day${days > 1 ? 's' : ''}`,
        body: `Your free trial ends on ${trialEnd.format('MMM D')}. Cancel now to avoid being charged.`,
        data: { subscriptionId: subscription.id },
        sound: 'default',
      },
      trigger: { date: notifyDate },
    });
  }
};

export const sendTestNotification = async (subscription) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🧪 Test — ${subscription.name}`,
      body: `Notifications are working! You'll be reminded before each renewal.`,
      data: { subscriptionId: subscription.id },
      sound: 'default',
    },
    trigger: { seconds: 3 },
  });
};

export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
