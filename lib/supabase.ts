import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// On web, AsyncStorage can throw "window is not defined" (SSR or early execution).
// Use a localStorage-backed adapter only when window exists.
function getStorage() {
  if (Platform.OS === "web") {
    return {
      getItem: (key: string) =>
        Promise.resolve(
          typeof window !== "undefined" ? window.localStorage.getItem(key) : null
        ),
      setItem: (key: string, value: string) => {
        if (typeof window !== "undefined") window.localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        if (typeof window !== "undefined") window.localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }
  // Native: use AsyncStorage (loaded only when not on web to avoid web path)
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;
  return AsyncStorage;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
