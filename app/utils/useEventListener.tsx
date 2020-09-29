import { useEffect, useRef } from 'react';

export default function useEventListener(
  eventName: string,
  handler: Function,
  element: HTMLElement | typeof window | null = window,
  enabled = true,
  options: any = undefined
) {
  // Create a ref that stores handler
  const savedHandler = useRef<Function>();

  // Update ref.current value if handler changes.
  // This allows our effect below to always get latest handler ...
  // ... without us needing to pass it in effect deps array ...
  // ... and potentially cause effect to re-run every render.
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(
    () => {
      // Make sure element supports addEventListener
      // On
      if (!element || !element.addEventListener) return;

      if (!enabled) return;

      // Create event listener that calls handler function stored in ref
      const eventListener = (event: any) => savedHandler.current && savedHandler.current(event);

      // Add event listener
      element.addEventListener(eventName, eventListener, options);

      // Remove event listener on cleanup
      // eslint-disable-next-line consistent-return
      return () => {
        element.removeEventListener(eventName, eventListener);
      };
    },
    [eventName, element, enabled] // Re-run if eventName or element changes
  );
}
