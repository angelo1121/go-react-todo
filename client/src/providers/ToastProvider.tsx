import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast, ToastId, UseToastOptions } from '@chakra-ui/react';

interface ToastContextProps {
  addToast: (title: string, status: UseToastOptions['status'], options?: UseToastOptions) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const toast = useToast();
  const [toastQueue, setToastQueue] = useState<ToastId[]>([]);

  const addToast = (title: string, status: UseToastOptions['status'], options?: UseToastOptions) => {
    if (toastQueue.length >= 3) {
      const [firstToastId, ...rest] = toastQueue;
      toast.close(firstToastId);
      setToastQueue(rest);
    }

    const id = toast({
      title,
      status,
      duration: 5000,
      isClosable: true,
      position: 'bottom-left',
      ...options
    });

    setToastQueue((prevQueue) => [...prevQueue, id]);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = (): ToastContextProps => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
