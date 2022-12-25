import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import { selectSelectedIndex, setSelectedIndex } from '../redux/slices/selectedFolderSlice';

type IndexValue = number | null;

export default function useSelectedIndex(
  defaultIndex: IndexValue = null
): [IndexValue, (folder: IndexValue, scroll?: number | null) => void] {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedIndex = useSelector(selectSelectedIndex);

  const debouncedHashReplace = useDebouncedCallback(
    (index: IndexValue, scroll: number) => {
      navigate(`${location.pathname}#${index}_${scroll}`, { replace: true });
    },
    100,
    { leading: true }
  );

  const setSelectedIndexCallback = useCallback(
    (index: IndexValue, scroll: number | null = null) => {
      const [hashIndex, hashScroll] = location.hash.replace('#', '').split('_').map(Number);

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
