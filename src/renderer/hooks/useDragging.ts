import React, { useState } from 'react';
import useEventListener from 'renderer/hooks/useEventListener';

type DragState = {
  x: number;
  y: number;
};

export default function useDragging(
  target: React.RefObject<HTMLElement>,
  onDrag: (state: DragState) => void,
  onStart: (state: DragState) => void,
  onEnd: (state: DragState) => void,
) {
  const [dragStart, setDragStart] = useState<DragState | null>(null);

  function getDiff(state: DragState, event: MouseEvent) {
    return {
      x: event.pageX - state.x,
      y: event.pageY - state.y,
    };
  }

  useEventListener(
    'pointerdown',
    (event: MouseEvent) => {
      event.preventDefault();
      const currentTarget = event.currentTarget as HTMLElement;
      setDragStart({ x: event.pageX, y: event.pageY });
      onStart(
        getDiff(
          {
            x: currentTarget.offsetLeft || 0,
            y: currentTarget.offsetTop || 0,
          },
          event,
        ),
      );
    },
    target.current,
  );

  useEventListener(
    'pointermove',
    (event: MouseEvent) => {
      event.preventDefault();
      if (!dragStart) {
        return;
      }

      onDrag(getDiff(dragStart, event));
    },
    window,
    dragStart !== null,
  );

  useEventListener(
    'pointerup',
    (event: MouseEvent) => {
      event.preventDefault();
      if (!dragStart) {
        return;
      }

      onEnd(getDiff(dragStart, event));
      setDragStart(null);
    },
    window,
    dragStart !== null,
  );
}
