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
  action: 'move' | 'click' | 'open' | 'close' | 'type' | 'minimize' | 'maximize' | 'focus' | 'setValue' | 'wait' | 'speak';
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
  executeSequence: (commands: AutomationCommand[]) => Promise<boolean>;
  clearQueue: () => void;

  // Text command parser
  parseTextCommand: (text: string) => AutomationCommand | null;
  executeTextCommand: (text: string) => Promise<boolean>;

  // Browser automation
  searchWeb: (query: string) => Promise<boolean>;
  openBrowserResearch: (query: string) => Promise<boolean>;
  closeBrowser: () => Promise<boolean>;
  
  // GLM Browser integration
  glmNavigate: (url: string) => Promise<boolean>;
  glmAutomate: (sequence: any[]) => Promise<boolean>;

  // State getters
  getState: () => AutomationState;
  getCursorPosition: () => CursorPosition;
  getAllWindows: () => string[];
}

export function useCursorAutomation(
  openApplication: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void,
  openWindows?: any[],
  setOpenWindows?: React.Dispatch<React.SetStateAction<any[]>>,
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

    // Dispatch automation click event for visual cursor
    window.dispatchEvent(new CustomEvent('cursor-automation-click', {
      detail: { x: position.x, y: position.y, type: 'click' }
    }));
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
    if (document.activeElement !== input) {
      console.log('[simulateTypingChar] Warning: Input not focused, focusing...');
      input.focus();
    }

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

    console.log(`[simulateTypingChar] After inserting "${char}", value: "${input.value}"`);

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

    console.log(`[simulateTypingChar] After typing "${char}", activeElement: ${document.activeElement?.id || document.activeElement?.tagName}`);
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
      log(`Options: delay=${options.delay}, humanLike=${options.humanLike}`, 'info');

      const element = findElement(elementId);
      if (!element) {
        log(`Element not found: ${elementId}`, 'error');
        return false;
      }

      if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
        log(`Element ${elementId} is not an input or textarea (tag: ${element.tagName})`, 'error');
        return false;
      }

      const input = element as HTMLInputElement;

      // 1️⃣ Make sure element is visible & focused
      await scrollIntoView(input);
      input.focus();
      log(`Element focused: ${elementId}, current value: "${input.value}"`, 'info');

      // 2️⃣ Clear existing value using React-safe method
      const currentValue = input.value;
      if (currentValue) {
        log(`Input has existing value "${currentValue}", clearing...`, 'info');
        // Use native setter to clear
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, '');
          // Trigger React events
          const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            composed: true,
            inputType: 'deleteContent',
          });
          input.dispatchEvent(inputEvent);
          dispatchEvent(input, 'change');
          log(`Cleared using native setter`, 'info');
        }
        // Wait for React to process the clear
        await new Promise(r => setTimeout(r, 200));
      }

      if (options.humanLike) {
        log(`Human-like wait: 150ms`, 'info');
        await new Promise(r => setTimeout(r, 150));
      }

      // 3️⃣ TYPE EACH CHARACTER (human-like)
      log(`Starting to type ${text.length} characters...`, 'info');
      let charIndex = 0;
      for (const char of text) {
        charIndex++;
        log(`Typing character ${charIndex}/${text.length}: "${char}"`, 'info');
        
        // DON'T refocus during typing - it can cause React state resets
        // Trust that the input stays focused
        
        await simulateTypingChar(input, char, options.delay ?? 80);
        log(`After char ${charIndex}, value: "${input.value}"`, 'info');
      }

      // 4️⃣ FINAL EVENTS (very important for React) - DON'T BLUR YET
      dispatchEvent(input, 'input');
      dispatchEvent(input, 'change');
      // DON'T dispatch blur - it causes focus issues
      // dispatchEvent(input, 'blur');

      // 5️⃣ WAIT FOR REACT TO UPDATE
      await new Promise(r => setTimeout(r, 500));

      log(`Successfully typed "${text}" into #${elementId}, final value: "${input.value}"`, 'success');
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

  // Browser: Search web using GLM browser tool (NO third-party APIs)
  const searchWeb = useCallback(async (query: string): Promise<boolean> => {
    try {
      log(`🌐 GLM Browser Search: ${query}`, 'info');
      speak?.(`Searching ${query}`);

      // GLM Browser API - Direct Google navigation
      try {
        const response = await fetch('/api/glm-browser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'search',
            query: query
          })
        });

        const data = await response.json();
        
        if (data.success) {
          log(`✅ GLM Browser: Google search ready`, 'success');
        }
      } catch (apiError) {
        log(`GLM API call failed, using direct navigation: ${apiError}`, 'warn');
      }

      // Open Chrome with Google search URL (all sources, proper search)
      openApplication('chrome', undefined, undefined, undefined, { searchQuery: query });

      log(`✅ Chrome opened for: ${query}`, 'success');
      return true;
    } catch (error) {
      log(`Error searching: ${error}`, 'error');
      openApplication('chrome', undefined, undefined, undefined, { searchQuery: query });
      return false;
    }
  }, [log, speak, openApplication]);

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

          const el = document.getElementById(command.target) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
          if (!el) return false

          const newValue = String(command.params.value)

          // ✅ Use React's native setter for text inputs
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set || Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype,
              'value'
            )?.set;

            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(el, newValue);
            } else {
              el.value = newValue;
            }

            // Dispatch proper React InputEvent
            const inputEvent = new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              composed: true,
              inputType: 'insertText',
              data: newValue,
            });
            el.dispatchEvent(inputEvent);
            
            // Also dispatch change event
            const changeEvent = new Event('change', { bubbles: true });
            el.dispatchEvent(changeEvent);
            
            log(`setValue: Set ${command.target} to "${newValue}", current value: "${el.value}"`, 'success');
          } 
          // ✅ Handle range/color inputs
          else if (el.tagName === 'INPUT' && (el.type === 'range' || el.type === 'color')) {
            el.value = newValue;
            const event = new Event('input', { bubbles: true });
            el.dispatchEvent(event);
          }
          // ✅ Handle select elements
          else if (el.tagName === 'SELECT') {
            el.value = newValue;
            const event = new Event('change', { bubbles: true });
            el.dispatchEvent(event);
          }

          return true
        }

        case 'search':
          if (command.params?.query) {
            // Dynamically import to avoid circular dependency
            result = await searchWeb(command.params.query);
          }
          break;

        case 'wait':
          // Wait for element to appear or condition to be met
          if (command.params?.timeout || command.delay) {
            const timeout = command.params?.timeout || command.delay || 2000;
            const checkInterval = command.params?.checkInterval || 200;
            const condition = command.params?.condition;
            
            log(`Waiting ${timeout}ms for ${command.target || 'completion'} (condition: ${condition || 'none'})`, 'info');
            
            const startTime = Date.now();
            let conditionMet = false;
            
            // Wait for element existence
            if (condition === 'exists' && command.target) {
              log(`Waiting for element #${command.target} to exist...`, 'info');
              
              while (!conditionMet && Date.now() - startTime < timeout) {
                const element = document.getElementById(command.target);
                
                if (element) {
                  conditionMet = true;
                  log(`Element #${command.target} found!`, 'success');
                } else {
                  await new Promise(resolve => setTimeout(resolve, checkInterval));
                }
              }
              
              if (!conditionMet) {
                log(`Timeout waiting for element #${command.target}, proceeding anyway...`, 'warn');
              }
              
              result = true;
            }
            // Wait for images to load
            else if (condition === 'imagesLoaded' && command.target) {
              log(`Waiting for images in ${command.target}...`, 'info');
              
              while (!conditionMet && Date.now() - startTime < timeout) {
                const container = document.getElementById(command.target) || 
                                 document.querySelector(`[data-automation-id="${command.target}"]`);
                
                if (container) {
                  const images = container.querySelectorAll('img');
                  
                  if (images.length > 0) {
                    log(`Found ${images.length} images, checking if loaded...`, 'info');
                    
                    const firstImage = images[0] as any;
                    if (firstImage.complete && firstImage.naturalHeight !== 0) {
                      conditionMet = true;
                      log('First image loaded successfully!', 'success');
                    } else {
                      log(`Image exists but not loaded yet (complete: ${firstImage.complete}, naturalHeight: ${firstImage.naturalHeight})`, 'info');
                    }
                  } else {
                    log('No images found yet, waiting...', 'info');
                  }
                } else {
                  log(`Container ${command.target} not found yet`, 'info');
                }
                
                if (!conditionMet) {
                  await new Promise(resolve => setTimeout(resolve, checkInterval));
                }
              }
              
              if (!conditionMet) {
                log('Timeout waiting for images, proceeding anyway...', 'warn');
              }
              
              result = true;
            }
            // Wait for input field to be filled
            else if (condition === 'inputFilled' && command.target) {
              log(`Waiting for input #${command.target} to be filled...`, 'info');
              
              while (!conditionMet && Date.now() - startTime < timeout) {
                const element = document.getElementById(command.target) || 
                                document.querySelector(`[data-automation-id="${command.target}"]`) as HTMLInputElement | HTMLTextAreaElement;
                
                if (element) {
                  const value = (element as HTMLInputElement | HTMLTextAreaElement).value;
                  
                  if (value && value.trim().length > 0) {
                    conditionMet = true;
                    log(`Input #${command.target} is filled with: "${value}"`, 'success');
                  } else {
                    log(`Input #${command.target} exists but empty, waiting...`, 'info');
                  }
                } else {
                  log(`Input #${command.target} not found yet`, 'info');
                }
                
                if (!conditionMet) {
                  await new Promise(resolve => setTimeout(resolve, checkInterval));
                }
              }
              
              if (!conditionMet) {
                log(`Timeout waiting for input #${command.target} to be filled`, 'warn');
              }
              
              result = true;
            }
            // Wait for element to have text content
            else if (condition === 'notEmpty' && command.target) {
              log(`Waiting for element #${command.target} to have content...`, 'info');
              
              while (!conditionMet && Date.now() - startTime < timeout) {
                const element = document.getElementById(command.target) || 
                                document.querySelector(`[data-automation-id="${command.target}"]`) as HTMLInputElement | HTMLTextAreaElement;
                
                if (element) {
                  const value = (element as HTMLInputElement | HTMLTextAreaElement).value || element.textContent;
                  
                  if (value && value.trim().length > 0) {
                    conditionMet = true;
                    log(`Element #${command.target} has content: "${value.substring(0, 50)}..."`, 'success');
                  } else {
                    log(`Element #${command.target} exists but empty, waiting...`, 'info');
                  }
                } else {
                  log(`Element #${command.target} not found yet`, 'info');
                }
                
                if (!conditionMet) {
                  await new Promise(resolve => setTimeout(resolve, checkInterval));
                }
              }
              
              if (!conditionMet) {
                log(`Timeout waiting for element #${command.target} to have content`, 'warn');
              }
              
              result = true;
            }
            // Wait for page to contain text
            else if (condition?.startsWith('textContains:') && !command.target) {
              const searchText = condition.replace('textContains:', '');
              log(`Waiting for page to contain text: "${searchText}"...`, 'info');
              
              while (!conditionMet && Date.now() - startTime < timeout) {
                const bodyText = document.body.innerText || document.body.textContent || '';
                
                if (bodyText.includes(searchText)) {
                  conditionMet = true;
                  log(`Found text "${searchText}" in page`, 'success');
                } else {
                  await new Promise(resolve => setTimeout(resolve, checkInterval));
                }
              }
              
              if (!conditionMet) {
                log(`Timeout waiting for text "${searchText}"`, 'warn');
              }
              
              result = true;
            }
            // Simple timeout wait
            else {
              await new Promise(resolve => setTimeout(resolve, timeout));
              result = true;
            }
          } else {
            result = true;
          }
          break;

        case 'speak':
          // Text-to-speech with polite voice
          if (command.params?.text) {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(command.params.text);
              
              // Set voice options for lovely polite voice
              if (command.params?.options?.rate) utterance.rate = command.params.options.rate;
              if (command.params?.options?.pitch) utterance.pitch = command.params.options.pitch;
              
              // Try to use a friendly voice
              const voices = window.speechSynthesis.getVoices();
              const preferredVoice = voices.find(v => 
                v.name.includes('Samantha') || 
                v.name.includes('Google UK English Female') ||
                (v.lang.startsWith('en') && v.name.includes('Female'))
              );
              if (preferredVoice) utterance.voice = preferredVoice;
              
              window.speechSynthesis.speak(utterance);
              log(`🔊 Speaking: "${command.params.text}"`, 'info');
            }
            result = true;
          }
          break;

        default:
          log(`Unknown action: ${command.action}`, 'error');
          return false;
      }

      return result;
    } finally {
      stateRef.current.currentCommand = null;
    }
  }, [moveTo, clickElement, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, searchWeb, log]);

  // Execute sequence of commands
  const executeSequence = useCallback(async (commands: AutomationCommand[]): Promise<boolean> => {
    stateRef.current.isRunning = true;
    stateRef.current.queue = [...commands];

    log(`Executing sequence of ${commands.length} commands`, 'info');

    try {
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        log(`Step ${i + 1}/${commands.length}: ${command.action} ${command.target || ''}`, 'info');

        const success = await executeCommand(command);
        
        if (!success) {
          log(`Sequence failed at step ${i + 1}: ${command.action} ${command.target || ''}`, 'error');
          return false;
        }

        // Remove from queue
        stateRef.current.queue.shift();
      }

      log('Sequence completed successfully', 'success');
      return true;
    } catch (error) {
      log(`Sequence error: ${error}`, 'error');
      return false;
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
      'terminal app': 'Terminal',
      'settings': 'Settings',
      'settings app': 'Settings',
      'safari': 'Safari',
      'safari app': 'Safari',
      'vscode': 'vscode',
      'vscode app': 'vscode',
      'chrome': 'chrome',
      'chrome app': 'chrome',
      'browser': 'chrome',
      'browser app': 'chrome',
      'music': 'Music',
      'music app': 'Music',
      'phone': 'Phone',
      'phone app': 'Phone',
      'spotify': 'Spotify',
      'spotify app': 'Spotify',
      'calendar': 'Calendar',
      'calendar app': 'Calendar',
      'maps': 'Maps',
      'maps app': 'Maps',
      'youtube': 'Youtube',
      'youtube app': 'Youtube',
      'excel': 'Excel Editor',
      'excel app': 'Excel Editor',
      'excel editor': 'Excel Editor',
      'excel editor app': 'Excel Editor',
      'mail': 'Mail',
      'mail app': 'Mail',
      'pdf': 'PDF Viewer',
      'pdf app': 'PDF Viewer',
      'pdf viewer': 'PDF Viewer',
      'pdf viewer app': 'PDF Viewer',
      'finder': 'Finder',
      'finder app': 'Finder',
      'photos': 'Photos',
      'photos app': 'Photos',
      'tv': 'TV',
      'tv app': 'TV',
      'game': 'game',
      'game app': 'game',
      'science': 'Science Book',
      'science app': 'Science Book',
      'science book': 'Science Book',
      'science book app': 'Science Book',
      'book': 'Science Book',
      'book app': 'Science Book',
      'ai book': 'AI Book',
      'ai book app': 'AI Book',
      'app store': 'App Store',
      'appstore': 'App Store',
      'appstore app': 'App Store',
      'app store app': 'App Store',
      'launchpad': 'App Store',
      'launchpad app': 'App Store',
      'about': 'About Me',
      'about app': 'About Me',
      'about me': 'About Me',
      'about me app': 'About Me',
      'projects': 'Projects',
      'projects app': 'Projects',
      'resume': 'Resume',
      'resume app': 'Resume',
      'resume pdf': 'Resume PDF',
      'resume pdf app': 'Resume PDF',
      'notes': 'Notes',
      'notes app': 'Notes',
      'figma': 'figma',
      'figma app': 'figma',
      'ats': 'ATS',
      'ats app': 'ATS',
      'ats resume': 'ATS',
      'ats resume app': 'ATS',
      'data table': 'Data Table',
      'data table app': 'Data Table',
      'table': 'Data Table',
      'table app': 'Data Table',
      'table studio': 'Data Table',
      'table studio app': 'Data Table',
      'interview': 'Interview',
      'interview app': 'Interview',
      'smarty interview': 'Interview',
      'smarty interview app': 'Interview',
      'teacher': 'Smarty Teacher',
      'teacher app': 'Smarty Teacher',
      'smarty teacher': 'Smarty Teacher',
      'smarty teacher app': 'Smarty Teacher',
      'portfolio': 'website',
      'portfolio app': 'website',
      'website': 'website',
      'website app': 'website',
      'trash': "Don't Look",
      'trash app': "Don't Look",
      "don't look": "Don't Look",
      "don't look app": "Don't Look",
      'dump': "Don't Look",
      'dump app': "Don't Look"
    };

    // Pattern: "open <app>"
    if (lower.startsWith('open ')) {
      let appInput = lower.substring(5).trim();
      
      // Try exact match first
      let appName = appNameMap[appInput];
      
      // If not found, remove "app" suffix and try again
      if (!appName && appInput.endsWith(' app')) {
        const withoutApp = appInput.substring(0, appInput.length - 4).trim();
        appName = appNameMap[withoutApp];
      }
      
      // If still not found, use the original input (stripped of "app" if present)
      if (!appName) {
        appName = trimmed.substring(5).trim();
      }
      
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

    // Pattern: "search <query>" or "research <query>"
    if (lower.startsWith('search ') || lower.startsWith('research ')) {
      const query = lower.startsWith('search ')
        ? trimmed.substring(7).trim()
        : trimmed.substring(9).trim();
      return {
        action: 'search',
        params: { query }
      };
    }

    // Pattern: "google <query>" or "look up <query>"
    if (lower.startsWith('google ') || lower.startsWith('look up ')) {
      const query = lower.startsWith('google ')
        ? trimmed.substring(7).trim()
        : trimmed.substring(8).trim();
      return {
        action: 'search',
        params: { query }
      };
    }

    log(`Unable to parse command: ${text}`, 'error');
    return null;
  }, [log]);

  // Execute text command
  // Execute text command using UNIFIED architecture
  const executeTextCommand = useCallback(async (text: string): Promise<boolean> => {
    try {
      log(`🎯 Processing command: "${text}"`, 'info');
      
      // 🔥 LAZY LOAD: Import unified resolver to avoid circular dependency
      const { resolveUserIntent } = await import('@/lib/resolveUserIntent');
      const { executeIntent } = await import('@/lib/executeIntent');
      
      // 🎯 Step 1: Resolve user intent (AI + pattern matching)
      const resolvedIntent = await resolveUserIntent(text, { source: 'terminal' });
      
      log(`✅ Intent: ${resolvedIntent.intent}`, 'info');
      log(`   Confidence: ${resolvedIntent.confidence}`, 'info');
      
      // 🚀 Step 2: Execute intent → automation sequence
      const sequence = executeIntent(resolvedIntent);
      
      log(`⚡ Executing ${sequence.length} steps...`, 'info');
      
      // 🔧 Step 3: Run sequence
      const success = await executeSequence(sequence);
      
      if (success) {
        log(`✅ Command executed successfully`, 'success');
      } else {
        log(`❌ Command execution failed`, 'error');
      }
      
      return success;
      
    } catch (error: any) {
      log(`❌ Failed to execute command: ${error.message}`, 'error');
      
      // FALLBACK: Try legacy parseTextCommand for backward compatibility
      try {
        log('⚠️ Trying legacy parser...', 'warn');
        const command = parseTextCommand(text);
        if (command) {
          return await executeCommand(command);
        }
      } catch (fallbackError) {
        log(`❌ Legacy fallback also failed`, 'error');
      }
      
      return false;
    }
  }, [executeSequence, executeCommand, parseTextCommand, log]);

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

  // Browser: Open browser for research (same as searchWeb)
  const openBrowserResearch = useCallback(async (query: string): Promise<boolean> => {
    return searchWeb(query);
  }, [searchWeb]);

  // Browser: Close Chrome
  const closeBrowser = useCallback(async (): Promise<boolean> => {
    try {
      log(`Closing browser`, 'info');
      
      // Find Chrome window
      const chromeWindow = openWindows.find(w => w.appName.toLowerCase() === 'chrome');
      
      if (chromeWindow) {
        await closeWindow(chromeWindow.id);
        speak?.('Browser closed');
        return true;
      } else {
        log('No Chrome window found', 'warn');
        return false;
      }
    } catch (error) {
      log(`Error closing browser: ${error}`, 'error');
      return false;
    }
  }, [log, openWindows, closeWindow, speak]);

  // GLM Browser: Navigate to URL with automation
  const glmNavigate = useCallback(async (url: string): Promise<boolean> => {
    try {
      log(`🚀 GLM Navigate: ${url}`, 'info');
      
      // Call GLM Browser API
      const response = await fetch('/api/glm-browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'navigate',
          url: url
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Open Chrome with direct URL
        openApplication('chrome', undefined, undefined, undefined, { directUrl: data.url });
        log(`✅ GLM Navigation successful: ${data.url}`, 'success');
        speak?.(`Navigating to ${url}`);
        return true;
      } else {
        throw new Error(data.error || 'Navigation failed');
      }
    } catch (error) {
      log(`GLM Navigate error: ${error}`, 'error');
      // Fallback: open browser directly
      openApplication('chrome', undefined, undefined, undefined, { directUrl: url });
      return false;
    }
  }, [log, speak, openApplication]);

  // GLM Browser: Execute automation sequence
  const glmAutomate = useCallback(async (sequence: any[]): Promise<boolean> => {
    try {
      log(`🤖 GLM Automate: ${sequence.length} steps`, 'info');
      
      // Call GLM Browser API for automation
      const response = await fetch('/api/glm-browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'automate',
          sequence: sequence
        })
      });

      const data = await response.json();
      
      if (data.success) {
        log(`✅ GLM Automation completed: ${data.message}`, 'success');
        
        // Navigate to the final URL if provided
        if (sequence.length > 0 && sequence[0].type === 'navigate' && sequence[0].value) {
          const url = sequence[0].value;
          openApplication('chrome', undefined, undefined, undefined, { directUrl: url.startsWith('http') ? url : `https://${url}` });
        }
        
        return true;
      } else {
        throw new Error(data.error || 'Automation failed');
      }
    } catch (error) {
      log(`GLM Automate error: ${error}`, 'error');
      return false;
    }
  }, [log, openApplication]);

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
    searchWeb,
    openBrowserResearch,
    closeBrowser,
    glmNavigate,
    glmAutomate,
    getState,
    getCursorPosition,
    getAllWindows
  };
}