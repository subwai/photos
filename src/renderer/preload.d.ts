import { Channels } from 'main/preload';

declare global {
  interface Window {
    electron: {
      setRootFolder(path: string | null): void;
      on(channel: Channels, listener: (...args: never[]) => void): void;
      removeListener(channel: Channels, listener: (...args: never[]) => void): void;
      send(channel: Channels, ...args: never[]): void;
      invoke(channel: Channels, ...args: never[]): Promise<never>;
      platform: NodeJS.Platform;
      pathToFileURL(path: string): string;
    };
  }
}

export {};
