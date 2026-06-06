import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { getCategoryById } from '../constants/categories';
import { toMonthly, getDaysUntilRenewal, formatCurrency } from '../utils/calculations';

const SubscriptionCard = ({ subscription, onPress }) => {
  const cat = getCategoryById(subscription.category);
  // Always use the subscription's own currency, not a global prop
  const currency = subscription.currency || 'USD';
  const daysLeft = getDaysUntilRenewal(subscription.startDate, subscription.billingCycle);
  const monthly = toMonthly(subscription.amount, subscription.billingCycle);
  const isPaused = subscription.status === 'paused';
  const isUrgent = daysLeft <= 3 && !isPaused;
  const isTrial = subscription.isTrial;

  return (
    <TouchableOpacity style={[styles.card, isPaused && styles.paused]} onPress={onPress} activeOpacity={0.7}>
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: cat.color }]} />

      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{subscription.customIcon || cat.icon}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{subscription.name}</Text>
          {isTrial && <View style={styles.trialBadge}><Text style={styles.trialText}>TRIAL</Text></View>}
          {subscription.unused && <Text style={styles.unusedDot}>●</Text>}
        </View>
        <Text style={styles.category}>{cat.icon} {cat.label}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>{formatCurrency(subscription.amount, currency)}</Text>
        <Text style={styles.cycle}>/{subscription.billingCycle}</Text>
        <View style={[styles.renewBadge, isUrgent && styles.urgentBadge]}>
          <Text style={[styles.renewText, isUrgent && styles.urgentText]}>
            {isPaused ? '⏸ Paused' : daysLeft === 0 ? 'Today' : `${daysLeft}d`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  paused: { opacity: 0.6 },
  accent: { width: 4, alignSelf: 'stretch' },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.md,
  },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...typography.body, fontWeight: '600', color: colors.text, maxWidth: 140 },
  category: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  trialBadge: {
    backgroundColor: colors.warning + '22',
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  trialText: { fontSize: 9, fontWeight: '700', color: colors.warning },
  unusedDot: { color: colors.textLight, fontSize: 10 },
  right: { alignItems: 'flex-end', padding: spacing.md },
  amount: { ...typography.body, fontWeight: '700', color: colors.text },
  cycle: { ...typography.caption, color: colors.textSecondary },
  renewBadge: {
    marginTop: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  urgentBadge: { backgroundColor: colors.danger + '15' },
  renewText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  urgentText: { color: colors.danger },
});

export default SubscriptionCard;
