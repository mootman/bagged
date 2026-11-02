import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Small physical confirmations on the moments that matter. No-ops on web. */
export const tap = () => Platform.OS !== 'web' && Haptics.selectionAsync().catch(() => {});
export const success = () =>
  Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
