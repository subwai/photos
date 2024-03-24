import classNames from 'classnames';
import { ComponentProps, memo, useState } from 'react';
import { createUseStyles } from 'react-jss';

import GridFolderThumbnail, {
  THUMBNAIL_HEIGHT,
  THUMBNAIL_PADDING,
  THUMBNAIL_WIDTH,
} from 'renderer/components/gallery-viewer/grid-viewer/GridFolderThumbnail';
import useThumbnail from 'renderer/hooks/useThumbnail';
import { FileEntryModel } from 'renderer/models/FileEntry';

const useStyles = createUseStyles({
  thumbnail: {
    padding: THUMBNAIL_PADDING,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    objectFit: 'contain',
    boxSizing: 'border-box',
    cursor: 'pointer',
    overflow: 'hidden',
    '&:after': {
      content: '"\\f1c5"',
      fontSize: 48,
      fontFamily: "'Font Awesome 5 Free'",
      color: '#333',
      display: 'inline-flex',
      position: 'absolute',
      top: 0,
      left: 0,
      margin: '10%',
      width: '80%',
      height: '80%',
      borderRadius: '4px',
      backgroundColor: '#222',
      justifyContent: 'center',
      alignItems: 'center',
      visibility: 'visible',
    },
  },
  folderName: {
    position: 'absolute',
    width: THUMBNAIL_WIDTH,
    height: 12,
    lineHeight: '12px',
    fontSize: 12,
    left: (THUMBNAIL_HEIGHT - THUMBNAIL_WIDTH) / 2,
    bottom: THUMBNAIL_PADDING,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    textShadow: '0 0 2px #000, 0 0 2px #000',
    padding: '0 2px',
    boxSizing: 'border-box',
  },
  hidden: {
    visibility: 'hidden',
  },
});

interface Props {
  fileEntry: FileEntryModel;
  index: number;
  classPrefix?: string;
  onClick: ComponentProps<'div'>['onClick'];
  onDoubleClick: ComponentProps<'div'>['onDoubleClick'];
  onAuxClick: ComponentProps<'div'>['onAuxClick'];
  style: ComponentProps<'div'>['style'];
}

export default memo(function GridThumbnail({
  fileEntry,
  index,
  onClick,
  onDoubleClick,
  onAuxClick,
  style,
  classPrefix = '',
}: Props): JSX.Element | null {
  const classes = useStyles();
  const [fullPath, key, generateThumbnail] = useThumbnail(fileEntry);
  const [loaded, setLoaded] = useState(false);

  if (fileEntry.isFolder) {
    return (
      <div
        className={classNames(
          classes.thumbnail,
          `${classPrefix}grid-thumbnail`,
          `${classPrefix}grid-thumbnail-${index}`,
        )}
        style={style}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onAuxClick={onAuxClick}
      >
        <GridFolderThumbnail fileEntry={fileEntry} />
        <span className={classes.folderName}>{fileEntry.name}</span>
      </div>
    );
  }

  return (
    <div
      className={classNames(classes.thumbnail, `${classPrefix}grid-thumbnail`, `${classPrefix}grid-thumbnail-${index}`)}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onAuxClick={onAuxClick}
    >
      <img
        key={key}
        className={classNames(classes.image, { [classes.hidden]: !loaded })}
        alt=""
        src={fullPath}
        loading="lazy"
        onError={() => generateThumbnail()}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
});
