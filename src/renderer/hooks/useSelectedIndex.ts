import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import { selectSelectedIndex, setSelectedIndex } from '../redux/slices/selectedFolderSlice';

type IndexValue = number | null;

export default function useSelectedIndex(defaultIndex: IndexValue = null): [IndexValue, (folder: IndexValue) => void] {
  const dispatch = useDispatch();
  const history = useHistory();
  const selectedIndex = useSelector(selectSelectedIndex);

  const debouncedHashReplace = useDebouncedCallback((index) => {
    history.replace(`${history.location.pathname}#${index}`);
  }, 250);

  const setSelectedIndexCallback = useCallback(
    (index: IndexValue) => {
      if (index !== selectedIndex && !Number.isNaN(index)) {
        dispatch(setSelectedIndex(index));
        debouncedHashReplace(index);
      }
    },
    [selectedIndex]
  );

  return [selectedIndex === null ? defaultIndex : selectedIndex, setSelectedIndexCallback];
}
