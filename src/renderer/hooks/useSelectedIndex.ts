import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

import { selectSelectedIndex, setSelectedIndex } from 'renderer/redux/slices/selectedFolderSlice';

type IndexValue = number | null;

export default function useSelectedIndex(
  defaultIndex: IndexValue = null,
): [IndexValue, (folder: IndexValue, scroll?: number | null) => void] {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedIndex = useSelector(selectSelectedIndex);

  const debouncedHashReplace = useDebouncedCallback(
    (pathname: string, index: IndexValue, scroll: number) => {
      navigate(`${pathname}#${index}_${scroll}`, { replace: true });
    },
    100,
    { leading: true },
  );

  const setSelectedIndexCallback = useCallback(
    (index: IndexValue, scroll: number | null = null) => {
      const [hashIndex, hashScroll] = location.hash.replace('#', '').split('_').map(Number);

      if (index !== selectedIndex && !Number.isNaN(index)) {
        dispatch(setSelectedIndex(index));
      }
      if (index !== hashIndex || (hashScroll !== scroll && scroll !== null)) {
        debouncedHashReplace(location.pathname, index, scroll || 0);
      }
    },
    [selectedIndex, location],
  );

  return [selectedIndex === null ? defaultIndex : selectedIndex, setSelectedIndexCallback];
}
