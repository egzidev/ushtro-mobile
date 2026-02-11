import { StyleSheet } from 'react-native';

/**
 * Flatten style array to a single object for web compatibility.
 * Prevents "Failed to set an indexed property [0] on 'CSSStyleDeclaration'" on web
 * by ensuring the DOM receives a plain object, not an array.
 */
export function flattenStyle<T extends object>(
  arr: (T | null | undefined | false)[]
): T | undefined {
  const filtered = arr.filter((s): s is T => s != null && s !== false);
  if (filtered.length === 0) return undefined;
  return StyleSheet.flatten(filtered) as T;
}
