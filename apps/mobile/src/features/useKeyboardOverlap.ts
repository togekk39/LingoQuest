import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Keyboard, Platform, type KeyboardEvent, type View } from 'react-native';

/** Space still covered by the keyboard after any OS window resize has happened. */
export function useKeyboardOverlap(frame: RefObject<View | null>) {
  const keyboardTop = useRef<number | null>(null);
  const [overlap, setOverlap] = useState(0);
  const measureOverlap = useCallback(() => {
    const top = keyboardTop.current;
    if (top === null) {
      setOverlap(0);
      return;
    }
    frame.current?.measureInWindow((_x, y, _width, height) => {
      if (keyboardTop.current === top) setOverlap(Math.max(0, Math.min(height, y + height - top)));
    });
  }, [frame]);

  useEffect(() => {
    const update = (top: number | null) => {
      keyboardTop.current = top;
      measureOverlap();
    };
    if (Platform.OS === 'web') {
      const viewport = window.visualViewport;
      // Mobile browsers can shrink only the visual viewport, leaving layout unchanged.
      const updateViewport = () =>
        update(
          viewport && viewport.scale === 1 && viewport.height < window.innerHeight
            ? viewport.offsetTop + viewport.height
            : null,
        );
      viewport?.addEventListener('resize', updateViewport);
      viewport?.addEventListener('scroll', updateViewport);
      window.addEventListener('resize', updateViewport);
      updateViewport();
      return () => {
        viewport?.removeEventListener('resize', updateViewport);
        viewport?.removeEventListener('scroll', updateViewport);
        window.removeEventListener('resize', updateViewport);
        keyboardTop.current = null;
      };
    }
    const updateKeyboard = (event: KeyboardEvent) =>
      update(event.endCoordinates.height > 0 ? event.endCoordinates.screenY : null);
    const subscriptions = [
      Keyboard.addListener('keyboardDidShow', updateKeyboard),
      Keyboard.addListener('keyboardDidChangeFrame', updateKeyboard),
      Keyboard.addListener('keyboardDidHide', () => update(null)),
    ];
    if (Platform.OS === 'ios')
      subscriptions.push(Keyboard.addListener('keyboardWillChangeFrame', updateKeyboard));
    const metrics = Keyboard.metrics();
    if (metrics) update(metrics.screenY);
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      keyboardTop.current = null;
    };
  }, [measureOverlap]);

  return { overlap, measureOverlap };
}
