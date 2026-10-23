import type {ChangeEvent, FormEvent} from 'react';
import {useCallback, useState} from 'react';
import {useCreateBookmarkMutation} from '@/entities/bookmark';
import {useCalloutMessage} from '@/shared/ui/callout/CalloutMessage';
import {floorToSecond, formatClock, formatDateTime} from '../../lib/time';

/**
 * Форма «В закладки»: сохраняет текущий момент записи под своим названием, а без названия — под временем момента.
 * Момент фиксируется при открытии формы: воспроизведение за это время уходит вперёд.
 */
export function useBookmarkForm(cameraId: string, position: number | null) {
  const [moment, setMoment] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const showMessage = useCalloutMessage();
  const {error, isPending, mutate, reset} = useCreateBookmarkMutation();
  const defaultTitle = moment === null ? '' : `Закладка ${formatClock(moment)}`;

  const changeOpen = useCallback(
    (open: boolean) => {
      if (open && position !== null) {
        setMoment(floorToSecond(position));
        setTitle('');
        reset();
      } else {
        setMoment(null);
      }
    },
    [position, reset]
  );

  const changeTitle = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  }, []);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (moment === null) return;
      const trimmed = title.trim();
      mutate(
        {at: new Date(moment).toISOString(), cameraId, title: trimmed === '' ? defaultTitle : trimmed},
        {
          onSuccess: bookmark => {
            setMoment(null);
            showMessage(`Закладка «${bookmark.title}» сохранена`, 'success');
          },
        }
      );
    },
    [cameraId, defaultTitle, moment, mutate, showMessage, title]
  );

  return {
    changeOpen,
    changeTitle,
    defaultTitle,
    errorMessage: error ? `Не удалось сохранить закладку: ${error.message}` : null,
    isOpen: moment !== null,
    isPending,
    momentLabel: moment === null ? null : formatDateTime(moment),
    submit,
    title,
  };
}
