/**
 * Coordinate Transformation Utilities
 * 
 * Converts coordinates between different reference frames:
 * - Screen coordinates (browser window position)
 * - Iframe container coordinates (visible viewport)
 * - Page coordinates (actual webpage content with scroll)
 * - Widget coordinates (desktop widget position)
 */

/**
 * Transform screen coordinates to iframe-relative coordinates
 * 
 * @param screenX - X position relative to browser window
 * @param screenY - Y position relative to browser window
 * @param iframeRect - Bounding rect of iframe element
 * @returns Coordinates relative to iframe content area
 */
export function screenToIframeCoordinates(
  screenX: number,
  screenY: number,
  iframeRect: DOMRect
): { x: number; y: number } {
  return {
    x: screenX - iframeRect.left,
    y: screenY - iframeRect.top,
  };
}

/**
 * Transform iframe-relative coordinates to page coordinates
 * (Accounting for page scroll position)
 * 
 * @param iframeX - X position relative to iframe viewport
 * @param iframeY - Y position relative to iframe viewport
 * @param scrollX - Current horizontal scroll position
 * @param scrollY - Current vertical scroll position
 * @returns Coordinates relative to entire page content
 */
export function iframeToPageCoordinates(
  iframeX: number,
  iframeY: number,
  scrollX: number = 0,
  scrollY: number = 0
): { x: number; y: number } {
  return {
    x: iframeX + scrollX,
    y: iframeY + scrollY,
  };
}

/**
 * Transform page coordinates to iframe-relative coordinates
 * 
 * @param pageX - X position relative to entire page
 * @param pageY - Y position relative to entire page
 * @param scrollX - Current horizontal scroll position
 * @param scrollY - Current vertical scroll position
 * @returns Coordinates relative to visible iframe viewport
 */
export function pageToIframeCoordinates(
  pageX: number,
  pageY: number,
  scrollX: number = 0,
  scrollY: number = 0
): { x: number; y: number } {
  return {
    x: pageX - scrollX,
    y: pageY - scrollY,
  };
}

/**
 * Calculate capture coordinates for Puppeteer from selection rectangle
 * 
 * @param selectionRect - Selection rectangle in iframe viewport coordinates
 * @param scrollPosition - Current scroll position of iframe
 * @param viewportSize - Iframe viewport dimensions
 * @returns Capture coordinates for Puppeteer screenshot
 */
export function calculateCaptureCoordinates(
  selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  scrollPosition: { x: number; y: number } = { x: 0, y: 0 },
  viewportSize: { width: number; height: number }
): {
  rect: { x: number; y: number; width: number; height: number };
  viewport: { width: number; height: number; scrollX: number; scrollY: number };
} {
  // Convert selection coordinates from iframe-relative to page-relative
  const pageX = selectionRect.x + scrollPosition.x;
  const pageY = selectionRect.y + scrollPosition.y;
  
  return {
    rect: {
      x: pageX,
      y: pageY,
      width: selectionRect.width,
      height: selectionRect.height,
    },
    viewport: {
      width: viewportSize.width,
      height: viewportSize.height,
      scrollX: scrollPosition.x,
      scrollY: scrollPosition.y,
    },
  };
}

/**
 * Calculate widget viewport position from capture coordinates
 * (For future live widget implementation)
 * 
 * @param capture - Capture metadata from widget
 * @param widgetWidth - Current widget width (resizable)
 * @param widgetHeight - Current widget height (resizable)
 * @returns CSS transform for iframe positioning
 */
export function captureToWidgetTransform(
  capture: {
    rect: { x: number; y: number; width: number; height: number };
    viewport: { width: number; height: number };
  },
  widgetWidth: number,
  widgetHeight: number
): {
  transform: string;
  iframeWidth: number;
  iframeHeight: number;
} {
  // Calculate scale factor if widget is resized
  const scaleX = widgetWidth / capture.rect.width;
  const scaleY = widgetHeight / capture.rect.height;
  const scale = Math.min(scaleX, scaleY);
  
  // Position iframe so capture region is visible
  const translateX = -capture.rect.x * scale;
  const translateY = -capture.rect.y * scale;
  
  return {
    transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
    iframeWidth: capture.viewport.width,
    iframeHeight: capture.viewport.height,
  };
}

/**
 * Get scroll position from iframe content window
 * (Works only for same-origin iframes)
 * 
 * @param iframeWindow - Iframe's contentWindow
 * @returns Scroll position or zero if cross-origin
 */
export function getIframeScrollPosition(
  iframeWindow: Window | null
): { x: number; y: number } {
  if (!iframeWindow) {
    return { x: 0, y: 0 };
  }
  
  try {
    return {
      x: iframeWindow.scrollX || iframeWindow.pageXOffset || 0,
      y: iframeWindow.scrollY || iframeWindow.pageYOffset || 0,
    };
  } catch (error) {
    // Cross-origin iframe - cannot access scroll position
    console.warn('Cannot access iframe scroll position (cross-origin)');
    return { x: 0, y: 0 };
  }
}

/**
 * Get viewport dimensions from iframe content window
 * (Works only for same-origin iframes)
 * 
 * @param iframeWindow - Iframe's contentWindow
 * @returns Viewport dimensions or defaults if cross-origin
 */
export function getIframeViewportSize(
  iframeWindow: Window | null
): { width: number; height: number } {
  if (!iframeWindow) {
    return { width: 1280, height: 720 };
  }
  
  try {
    return {
      width: iframeWindow.innerWidth || 1280,
      height: iframeWindow.innerHeight || 720,
    };
  } catch (error) {
    // Cross-origin iframe - cannot access dimensions
    console.warn('Cannot access iframe viewport size (cross-origin)');
    return { width: 1280, height: 720 };
  }
}
