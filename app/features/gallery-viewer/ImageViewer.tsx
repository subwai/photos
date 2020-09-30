import React, { useEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'lodash';
import url from 'url';
import FileEntry, { isVideo } from '../../utils/FileEntry';
import useEventListener from '../../utils/useEventListener';
import { play, pause, selectPlaying } from './playerSlice';
import { selectCurrentFolder } from './currentFolderSlice';

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

interface Props {
  fileEntry: FileEntry | null;
}

export default function ImageViewer({ fileEntry }: Props): JSX.Element | null {
  const styles = useStyles();
  const [file, setFile] = useState<FileEntry | null>(null);
  const dispatch = useDispatch();
  const folderPath = useSelector(selectCurrentFolder);
  const playing = useSelector(selectPlaying);
  const videoElement = useRef<HTMLVideoElement>(null);
  const imageElement = useRef<HTMLImageElement>(null);
  const imageWrapper = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<number>(4);

  useEffect(() => {
    const timeout = setTimeout(() => setFile(fileEntry), 200);

    if (playing) {
      dispatch(pause());
    }

    return () => clearTimeout(timeout);
  }, [fileEntry]);

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

  const SPACE_KEY = 32;
  const LEFT_ARROW = 37;
  const RIGHT_ARROW = 39;
  const F_KEY = 70;
  useEventListener('keydown', (event: React.KeyboardEvent) => {
    if (event.keyCode === SPACE_KEY && videoElement.current) {
      if (videoElement.current.paused) {
        videoElement.current.play().catch(console.error);
      } else {
        videoElement.current.pause();
      }
      event.preventDefault();
    }
    if (event.keyCode === LEFT_ARROW && videoElement.current && !videoElement.current.paused && !event.shiftKey) {
      videoElement.current.currentTime = Math.max(0, videoElement.current.currentTime - 5);
      event.preventDefault();
    }
    if (event.keyCode === RIGHT_ARROW && videoElement.current && !videoElement.current.paused && !event.shiftKey) {
      videoElement.current.currentTime = Math.min(videoElement.current.duration, videoElement.current.currentTime + 5);
      event.preventDefault();
    }
    if (event.keyCode === F_KEY) {
      if (document.fullscreenElement) {
        document.exitFullscreen().then(updateStep).catch(console.error);
      }
      const currentElement = videoElement.current || imageWrapper.current;
      if (currentElement) {
        currentElement.requestFullscreen().then(updateStep).catch(console.error);
      }
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

  const noFileOrFolder = !file && !folderPath;

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
