import { useEffect, useRef, useState } from 'react';
import useUnmount from './useUnmount';

const useThrottle = <T>(value: T, ms = 200) => {
  const [state, setState] = useState<T>(value);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const nextValue = useRef<T>(value);
  const hasNextValue = useRef<boolean>(false);

  useEffect(() => {
    if (!timeout.current) {
      setState(value);
      const timeoutCallback = () => {
        if (hasNextValue.current) {
          hasNextValue.current = false;
          setState(nextValue.current);
          timeout.current = setTimeout(timeoutCallback, ms);
        } else {
          timeout.current = undefined;
        }
      };
      timeout.current = setTimeout(timeoutCallback, ms);
    } else {
      nextValue.current = value;
      hasNextValue.current = true;
    }
  }, [value]);

  useUnmount(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  });

  return state;
};

export default useThrottle;
