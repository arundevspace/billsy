import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscriptionStore } from '../store/subscriptionStore';
import {
  getTotalMonthly, getTotalYearly, getMonthlyByCategory,
  getSpendingTrend, formatCurrency, getTotalsByCurrency,
} from '../utils/calculations';
import { getCategoryById } from '../constants/categories';
import { colors, spacing, radius, typography } from '../constants/theme';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - spacing.md * 2 - spacing.md * 2;
const CHART_H = 160;

// Pure RN bar chart
const BarChart = ({ data, currency }) => {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_H, gap: 6, paddingTop: 8 }}>
      {data.map((item, i) => {
        const barH = Math.max((item.total / max) * (CHART_H - 30), 4);
        const isLast = i === data.length - 1;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            {isLast && item.total > 0 && (
              <Text style={{ fontSize: 8, color: colors.primary, fontWeight: '700', marginBottom: 2 }}>
                {formatCurrency(item.total, currency)}
              </Text>
            )}
            <View style={{
              width: '100%', height: barH, borderRadius: 4,
              backgroundColor: isLast ? colors.primary : colors.primaryLight,
            }} />
            <Text style={{ fontSize: 9, color: colors.textSecondary, marginTop: 4 }}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

// Pure RN horizontal bar chart for categories
const CategoryBar = ({ label, amount, total, color, currency }) => {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: colors.text, fontWeight: '500' }}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
          {formatCurrency(amount, currency)} · {pct.toFixed(0)}%
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: 8, width: `${pct}%`, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
};

export default function AnalyticsScreen() {
  const { subscriptions } = useSubscriptionStore();

  // Pick currency from the first active subscription (avoids using wrong global default)
  const currency = subscriptions.find(s => s.status === 'active')?.currency || 'USD';

  const totalMonthly = getTotalMonthly(subscriptions);
  const totalYearly  = getTotalYearly(subscriptions);
  const trend        = getSpendingTrend(subscriptions);
  const byCurrency   = getMonthlyByCategory(subscriptions); // { currency: { catId: amount } }
  const currencyTotals = getTotalsByCurrency(subscriptions); // [{currency, monthly, yearly}]

  const activeCount  = subscriptions.filter(s => s.status === 'active').length;
  const trialCount   = subscriptions.filter(s => s.isTrial).length;
  const unusedCount  = subscriptions.filter(s => s.unused).length;
  const unusedCost   = subscriptions
    .filter(s => s.unused && s.status === 'active')
    .reduce((sum, s) => sum + getTotalMonthly([s]), 0);


  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Monthly',  value: formatCurrency(totalMonthly, currency), color: colors.primary },
            { label: 'Yearly',   value: formatCurrency(totalYearly, currency),  color: colors.text },
            { label: 'Active',   value: String(activeCount),                    color: colors.success },
            { label: 'Trials',   value: String(trialCount),                     color: colors.warning },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Unused Alert */}
        {unusedCount > 0 && (
          <View style={styles.alertCard}>
            <Text style={styles.alertIcon}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Possibly wasting money</Text>
              <Text style={styles.alertBody}>
                {unusedCount} unused · {formatCurrency(unusedCost, currency)}/mo you could save
              </Text>
            </View>
          </View>
        )}

        {/* 6-Month Trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>6-Month Spending Trend</Text>
          {trend.some(t => t.total > 0)
            ? <BarChart data={trend} currency={currency} />
            : <Text style={styles.empty}>Add subscriptions to see trend</Text>}
        </View>

        {/* Category Breakdown — one section per currency */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spend by Category</Text>
          {Object.keys(byCurrency).length === 0
            ? <Text style={styles.empty}>No data yet</Text>
            : Object.entries(byCurrency).map(([cur, catMap]) => {
                const curTotal = currencyTotals.find(c => c.currency === cur)?.monthly || 0;
                const entries = Object.entries(catMap)
                  .map(([id, amount]) => ({ ...getCategoryById(id), amount }))
                  .sort((a, b) => b.amount - a.amount);
                return (
                  <View key={cur}>
                    {Object.keys(byCurrency).length > 1 && (
                      <Text style={styles.currencyHeader}>{cur}</Text>
                    )}
                    {entries.map(cat => (
                      <CategoryBar
                        key={`${cur}-${cat.id}`}
                        label={`${cat.icon} ${cat.label}`}
                        amount={cat.amount}
                        total={curTotal}
                        color={cat.color}
                        currency={cur}
                      />
                    ))}
                  </View>
                );
              })}
        </View>

        {/* Top subscriptions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top by Monthly Cost</Text>
          {subscriptions
            .filter(s => s.status === 'active')
            .sort((a, b) => getTotalMonthly([b]) - getTotalMonthly([a]))
            .slice(0, 5)
            .map((s, i) => {
              const cat = getCategoryById(s.category);
              const mo  = getTotalMonthly([s]);
              const pct = totalMonthly > 0 ? ((mo / totalMonthly) * 100).toFixed(0) : 0;
              return (
                <View key={s.id} style={styles.topRow}>
                  <Text style={styles.rank}>#{i + 1}</Text>
                  <Text style={styles.topIcon}>{s.customIcon || cat.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topName} numberOfLines={1}>{s.name}</Text>
                    <View style={{ height: 4, backgroundColor: colors.bg, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                      <View style={{ height: 4, width: `${pct}%`, backgroundColor: cat.color, borderRadius: 2 }} />
                    </View>
                  </View>
                  <Text style={styles.topAmount}>{formatCurrency(mo, currency)}/mo</Text>
                </View>
              );
            })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.h2, color: colors.text },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    paddingHorizontal: spacing.md, marginBottom: spacing.md,
  },
  statCard: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    width: (SCREEN_W - spacing.md * 2 - spacing.sm) / 2 - spacing.sm / 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.warning + '15', borderRadius: radius.md,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    padding: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.warning,
  },
  alertIcon: { fontSize: 24 },
  alertTitle: { ...typography.label, color: colors.text, fontWeight: '700' },
  alertBody: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  card: {
    backgroundColor: colors.card, marginHorizontal: spacing.md,
    marginBottom: spacing.md, borderRadius: radius.lg, padding: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  cardTitle: {
    ...typography.label, color: colors.textSecondary, marginBottom: spacing.md,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  empty: { textAlign: 'center', color: colors.textLight, paddingVertical: spacing.xl },
  currencyHeader: { fontSize: 11, fontWeight: '700', color: colors.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.sm, marginBottom: 4 },

  topRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rank: { width: 24, ...typography.label, color: colors.textLight },
  topIcon: { fontSize: 18, width: 28 },
  topName: { ...typography.body, color: colors.text, fontWeight: '500' },
  topAmount: { ...typography.label, color: colors.primary, fontWeight: '700' },
});
