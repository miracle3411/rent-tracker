import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { Entry } from '../types';
import { calcNextDueDate } from '../utils/calculations';

interface ListCardProps {
  entry: Entry;
  onPress: () => void;
}

export default function ListCard({ entry, onPress }: ListCardProps) {
  const propertyName = entry.property_name?.trim() || 'Unnamed Property';
  const unitNumber = entry.unit_number?.trim() || null;
  const guestName = entry.guest_name?.trim() || 'No Guest';

  const dueDate = entry.booking_date
    ? format(calcNextDueDate(entry.booking_date), 'MMMM d, yyyy')
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <Text style={styles.propertyName} numberOfLines={1}>
          {propertyName}
        </Text>
        {unitNumber && (
          <Text style={styles.unitNumber} numberOfLines={1}>
            {unitNumber}
          </Text>
        )}
        <Text style={styles.guestName} numberOfLines={1}>
          {guestName}
        </Text>
        {dueDate && (
          <Text style={styles.dueDate}>Due Date: {dueDate}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    gap: 4,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  unitNumber: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
  },
  guestName: {
    fontSize: 14,
    color: '#64748B',
  },
  dueDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
});
