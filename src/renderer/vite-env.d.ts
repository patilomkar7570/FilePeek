/// <reference types="vite/client" />

import { FilePeekApi } from '../preload/index';

declare global {
  interface Window {
    filePeekApi: FilePeekApi;
  }
}
