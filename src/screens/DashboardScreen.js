import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscriptionStore } from '../store/subscriptionStore';
import SubscriptionCard from '../components/SubscriptionCard';
import {
  getTotalsByCurrency, getUpcomingRenewals, formatCurrency,
} from '../utils/calculations';
import { colors, spacing, radius, typography } from '../constants/theme';
import { CATEGORIES } from '../constants/categories';

const FILTERS = ['All', 'Active', 'Trial', 'Paused', 'Unused'];

export default function DashboardScreen({ navigation }) {
  const { subscriptions, loadSubscriptions } = useSubscriptionStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadSubscriptions(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubscriptions();
    setRefreshing(false);
  };

  const totals = getTotalsByCurrency(subscriptions);
  const upcoming = getUpcomingRenewals(subscriptions, 7);

  const filtered = subscriptions.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'All') return true;
    if (filter === 'Active') return s.status === 'active' && !s.isTrial;
    if (filter === 'Trial') return s.isTrial;
    if (filter === 'Paused') return s.status === 'paused';
    if (filter === 'Unused') return s.unused;
    return true;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Billsy 💸</Text>
            <Text style={styles.subGreeting}>{subscriptions.filter(s=>s.status==='active').length} active</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddSubscription')}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards — one row per currency */}
        {totals.length === 0 ? (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.summaryLabel}>Monthly</Text>
              <Text style={styles.summaryAmount}>—</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.text }]}>
              <Text style={styles.summaryLabel}>Yearly</Text>
              <Text style={styles.summaryAmount}>—</Text>
            </View>
          </View>
        ) : (
          totals.map((t, i) => (
            <View key={t.currency} style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
                <Text style={styles.summaryLabel}>Monthly · {t.currency}</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(t.monthly, t.currency)}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.text }]}>
                <Text style={styles.summaryLabel}>Yearly · {t.currency}</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(t.yearly, t.currency)}</Text>
              </View>
            </View>
          ))
        )}

        {/* Upcoming Renewals */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏰ Renewing Soon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcoming.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.upcomingCard}
                  onPress={() => navigation.navigate('SubscriptionDetail', { subscription: s })}
                >
                  <Text style={styles.upcomingIcon}>{s.customIcon || '📦'}</Text>
                  <Text style={styles.upcomingName} numberOfLines={1}>{s.name}</Text>
                  <Text style={[styles.upcomingDays, s.daysLeft <= 1 && styles.urgentText]}>
                    {s.daysLeft === 0 ? 'Today' : `${s.daysLeft}d`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search subscriptions..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Subscription List */}
        <View style={styles.listContainer}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No subscriptions yet</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AddSubscription')}>
                <Text style={styles.emptyLink}>Add your first one →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map(sub => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}

                onPress={() => navigation.navigate('SubscriptionDetail', { subscription: sub })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  greeting: { ...typography.h2, color: colors.text },
  subGreeting: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  addBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },

  summaryRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  summaryCard: {
    flex: 1, borderRadius: radius.lg, padding: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  summaryLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' },
  summaryAmount: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 4 },

  section: { paddingLeft: spacing.md, marginBottom: spacing.md },
  sectionTitle: { ...typography.label, color: colors.text, marginBottom: spacing.sm, fontWeight: '700' },
  upcomingCard: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm,
    alignItems: 'center', marginRight: spacing.sm, width: 72,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  upcomingIcon: { fontSize: 24, marginBottom: 4 },
  upcomingName: { fontSize: 10, color: colors.text, fontWeight: '600', textAlign: 'center' },
  upcomingDays: { fontSize: 10, color: colors.primary, fontWeight: '700', marginTop: 2 },
  urgentText: { color: colors.danger },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    marginHorizontal: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, height: 44, ...typography.body, color: colors.text },

  filterRow: { marginBottom: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.card, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.label, color: colors.textSecondary },
  filterTextActive: { color: colors.white },

  listContainer: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.h3, color: colors.textSecondary },
  emptyLink: { color: colors.primary, marginTop: spacing.sm, fontWeight: '600' },
});
