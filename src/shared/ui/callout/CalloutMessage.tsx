import './callout.scss';
import {CheckCircledIcon, CrossCircledIcon, ExclamationTriangleIcon, InfoCircledIcon} from '@radix-ui/react-icons';
import {Callout} from '@radix-ui/themes';
import {createContext, useCallback, useContext, useState} from 'react';
import type {Message, MessageType, ProviderProps, ShowToast} from './model/types';

const CalloutContext = createContext<ShowToast | null>(null);

export function CalloutMessage({children}: ProviderProps) {
  const [messages, setMessages] = useState<Message[]>([]);

  const colors = {
    error: 'tomato',
    info: 'blue',
    success: 'green',
    warn: 'yellow',
  } as const;

  const showMessage = useCallback((message: string, type: MessageType) => {
    const id = crypto.randomUUID();
    setMessages(prev => [...prev, {id, message, type}]);

    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== id));
    }, 4000);
  }, []);

  function renderIcon(type: MessageType): React.ReactNode {
    switch (type) {
      case 'error':
        return <CrossCircledIcon />;
      case 'success':
        return <CheckCircledIcon />;
      case 'warn':
        return <ExclamationTriangleIcon />;
      default:
        return <InfoCircledIcon />;
    }
  }

  return (
    <CalloutContext.Provider value={showMessage}>
      {children}
      <div className='callout-container'>
        {messages.map(m => (
          <div
            className='callout'
            key={m.id}
          >
            <Callout.Root color={colors[m.type]}>
              <Callout.Icon>{renderIcon(m.type)}</Callout.Icon>
              <Callout.Text>{m.message}</Callout.Text>
            </Callout.Root>
          </div>
        ))}
      </div>
    </CalloutContext.Provider>
  );
}

export function useCalloutMessage() {
  const context = useContext(CalloutContext);
  if (!context) {
    throw new Error('useCalloutMessage должен использоваться внутри CalloutMessage');
  }
  return context; // тип сужен до ShowToast, без null
}
