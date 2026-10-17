import {useEffect, useState} from 'react';

/** Текущее время, обновляемое раз в `intervalMs`, — для отображения, которое зависит от «сейчас» */
export function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);
    return () => {
      clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}
