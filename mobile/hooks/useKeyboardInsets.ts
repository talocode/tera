import { Platform } from 'react-native';

export function useKeyboardInsets() {
  return {
    behavior: Platform.OS === 'ios' ? 'padding' as const : 'height' as const,
    keyboardVerticalOffset: Platform.OS === 'android' ? 82 : 0,
  };
}
