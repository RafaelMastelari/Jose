import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
}

export function useLongPress({ onLongPress, onClick, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const hasMoved = useRef(false);

  const start = useCallback(() => {
    hasMoved.current = false;
    isLongPressRef.current = false;
    
    timerRef.current = setTimeout(() => {
      if (!hasMoved.current) {
        isLongPressRef.current = true;
        onLongPress();
      }
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMove = useCallback(() => {
    hasMoved.current = true;
    cancel();
  }, [cancel]);

  const handleEnd = useCallback(() => {
    cancel();
    
    // If it wasn't a long press and onClick is defined, call it
    if (!isLongPressRef.current && onClick && !hasMoved.current) {
      onClick();
    }
    
    isLongPressRef.current = false;
  }, [cancel, onClick]);

  return {
    onMouseDown: start,
    onMouseUp: handleEnd,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: handleEnd,
    onTouchMove: handleMove,
  };
}
