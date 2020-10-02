import React, { useEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'lodash';
import url from 'url';
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
  },
  transformWrapper: {
    width: '100%',
    height: '100%',
  },
  transformComponent: {
    width: '100%',
    height: '100%',
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
  const [step, setStep] = useState<number>(4);

  const file = useDebounce(selectedFile, 200);

  function updateStep() {
    if (imageElement.current) {
      const min = Math.max(imageElement.current.clientWidth, imageElement.current.clientHeight);
      const scaling = document.fullscreenElement ? 10 : 1;

      setStep((scaling * min) / 200);
    }
  }

  const updateStepDebounced = debounce(updateStep, 200);

  useEventListener('resize', () => {
    updateStepDebounced();
  });

  useEffect(() => {
    updateStep();
  }, [imageElement.current]);

  useEffect(() => {
    if (playing) {
      dispatch(pause());
    }
  }, [selectedFile]);

  const space = (event: React.KeyboardEvent) => {
    if (videoElement.current) {
      event.preventDefault();
      if (videoElement.current.paused) {
        videoElement.current.play().catch(console.error);
      } else {
        videoElement.current.pause();
      }
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
      document.exitFullscreen().then(updateStep).catch(console.error);
    }
    const currentElement = videoElement.current || imageWrapper.current;
    if (currentElement) {
      currentElement.requestFullscreen().then(updateStep).catch(console.error);
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
        className={styles.image}
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
    <div ref={imageWrapper} className={styles.imageWrapper}>
      <TransformWrapper
        wheel={{ step }}
        options={{
          disabled: noFileOrFolder,
          // @ts-ignore
          wrapperClass: styles.transformWrapper,
          contentClass: styles.transformComponent,
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
