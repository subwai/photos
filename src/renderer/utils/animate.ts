// For this example, I've used easeOutQuart, see https://gist.github.com/gre/1650294 for different easing
function easing(time: number) {
  // eslint-disable-next-line no-param-reassign,no-plusplus
  return 1 - --time * time * time * time;
}

/**
 * Given a start/end point of a scroll and time elapsed, calculate the scroll position we should be at
 * @param {Number} start - the initial value
 * @param {Number} end - the final desired value
 * @param {Number} elapsed - the amount of time elapsed since we started animating
 * @param {Number} duration - the duration of the animation
 * @return {Number} - The value we should use on the next tick
 */
function getValue(start: number, end: number, elapsed: number, duration: number) {
  if (elapsed > duration) return end;
  return start + (end - start) * easing(elapsed / duration);
}

/**
 * Smoothly animate between two values
 * @param {Number} fromValue - the initial value
 * @param {Number} toValue - the initial value
 * @param {Function} onUpdate - A function that is called on each tick
 * @param {Function} onComplete - A callback that is fired once the scroll animation ends
 * @param {Number} duration - the desired duration of the scroll animation
 */
export default function animate({
  fromValue,
  toValue,
  onUpdate,
  onComplete,
  duration = 600,
}: {
  fromValue: number;
  toValue: number;
  onUpdate: (value: number, callback?: Function) => void;
  onComplete?: Function;
  duration?: number;
}) {
  const startTime = performance.now();
  let stopped = false;

  const tick = () => {
    if (stopped) {
      return;
    }

    const elapsed = performance.now() - startTime;

    window.requestAnimationFrame(() =>
      onUpdate(
        getValue(fromValue, toValue, elapsed, duration),
        // Callback
        elapsed <= duration ? tick : onComplete
      )
    );
  };

  tick();

  return () => {
    stopped = true;
  };
}
