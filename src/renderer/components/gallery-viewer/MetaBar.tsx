import classNames from 'classnames';
import React, { memo } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectFilesCount,
  selectGallerySort,
  selectGalleryViewer,
  setSort,
  setViewer,
  State,
} from '../../redux/slices/galleryViewerSlice';

const useStyles = createUseStyles({
  metaBar: {
    height: 24,
    background: 'rgba(40,40,40,.9)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 5px',
    color: '#ccc',
    borderTop: '1px solid #555',
    zIndex: 1,
  },
  leftSide: {},
  sort: {
    background: 'transparent',
    appearance: 'none',
    color: '#ccc',
    border: 0,
    cursor: 'pointer',
    fontSize: '13px',
  },
  viewer: {
    marginLeft: 5,
    display: 'inline-block',
    '& > i': {
      padding: '2px 5px',
      border: '1px solid #555',
      cursor: 'pointer',
      '&:first-child': {
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        borderRight: 0,
      },
      '&:last-child': {
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
      },
      '&.selected': {
        background: 'rgba(255,255,255,.15)',
      },
      '&:hover': {
        background: 'rgba(255,255,255,.3)',
      },
    },
  },
  rightSide: {},
  count: {
    fontSize: '10px',
  },
});

export default memo(function MetaBar() {
  const filesCount = useSelector(selectFilesCount);
  const sort = useSelector(selectGallerySort);
  const viewer = useSelector(selectGalleryViewer);
  const dispatch = useDispatch();
  const classes = useStyles();

  const onSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSort(event.target.value));
  };

  const onViewerSelect = (nextViewer: State['viewer']) => {
    dispatch(setViewer(nextViewer));
  };

  return (
    <div className={classes.metaBar}>
      <div className={classes.leftSide}>
        <select value={sort} onChange={onSortChange} className={classes.sort}>
          <option value="fullPath:asc">Filename &#11014;</option>
          <option value="fullPath:desc">Filename &#11015;</option>
        </select>
        <div className={classes.viewer}>
          <i
            className={classNames('fas fa-th', { selected: viewer === 'grid' })}
            onClick={() => onViewerSelect('grid')}
          />
          <i
            className={classNames('fas fa-ellipsis-h', { selected: viewer === 'line' })}
            onClick={() => onViewerSelect('line')}
          />
        </div>
      </div>
      <div className={classes.rightSide}>
        <div className={classes.count}>{filesCount}</div>
      </div>
    </div>
  );
});
