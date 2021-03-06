import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import { selectSelectedIndex, setSelectedIndex } from '../redux/slices/selectedFolderSlice';

type IndexValue = number | null;

export default function useSelectedIndex(
  defaultIndex: IndexValue = null
): [IndexValue, (folder: IndexValue, scroll?: number) => void] {
  const dispatch = useDispatch();
  const history = useHistory();
  const selectedIndex = useSelector(selectSelectedIndex);

  const debouncedHashReplace = useDebouncedCallback(
    (index: IndexValue, scroll: number) => {
      history.replace(`${history.location.pathname}#${index}_${scroll}`);
    },
    100,
    { leading: true }
  );

  const setSelectedIndexCallback = useCallback(
    (index: IndexValue, scroll = null) => {
      const [hashIndex, hashScroll] = history.location.hash.replace('#', '').split('_').map(Number);

      if (index !== selectedIndex && !Number.isNaN(index)) {
        dispatch(setSelectedIndex(index));
      }
      if (index !== hashIndex || (hashScroll !== scroll && scroll !== null)) {
        debouncedHashReplace(index, scroll || 0);
      }
    },
    [selectedIndex]
  );

  return [selectedIndex === null ? defaultIndex : selectedIndex, setSelectedIndexCallback];
}
