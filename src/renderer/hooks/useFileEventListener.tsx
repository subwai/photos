import { useEffect, useRef } from 'react';
import { FileEntryEvent, FileEntryModel } from '../models/FileEntry';

export default function useFileEventListener(
  eventName: string,
  handler: (event: FileEntryEvent) => void,
  fileEntry: FileEntryModel | null
) {
  // Create a ref that stores handler
  const savedHandler = useRef<(event: FileEntryEvent) => void>();

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
      if (!fileEntry) return;

      // Create event listener that calls handler function stored in ref
      const eventListener = (event: FileEntryEvent) => savedHandler.current && savedHandler.current(event);

      // Add event listener
      fileEntry.addEventListener(eventName, eventListener);

      // Remove event listener on cleanup
      // eslint-disable-next-line consistent-return
      return () => {
        fileEntry.removeEventListener(eventName, eventListener);
      };
    },
    [eventName, fileEntry] // Re-run if eventName or element changes
  );
}
