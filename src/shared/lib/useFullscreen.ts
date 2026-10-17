import {useCallback, useEffect, useRef, useState} from 'react';

/**
 * Полноэкранный режим для произвольного элемента.
 *   const {ref, isFullscreen, isSupported, toggle} = useFullscreen<HTMLDivElement>();
 *   <div ref={ref}>…</div>
 */
export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isSupported = document.fullscreenEnabled;

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(ref.current !== null && document.fullscreenElement === ref.current);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
    };
  }, []);

  const toggle = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => ({}));
    } else {
      element.requestFullscreen().catch(() => ({}));
    }
  }, []);

  return {isFullscreen, isSupported, ref, toggle};
}
