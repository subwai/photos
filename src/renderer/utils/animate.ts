/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
// https://gist.github.com/gre/1650294
const EasingFunctions = {
  // no easing, no acceleration
  linear: (t: number) => t,
  // accelerating from zero velocity
  easeInQuad: (t: number) => t * t,
  // decelerating to zero velocity
  easeOutQuad: (t: number) => t * (2 - t),
  // acceleration until halfway, then deceleration
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  // accelerating from zero velocity
  easeInCubic: (t: number) => t * t * t,
  // decelerating to zero velocity
  easeOutCubic: (t: number) => --t * t * t + 1,
  // acceleration until halfway, then deceleration
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  // accelerating from zero velocity
  easeInQuart: (t: number) => t * t * t * t,
  // decelerating to zero velocity
  easeOutQuart: (t: number) => 1 - --t * t * t * t,
  // acceleration until halfway, then deceleration
  easeInOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),
  // accelerating from zero velocity
  easeInQuint: (t: number) => t * t * t * t * t,
  // decelerating to zero velocity
  easeOutQuint: (t: number) => 1 + --t * t * t * t * t,
  // acceleration until halfway, then deceleration
  easeInOutQuint: (t: number) => (t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t),
};

type EasingFunctionTypes = keyof typeof EasingFunctions;

/**
 * Given a start/end point of a scroll and time elapsed, calculate the scroll position we should be at
 * @param {Number} start - the initial value
 * @param {Number} end - the final desired value
 * @param {Number} elapsed - the amount of time elapsed since we started animating
 * @param {String} easing - An easing function name
 * @param {Number} duration - the duration of the animation
 * @return {Number} - The value we should use on the next tick
 */
function getValue(start: number, end: number, elapsed: number, easing: EasingFunctionTypes, duration: number) {
  if (elapsed > duration) return end;
  return start + (end - start) * EasingFunctions[easing](elapsed / duration);
}

/**
 * Smoothly animate between two values
 * @param {String} easing - An easing function name
 * @param {Number} fromValue - the initial value
 * @param {Number} toValue - the initial value
 * @param {Function} onUpdate - A function that is called on each tick
 * @param {Function} onComplete - A callback that is fired once the scroll animation ends
 * @param {Number} duration - the desired duration of the scroll animation
 */
export default function animate({
  easing = 'linear',
  fromValue,
  toValue,
  onUpdate,
  onComplete = () => {},
  duration = 600,
}: {
  easing?: EasingFunctionTypes;
  fromValue: number;
  toValue: number;
  onUpdate: (value: number, callback: Function) => void;
  onComplete?: Function;
  duration?: number;
}) {
  const startTime = performance.now();
  let stopped = false;

  const tick = () => {
    const elapsed = performance.now() - startTime;

    window.requestAnimationFrame(() => {
      if (stopped) {
        return;
      }

      onUpdate(
        getValue(fromValue, toValue, elapsed, easing, duration),
        // Callback
        elapsed <= duration ? tick : onComplete
      );
    });
  };

  tick();

  return () => {
    stopped = true;
  };
}
