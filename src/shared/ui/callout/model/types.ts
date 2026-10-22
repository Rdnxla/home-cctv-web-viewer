import type {ReactNode} from 'react';

interface ProviderProps {
  children: ReactNode;
}

interface Message {
  id: string;
  message: string;
  type: MessageType;
}

type MessageType = 'error' | 'info' | 'success' | 'warn';

type ShowToast = (message: string, type: MessageType) => void;

export type {Message, MessageType, ProviderProps, ShowToast};
