import { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';

export default function useAnimationTimer(duration = 1000, delay = 0, dependencies: ReadonlyArray<unknown>) {
  const [elapsed, setTime] = useState(0);
  const [oldDependencies, setDependencies] = useState<ReadonlyArray<unknown>>(dependencies);

  useEffect(
    () => {
      let animationFrame: number;
      let timerStop: NodeJS.Timeout;
      let start: number;
      let stopAnimation: boolean;

      // Function to be executed on each animation frame
      function onFrame() {
        if (stopAnimation || Date.now() - start <= duration) {
          setTime(Date.now() - start);
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          loop();
        }
      }

      // Call onFrame() on next animation frame
      function loop() {
        if (!stopAnimation) {
          animationFrame = requestAnimationFrame(onFrame);
        }
      }

      function onStart() {
        // Set a timeout to stop things when duration time elapses
        timerStop = setTimeout(() => {
          cancelAnimationFrame(animationFrame);
          setTime(Date.now() - start);
          stopAnimation = true;
        }, duration);

        // Start the loop
        start = Date.now();
        loop();
      }

      // Start after specified delay (defaults to 0)
      const timerDelay = setTimeout(onStart, delay);
      setTime(0);

      // Clean things up
      return () => {
        stopAnimation = true;
        clearTimeout(timerStop);
        clearTimeout(timerDelay);
        cancelAnimationFrame(animationFrame);
      };
    },
    [duration, delay, ...dependencies] // Only re-run effect if duration or delay changes
  );

  useEffect(() => {
    setDependencies(dependencies);
  }, dependencies);

  return shallowEqual(oldDependencies, dependencies) ? elapsed : 0;
}
