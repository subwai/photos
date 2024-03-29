import classNames from 'classnames';
import { createUseStyles } from 'react-jss';

import useThumbnail from 'renderer/hooks/useThumbnail';
import { FileEntryModel, isImage, isVideo } from 'renderer/models/FileEntry';

export const FOLDER_ICON_SIDE_MARGIN = 4;

const useStyles = createUseStyles({
  previewIcon: {
    height: '100%',
    borderRadius: 5,
    margin: `0 ${FOLDER_ICON_SIDE_MARGIN}px`,
    verticalAlign: 'middle',
    imageRendering: 'pixelated',
    background: 'rgba(0,0,0,.3)',
    objectFit: 'cover',
    aspectRatio: 1,
    position: 'relative',
    '&:after': {
      content: '"\\f1c5"',
      fontSize: 32,
      fontFamily: "'Font Awesome 5 Free'",
      color: '#333',
      display: 'inline-flex',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#222',
      justifyContent: 'center',
      alignItems: 'center',
    },
  },
  folderIcon: {
    margin: `0 ${FOLDER_ICON_SIDE_MARGIN}px`,
    textAlign: 'center',
    verticalAlign: 'middle',
  },
});

interface Props {
  fileEntry: FileEntryModel;
}

export default function FolderIcon({ fileEntry }: Props): JSX.Element | null {
  const classes = useStyles();
  const [fullPath, key, generateThumbnail] = useThumbnail(fileEntry.cover);

  if (fileEntry.cover && isVideo(fileEntry.cover)) {
    return <img key={key} className={classes.previewIcon} alt="" src={fullPath} onError={() => generateThumbnail()} />;
  }

  if (fileEntry.cover && isImage(fileEntry.cover)) {
    return <img key={key} className={classes.previewIcon} alt="" src={fullPath} onError={() => generateThumbnail()} />;
  }

  return <i className={classNames(classes.folderIcon, 'fas fa-folder', 'folder-size', 'folder-icon')} />;
}
