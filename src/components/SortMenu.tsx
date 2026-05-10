import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SortOption = 'date' | 'name';

interface SortMenuProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const LABELS: Record<SortOption, string> = {
  date: 'Date Created',
  name: 'Property Name',
};

export default function SortMenu({ value, onChange }: SortMenuProps) {
  const [open, setOpen] = useState(false);

  function select(option: SortOption) {
    onChange(option);
    setOpen(false);
  }

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Ionicons name="swap-vertical-outline" size={16} color="#64748B" />
        <Text style={styles.triggerText}>{LABELS[value]}</Text>
        <Ionicons name="chevron-down" size={14} color="#64748B" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Sort By</Text>
            {(['date', 'name'] as SortOption[]).map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.menuItem}
                onPress={() => select(option)}
              >
                <Text style={[styles.menuItemText, value === option && styles.activeText]}>
                  {LABELS[option]}
                </Text>
                {value === option && (
                  <Ionicons name="checkmark" size={18} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  triggerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#1E293B',
  },
  activeText: {
    color: '#2563EB',
    fontWeight: '600',
  },
});
