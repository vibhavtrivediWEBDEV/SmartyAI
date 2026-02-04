/**
 * Cursor Automation Hook for React Windows
 * Provides programmatic control over window operations via text commands
 */

import { useCallback, useRef, useEffect } from 'react';

interface CursorPosition {
  x: number;
  y: number;
}

interface AutomationCommand {
  action: 'move' | 'click' | 'open' | 'close' | 'type' | 'minimize' | 'maximize' | 'focus' | 'setValue';
  target?: string; // Window ID or element ID
  params?: any; // Additional parameters
  delay?: number; // Delay before execution
}

interface AutomationState {
  isRunning: boolean;
  currentCommand: AutomationCommand | null;
  queue: AutomationCommand[];
  cursorPosition: CursorPosition;
}

export interface CursorAutomationAPI {
  // Core actions
  moveTo: (elementId: string) => Promise<boolean>;
  clickElement: (elementId: string) => Promise<boolean>;
  typeIntoElement: (elementId: string, text: string, options?: { delay?: number; humanLike?: boolean }) => Promise<boolean>;

  // Window operations
  openWindow: (appName: string, x?: number, y?: number) => Promise<boolean>;
  closeWindow: (identifier: string) => Promise<boolean>; // ⬅️ Changed from windowId to identifier
  minimizeWindow: (identifier: string) => Promise<boolean>; // ⬅️ Changed
  maximizeWindow: (identifier: string) => Promise<boolean>; // ⬅️ Changed
  focusWindow: (identifier: string) => Promise<boolean>;

  // Queue management
  executeCommand: (command: AutomationCommand) => Promise<boolean>;
  executeSequence: (commands: AutomationCommand[]) => Promise<void>;
  clearQueue: () => void;

  // Text command parser
  parseTextCommand: (text: string) => AutomationCommand | null;
  executeTextCommand: (text: string) => Promise<boolean>;

  // State getters
  getState: () => AutomationState;
  getCursorPosition: () => CursorPosition;
  getAllWindows: () => string[];
}

export function useCursorAutomation(
  openApplication: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void,
  openWindows: any[],
  setOpenWindows: React.Dispatch<React.SetStateAction<any[]>>,
  speak?: (text: string) => void // ⬅️ NEW: Hindi TTS function

): CursorAutomationAPI {

  const stateRef = useRef<AutomationState>({
    isRunning: false,
    currentCommand: null,
    queue: [],
    cursorPosition: { x: 0, y: 0 }
  });

  // 🔥 FIX: Use ref to always get latest openWindows
  const openWindowsRef = useRef(openWindows);

  useEffect(() => {
    openWindowsRef.current = openWindows;
  }, [openWindows]);

  const logRef = useRef<string[]>([]);

  // Helper: Log automation events
  const log = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    logRef.current.push(logMessage);

    // Keep only last 100 logs
    if (logRef.current.length > 100) {
      logRef.current.shift();
    }
  }, []);

  // Helper: Find element by ID or selector
  const findElement = useCallback((selector: string): HTMLElement | null => {
    // Try by ID first
    let element = document.getElementById(selector);

    // Try by querySelector if not found
    if (!element) {
      element = document.querySelector(selector) as HTMLElement;
    }

    if (!element) {
      log(`Element not found: ${selector}`, 'error');
    }

    return element;
  }, [log]);

  // Helper: Get element center position
  const getElementCenter = useCallback((element: HTMLElement): CursorPosition => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }, []);

  // Helper: Scroll element into view if needed
  const scrollIntoView = useCallback(async (element: HTMLElement): Promise<void> => {
    const rect = element.getBoundingClientRect();
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );

    if (!isInViewport) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Wait for scroll to complete
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }, []);

  // Helper: Simulate mouse click
  const simulateClick = useCallback((element: HTMLElement, position: CursorPosition): void => {
    const events = ['mousedown', 'mouseup', 'click'];

    events.forEach(eventType => {
      const event = new MouseEvent(eventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: position.x,
        clientY: position.y
      });
      element.dispatchEvent(event);
    });
  }, []);



  // Helper: Dispatch simple event
  const dispatchEvent = useCallback((target: HTMLElement, type: string, detail?: any) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    if (detail) Object.assign(event, detail);
    target.dispatchEvent(event);
  }, []);

  // Helper: Dispatch keyboard event
  const dispatchKeyboardEvent = useCallback((
    target: HTMLElement,
    type: string,
    key: string,
    code?: string
  ) => {
    const event = new KeyboardEvent(type, {
      key,
      code: code || `Key${key.toUpperCase()}`,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    target.dispatchEvent(event);
  }, []);

  // Helper: Simulate typing one character (used in typeIntoElement)
  // In simulateTypingChar
  const simulateTypingChar = useCallback(async (
    input: HTMLInputElement,
    char: string,
    baseDelay: number
  ) => {
    const delay = baseDelay + (Math.random() * 40 - 20);

    // Focus if not already
    input.focus();

    // Simulate key events (optional but good)
    dispatchKeyboardEvent(input, 'keydown', char);
    dispatchKeyboardEvent(input, 'keypress', char);

    // === React-friendly insert ===
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;

    // Use the real setter to bypass React's read-only value
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, input.value + char);
    } else {
      input.value += char; // fallback
    }

    // Move cursor
    input.selectionStart = input.selectionEnd = input.value.length;

    // Trigger React's onChange properly
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      composed: true,
      data: char,
      inputType: 'insertText',
    });

    input.dispatchEvent(inputEvent);

    await new Promise(r => setTimeout(r, delay));

    dispatchKeyboardEvent(input, 'keyup', char);
  }, [dispatchKeyboardEvent]);



  // Core: Move cursor to element
  const moveTo = useCallback(async (elementId: string): Promise<boolean> => {
    try {
      log(`Moving to element: ${elementId}`, 'info');

      const element = findElement(elementId);
      if (!element) return false;

      await scrollIntoView(element);
      const position = getElementCenter(element);

      stateRef.current.cursorPosition = position;

      // Emit cursor move event for visual cursor
      window.dispatchEvent(new CustomEvent('cursor-automation-move', {
        detail: { x: position.x, y: position.y, elementId }
      }));

      log(`Moved to (${Math.round(position.x)}, ${Math.round(position.y)})`, 'success');

      return true;
    } catch (error) {
      log(`Error moving to element: ${error}`, 'error');
      return false;
    }
  }, [findElement, scrollIntoView, getElementCenter, log]);

  // Core: Click element
  // const clickElement = useCallback(async (elementId: string): Promise<boolean> => {
  //   try {
  //     log(`Clicking element: ${elementId}`, 'info');

  //     const element = findElement(elementId);
  //     if (!element) return false;

  //     await scrollIntoView(element);
  //     const position = getElementCenter(element);

  //     // Update cursor position
  //     stateRef.current.cursorPosition = position;

  //     // Emit move event
  //     window.dispatchEvent(new CustomEvent('cursor-automation-move', {
  //       detail: { x: position.x, y: position.y, elementId }
  //     }));

  //     // Wait a moment for visual feedback
  //     await new Promise(resolve => setTimeout(resolve, 100));

  //     // Emit click event
  //     window.dispatchEvent(new CustomEvent('cursor-automation-click', {
  //       detail: { x: position.x, y: position.y, elementId }
  //     }));

  //     // Simulate click
  //     simulateClick(element, position);

  //     log(`Clicked element: ${elementId}`, 'success');
  //     return true;
  //   } catch (error) {
  //     log(`Error clicking element: ${error}`, 'error');
  //     return false;
  //   }
  // }, [findElement, scrollIntoView, getElementCenter, simulateClick, log]);


  const clickElement = useCallback(async (elementId: string): Promise<boolean> => {
    try {
      log(`Clicking element: ${elementId}`, 'info');

      const element = findElement(elementId);
      if (!element) return false;

      // 🔥 STEP 1: mouse move FIRST and WAIT
      await moveTo(elementId); // ⬅️ YAHI FIX HAI

      // 🔥 STEP 2: tiny human-like pause (optional but recommended)
      await new Promise(res => setTimeout(res, 500));

      // 🔥 STEP 3: NOW click
      element.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true })
      );
      element.dispatchEvent(
        new MouseEvent('mouseup', { bubbles: true })
      );
      element.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      );

      log(`Clicked element: ${elementId}`, 'success');
      return true;

    } catch (error) {
      log(`Error clicking element: ${error}`, 'error');
      return false;
    }
  }, [findElement, moveTo, log]);


  // Core: Type text into an input element (human-like simulation)
  const typeIntoElement = useCallback(async (
    elementId: string,
    text: string,
    options: { delay?: number; humanLike?: boolean } = { delay: 80, humanLike: true }
  ): Promise<boolean> => {
    try {
      log(`Typing into element: ${elementId} → "${text}"`, 'info');

      const element = findElement(elementId);
      if (!element) return false;

      if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
        log(`Element ${elementId} is not an input or textarea`, 'error');
        return false;
      }

      const input = element as HTMLInputElement;

      // 1️⃣ Make sure element is visible & focused
      await scrollIntoView(input);
      input.focus();

      // 2️⃣ 🔥 CLEAR TEXT (REACT SAFE, ALWAYS WORKS)
      input.value = '';
      dispatchEvent(input, 'input');
      dispatchEvent(input, 'change');

      if (options.humanLike) {
        await new Promise(r => setTimeout(r, 120));
      }

      // 3️⃣ TYPE EACH CHARACTER (human-like)
      for (const char of text) {
        await simulateTypingChar(input, char, options.delay ?? 80);
      }

      // 4️⃣ FINAL EVENTS (very important for React)
      dispatchEvent(input, 'input');
      dispatchEvent(input, 'change');
      dispatchEvent(input, 'blur');

      log(`Successfully typed "${text}" into #${elementId}`, 'success');
      return true;
    } catch (error) {
      log(`Error typing into ${elementId}: ${error}`, 'error');
      return false;
    }
  }, [
    log,
    findElement,
    scrollIntoView,
    simulateTypingChar,
    dispatchEvent,
  ]);



  // Window: Open application
  // Window: Open application
  const openWindow = useCallback(async (
    appName: string,
    x?: number,
    y?: number
  ): Promise<boolean> => {
    try {
      log(`Opening window: ${appName}`, 'info');
      speak?.(`${appName} Opening.`)

      openApplication(appName, x, y);

      // ⬇️ WAIT for DOM window element to appear instead of checking state
      let retries = 0;
      let windowElement = null;
      const maxRetries = 20; // 2 seconds max

      while (!windowElement && retries < maxRetries) {
        // Look for any window with matching title/app name in DOM
        windowElement = document.querySelector(`[data-window-app="${appName}"]`);

        if (!windowElement) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
      }

      if (!windowElement) {
        log(`Window DOM element not found: ${appName}, but continuing anyway`, 'warn');
        // Don't fail - the window might still be there, just not tagged properly
      } else {
        log(`Window ${appName} DOM element found after ${retries} retries`, 'success');
      }

      speak?.(`${appName} Opened`)
      return true; // Always return true since openApplication was called
    } catch (error) {
      log(`Error opening window: ${error}`, 'error');
      return false;
    }
  }, [openApplication, log, speak]);

  // Window: Close by ID
  // Window: Close by ID or AppName
  const closeWindow = useCallback(async (
    identifier: string
  ): Promise<boolean> => {
    try {
      log(`Closing window(s): ${identifier}`, 'info');

      // 🔥 FIX: Use ref to get latest openWindows
      const currentWindows = openWindowsRef.current;

      console.log('🔍 DEBUG closeWindow:', {
        identifier,
        allWindows: currentWindows.map(w => ({ id: w.id, appName: w.appName }))
      });

      // 🔎 Find windows by id OR appName
      const targets = currentWindows.filter(
        w => w.id === identifier || w.appName.toLowerCase() === identifier.toLowerCase()
      );

      console.log('🎯 Found targets:', targets);

      if (!targets.length) {
        log(`No window found for: ${identifier}`, 'warn');
        return false;
      }

      // 🧹 Close all matched windows
      for (const win of targets) {
        const closeButtonId = `${win.id}-close`;

        console.log('🔘 Looking for close button:', closeButtonId);

        // 🔥 FIX: Wait for close button to appear in DOM with retry
        let closeButton = null;
        let retries = 0;
        const maxRetries = 20; // 2 seconds max

        while (!closeButton && retries < maxRetries) {
          closeButton = findElement(closeButtonId);
          if (!closeButton) {
            console.log(`⏳ Retry ${retries + 1}/${maxRetries} - waiting for button...`);
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
          } else {
            console.log('✅ Close button found!', closeButton);
          }
        }

        if (closeButton) {
          await clickElement(closeButtonId);
          log(`Closed via button: ${win.id} (found after ${retries} retries)`, 'success');
        } else {
          console.error('❌ Close button not found after retries');
          log(`Close button not found after ${retries} retries, using state cleanup`, 'warn');
        }

        // Fallback / state cleanup
        setOpenWindows(prev => prev.filter(w => w.id !== win.id));
      }

      log(`Closed ${targets.length} window(s) for ${identifier}`, 'success');

      if (targets.length > 1) {
        // aiSpeak(`${targets.length} विंडो बंद हो गईं`); // 🔊 Multiple windows closed
      } else {
        // aiSpeak("विंडो बंद हो गई"); // 🔊 Window closed
      }

      return true;
    } catch (error) {
      log(`Error closing window(s): ${error}`, 'error');
      return false;
    }
  }, [findElement, clickElement, setOpenWindows, log]);
  // Window: Minimize


  // Window: Minimize (supports both windowId and appName)
  const minimizeWindow = useCallback(async (identifier: string): Promise<boolean> => {
    try {
      log(`Minimizing window: ${identifier}`, 'info');
      // aiSpeak(`${identifier} मिनिमाइज़ कर रहे हैं`);

      // 🔎 Find windows by id OR appName
      const targets = openWindowsRef.current.filter(
        w => w.id === identifier || w.appName.toLowerCase() === identifier.toLowerCase()
      );

      if (!targets.length) {
        log(`No window found for: ${identifier}`, 'warn');
        // aiSpeak("विंडो नहीं मिली");
        return false;
      }

      // Minimize all matched windows
      for (const win of targets) {
        const minimizeButtonId = `${win.id}-minimize`;
        await clickElement(minimizeButtonId);
        log(`Minimized: ${win.id}`, 'success');
      }

      if (targets.length > 1) {
        // aiSpeak(`${targets.length} विंडो मिनिमाइज़ हो गईं`);
      } else {
        // aiSpeak("मिनिमाइज़ हो गया");
      }

      return true;
    } catch (error) {
      log(`Error minimizing window: ${error}`, 'error');
      // aiSpeak("मिनिमाइज़ नहीं हो पाया");
      return false;
    }
  }, [clickElement, log]);

  // Window: Maximize (supports both windowId and appName)
  const maximizeWindow = useCallback(async (identifier: string): Promise<boolean> => {
    try {
      log(`Maximizing window: ${identifier}`, 'info');
      // aiSpeak(`${identifier} मैक्सिमाइज़ कर रहे हैं`);

      // 🔎 Find windows by id OR appName
      const targets = openWindowsRef.current.filter(
        w => w.id === identifier || w.appName.toLowerCase() === identifier.toLowerCase()
      );

      if (!targets.length) {
        log(`No window found for: ${identifier}`, 'warn');
        // aiSpeak("विंडो नहीं मिली");
        return false;
      }

      // Maximize all matched windows
      for (const win of targets) {
        const maximizeButtonId = `${win.id}-maximize`;
        await clickElement(maximizeButtonId);
        log(`Maximized: ${win.id}`, 'success');
      }

      if (targets.length > 1) {
        // aiSpeak(`${targets.length} विंडो मैक्सिमाइज़ हो गईं`);
      } else {
        // aiSpeak("मैक्सिमाइज़ हो गया");
      }

      return true;
    } catch (error) {
      log(`Error maximizing window: ${error}`, 'error');
      // aiSpeak("मैक्सिमाइज़ नहीं हो पाया");
      return false;
    }
  }, [clickElement, log]);

  // Window: Focus (supports both windowId and appName)
  const focusWindow = useCallback(async (identifier: string): Promise<boolean> => {
    try {
      log(`Focusing window: ${identifier}`, 'info');
      // aiSpeak(`${identifier} पर फोकस कर रहे हैं`);

      // 🔎 Find first matching window by id OR appName
      const target = openWindowsRef.current.find(
        w => w.id === identifier || w.appName.toLowerCase() === identifier.toLowerCase()
      );

      if (!target) {
        log(`No window found for: ${identifier}`, 'warn');
        // aiSpeak("विंडो नहीं मिली");
        return false;
      }

      // Focus by clicking the window
      const result = await clickElement(target.id);

      if (result) {
        log(`Focused window: ${target.id}`, 'success');
        // aiSpeak("फोकस हो गया");
      }

      return result;
    } catch (error) {
      log(`Error focusing window: ${error}`, 'error');
      // aiSpeak("फोकस नहीं हो पाया");
      return false;
    }
  }, [clickElement, log]);

  // Execute single command
  const executeCommand = useCallback(async (command: AutomationCommand): Promise<boolean> => {
    stateRef.current.currentCommand = command;

    try {
      // Apply delay if specified
      if (command.delay) {
        await new Promise(resolve => setTimeout(resolve, command.delay));
      }

      let result = false;

      switch (command.action) {
        case 'move':
          if (command.target) {
            result = await moveTo(command.target);
          }
          break;

        case 'click':
          if (command.target) {
            result = await clickElement(command.target);
          }
          break;

        case 'open':
          if (command.target) {
            const { x, y } = command.params || {};
            result = await openWindow(command.target, x, y);
          }
          break;

        case 'close':
          if (command.target) {
            result = await closeWindow(command.target);
          }
          break;

        case 'minimize':
          if (command.target) {
            result = await minimizeWindow(command.target);
          }
          break;

        case 'maximize':
          if (command.target) {
            result = await maximizeWindow(command.target);
          }
          break;

        case 'focus':
          if (command.target) {
            result = await focusWindow(command.target);
          }
          break;
        case 'type':
          if (command.target && command.params?.text) {
            result = await typeIntoElement(
              command.target,
              command.params.text,
              command.params.options
            );
          }
          break;
        case 'setValue': {
          if (!command.target || command.params?.value == null) return false

          const el = document.getElementById(command.target) as HTMLInputElement | null
          if (!el) return false

          el.value = String(command.params.value)

          // ✅ React controlled input ke liye
          if (el.type === 'range' || el.type === 'color') {
            const event = new Event('input', { bubbles: true })
            el.dispatchEvent(event)
          }

          return true
        }



        default:
          log(`Unknown action: ${command.action}`, 'error');
          return false;
      }

      return result;
    } finally {
      stateRef.current.currentCommand = null;
    }
  }, [moveTo, clickElement, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, log]);

  // Execute sequence of commands
  const executeSequence = useCallback(async (commands: AutomationCommand[]): Promise<void> => {
    stateRef.current.isRunning = true;
    stateRef.current.queue = [...commands];

    log(`Executing sequence of ${commands.length} commands`, 'info');

    try {
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        log(`Step ${i + 1}/${commands.length}: ${command.action} ${command.target || ''}`, 'info');

        await executeCommand(command);

        // Remove from queue
        stateRef.current.queue.shift();
      }

      log('Sequence completed', 'success');
    } catch (error) {
      log(`Sequence error: ${error}`, 'error');
    } finally {
      stateRef.current.isRunning = false;
      stateRef.current.queue = [];
    }
  }, [executeCommand, log]);

  // Clear command queue
  const clearQueue = useCallback(() => {
    stateRef.current.queue = [];
    stateRef.current.isRunning = false;
    log('Queue cleared', 'info');
  }, [log]);

  // Parse text command into AutomationCommand
  const parseTextCommand = useCallback((text: string): AutomationCommand | null => {
    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();

    // App name mapping - maps lowercase input to exact app names
    const appNameMap: Record<string, string> = {
      'terminal': 'Terminal',
      'settings': 'Settings',
      'safari': 'Safari',
      'vscode': 'vscode',
      'chrome': 'chrome',
      'browser': 'chrome',
      'spotify': 'Spotify',
      'calendar': 'Calendar',
      'maps': 'Maps',
      'youtube': 'Youtube',
      'excel': 'Excel Editor',
      'mail': 'Mail',
      'pdf': 'PDF Viewer',
      'finder': 'Finder',
      'photos': 'Photos',
      'tv': 'TV',
      'game': 'game',
      'science': 'Science Book',
      'book': 'Science Book',
      'app store': 'App Store',
      'launchpad': 'App Store'
    };

    // Pattern: "open <app>"
    if (lower.startsWith('open ')) {
      const appInput = lower.substring(5).trim();
      const appName = appNameMap[appInput] || trimmed.substring(5).trim();
      return { action: 'open', target: appName };
    }

    // Pattern: "close <windowId>"
    if (lower.startsWith('close ')) {
      const windowId = trimmed.substring(6).trim();
      return { action: 'close', target: windowId };
    }

    // Pattern: "minimize <windowId>"
    if (lower.startsWith('minimize ')) {
      const windowId = trimmed.substring(9).trim();
      return { action: 'minimize', target: windowId };
    }

    // Pattern: "maximize <windowId>"
    if (lower.startsWith('maximize ')) {
      const windowId = trimmed.substring(9).trim();
      return { action: 'maximize', target: windowId };
    }

    // Pattern: "focus <windowId>"
    if (lower.startsWith('focus ')) {
      const windowId = trimmed.substring(6).trim();
      return { action: 'focus', target: windowId };
    }

    // Pattern: "click <elementId>"
    if (lower.startsWith('click ')) {
      const elementId = trimmed.substring(6).trim();
      return { action: 'click', target: elementId };
    }

    // Pattern: "move to <elementId>"
    if (lower.startsWith('move to ')) {
      const elementId = trimmed.substring(8).trim();
      return { action: 'move', target: elementId };
    }

    // Pattern: "type into <elementId> <text>" or "type into <elementId> "<text with spaces>""
    if (lower.startsWith('type into')) {
      const rest = trimmed.substring(10).trim();

      // Simple split — first word = id, rest = text (improve with regex if needed)
      const spaceIndex = rest.indexOf(' ');
      if (spaceIndex === -1) return null;

      const elementId = rest.substring(0, spaceIndex).trim();
      let text = rest.substring(spaceIndex + 1).trim();

      // Handle quoted text (optional improvement)
      if (text.startsWith('"') && text.endsWith('"')) {
        text = text.slice(1, -1);
      }

      return {
        action: 'type',
        target: elementId,
        params: { text, options: { delay: 70, humanLike: true } }
      };
    }

    log(`Unable to parse command: ${text}`, 'error');
    return null;
  }, [log]);

  // Execute text command
  const executeTextCommand = useCallback(async (text: string): Promise<boolean> => {
    const command = parseTextCommand(text);
    if (!command) return false;

    return await executeCommand(command);
  }, [parseTextCommand, executeCommand]);

  // Get current state
  const getState = useCallback((): AutomationState => {
    return { ...stateRef.current };
  }, []);

  // Get cursor position
  const getCursorPosition = useCallback((): CursorPosition => {
    return { ...stateRef.current.cursorPosition };
  }, []);

  // Get all window IDs
  const getAllWindows = useCallback((): string[] => {
    return openWindows.map(w => w.id);
  }, [openWindows]);

  return {
    moveTo,
    clickElement,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    executeCommand,
    executeSequence,
    clearQueue,
    parseTextCommand,
    executeTextCommand,
    getState,
    getCursorPosition,
    getAllWindows
  };
}