import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { initDB } from './src/database/queries';
import { setupNotifications } from './src/utils/notifications';
import { RootStackParamList } from './src/types';
import HomeScreen from './src/screens/HomeScreen';
import AddEntryScreen from './src/screens/AddEntryScreen';
import DetailScreen from './src/screens/DetailScreen';
import EditEntryScreen from './src/screens/EditEntryScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const notificationHandled = useRef<string | null>(null);

  useEffect(() => {
    async function init() {
      await setupNotifications();
      await initDB();
      setDbReady(true);
    }
    init();
  }, []);

  // Navigate to the entry when a notification is tapped
  useEffect(() => {
    if (!lastNotificationResponse || !dbReady) return;
    const notifId = lastNotificationResponse.notification.request.identifier;
    if (notificationHandled.current === notifId) return;
    notificationHandled.current = notifId;

    const entryId = lastNotificationResponse.notification.request.content.data?.entryId;
    if (typeof entryId === 'number' && navigationRef.isReady()) {
      navigationRef.navigate('Detail', { id: entryId });
    }
  }, [lastNotificationResponse, dbReady]);

  if (!dbReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '700',
            color: '#1E293B',
          },
          headerTintColor: '#2563EB',
          cardStyle: { backgroundColor: '#F8FAFC' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Rent Tracker' }}
        />
        <Stack.Screen
          name="AddEntry"
          component={AddEntryScreen}
          options={{ title: 'Add Entry' }}
        />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{ title: 'Entry Details' }}
        />
        <Stack.Screen
          name="EditEntry"
          component={EditEntryScreen}
          options={{ title: 'Edit Entry' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
