import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addMonths } from 'date-fns';

export async function setupNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rent-due', {
      name: 'Rent Due Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleRentDueNotification(
  entryId: number,
  bookingDate: string,
  propertyName: string | null,
  guestName: string | null
): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  let dueDate = addMonths(new Date(bookingDate), 1);
  dueDate.setUTCHours(0, 0, 0, 0); // midnight UTC = 8:00 AM Philippine time

  const now = new Date();
  if (dueDate <= now) {
    // 8am on the due date already passed — notify 5 seconds after entry is saved
    dueDate = new Date(now.getTime() + 5 * 1000);
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Rent Due — ${propertyName ?? 'Unnamed Property'}`,
      body: `${guestName ?? 'Guest'}'s rent payment is due today.`,
      data: { entryId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dueDate,
    },
  });

  return id;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
