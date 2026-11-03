import {useCallback, useEffect, useRef, useState} from 'react';

// Safari before 16.4 (and iPadOS stuck on 15) only has the webkit-prefixed API
interface WebkitDocument {
  webkitExitFullscreen?: () => void;
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
}

interface WebkitElement {
  webkitRequestFullscreen?: () => void;
}

// iPhone Safari has no element fullscreen at all, only a <video> in the native player
interface WebkitVideoElement {
  webkitEnterFullscreen?: () => void;
}

const FULLSCREEN_CHANGE_EVENTS = ['fullscreenchange', 'webkitfullscreenchange'];

const fullscreenDocument = document as Document & WebkitDocument;

function isElementFullscreenEnabled() {
  return Boolean(fullscreenDocument.fullscreenEnabled || fullscreenDocument.webkitFullscreenEnabled);
}

function getFullscreenElement() {
  return fullscreenDocument.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? null;
}

function enterFullscreen(element: HTMLElement & WebkitElement) {
  if (typeof element.requestFullscreen === 'function') {
    element.requestFullscreen().catch(() => ({}));
  } else {
    element.webkitRequestFullscreen?.();
  }
}

function exitFullscreen() {
  if (typeof fullscreenDocument.exitFullscreen === 'function') {
    fullscreenDocument.exitFullscreen().catch(() => ({}));
  } else {
    fullscreenDocument.webkitExitFullscreen?.();
  }
}

function enterVideoFullscreen(container: HTMLElement) {
  const video: (HTMLVideoElement & WebkitVideoElement) | null = container.querySelector('video');
  try {
    video?.webkitEnterFullscreen?.();
  } catch {
    // InvalidStateError until the video has loaded metadata; the button just does nothing then
  }
}

export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isSupported = isElementFullscreenEnabled() || 'webkitEnterFullscreen' in HTMLVideoElement.prototype;

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(ref.current !== null && getFullscreenElement() === ref.current);
    };
    for (const type of FULLSCREEN_CHANGE_EVENTS) {
      document.addEventListener(type, onChange);
    }
    return () => {
      for (const type of FULLSCREEN_CHANGE_EVENTS) {
        document.removeEventListener(type, onChange);
      }
    };
  }, []);

  const toggle = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    if (!isElementFullscreenEnabled()) {
      enterVideoFullscreen(element);
    } else if (getFullscreenElement()) {
      exitFullscreen();
    } else {
      enterFullscreen(element);
    }
  }, []);

  return {isFullscreen, isSupported, ref, toggle};
}
