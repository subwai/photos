import type { Channels, ElectronHandler } from 'main/preload';

window.electron = {
  setRootFolder(_: string | null) {},
  on(_channel: Channels, _listener: (...args: any[]) => void) {},
  removeListener(_channel: Channels, _listener: (...args: any[]) => void) {},
  send(_channel: Channels, ..._args: any[]) {},
  invoke(_channel: Channels, ..._args: any[]) {
    return Promise.resolve();
  },
  platform: process.platform,
  pathToFileURL(_path: string) {
    return 'fake-path';
  },
} as ElectronHandler;
