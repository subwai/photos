import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import useEventListener from '../../hooks/useEventListener';
import { isVideo } from '../../models/FileEntry';
import { selectRootFolder } from '../../redux/slices/rootFolderSlice';
import { selectSelectedFile } from '../../redux/slices/selectedFolderSlice';
import { pause, play, selectPlaying, selectPreview, setPreview } from '../../redux/slices/viewerSlice';

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

export default function ImageViewer() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const rootFolder = useSelector(selectRootFolder);
  const selectedFile = useSelector(selectSelectedFile);
  const playing = useSelector(selectPlaying);
  const preview = useSelector(selectPreview);
  const videoElement = useRef<HTMLVideoElement>(null);
  const imageElement = useRef<HTMLImageElement>(null);
  const imageWrapper = useRef<HTMLDivElement>(null);
  const transformer = useRef<ReactZoomPanPinchRef>(null);

  useEffect(() => {
    if (playing) {
      dispatch(pause());
    }
  }, [selectedFile, dispatch]);

  useEffect(() => {
    transformer.current?.setTransform(transformer.current?.state.positionX, 0, transformer.current?.state.scale, 0);
  }, [selectedFile]);

  const space = (event: React.KeyboardEvent) => {
    if (videoElement.current) {
      event.preventDefault();
      if (event.shiftKey) {
        dispatch(setPreview(!preview));
      } else if (videoElement.current.paused) {
        videoElement.current.play().catch(console.error);
      } else {
        videoElement.current.pause();
      }
    }
    if (imageWrapper.current && !document.fullscreenElement) {
      event.preventDefault();
      dispatch(setPreview(!preview));
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

  const pageDown = (event: React.KeyboardEvent) => {
    if (transformer.current) {
      const offsetMultiplier = event.shiftKey ? 0.5 : 1;
      transformer.current.setTransform(
        transformer.current.state.positionX,
        Math.max(
          transformer.current.state.positionY -
            transformer.current.instance.contentComponent!.offsetHeight * offsetMultiplier,
          transformer.current.instance.bounds!.minPositionY
        ),
        transformer.current.state.scale
      );
      event.preventDefault();
    }
  };

  const pageUp = (event: React.KeyboardEvent) => {
    if (transformer.current) {
      const offsetMultiplier = event.shiftKey ? 0.5 : 1;
      transformer.current.setTransform(
        transformer.current.state.positionX,
        Math.min(
          transformer.current.state.positionY +
            transformer.current.instance.contentComponent!.offsetHeight * offsetMultiplier,
          transformer.current.instance.bounds!.maxPositionY
        ),
        transformer.current.state.scale
      );
      event.preventDefault();
    }
  };

  const fKey = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .then(() => dispatch(setPreview(false)))
        .catch(console.error);
    }
    const currentElement = videoElement.current || imageWrapper.current;
    if (currentElement) {
      currentElement.requestFullscreen().catch(console.error);
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
      case 'PageDown':
        return pageDown(event);
      case 'PageUp':
        return pageUp(event);
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
    window.electron.send('open-folder');
  }

  if (!selectedFile && !rootFolder) {
    return (
      <div ref={imageWrapper} className={classes.imageWrapper}>
        <h2 className={classes.selectText} onClick={selectFolder}>
          Select a folder
        </h2>
      </div>
    );
  }

  if (selectedFile && isVideo(selectedFile)) {
    return (
      <video
        key={selectedFile.fullPath}
        ref={videoElement}
        className={classNames(classes.image, { [classes.preview]: preview })}
        // eslint-disable-next-line react/no-unknown-property
        controls
        loop
        onFocus={preventFocus}
        // eslint-disable-next-line react/no-unknown-property
        onPlay={() => dispatch(play())}
        // eslint-disable-next-line react/no-unknown-property
        onPause={() => dispatch(pause())}
        // eslint-disable-next-line react/no-unknown-property
        onAuxClick={() => dispatch(setPreview(false))}
      >
        <source src={`${window.electron.pathToFileURL(selectedFile.fullPath).toString()}#t=0.5`} />
      </video>
    );
  }

  return (
    <div
      ref={imageWrapper}
      className={classNames(classes.imageWrapper, { [classes.preview]: preview })}
      // eslint-disable-next-line react/no-unknown-property
      onAuxClick={() => dispatch(setPreview(false))}
    >
      <TransformWrapper
        ref={transformer}
        doubleClick={{
          mode: 'reset',
        }}
      >
        <TransformComponent wrapperClass={classes.transformWrapper} contentClass={classes.transformComponent}>
          {selectedFile && (
            <img
              ref={imageElement}
              className={classes.image}
              alt={selectedFile.fullPath}
              src={window.electron.pathToFileURL(selectedFile.fullPath).toString()}
            />
          )}
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
