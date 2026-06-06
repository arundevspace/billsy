import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { sendTestNotification, NOTIFY_OPTIONS } from '../utils/notifications';
import { getCategoryById } from '../constants/categories';
import { toMonthly, toYearly, getDaysUntilRenewal, getNextRenewal, formatCurrency } from '../utils/calculations';
import { colors, spacing, radius, typography } from '../constants/theme';
import dayjs from 'dayjs';

export default function SubscriptionDetailScreen({ navigation, route }) {
  const { subscription: initialSub } = route.params;
  const { subscriptions, deleteSubscription, toggleStatus, markUnused } = useSubscriptionStore();
  const sub = subscriptions.find(s => s.id === initialSub.id) || initialSub;
  const currency = sub?.currency || 'INR';

  const cat = getCategoryById(sub.category);
  const daysLeft = getDaysUntilRenewal(sub.startDate, sub.billingCycle);
  const nextRenewal = dayjs(getNextRenewal(sub.startDate, sub.billingCycle));
  const monthly = toMonthly(sub.amount, sub.billingCycle);
  const yearly = toYearly(sub.amount, sub.billingCycle);

  const handleDelete = () => {
    Alert.alert('Delete Subscription', `Remove ${sub.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteSubscription(sub.id); navigation.goBack(); },
      },
    ]);
  };

  const InfoRow = ({ label, value, valueColor }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: cat.color + '18' }]}>
          <View style={[styles.heroIcon, { backgroundColor: cat.color + '30' }]}>
            <Text style={styles.heroEmoji}>{sub.customIcon || cat.icon}</Text>
          </View>
          <Text style={styles.heroName}>{sub.name}</Text>
          <Text style={styles.heroAmount}>{formatCurrency(sub.amount, sub.currency || 'USD')}</Text>
          <Text style={styles.heroCycle}>per {sub.billingCycle}</Text>

          <View style={styles.heroBadges}>
            <View style={[styles.badge, { backgroundColor: cat.color + '22' }]}>
              <Text style={[styles.badgeText, { color: cat.color }]}>{cat.icon} {cat.label}</Text>
            </View>
            {sub.isTrial && (
              <View style={[styles.badge, { backgroundColor: colors.warning + '22' }]}>
                <Text style={[styles.badgeText, { color: colors.warning }]}>🧪 Free Trial</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: sub.status === 'active' ? colors.success + '22' : colors.textLight + '22' }]}>
              <Text style={[styles.badgeText, { color: sub.status === 'active' ? colors.success : colors.textLight }]}>
                {sub.status === 'active' ? '● Active' : '⏸ Paused'}
              </Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Billing Details</Text>
          <InfoRow label="Monthly cost" value={formatCurrency(monthly, sub.currency)} />
          <InfoRow label="Yearly cost" value={formatCurrency(yearly, sub.currency)} />
          <InfoRow label="Next renewal" value={nextRenewal.format('MMM D, YYYY')} />
          <InfoRow
            label="Days until renewal"
            value={daysLeft === 0 ? 'Today!' : `${daysLeft} days`}
            valueColor={daysLeft <= 3 ? colors.danger : colors.primary}
          />
          <InfoRow label="Billing cycle" value={sub.billingCycle.charAt(0).toUpperCase() + sub.billingCycle.slice(1)} />
          <InfoRow label="Started" value={dayjs(sub.startDate).format('MMM D, YYYY')} />
          {sub.isTrial && sub.trialEndDate && (
            <InfoRow label="Trial ends" value={dayjs(sub.trialEndDate).format('MMM D, YYYY')} valueColor={colors.warning} />
          )}
        </View>

        {/* Notification Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <InfoRow
            label="Remind me"
            value={(() => {
              const days = sub.notifyDaysBefore ?? 3;
              const opt = NOTIFY_OPTIONS.find(o => o.daysBefore === days);
              return opt ? opt.label : `${days} days before`;
            })()}
          />
          <TouchableOpacity
            style={styles.testNotifBtn}
            onPress={async () => {
              await sendTestNotification(sub);
              Alert.alert('✅ Test Sent', 'You\'ll receive a notification in 3 seconds.');
            }}
          >
            <Text style={styles.testNotifText}>🧪 Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {sub.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notes}>{sub.notes}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
            onPress={() => navigation.navigate('AddSubscription', { subscription: sub })}
          >
            <Text style={[styles.actionText, { color: colors.primary }]}>✏️ Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.warning + '18' }]}
            onPress={() => toggleStatus(sub.id)}
          >
            <Text style={[styles.actionText, { color: colors.warning }]}>
              {sub.status === 'active' ? '⏸ Pause' : '▶️ Resume'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.textLight + '18' }]}
            onPress={() => markUnused(sub.id)}
          >
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              {sub.unused ? '✅ Mark Used' : '😴 Mark Unused'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.danger + '12' }]}
            onPress={handleDelete}
          >
            <Text style={[styles.actionText, { color: colors.danger }]}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  hero: {
    alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md,
  },
  heroIcon: {
    width: 80, height: 80, borderRadius: 20, alignItems: 'center',
    justifyContent: 'center', marginBottom: spacing.md,
  },
  heroEmoji: { fontSize: 40 },
  heroName: { ...typography.h2, color: colors.text, marginBottom: 4 },
  heroAmount: { fontSize: 36, fontWeight: '800', color: colors.text },
  heroCycle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  heroBadges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },

  card: {
    backgroundColor: colors.card, marginHorizontal: spacing.md, marginBottom: spacing.md,
    borderRadius: radius.lg, padding: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  cardTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoLabel: { ...typography.body, color: colors.textSecondary },
  infoValue: { ...typography.body, fontWeight: '600', color: colors.text },
  notes: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  testNotifBtn: {
    marginTop: spacing.sm, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.primary, padding: spacing.sm, alignItems: 'center',
  },
  testNotifText: { color: colors.primary, fontWeight: '600', fontSize: 14 },

  actions: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  actionBtn: {
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
  },
  actionText: { ...typography.body, fontWeight: '600' },
});
