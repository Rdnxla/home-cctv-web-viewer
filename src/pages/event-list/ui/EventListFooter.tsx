import {Flex, Select, Text} from '@radix-ui/themes';
import {useCallback, useId} from 'react';
import {Pagination} from '@/shared/ui';
import {PAGE_SIZE_OPTIONS} from '../model/eventListParams';

const countFormat = new Intl.NumberFormat('ru');

interface EventListFooterProps {
  disabled: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  total: number;
}

/** «Показаны 26–50 из 142», размер страницы и номера страниц */
export function EventListFooter(props: EventListFooterProps) {
  const {disabled, onPageChange, onPageSizeChange, page, pageSize, total} = props;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const pageSizeId = useId();

  const changePageSize = useCallback(
    (value: string) => {
      onPageSizeChange(Number(value));
    },
    [onPageSizeChange]
  );

  return (
    <Flex align='center' gap='3' justify='between' wrap='wrap'>
      <Text aria-live='polite' color='gray' size='2'>
        {total === 0
          ? 'Нет событий'
          : `Показаны ${countFormat.format(first)}–${countFormat.format(last)} из ${countFormat.format(total)}`}
      </Text>
      <Flex align='center' gap='4' wrap='wrap'>
        <Flex align='center' gap='2'>
          <Text as='label' color='gray' htmlFor={pageSizeId} size='2'>
            На странице
          </Text>
          <Select.Root disabled={disabled} onValueChange={changePageSize} size='2' value={String(pageSize)}>
            <Select.Trigger id={pageSizeId} />
            <Select.Content position='popper'>
              {PAGE_SIZE_OPTIONS.map(option => (
                <Select.Item key={option} value={String(option)}>
                  {option}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
        {totalPages > 1 ? (
          <Pagination disabled={disabled} onPageChange={onPageChange} page={page} totalPages={totalPages} />
        ) : null}
      </Flex>
    </Flex>
  );
}
