// lib/macNode.ts
/**
 * Mac Node stub provider
 * - Provides a minimal interface for native macOS capabilities
 * - When a real Mac Node (native bridge) is available it should expose a
 *   global `window.__MAC_NODE__` object with IPC methods.
 * - For now, these functions either call the bridge if present or throw
 *   a clear error so callers know native capabilities are not implemented.
 */

export type MacNode = {
  readFile?: (path: string) => Promise<string>;
  listDir?: (path: string) => Promise<string[]>;
  openApp?: (bundleIdOrName: string) => Promise<boolean>;
  captureScreen?: (options?: any) => Promise<string>; // returns data-url or temp path
  sendMail?: (opts: { to: string[]; subject: string; body: string }) => Promise<boolean>;
  // ... add more as needed
};

const bridge = (typeof window !== 'undefined' && (window as any).__MAC_NODE__) ? (window as any).__MAC_NODE__ : null;

export const macNode: MacNode = {
  readFile: async (path: string) => {
    if (bridge && typeof bridge.readFile === 'function') return await bridge.readFile(path);
    throw new Error('Mac Node readFile not available. Implement native provider.');
  },
  listDir: async (path: string) => {
    if (bridge && typeof bridge.listDir === 'function') return await bridge.listDir(path);
    throw new Error('Mac Node listDir not available. Implement native provider.');
  },
  openApp: async (name: string) => {
    if (bridge && typeof bridge.openApp === 'function') return await bridge.openApp(name);
    throw new Error('Mac Node openApp not available. Implement native provider.');
  },
  captureScreen: async (opts?: any) => {
    if (bridge && typeof bridge.captureScreen === 'function') return await bridge.captureScreen(opts);
    throw new Error('Mac Node captureScreen not available. Implement native provider.');
  },
  sendMail: async (opts: { to: string[]; subject: string; body: string }) => {
    if (bridge && typeof bridge.sendMail === 'function') return await bridge.sendMail(opts);
    throw new Error('Mac Node sendMail not available. Implement native provider.');
  }
};

export default macNode;
