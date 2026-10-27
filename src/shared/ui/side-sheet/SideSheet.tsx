import {Cross2Icon} from '@radix-ui/react-icons';
import {Flex, Heading, IconButton, Text, Theme} from '@radix-ui/themes';
import {Dialog} from 'radix-ui';
import type {ReactElement, ReactNode} from 'react';
import styles from './SideSheet.module.scss';

interface SideSheetProps {
  children: ReactNode;
  description: string;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  trigger: ReactElement;
}

export function SideSheet(props: SideSheetProps) {
  const {children, description, footer, onOpenChange, open, title, trigger} = props;

  return (
    <Dialog.Root
      onOpenChange={onOpenChange}
      open={open}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Theme asChild>
          <Dialog.Overlay className={styles.sideSheet__overlay}>
            <Dialog.Content className={styles.sideSheet}>
              <Flex
                align='start'
                className={styles.sideSheet__header}
                gap='3'
                justify='between'
              >
                <Flex
                  direction='column'
                  gap='1'
                >
                  <Dialog.Title asChild>
                    <Heading
                      as='h2'
                      size='4'
                    >
                      {title}
                    </Heading>
                  </Dialog.Title>
                  <Dialog.Description asChild>
                    <Text
                      as='p'
                      color='gray'
                      size='2'
                    >
                      {description}
                    </Text>
                  </Dialog.Description>
                </Flex>
                <Dialog.Close asChild>
                  <IconButton
                    aria-label='Закрыть'
                    color='gray'
                    variant='ghost'
                  >
                    <Cross2Icon aria-hidden='true' />
                  </IconButton>
                </Dialog.Close>
              </Flex>
              <div className={styles.sideSheet__body}>{children}</div>
              {footer ? <div className={styles.sideSheet__footer}>{footer}</div> : null}
            </Dialog.Content>
          </Dialog.Overlay>
        </Theme>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
