import {Cross2Icon, MagnifyingGlassIcon} from '@radix-ui/react-icons';
import {IconButton, TextField} from '@radix-ui/themes';
import type {ChangeEvent, KeyboardEvent} from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';

const DEFAULT_DEBOUNCE_MS = 300;

interface SearchFieldProps {
  debounceMs?: number | undefined;
  /** Доступное имя поля (видимой подписи нет) */
  label: string;
  /** Вызывается после паузы в наборе и сразу при очистке */
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}

/** Поле поиска с задержкой: родитель получает значение, когда пользователь перестал печатать */
export function SearchField(props: SearchFieldProps) {
  const {debounceMs = DEFAULT_DEBOUNCE_MS, label, onChange, placeholder, value} = props;
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Внешнее изменение (сброс фильтров, навигация по истории) заменяет то, что набрано
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  const cancelPending = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setDraft(next);
      cancelPending();
      timerRef.current = setTimeout(() => {
        onChange(next);
      }, debounceMs);
    },
    [cancelPending, debounceMs, onChange]
  );

  const clear = useCallback(() => {
    cancelPending();
    setDraft('');
    onChange('');
  }, [cancelPending, onChange]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape' && draft !== '') {
        event.preventDefault();
        clear();
      }
    },
    [clear, draft]
  );

  return (
    <TextField.Root
      aria-label={label}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      value={draft}
    >
      <TextField.Slot>
        <MagnifyingGlassIcon aria-hidden='true' />
      </TextField.Slot>
      {draft === '' ? null : (
        <TextField.Slot>
          <IconButton aria-label='Очистить поиск' color='gray' onClick={clear} size='1' variant='ghost'>
            <Cross2Icon />
          </IconButton>
        </TextField.Slot>
      )}
    </TextField.Root>
  );
}
