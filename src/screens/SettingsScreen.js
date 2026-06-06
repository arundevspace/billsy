import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { cancelAllNotifications, requestPermissions, getScheduledNotifications } from '../utils/notifications';
import { getTotalMonthly, getTotalYearly, formatCurrency } from '../utils/calculations';
import { CURRENCIES } from '../constants/categories';
import { colors, spacing, radius, typography } from '../constants/theme';

export default function SettingsScreen() {
  const { subscriptions, currency, setCurrency } = useSubscriptionStore();
  const [scheduledCount, setScheduledCount] = React.useState(0);
  const totalMonthly = getTotalMonthly(subscriptions);
  const totalYearly = getTotalYearly(subscriptions);
  const displayCurrency = subscriptions.find(s => s.status === 'active')?.currency || currency;

  React.useEffect(() => {
    getScheduledNotifications().then(n => setScheduledCount(n.length));
  }, []);

  const handleNotifPermission = async () => {
    const granted = await requestPermissions();
    Alert.alert(granted ? '✅ Notifications Enabled' : '❌ Permission Denied', granted ? 'You will receive renewal reminders.' : 'Please enable in iOS Settings.');
  };

  const Row = ({ icon, label, onPress, right, color }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, color && { color }]}>{label}</Text>
      {right && <Text style={styles.rowRight}>{right}</Text>}
      {onPress && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Spending</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatCurrency(totalMonthly, displayCurrency)}</Text>
              <Text style={styles.summaryLabel}>/ month</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatCurrency(totalYearly, displayCurrency)}</Text>
              <Text style={styles.summaryLabel}>/ year</Text>
            </View>
          </View>
        </View>

        {/* Currency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <View style={styles.currencyGrid}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c.code}
                style={[styles.currencyChip, currency === c.code && styles.currencyChipActive]}
                onPress={() => setCurrency(c.code)}
              >
                <Text style={[styles.currencyText, currency === c.code && styles.currencyTextActive]}>
                  {c.symbol} {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <Row icon="🔔" label="Enable Notifications" onPress={handleNotifPermission} />
            <Row icon="📋" label="Scheduled Notifications" right={`${scheduledCount} active`} />
            <Row icon="🔕" label="Cancel All Notifications" color={colors.danger}
              onPress={async () => {
                await cancelAllNotifications();
                setScheduledCount(0);
                Alert.alert('Done', 'All notifications cancelled.');
              }} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.card}>
            <Row icon="📋" label="Total Subscriptions" right={`${subscriptions.length}`} />
            <Row icon="✅" label="Active" right={`${subscriptions.filter(s => s.status === 'active').length}`} />
            <Row icon="⏸" label="Paused" right={`${subscriptions.filter(s => s.status === 'paused').length}`} />
            <Row icon="🧪" label="Trials" right={`${subscriptions.filter(s => s.isTrial).length}`} />
            <Row icon="😴" label="Unused" right={`${subscriptions.filter(s => s.unused).length}`} />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Row icon="📱" label="Billsy" right="v1.0.0" />
            <Row icon="💜" label="Built with React Native + Expo" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.h2, color: colors.text },

  summaryCard: {
    backgroundColor: colors.primary, marginHorizontal: spacing.md,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg,
  },
  summaryTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: colors.white, fontSize: 24, fontWeight: '800' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  divider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },

  section: { marginBottom: spacing.lg },
  sectionTitle: {
    ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm,
    paddingHorizontal: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.card, marginHorizontal: spacing.md,
    borderRadius: radius.lg, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowIcon: { fontSize: 18, width: 28 },
  rowLabel: { flex: 1, ...typography.body, color: colors.text },
  rowRight: { ...typography.label, color: colors.textSecondary, marginRight: 4 },
  chevron: { color: colors.textLight, fontSize: 18 },

  currencyGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  currencyChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  currencyChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  currencyText: { ...typography.label, color: colors.textSecondary },
  currencyTextActive: { color: colors.primary, fontWeight: '700' },
});
