import classNames from 'classnames';
import { ipcRenderer } from 'electron';
import React, { useEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import url from 'url';
import useDebounce from '../../hooks/useDebounce';
import useEventListener from '../../hooks/useEventListener';
import { isVideo } from '../../models/FileEntry';
import { pause, play, selectPlaying } from '../../redux/slices/playerSlice';
import { selectRootFolder } from '../../redux/slices/rootFolderSlice';
import { selectSelectedFile } from '../../redux/slices/selectedFolderSlice';

const useStyles = createUseStyles({
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  selectText: {
    margin: '0 auto',
    alignSelf: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    display: 'flex',
  },
  transformWrapper: {
    width: '100%',
    height: '100%',
  },
  transformComponent: {
    width: '100%',
    height: '100%',
  },
  preview: {
    position: 'absolute',
    width: '100%',
    height: 'calc(100% + 35px)',
    top: -35,
    left: 0,
    zIndex: 2,
    background: 'rgba(20,20,20,.9)',
  },
});

export default function ImageViewer(): JSX.Element | null {
  const classes = useStyles();
  const dispatch = useDispatch();
  const rootFolder = useSelector(selectRootFolder);
  const selectedFile = useSelector(selectSelectedFile);
  const playing = useSelector(selectPlaying);
  const videoElement = useRef<HTMLVideoElement>(null);
  const imageElement = useRef<HTMLImageElement>(null);
  const imageWrapper = useRef<HTMLDivElement>(null);
  const [isPreviewing, setPreview] = useState<boolean>(false);

  const file = useDebounce(selectedFile, isPreviewing ? 0 : 50);

  useEffect(() => {
    if (playing) {
      dispatch(pause());
    }
  }, [selectedFile, dispatch]);

  const space = (event: React.KeyboardEvent) => {
    if (videoElement.current) {
      event.preventDefault();
      if (event.shiftKey) {
        setPreview(!isPreviewing);
      } else if (videoElement.current.paused) {
        videoElement.current.play().catch(console.error);
      } else {
        videoElement.current.pause();
      }
    }
    if (imageWrapper.current && !document.fullscreenElement) {
      event.preventDefault();
      setPreview(!isPreviewing);
    }
  };

  const arrowLeft = (event: React.KeyboardEvent) => {
    if (videoElement.current && !videoElement.current.paused && !event.shiftKey) {
      event.preventDefault();
      videoElement.current.currentTime = Math.max(0, videoElement.current.currentTime - 5);
    }
  };

  const arrowRight = (event: React.KeyboardEvent) => {
    if (videoElement.current && !videoElement.current.paused && !event.shiftKey) {
      event.preventDefault();
      videoElement.current.currentTime = Math.min(videoElement.current.duration, videoElement.current.currentTime + 5);
    }
  };

  const fKey = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
    const currentElement = videoElement.current || imageWrapper.current;
    if (currentElement) {
      currentElement
        .requestFullscreen()
        .then(() => setPreview(false))
        .catch(console.error);
    }
  };

  useEventListener('keydown', (event: React.KeyboardEvent) => {
    switch (event.key) {
      case ' ':
        return space(event);
      case 'ArrowLeft':
        return arrowLeft(event);
      case 'ArrowRight':
        return arrowRight(event);
      case 'f':
        return fKey(event);
      default:
        return false;
    }
  });

  function preventFocus(event: React.FocusEvent<HTMLImageElement | HTMLVideoElement>) {
    event.preventDefault();
    event.currentTarget.blur();
  }

  function selectFolder() {
    ipcRenderer.send('open-folder');
  }

  if (!file && !rootFolder) {
    return (
      <div ref={imageWrapper} className={classes.imageWrapper}>
        <h2 className={classes.selectText} onClick={selectFolder}>
          Select a folder
        </h2>
      </div>
    );
  }

  if (file && isVideo(file)) {
    return (
      <video
        key={file.fullPath}
        ref={videoElement}
        className={classNames(classes.image, { [classes.preview]: isPreviewing })}
        controls
        loop
        onFocus={preventFocus}
        onPlay={() => dispatch(play())}
        onPause={() => dispatch(pause())}
      >
        <source src={`${url.pathToFileURL(file.fullPath).toString()}#t=0.5`} />
      </video>
    );
  }

  return (
    <div ref={imageWrapper} className={classNames(classes.imageWrapper, { [classes.preview]: isPreviewing })}>
      <TransformWrapper
        options={{
          // @ts-ignore
          wrapperClass: classes.transformWrapper,
          contentClass: classes.transformComponent,
        }}
        doubleClick={{
          mode: 'reset',
        }}
      >
        <TransformComponent>
          {file && (
            <img
              ref={imageElement}
              className={classes.image}
              alt={file.fullPath}
              src={url.pathToFileURL(file.fullPath).toString()}
            />
          )}
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
