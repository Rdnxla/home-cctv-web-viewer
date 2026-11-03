import type {ThemeProps} from '@radix-ui/themes';

type AccentColor = NonNullable<ThemeProps['accentColor']>;

interface ThemeOption<T extends string> {
  label: string;
  value: T;
}

const ACCENT_COLOR_OPTIONS: readonly ThemeOption<AccentColor>[] = [
  {label: 'Серый', value: 'gray'},
  {label: 'Золотой', value: 'gold'},
  {label: 'Бронзовый', value: 'bronze'},
  {label: 'Коричневый', value: 'brown'},
  {label: 'Жёлтый', value: 'yellow'},
  {label: 'Янтарный', value: 'amber'},
  {label: 'Оранжевый', value: 'orange'},
  {label: 'Томатный', value: 'tomato'},
  {label: 'Красный', value: 'red'},
  {label: 'Рубиновый', value: 'ruby'},
  {label: 'Малиновый', value: 'crimson'},
  {label: 'Розовый', value: 'pink'},
  {label: 'Сливовый', value: 'plum'},
  {label: 'Пурпурный', value: 'purple'},
  {label: 'Фиолетовый', value: 'violet'},
  {label: 'Ирис', value: 'iris'},
  {label: 'Индиго', value: 'indigo'},
  {label: 'Синий', value: 'blue'},
  {label: 'Голубой', value: 'cyan'},
  {label: 'Бирюзовый', value: 'teal'},
  {label: 'Нефритовый', value: 'jade'},
  {label: 'Зелёный', value: 'green'},
  {label: 'Травяной', value: 'grass'},
  {label: 'Лаймовый', value: 'lime'},
  {label: 'Мятный', value: 'mint'},
  {label: 'Небесный', value: 'sky'},
];

const ACCENT_COLORS = ACCENT_COLOR_OPTIONS.map(option => option.value);

export type {AccentColor, ThemeOption};
export {ACCENT_COLOR_OPTIONS, ACCENT_COLORS};
