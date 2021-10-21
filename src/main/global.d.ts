/* eslint-disable @typescript-eslint/no-explicit-any */
export {};

declare global {
  interface Window {
    electron: {
      setRootFolder: (path: string | null) => void;
      on: (channel: string, func: (...arg: any[]) => void) => void;
      removeListener: (channel: string, listener: (...arg: any[]) => void) => void;
      send: (channel: string, ...arg: any) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      platform: NodeJS.Platform;
      pathToFileURL: (path: string) => string;
      // receive: (channel: string, func: (event: any, ...arg: any) => void) => void;
      // electronIpcSendTo: (window_id: string, channel: string, ...arg: any) => void;
      // electronIpcSend: (channel: string, ...arg: any) => void;
      // electronIpcOn: (channel: string, listener: (event: any, ...arg: any) => void) => void;
      // electronIpcSendSync: (channel: string, ...arg: any) => void;
      // electronIpcOnce: (channel: string, listener: (event: any, ...arg: any) => void) => void;
      // electronIpcRemoveListener: (channel: string, listener: (event: any, ...arg: any) => void) => void;
      // electronIpcRemoveAllListeners: (channel: string) => void;
    };
  }
}
