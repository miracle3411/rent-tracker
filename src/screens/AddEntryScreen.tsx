import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { StackNavigationProp } from '@react-navigation/stack';
import { createEntry, setNotificationId } from '../database/queries';
import { calcRemainingPayment } from '../utils/calculations';
import { scheduleRentDueNotification } from '../utils/notifications';
import { EntryInput, RootStackParamList } from '../types';

type AddEntryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddEntry'>;

interface AddEntryScreenProps {
  navigation: AddEntryScreenNavigationProp;
}

export default function AddEntryScreen({ navigation }: AddEntryScreenProps) {
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
  const [meterReading, setMeterReading] = useState('');
  const [meterReadingDate, setMeterReadingDate] = useState<Date | null>(null);
  const [showMeterReadingDatePicker, setShowMeterReadingDatePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const rentNum = parseFloat(monthlyRent) || null;
  const advanceNum = parseFloat(advancedPayment) || null;
  const remaining = calcRemainingPayment(rentNum, advanceNum);

  async function handleSave() {
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
      meter_reading: parseFloat(meterReading) || null,
      meter_reading_date: meterReadingDate ? meterReadingDate.toISOString().split('T')[0] : null,
      notes: notes.trim() || null,
    };
    const entryId = await createEntry(data);
    if (data.booking_date) {
      const notifId = await scheduleRentDueNotification(
        entryId,
        data.booking_date,
        data.property_name,
        data.guest_name
      );
      if (notifId) await setNotificationId(entryId, notifId);
    }
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Property Details" />
        <FormField label="Property Name">
          <TextInput
            style={styles.input}
            value={propertyName}
            onChangeText={setPropertyName}
            placeholder="e.g. Sunset Apartments"
            placeholderTextColor="#94A3B8"
          />
        </FormField>
        <FormField label="Property Address">
          <TextInput
            style={styles.input}
            value={propertyAddress}
            onChangeText={setPropertyAddress}
            placeholder="e.g. 123 Main St"
            placeholderTextColor="#94A3B8"
          />
        </FormField>
        <FormField label="Unit Number / Name">
          <TextInput
            style={styles.input}
            value={unitNumber}
            onChangeText={setUnitNumber}
            placeholder="e.g. Unit 4B"
            placeholderTextColor="#94A3B8"
          />
        </FormField>

        <SectionHeader title="Guest Details" />
        <FormField label="Guest Name">
          <TextInput
            style={styles.input}
            value={guestName}
            onChangeText={setGuestName}
            placeholder="e.g. John Smith"
            placeholderTextColor="#94A3B8"
          />
        </FormField>
        <FormField label="Phone Number">
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="e.g. 09171234567"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
          />
        </FormField>
        <FormField label="Email">
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. guest@email.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </FormField>
        <FormField label="Guest Address">
          <TextInput
            style={styles.input}
            value={guestAddress}
            onChangeText={setGuestAddress}
            placeholder="e.g. 456 Oak Ave"
            placeholderTextColor="#94A3B8"
          />
        </FormField>
        <FormField label="Monthly Rent (₱)">
          <TextInput
            style={styles.input}
            value={monthlyRent}
            onChangeText={setMonthlyRent}
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
          />
        </FormField>
        <FormField label="Advanced Payment (₱)">
          <TextInput
            style={styles.input}
            value={advancedPayment}
            onChangeText={setAdvancedPayment}
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
          />
        </FormField>
        <FormField label="Deposit (₱)">
          <TextInput
            style={styles.input}
            value={deposit}
            onChangeText={setDeposit}
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
          />
        </FormField>
        <FormField label="Remaining Payment (₱)">
          <View style={[styles.input, styles.readOnly]}>
            <Text style={styles.readOnlyText}>
              {remaining.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </FormField>
        <FormField label="Booking Date">
          <TouchableOpacity
            style={[styles.input, styles.dateButton]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={bookingDate ? styles.dateText : styles.datePlaceholder}>
              {bookingDate ? format(bookingDate, 'MMMM d, yyyy') : 'Select a date'}
            </Text>
            <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={bookingDate ?? new Date()}
              mode="date"
              display="default"
              onChange={(event: DateTimePickerEvent, selected?: Date) => {
                setShowDatePicker(false);
                if (event.type === 'set' && selected) {
                  setBookingDate(selected);
                }
              }}
            />
          )}
        </FormField>

        <SectionHeader title="Meter Reading" />
        <FormField label="Electric Meter Reading (kWh)">
          <TextInput
            style={styles.input}
            value={meterReading}
            onChangeText={setMeterReading}
            placeholder="e.g. 1234.5"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
          />
        </FormField>
        <FormField label="Meter Reading Start Date">
          <TouchableOpacity
            style={[styles.input, styles.dateButton]}
            onPress={() => setShowMeterReadingDatePicker(true)}
          >
            <Text style={meterReadingDate ? styles.dateText : styles.datePlaceholder}>
              {meterReadingDate ? format(meterReadingDate, 'MMMM d, yyyy') : 'Select a date'}
            </Text>
            <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>
          {showMeterReadingDatePicker && (
            <DateTimePicker
              value={meterReadingDate ?? new Date()}
              mode="date"
              display="default"
              onChange={(event: DateTimePickerEvent, selected?: Date) => {
                setShowMeterReadingDatePicker(false);
                if (event.type === 'set' && selected) {
                  setMeterReadingDate(selected);
                }
              }}
            />
          )}
        </FormField>

        <SectionHeader title="Notes" />
        <FormField label="Notes">
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </FormField>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Entry'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  readOnly: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 15,
    color: '#1E293B',
  },
  datePlaceholder: {
    fontSize: 15,
    color: '#94A3B8',
  },
  saveButton: {
    marginTop: 32,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
