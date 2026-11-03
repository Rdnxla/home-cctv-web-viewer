import {useSyncExternalStore} from 'react';
import * as v from 'valibot';
import {ACCENT_COLORS} from '../config/themeOptions';

const STORAGE_KEY = 'theme-settings';

const ThemeSettingsSchema = v.object({
  accentColor: v.fallback(v.picklist(ACCENT_COLORS), 'indigo'),
});

type ThemeSettings = v.InferOutput<typeof ThemeSettingsSchema>;

// Один экземпляр на приложение: настройки читают оба layout-а и форма в боковой панели
const listeners = new Set<() => void>();
let current: ThemeSettings | undefined;

function readStoredSettings(): ThemeSettings {
  let stored: unknown;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    stored = {};
  }
  const result = v.safeParse(ThemeSettingsSchema, stored);
  return result.success ? result.output : v.parse(ThemeSettingsSchema, {});
}

function getSnapshot() {
  current ??= readStoredSettings();
  return current;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function updateThemeSettings(patch: Partial<ThemeSettings>) {
  current = {...getSnapshot(), ...patch};
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  for (const listener of listeners) listener();
}

function useThemeSettings() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export {updateThemeSettings, useThemeSettings};
