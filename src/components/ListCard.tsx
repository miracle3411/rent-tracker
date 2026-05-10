import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { Entry } from '../types';

interface ListCardProps {
  entry: Entry;
  onPress: () => void;
}

export default function ListCard({ entry, onPress }: ListCardProps) {
  const propertyName = entry.property_name?.trim() || 'Unnamed Property';
  const guestName = entry.guest_name?.trim() || 'No Guest';
  const dateLabel = format(new Date(entry.created_at), 'MMM d, yyyy');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <Text style={styles.propertyName} numberOfLines={1}>
          {propertyName}
        </Text>
        <Text style={styles.guestName} numberOfLines={1}>
          {guestName}
        </Text>
        <Text style={styles.date}>{dateLabel}</Text>
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
  guestName: {
    fontSize: 14,
    color: '#64748B',
  },
  date: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
});
