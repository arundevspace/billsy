import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Switch, Alert, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { colors, spacing, radius, typography } from '../constants/theme';
import { CATEGORIES, BILLING_CYCLES, CURRENCIES, POPULAR_SERVICES } from '../constants/categories';
import { NOTIFY_OPTIONS, sendTestNotification } from '../utils/notifications';
import dayjs from 'dayjs';

export default function AddSubscriptionScreen({ navigation, route }) {
  const editing = route.params?.subscription;
  const { addSubscription, updateSubscription } = useSubscriptionStore();

  const [name, setName]               = useState(editing?.name || '');
  const [amount, setAmount]           = useState(editing?.amount?.toString() || '');
  const [billingCycle, setBillingCycle] = useState(editing?.billingCycle || 'monthly');
  const [category, setCategory]       = useState(editing?.category || 'entertainment');
  const [currency, setCurrency]       = useState(editing?.currency || 'USD');
  const [startDate, setStartDate]     = useState(editing?.startDate || new Date().toISOString());
  const [isTrial, setIsTrial]         = useState(editing?.isTrial || false);
  const [trialEndDate, setTrialEndDate] = useState(editing?.trialEndDate || '');
  const [notes, setNotes]             = useState(editing?.notes || '');
  const [customIcon, setCustomIcon]   = useState(editing?.customIcon || '');
  const [notifyDays, setNotifyDays]   = useState(
    editing?.notifyDaysBefore !== undefined ? editing.notifyDaysBefore : 3
  );

  // Date picker state
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showTrialPicker, setShowTrialPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim()) return Alert.alert('Missing Name', 'Please enter a subscription name.');
    if (!amount || isNaN(parseFloat(amount))) return Alert.alert('Invalid Amount', 'Please enter a valid amount.');

    setSaving(true);
    const sub = {
      name: name.trim(),
      amount: parseFloat(amount),
      billingCycle,
      category,
      currency,
      startDate,
      isTrial,
      trialEndDate: isTrial ? trialEndDate : null,
      notes,
      customIcon,
      notifyDaysBefore: notifyDays,
      status: 'active',
    };

    if (editing) {
      await updateSubscription(editing.id, sub);
    } else {
      await addSubscription(sub);
    }
    setSaving(false);
    navigation.goBack();
  };

  const pickService = (service) => {
    setName(service.name);
    setCategory(service.category);
    setCustomIcon(service.icon);
  };

  const Label = ({ text }) => <Text style={styles.label}>{text}</Text>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

          {/* Popular Services */}
          {!editing && (
            <View style={styles.section}>
              <Label text="Quick Add Popular Service" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {POPULAR_SERVICES.map(s => (
                  <TouchableOpacity key={s.name} style={styles.serviceChip} onPress={() => pickService(s)}>
                    <Text style={styles.serviceIcon}>{s.icon}</Text>
                    <Text style={styles.serviceLabel}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Name */}
          <View style={styles.section}>
            <Label text="Service Name *" />
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. Netflix"
                placeholderTextColor={colors.textLight}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={[styles.input, styles.emojiInput]}
                placeholder="🎬"
                value={customIcon}
                onChangeText={setCustomIcon}
                maxLength={2}
              />
            </View>
          </View>

          {/* Amount — full width row */}
          <View style={styles.section}>
            <Label text="Amount *" />
            <View style={styles.amountBox}>
              <Text style={styles.amountCurrencySymbol}>
                {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency}
              </Text>
              <TextInput
                style={styles.amountField}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                selectionColor={colors.primary}
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Currency */}
          <View style={styles.section}>
            <Label text="Currency" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CURRENCIES.map(c => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.chip, currency === c.code && styles.chipActive]}
                  onPress={() => setCurrency(c.code)}
                >
                  <Text style={[styles.chipText, currency === c.code && styles.chipTextActive]}>
                    {c.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Billing Cycle */}
          <View style={styles.section}>
            <Label text="Billing Cycle" />
            <View style={styles.chipRow}>
              {BILLING_CYCLES.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, billingCycle === c.id && styles.chipActive]}
                  onPress={() => setBillingCycle(c.id)}
                >
                  <Text style={[styles.chipText, billingCycle === c.id && styles.chipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Label text="Category" />
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, category === cat.id && { backgroundColor: cat.color + '22', borderColor: cat.color }]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catLabel, category === cat.id && { color: cat.color, fontWeight: '700' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Start Date */}
          <View style={styles.section}>
            <Label text="Start Date" />
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
              <Text style={styles.dateBtnIcon}>📅</Text>
              <Text style={styles.dateBtnText}>
                {dayjs(startDate).format('DD MMM YYYY')}
              </Text>
              <Text style={styles.dateBtnChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Start Date Picker Modal */}
          {showStartPicker && (
            <Modal transparent animationType="slide">
              <View style={styles.pickerModal}>
                <View style={styles.pickerSheet}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Select Start Date</Text>
                    <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                      <Text style={styles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={new Date(startDate)}
                    mode="date"
                    display="spinner"
                    onChange={(_, date) => { if (date) setStartDate(date.toISOString()); }}
                    style={{ width: '100%' }}
                  />
                </View>
              </View>
            </Modal>
          )}

          {/* Trial Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Free Trial</Text>
                <Text style={styles.toggleSub}>Get notified before trial ends</Text>
              </View>
              <Switch
                value={isTrial}
                onValueChange={setIsTrial}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            {isTrial && (
              <>
                <TouchableOpacity
                  style={[styles.dateBtn, { marginTop: spacing.sm }]}
                  onPress={() => setShowTrialPicker(true)}
                >
                  <Text style={styles.dateBtnIcon}>⏳</Text>
                  <Text style={styles.dateBtnText}>
                    {trialEndDate ? dayjs(trialEndDate).format('DD MMM YYYY') : 'Select trial end date'}
                  </Text>
                  <Text style={styles.dateBtnChevron}>›</Text>
                </TouchableOpacity>
                {showTrialPicker && (
                  <Modal transparent animationType="slide">
                    <View style={styles.pickerModal}>
                      <View style={styles.pickerSheet}>
                        <View style={styles.pickerHeader}>
                          <Text style={styles.pickerTitle}>Trial End Date</Text>
                          <TouchableOpacity onPress={() => setShowTrialPicker(false)}>
                            <Text style={styles.pickerDone}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={trialEndDate ? new Date(trialEndDate) : new Date()}
                          mode="date"
                          display="spinner"
                          minimumDate={new Date()}
                          onChange={(_, date) => { if (date) setTrialEndDate(date.toISOString()); }}
                          style={{ width: '100%' }}
                        />
                      </View>
                    </View>
                  </Modal>
                )}
              </>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Label text="Notes (optional)" />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Shared with family, cancel before Aug..."
              placeholderTextColor={colors.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Notification Timing */}
          <View style={styles.section}>
            <Label text="🔔 Remind Me Before Renewal" />
            <View style={styles.chipRow}>
              {NOTIFY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.chip, notifyDays === opt.daysBefore && styles.chipActive]}
                  onPress={() => setNotifyDays(opt.daysBefore)}
                >
                  <Text style={[styles.chipText, notifyDays === opt.daysBefore && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {editing && (
              <TouchableOpacity
                style={styles.testNotifBtn}
                onPress={async () => {
                  await sendTestNotification(editing);
                  Alert.alert('✅ Test Sent', 'You\'ll receive a test notification in 3 seconds.');
                }}
              >
                <Text style={styles.testNotifText}>🧪 Send Test Notification</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Subscription'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.lg },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 64,
  },
  amountCurrencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 6,
  },
  amountField: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    height: 64,
    padding: 0,
  },
  emojiInput: { width: 56, marginLeft: spacing.sm, textAlign: 'center', fontSize: 22 },
  textArea: { height: 80, textAlignVertical: 'top' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { ...typography.label, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 12, color: colors.textSecondary },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { ...typography.body, color: colors.text, fontWeight: '600' },
  toggleSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  serviceChip: {
    alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md,
    padding: spacing.sm, marginRight: spacing.sm, width: 68,
    borderWidth: 1, borderColor: colors.border,
  },
  serviceIcon: { fontSize: 20, marginBottom: 4 },
  serviceLabel: { fontSize: 9, color: colors.text, fontWeight: '600', textAlign: 'center' },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  saveBtnText: { color: colors.white, ...typography.h3, fontWeight: '700' },
  testNotifBtn: {
    marginTop: spacing.sm, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.primary, padding: spacing.sm, alignItems: 'center',
  },
  testNotifText: { color: colors.primary, fontWeight: '600', fontSize: 14 },

  dateBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1.5, borderColor: '#D1D5DB',
  },
  dateBtnIcon: { fontSize: 18, marginRight: spacing.sm },
  dateBtnText: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  dateBtnChevron: { fontSize: 20, color: colors.textLight },

  pickerModal: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl, paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  pickerTitle: { ...typography.h3, color: colors.text },
  pickerDone: { color: colors.primary, fontWeight: '700', fontSize: 16 },
});
