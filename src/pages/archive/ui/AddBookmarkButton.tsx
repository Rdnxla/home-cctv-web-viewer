import {BookmarkIcon} from '@radix-ui/react-icons';
import {Button, Flex, Popover, Text, TextField} from '@radix-ui/themes';
import type {ChangeEvent, FormEvent} from 'react';
import {useCallback, useId, useState} from 'react';
import {BOOKMARK_TITLE_MAX_LENGTH, useCreateBookmarkMutation} from '@/entities/bookmark';
import {useCalloutMessage} from '@/shared/components/callout/CalloutMessage';
import {formatDateTime} from '../lib/format';
import {floorToSecond, formatClock} from '../lib/time';

interface AddBookmarkButtonProps {
  cameraId: string;
  /** Текущий момент воспроизведения; `null` — сохранять нечего */
  position: number | null;
}

function getDefaultTitle(moment: number) {
  return `Закладка ${formatClock(moment)}`;
}

/** «В закладки»: сохраняет текущий момент записи под своим названием */
export function AddBookmarkButton(props: AddBookmarkButtonProps) {
  const {cameraId, position} = props;
  // Момент фиксируется при открытии формы: воспроизведение за это время уходит вперёд
  const [moment, setMoment] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const titleId = useId();
  const showMessage = useCalloutMessage();
  const {error, isPending, mutate, reset} = useCreateBookmarkMutation();

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
        {at: new Date(moment).toISOString(), cameraId, title: trimmed === '' ? getDefaultTitle(moment) : trimmed},
        {
          onSuccess: bookmark => {
            setMoment(null);
            showMessage(`Закладка «${bookmark.title}» сохранена`, 'success');
          },
        }
      );
    },
    [cameraId, moment, mutate, showMessage, title]
  );

  return (
    <Popover.Root
      onOpenChange={changeOpen}
      open={moment !== null}
    >
      <Popover.Trigger>
        <Button
          color='gray'
          disabled={position === null}
          variant='soft'
        >
          <BookmarkIcon />В закладки
        </Button>
      </Popover.Trigger>
      <Popover.Content
        maxWidth='320px'
        width='320px'
      >
        {moment === null ? null : (
          <form onSubmit={submit}>
            <Flex
              direction='column'
              gap='3'
            >
              <Flex
                direction='column'
                gap='1'
              >
                <Text
                  size='3'
                  weight='medium'
                >
                  Новая закладка
                </Text>
                <Text
                  color='gray'
                  size='2'
                >
                  {formatDateTime(moment)}
                </Text>
              </Flex>
              <Flex
                direction='column'
                gap='1'
              >
                <Text
                  as='label'
                  htmlFor={titleId}
                  size='2'
                >
                  Название
                </Text>
                <TextField.Root
                  id={titleId}
                  maxLength={BOOKMARK_TITLE_MAX_LENGTH}
                  onChange={changeTitle}
                  placeholder={getDefaultTitle(moment)}
                  value={title}
                />
              </Flex>
              {error ? (
                <Text
                  color='red'
                  size='2'
                >
                  {`Не удалось сохранить закладку: ${error.message}`}
                </Text>
              ) : null}
              <Flex
                gap='2'
                justify='end'
              >
                <Popover.Close>
                  <Button
                    color='gray'
                    type='button'
                    variant='soft'
                  >
                    Отмена
                  </Button>
                </Popover.Close>
                <Button
                  loading={isPending}
                  type='submit'
                >
                  Сохранить
                </Button>
              </Flex>
            </Flex>
          </form>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}
