declare module 'electron-vibrancy' {
  import { BrowserWindow } from "electron";

  export interface ViewOptions {
    Material: number;
    Width: number;
    Height: number;
    X: number;
    Y: number;
    ResizeMask: number;
  }

  export function SetVibrancy(window: BrowserWindow | null, material: number): boolean;
  export function AddView(window: BrowserWindow | null, options: ViewOptions): number;
  export function UpdateView(window: BrowserWindow | null, options: ViewOptions): boolean;
  export function RemoveView(window: BrowserWindow | null, viewId: number): boolean;
  export function DisableVibrancy(window: BrowserWindow | null): void;
}
