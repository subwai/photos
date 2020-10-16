import React, { useEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { useDispatch, useSelector } from 'react-redux';
import url from 'url';
import classNames from 'classnames';
import { isVideo } from '../../utils/FileEntry';
import useEventListener from '../../utils/useEventListener';
import { play, pause, selectPlaying } from './playerSlice';
import { selectRootFolder } from '../rootFolderSlice';
import { selectSelectedFile } from '../selectedFolderSlice';
import useDebounce from '../../utils/useDebounce';

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
  const styles = useStyles();
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
  }, [selectedFile]);

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

  if (file && isVideo(file)) {
    return (
      <video
        key={file.fullPath}
        ref={videoElement}
        className={classNames(styles.image, { [styles.preview]: isPreviewing })}
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

  const noFileOrFolder = !file && !rootFolder;

  return (
    <div ref={imageWrapper} className={classNames(styles.imageWrapper, { [styles.preview]: isPreviewing })}>
      <TransformWrapper
        options={{
          disabled: noFileOrFolder,
          // @ts-ignore
          wrapperClass: styles.transformWrapper,
          contentClass: styles.transformComponent,
        }}
        doubleClick={{
          mode: 'reset',
        }}
      >
        <TransformComponent>
          {noFileOrFolder && <h2 className={styles.selectText}>Select a folder</h2>}
          {file && (
            <img
              ref={imageElement}
              className={styles.image}
              alt={file.fullPath}
              src={url.pathToFileURL(file.fullPath).toString()}
            />
          )}
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
