import {useCallback} from 'react';
import type {AccentColor} from '../config/themeOptions';
import {ACCENT_COLOR_OPTIONS} from '../config/themeOptions';
import {updateThemeSettings, useThemeSettings} from '../model/themeSettings';
import {ColorPicker} from './ColorPicker';

export function ThemeSettingsForm() {
  const {accentColor} = useThemeSettings();

  const changeAccentColor = useCallback((value: AccentColor) => {
    updateThemeSettings({accentColor: value});
  }, []);

  return (
    <ColorPicker
      label='Основной цвет'
      onChange={changeAccentColor}
      options={ACCENT_COLOR_OPTIONS}
      value={accentColor}
    />
  );
}
