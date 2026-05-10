import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { getAllEntries } from '../database/queries';
import { Entry, RootStackParamList } from '../types';
import ListCard from '../components/ListCard';
import SortMenu, { SortOption } from '../components/SortMenu';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getAllEntries().then((data) => {
        if (active) {
          setEntries(data);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = (a.property_name ?? '').toLowerCase();
      const nameB = (b.property_name ?? '').toLowerCase();
      return nameA.localeCompare(nameB);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEntry')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={28} color="#2563EB" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sortRow}>
        <Text style={styles.countText}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </Text>
        <SortMenu value={sortBy} onChange={setSortBy} />
      </View>

      {sorted.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="home-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptySubtitle}>Tap + to add your first property</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ListCard
              entry={item}
              onPress={() => navigation.navigate('Detail', { id: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  list: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  addButton: {
    marginRight: 8,
    padding: 4,
  },
});
