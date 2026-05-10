import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { getEntryById, updateEntry, setNotificationId, rolloverReadingsIfNeeded } from '../database/queries';
import { calcRemainingPayment, calcTotalKW, calcElectricPayment, calcNextDueDate } from '../utils/calculations';
import { scheduleRentDueNotification, cancelNotification } from '../utils/notifications';
import { EntryInput, RootStackParamList } from '../types';
import ConfirmModal from '../components/ConfirmModal';

const numericOnly = (val: string) => val.replace(/[^0-9]/g, '');
const decimalOnly = (val: string) => {
  const cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
};

type EditEntryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditEntry'>;
type EditEntryScreenRouteProp = RouteProp<RootStackParamList, 'EditEntry'>;

interface EditEntryScreenProps {
  navigation: EditEntryScreenNavigationProp;
  route: EditEntryScreenRouteProp;
}

export default function EditEntryScreen({ navigation, route }: EditEntryScreenProps) {
  const { id } = route.params;
  const [loading, setLoading] = useState(true);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingNotificationId, setExistingNotificationId] = useState<string | null>(null);

  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [advancedPayment, setAdvancedPayment] = useState('');
  const [deposit, setDeposit] = useState('');
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [previousReading, setPreviousReading] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  const [multiplier, setMultiplier] = useState('');
  const [notes, setNotes] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getEntryById(id).then(async (raw) => {
        if (!active) return;
        const entry = raw ? await rolloverReadingsIfNeeded(raw) : null;
        if (active && entry) {
          setPropertyName(entry.property_name ?? '');
          setPropertyAddress(entry.property_address ?? '');
          setUnitNumber(entry.unit_number ?? '');
          setGuestName(entry.guest_name ?? '');
          setPhoneNumber(entry.phone_number ?? '');
          setEmail(entry.email ?? '');
          setGuestAddress(entry.guest_address ?? '');
          setMonthlyRent(entry.monthly_rent != null ? String(entry.monthly_rent) : '');
          setAdvancedPayment(entry.advanced_payment != null ? String(entry.advanced_payment) : '');
          setDeposit(entry.deposit != null ? String(entry.deposit) : '');
          setBookingDate(entry.booking_date ? new Date(entry.booking_date) : null);
          setPreviousReading(entry.previous_reading != null ? String(entry.previous_reading) : '');
          setCurrentReading(entry.current_reading != null ? String(entry.current_reading) : '');
          setMultiplier(entry.multiplier != null ? String(entry.multiplier) : '');
          setExistingNotificationId(entry.notification_id ?? null);
          setNotes(entry.notes ?? '');
          setLoading(false);
        }
      });
      return () => { active = false; };
    }, [id])
  );

  const rentNum = parseFloat(monthlyRent) || null;
  const advanceNum = parseFloat(advancedPayment) || null;
  const remaining = calcRemainingPayment(rentNum, advanceNum);

  const prevNum = parseFloat(previousReading) || null;
  const currNum = parseFloat(currentReading) || null;
  const multiplierNum = parseFloat(multiplier) || null;
  const totalKW = calcTotalKW(prevNum, currNum);
  const electricPayment = calcElectricPayment(totalKW, multiplierNum);

  async function handleConfirmSave() {
    if (saving) return;
    setSaving(true);
    const data: EntryInput = {
      property_name: propertyName.trim() || null,
      property_address: propertyAddress.trim() || null,
      unit_number: unitNumber.trim() || null,
      guest_name: guestName.trim() || null,
      phone_number: phoneNumber.trim() || null,
      email: email.trim() || null,
      guest_address: guestAddress.trim() || null,
      monthly_rent: rentNum,
      advanced_payment: advanceNum,
      deposit: parseFloat(deposit) || null,
      remaining_payment: remaining,
      booking_date: bookingDate ? bookingDate.toISOString().split('T')[0] : null,
      previous_reading: prevNum,
      current_reading: currNum,
      multiplier: multiplierNum,
      payment_result: electricPayment,
      notes: notes.trim() || null,
      billing_period_end: bookingDate
        ? calcNextDueDate(bookingDate.toISOString().split('T')[0]).toISOString().split('T')[0]
        : null,
    };
    await updateEntry(id, data);
    if (existingNotificationId) await cancelNotification(existingNotificationId);
    if (data.booking_date) {
      const notifId = await scheduleRentDueNotification(id, data.booking_date, data.property_name, data.guest_name);
      await setNotificationId(id, notifId);
    } else {
      await setNotificationId(id, null);
    }
    setSaving(false);
    setSaveModalVisible(false);
    navigation.goBack();
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <SectionHeader title="Property Details" />
          <FormField label="Property Name">
            <TextInput style={styles.input} value={propertyName} onChangeText={setPropertyName}
              placeholder="e.g. Sunset Apartments" placeholderTextColor="#94A3B8" />
          </FormField>
          <FormField label="Property Address">
            <TextInput style={styles.input} value={propertyAddress} onChangeText={setPropertyAddress}
              placeholder="e.g. 123 Main St" placeholderTextColor="#94A3B8" />
          </FormField>
          <FormField label="Unit Number / Name">
            <TextInput style={styles.input} value={unitNumber} onChangeText={setUnitNumber}
              placeholder="e.g. Unit 4B" placeholderTextColor="#94A3B8" />
          </FormField>

          <SectionHeader title="Guest Details" />
          <FormField label="Guest Name">
            <TextInput style={styles.input} value={guestName} onChangeText={setGuestName}
              placeholder="e.g. John Smith" placeholderTextColor="#94A3B8" />
          </FormField>
          <FormField label="Phone Number">
            <TextInput style={styles.input} value={phoneNumber}
              onChangeText={(v) => setPhoneNumber(numericOnly(v))}
              placeholder="e.g. 09171234567" placeholderTextColor="#94A3B8" keyboardType="number-pad" />
          </FormField>
          <FormField label="Email">
            <TextInput style={styles.input} value={email} onChangeText={setEmail}
              placeholder="e.g. guest@email.com" placeholderTextColor="#94A3B8"
              keyboardType="email-address" autoCapitalize="none" />
          </FormField>
          <FormField label="Guest Address">
            <TextInput style={styles.input} value={guestAddress} onChangeText={setGuestAddress}
              placeholder="e.g. 456 Oak Ave" placeholderTextColor="#94A3B8" />
          </FormField>
          <FormField label="Monthly Rent (₱)">
            <TextInput style={styles.input} value={monthlyRent}
              onChangeText={(v) => setMonthlyRent(decimalOnly(v))}
              placeholder="0.00" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
          </FormField>
          <FormField label="Advanced Payment (₱)">
            <TextInput style={styles.input} value={advancedPayment}
              onChangeText={(v) => setAdvancedPayment(decimalOnly(v))}
              placeholder="0.00" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
          </FormField>
          <FormField label="Deposit (₱)">
            <TextInput style={styles.input} value={deposit}
              onChangeText={(v) => setDeposit(decimalOnly(v))}
              placeholder="0.00" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
          </FormField>
          <FormField label="Remaining Payment (₱)">
            <View style={[styles.input, styles.readOnly]}>
              <Text style={styles.readOnlyText}>
                {remaining.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </FormField>
          <FormField label="Booking Date">
            <TouchableOpacity style={[styles.input, styles.dateButton]} onPress={() => setShowDatePicker(true)}>
              <Text style={bookingDate ? styles.dateText : styles.datePlaceholder}>
                {bookingDate ? format(bookingDate, 'MMMM d, yyyy') : 'Select a date'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker value={bookingDate ?? new Date()} mode="date" display="default"
                onChange={(event: DateTimePickerEvent, selected?: Date) => {
                  setShowDatePicker(false);
                  if (event.type === 'set' && selected) setBookingDate(selected);
                }} />
            )}
          </FormField>

          <SectionHeader title="Meter Reading" />

          {/* Row 1: Previous Reading | Current Reading */}
          <View style={styles.twoCol}>
            <View style={styles.colItem}>
              <Text style={styles.label}>Previous Reading</Text>
              <TextInput style={styles.input} value={previousReading}
                onChangeText={(v) => setPreviousReading(decimalOnly(v))}
                placeholder="0" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
            </View>
            <View style={styles.colDivider} />
            <View style={styles.colItem}>
              <Text style={styles.label}>Current Reading</Text>
              <TextInput style={styles.input} value={currentReading}
                onChangeText={(v) => setCurrentReading(decimalOnly(v))}
                placeholder="0" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
            </View>
          </View>

          {/* Row 2: Total KW (auto) | Multiplier */}
          <View style={[styles.twoCol, { marginTop: 12 }]}>
            <View style={styles.colItem}>
              <Text style={styles.label}>Total KW</Text>
              <View style={[styles.input, styles.readOnly]}>
                <Text style={styles.readOnlyText}>{totalKW.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.colDivider} />
            <View style={styles.colItem}>
              <Text style={styles.label}>Multiplier</Text>
              <TextInput style={styles.input} value={multiplier}
                onChangeText={(v) => setMultiplier(decimalOnly(v))}
                placeholder="0" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
            </View>
          </View>

          {/* Row 3: Electric Bill Payment (full width) */}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Electric Bill Payment (₱)</Text>
            <View style={[styles.input, styles.readOnly, styles.paymentResult]}>
              <Text style={styles.paymentResultText}>
                ₱{electricPayment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <SectionHeader title="Notes" />
          <FormField label="Notes">
            <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes}
              placeholder="Any additional notes..." placeholderTextColor="#94A3B8"
              multiline numberOfLines={4} textAlignVertical="top" />
          </FormField>

          <TouchableOpacity style={styles.saveButton} onPress={() => setSaveModalVisible(true)}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={saveModalVisible}
        title="Save Changes?"
        message="Your updates will be saved to this entry."
        confirmLabel={saving ? 'Saving...' : 'Save Changes'}
        onConfirm={handleConfirmSave}
        onCancel={() => setSaveModalVisible(false)}
      />
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
  sectionHeader: {
    marginTop: 24, marginBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#64748B',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1E293B',
  },
  readOnly: { backgroundColor: '#F1F5F9', justifyContent: 'center' },
  readOnlyText: { fontSize: 15, color: '#64748B', fontWeight: '600' },
  textArea: { minHeight: 100, paddingTop: 12 },
  dateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: 15, color: '#1E293B' },
  datePlaceholder: { fontSize: 15, color: '#94A3B8' },
  twoCol: { flexDirection: 'row', alignItems: 'flex-end' },
  colItem: { flex: 1 },
  colDivider: { width: 12 },
  paymentResult: { alignItems: 'center', paddingVertical: 16 },
  paymentResultText: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
  saveButton: {
    marginTop: 32, backgroundColor: '#2563EB',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
