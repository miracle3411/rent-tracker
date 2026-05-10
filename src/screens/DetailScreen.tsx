import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getEntryById, deleteEntry, rolloverReadingsIfNeeded } from '../database/queries';
import { cancelNotification } from '../utils/notifications';
import { Entry, RootStackParamList } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import { format } from 'date-fns';

type DetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Detail'>;
type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

interface DetailScreenProps {
  navigation: DetailScreenNavigationProp;
  route: DetailScreenRouteProp;
}

export default function DetailScreen({ navigation, route }: DetailScreenProps) {
  const { id } = route.params;
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getEntryById(id).then(async (data) => {
        if (!active) return;
        const resolved = data ? await rolloverReadingsIfNeeded(data) : null;
        if (active) {
          setEntry(resolved);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [id])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditEntry', { id })}
            style={styles.headerBtn}
          >
            <Ionicons name="pencil-outline" size={22} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDeleteModalVisible(true)}
            style={styles.headerBtn}
          >
            <Ionicons name="trash-outline" size={22} color="#DC2626" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, id]);

  async function handleDelete() {
    if (entry?.notification_id) {
      await cancelNotification(entry.notification_id);
    }
    await deleteEntry(id);
    setDeleteModalVisible(false);
    navigation.popToTop();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Entry not found.</Text>
      </View>
    );
  }

  const createdLabel = format(new Date(entry.created_at), 'MMMM d, yyyy');

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.createdAt}>Added {createdLabel}</Text>

        <SectionHeader title="Property Details" />
        <DetailRow label="Property Name" value={entry.property_name} />
        <DetailRow label="Property Address" value={entry.property_address} />
        <DetailRow label="Unit Number / Name" value={entry.unit_number} />

        <SectionHeader title="Guest Details" />
        <DetailRow label="Guest Name" value={entry.guest_name} />
        <ContactRow
          label="Phone Number"
          value={entry.phone_number}
          actions={entry.phone_number ? [
            { icon: 'call-outline', color: '#16A34A', onPress: () => Linking.openURL(`tel:${entry.phone_number}`) },
            { icon: 'chatbubble-outline', color: '#2563EB', onPress: () => Linking.openURL(`sms:${entry.phone_number}`) },
          ] : []}
        />
        <ContactRow
          label="WhatsApp Number"
          value={entry.whatsapp_number}
          actions={entry.whatsapp_number ? [
            { icon: 'logo-whatsapp', color: '#25D366', onPress: () => Linking.openURL(`https://wa.me/${entry.whatsapp_number}`) },
          ] : []}
        />
        <DetailRow label="Email" value={entry.email} />
        <DetailRow label="Guest Address" value={entry.guest_address} />
        <DetailRow
          label="Monthly Rent"
          value={
            entry.monthly_rent != null
              ? `₱${entry.monthly_rent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
              : null
          }
        />
        <DetailRow
          label="Advanced Payment"
          value={
            entry.advanced_payment != null
              ? `₱${entry.advanced_payment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
              : null
          }
        />
        <DetailRow
          label="Deposit"
          value={
            entry.deposit != null
              ? `₱${entry.deposit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
              : null
          }
        />
        <DetailRow
          label="Remaining Payment"
          value={
            entry.remaining_payment != null
              ? `₱${entry.remaining_payment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
              : null
          }
          highlight
        />
        <DetailRow
          label="Booking Date"
          value={entry.booking_date ? format(new Date(entry.booking_date), 'MMMM d, yyyy') : null}
        />

        <SectionHeader title="Meter Reading" />
        <View style={styles.twoColRow}>
          <View style={styles.twoColItem}>
            <DetailRow label="Previous Reading" value={entry.previous_reading != null ? String(entry.previous_reading) : null} />
          </View>
          <View style={styles.twoColItem}>
            <DetailRow label="Current Reading" value={entry.current_reading != null ? String(entry.current_reading) : null} />
          </View>
        </View>
        <View style={styles.twoColRow}>
          <View style={styles.twoColItem}>
            <DetailRow label="Total KW" value={
              entry.previous_reading != null || entry.current_reading != null
                ? ((entry.current_reading ?? 0) - (entry.previous_reading ?? 0)).toFixed(2)
                : null
            } />
          </View>
          <View style={styles.twoColItem}>
            <DetailRow label="Multiplier" value={entry.multiplier != null ? String(entry.multiplier) : null} />
          </View>
        </View>
        <DetailRow
          label="Electric Bill Payment"
          value={entry.payment_result != null
            ? `₱${entry.payment_result.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
            : null}
          highlight
        />

        <SectionHeader title="Notes" />
        <DetailRow label="Notes" value={entry.notes} multiline />
      </ScrollView>

      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Entry?"
        message="This action cannot be undone. The entry will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        destructive
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

function DetailRow({
  label,
  value,
  multiline = false,
  highlight = false,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.row, multiline && styles.rowMultiline]}>
      <Text style={[styles.rowLabel, multiline && styles.rowLabelMultiline]}>{label}</Text>
      <Text style={[styles.rowValue, multiline && styles.rowValueMultiline, highlight && styles.highlightValue, !value && styles.emptyValue]}>
        {value || '—'}
      </Text>
    </View>
  );
}

function ContactRow({
  label,
  value,
  actions,
}: {
  label: string;
  value: string | null | undefined;
  actions: { icon: string; color: string; onPress: () => void }[];
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.contactValueRow}>
        <Text style={[styles.rowValue, !value && styles.emptyValue]}>
          {value || '—'}
        </Text>
        {value && actions.length > 0 && (
          <View style={styles.contactActions}>
            {actions.map((action, i) => (
              <TouchableOpacity key={i} onPress={action.onPress} style={styles.contactBtn}>
                <Ionicons name={action.icon as any} size={20} color={action.color} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createdAt: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
  },
  sectionHeader: {
    marginTop: 14,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowMultiline: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flex: 1,
  },
  rowLabelMultiline: {
    flex: 0,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
    textAlign: 'right',
  },
  rowValueMultiline: {
    textAlign: 'left',
    flex: 0,
    width: '100%',
  },
  emptyValue: {
    color: '#CBD5E1',
  },
  highlightValue: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 15,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 8,
  },
  headerBtn: {
    padding: 6,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 0,
  },
  twoColItem: {
    flex: 1,
  },
  contactValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  contactBtn: {
    padding: 4,
  },
});
