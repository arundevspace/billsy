import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { getNextRenewal, formatCurrency, toMonthly } from '../utils/calculations';
import { getCategoryById } from '../constants/categories';
import { colors, spacing, radius, typography } from '../constants/theme';
import dayjs from 'dayjs';

export default function CalendarScreen({ navigation }) {
  const { subscriptions } = useSubscriptionStore();
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  // Build marked dates — map renewal dates to subscriptions
  const { markedDates, renewalMap } = useMemo(() => {
    const map = {};     // 'YYYY-MM-DD' → [subscription, ...]
    const marked = {};

    subscriptions
      .filter(s => s.status === 'active')
      .forEach(s => {
        // Show next 3 renewals for each subscription
        let next = dayjs(getNextRenewal(s.startDate, s.billingCycle));
        for (let i = 0; i < 3; i++) {
          const key = next.format('YYYY-MM-DD');
          if (!map[key]) map[key] = [];
          map[key].push(s);

          // Advance to following renewal
          switch (s.billingCycle) {
            case 'weekly':    next = next.add(1, 'week'); break;
            case 'monthly':   next = next.add(1, 'month'); break;
            case 'quarterly': next = next.add(3, 'month'); break;
            case 'yearly':    next = next.add(1, 'year'); break;
            default:          next = next.add(1, 'month');
          }
        }
      });

    Object.entries(map).forEach(([date, subs]) => {
      const dots = subs.slice(0, 3).map(s => ({
        key: s.id,
        color: getCategoryById(s.category).color,
      }));
      marked[date] = {
        dots,
        selected: date === selectedDate,
        selectedColor: colors.primary,
      };
    });

    // Always mark selected date even if no renewals
    if (!marked[selectedDate]) {
      marked[selectedDate] = { selected: true, selectedColor: colors.primary };
    } else {
      marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: colors.primary };
    }

    return { markedDates: marked, renewalMap: map };
  }, [subscriptions, selectedDate]);

  const selectedSubs = renewalMap[selectedDate] || [];
  const totalOnDay = selectedSubs.reduce((sum, s) => sum + s.amount, 0);

  // Upcoming renewals in next 30 days
  const upcoming = useMemo(() => {
    const today = dayjs();
    const entries = [];
    Object.entries(renewalMap).forEach(([date, subs]) => {
      const d = dayjs(date);
      if (d.isAfter(today.subtract(1, 'day')) && d.isBefore(today.add(31, 'day'))) {
        subs.forEach(s => entries.push({ ...s, renewDate: date, daysLeft: d.diff(today, 'day') }));
      }
    });
    return entries.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [renewalMap]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>

        {/* Header */}
        <View style={styles.headerWrap}>
          <Text style={styles.title}>📅 Renewal Calendar</Text>
          <Text style={styles.subtitle}>{upcoming.length} renewals in next 30 days</Text>
        </View>

        {/* Calendar */}
        <Calendar
          style={styles.calendar}
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={day => setSelectedDate(day.dateString)}
          theme={{
            backgroundColor: colors.bg,
            calendarBackground: colors.card,
            textSectionTitleColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.white,
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: colors.textLight,
            dotColor: colors.primary,
            selectedDotColor: colors.white,
            arrowColor: colors.primary,
            monthTextColor: colors.text,
            indicatorColor: colors.primary,
            textDayFontWeight: '500',
            textMonthFontWeight: '700',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 14,
            textMonthFontSize: 16,
          }}
        />

        {/* Selected Day Detail */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {dayjs(selectedDate).format('MMMM D, YYYY')}
            </Text>
            {selectedSubs.length > 0 && (
              <Text style={styles.sectionTotal}>
                {formatCurrency(totalOnDay, selectedSubs[0]?.currency || 'INR')} due
              </Text>
            )}
          </View>

          {selectedSubs.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayIcon}>✨</Text>
              <Text style={styles.emptyDayText}>No renewals on this day</Text>
            </View>
          ) : (
            selectedSubs.map(sub => {
              const cat = getCategoryById(sub.category);
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={styles.renewCard}
                  onPress={() => navigation.navigate('Home', {
                    screen: 'SubscriptionDetail',
                    params: { subscription: sub },
                  })}
                  activeOpacity={0.75}
                >
                  <View style={[styles.renewAccent, { backgroundColor: cat.color }]} />
                  <View style={[styles.renewIcon, { backgroundColor: cat.color + '22' }]}>
                    <Text style={styles.renewEmoji}>{sub.customIcon || cat.icon}</Text>
                  </View>
                  <View style={styles.renewInfo}>
                    <Text style={styles.renewName}>{sub.name}</Text>
                    <Text style={styles.renewCategory}>{cat.label} · {sub.billingCycle}</Text>
                  </View>
                  <View style={styles.renewRight}>
                    <Text style={styles.renewAmount}>{formatCurrency(sub.amount, sub.currency || 'INR')}</Text>
                    <Text style={styles.renewMonthly}>
                      {formatCurrency(toMonthly(sub.amount, sub.billingCycle), sub.currency || 'INR')}/mo
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Upcoming 30 Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next 30 Days</Text>
          {upcoming.length === 0 ? (
            <Text style={styles.emptyDayText}>No upcoming renewals</Text>
          ) : (
            upcoming.map((sub, i) => {
              const cat = getCategoryById(sub.category);
              const isToday = sub.daysLeft === 0;
              const isUrgent = sub.daysLeft <= 3;
              return (
                <TouchableOpacity
                  key={`${sub.id}-${i}`}
                  style={styles.upcomingRow}
                  onPress={() => setSelectedDate(sub.renewDate)}
                  activeOpacity={0.7}
                >
                  {/* Date pill */}
                  <View style={[styles.datePill, isToday && styles.datePillToday]}>
                    <Text style={[styles.datePillDay, isToday && styles.datePillDayToday]}>
                      {dayjs(sub.renewDate).format('DD')}
                    </Text>
                    <Text style={[styles.datePillMon, isToday && styles.datePillDayToday]}>
                      {dayjs(sub.renewDate).format('MMM')}
                    </Text>
                  </View>

                  <Text style={styles.upcomingIcon}>{sub.customIcon || cat.icon}</Text>

                  <View style={styles.upcomingInfo}>
                    <Text style={styles.upcomingName}>{sub.name}</Text>
                    <Text style={[styles.upcomingDays, isUrgent && { color: colors.danger }]}>
                      {isToday ? '🔴 Today' : isUrgent ? `⚠️ in ${sub.daysLeft}d` : `in ${sub.daysLeft} days`}
                    </Text>
                  </View>

                  <Text style={styles.upcomingAmount}>{formatCurrency(sub.amount, sub.currency || 'INR')}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  headerWrap: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  calendar: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text },
  sectionTotal: { ...typography.label, color: colors.primary, fontWeight: '700' },

  emptyDay: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyDayIcon: { fontSize: 32, marginBottom: spacing.sm },
  emptyDayText: { ...typography.body, color: colors.textSecondary },

  renewCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.md, marginBottom: spacing.sm, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  renewAccent: { width: 4, alignSelf: 'stretch' },
  renewIcon: {
    width: 42, height: 42, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', margin: spacing.md,
  },
  renewEmoji: { fontSize: 20 },
  renewInfo: { flex: 1 },
  renewName: { ...typography.body, fontWeight: '600', color: colors.text },
  renewCategory: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  renewRight: { alignItems: 'flex-end', padding: spacing.md },
  renewAmount: { ...typography.body, fontWeight: '700', color: colors.text },
  renewMonthly: { ...typography.caption, color: colors.textSecondary },

  upcomingRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm,
    gap: spacing.sm,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  datePill: {
    width: 44, alignItems: 'center', backgroundColor: colors.bg,
    borderRadius: radius.sm, paddingVertical: 4,
  },
  datePillToday: { backgroundColor: colors.primary },
  datePillDay: { fontSize: 16, fontWeight: '800', color: colors.text },
  datePillMon: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginTop: -2 },
  datePillDayToday: { color: colors.white },
  upcomingIcon: { fontSize: 22 },
  upcomingInfo: { flex: 1 },
  upcomingName: { ...typography.body, fontWeight: '600', color: colors.text },
  upcomingDays: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  upcomingAmount: { ...typography.label, fontWeight: '700', color: colors.primary },
});
