import styles from './InfoBlock.module.scss'
import {
  Box,
  Callout,
  Heading,
  Text,
} from "@radix-ui/themes";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from '@radix-ui/react-icons'
import type {
  MessageType,
} from "@/shared/components/callout/types";

const messages = [
  {
    id: 1,
    type: 'error',
    message: 'Обнаружено движение!'
  },
  {
    id: 1,
    type: 'success',
    message: 'Сигнал восстановлен'
  },
  {
    id: 1,
    type: 'warn',
    message: 'Нет электричества!'
  },
  {
    id: 1,
    type: 'warn',
    message: 'Нет электричества!'
  },
  {
    id: 1,
    type: 'warn',
    message: 'Нет электричества!'
  },
  {
    id: 1,
    type: 'warn',
    message: 'Нет электричества!'
  },
  {
    id: 1,
    type: 'warn',
    message: 'Нет электричества!'
  },
  {
    id: 1,
    type: 'warn',
    message: 'Нет электричества!'
  },
  {
    id: 1,
    type: 'warn',
    message: 'Нет электричества!'
  },
]

const colors = {
  error: 'tomato',
  info: 'blue',
  success: 'green',
  warn: 'yellow',
} as const

function renderIcon(type: MessageType): React.ReactNode {
  switch (type) {
    case 'error': 
      return (
        <CrossCircledIcon />
      )
    case 'success':
      return (
        <CheckCircledIcon />
      )
    case 'warn':
      return (
        <ExclamationTriangleIcon />
      )
    default:
      return (
        <InfoCircledIcon />
      )
  }
}

export function InfoBlock() {
  return (
    <Box
      className={styles.infoBlock}
    >
      <Heading as='h2' size='4'>Обзор</Heading>
      <Text>Камер в сети: 3 из 4</Text>
      <Heading as='h4' my='2' size='3'>Последние события:</Heading>
      <Box height='800px' overflow='scroll'>
        <Box>
          {messages.map((m) => (
            <div className={styles.callout} key={m.id}>
              <Callout.Root color={colors[m.type]}>
                <Callout.Icon>
                  {renderIcon(m.type)}
                </Callout.Icon>
                <Callout.Text>
                  {m.message}
                </Callout.Text>
              </Callout.Root>
            </ div>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
