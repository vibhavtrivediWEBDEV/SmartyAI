/**
 * Puppeteer Web Capture Service
 * 
 * Server-side webpage rendering and region capture
 * Used for creating live web region widgets
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Browser singleton for reuse
let browserInstance: Browser | null = null;

/**
 * Get or create Puppeteer browser instance
 */
async function getBrowser(): Promise<Browser> {
  try {
    // Try to get existing browser pages to check if connected
    if (browserInstance) {
      const pages = await browserInstance.pages().catch(() => []);
      if (pages.length >= 0) {
        return browserInstance;
      }
    }
  } catch (error) {
    // Browser is disconnected, create new one
    browserInstance = null;
  }
  
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });
    
    // Handle browser disconnection
    browserInstance.on('disconnected', () => {
      browserInstance = null;
    });
  }
  
  return browserInstance;
}

/**
 * Capture configuration
 */
export interface CaptureConfig {
  url: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  viewport: {
    width: number;
    height: number;
    scrollX?: number;
    scrollY?: number;
    deviceScaleFactor?: number;
  };
}

/**
 * Security: Validate URL to prevent SSRF attacks
 */
function isValidUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
    }
    
    // Block dangerous protocols
    if (parsed.protocol === 'file:' || parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
      return { valid: false, error: 'Blocked protocol' };
    }
    
    const hostname = parsed.hostname.toLowerCase();
    
    // Block localhost and internal addresses
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '0:0:0:0:0:0:0:1',
    ];
    
    if (blockedHosts.includes(hostname)) {
      return { valid: false, error: 'Local addresses are not allowed' };
    }
    
    // Block private IP ranges
    const privateIpPatterns = [
      /^10\./,                           // 10.0.0.0 - 10.255.255.255
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0 - 172.31.255.255
      /^192\.168\./,                     // 192.168.0.0 - 192.168.255.255
      /^169\.254\./,                     // Link-local
      /^fc00:/i,                         // IPv6 private
      /^fe80:/i,                         // IPv6 link-local
    ];
    
    if (privateIpPatterns.some(pattern => pattern.test(hostname))) {
      return { valid: false, error: 'Private IP addresses are not allowed' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Capture a specific region of a webpage
 */
export async function captureWebRegion(config: CaptureConfig): Promise<{
  success: boolean;
  image?: string; // Base64 PNG
  error?: string;
  capturedAt?: string;
}> {
  const browser = await getBrowser();
  let page: Page | null = null;
  
  try {
    // Validate URL
    const urlValidation = isValidUrl(config.url);
    if (!urlValidation.valid) {
      return { success: false, error: urlValidation.error };
    }
    
    // Validate dimensions
    if (config.rect.width <= 0 || config.rect.height <= 0) {
      return { success: false, error: 'Invalid capture dimensions' };
    }
    
    if (config.viewport.width <= 0 || config.viewport.height <= 0) {
      return { success: false, error: 'Invalid viewport dimensions' };
    }
    
    // Maximum screenshot size (prevent memory exhaustion)
    const MAX_AREA = 1920 * 1080 * 2; // ~4MP
    const area = config.rect.width * config.rect.height;
    if (area > MAX_AREA) {
      return { success: false, error: 'Capture area too large' };
    }
    
    // Create new page
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: config.viewport.width,
      height: config.viewport.height,
      deviceScaleFactor: config.viewport.deviceScaleFactor || 1,
    });
    
    // Navigate to URL
    await page.goto(config.url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    
    // Restore scroll position
    if (config.viewport.scrollX || config.viewport.scrollY) {
      await page.evaluate((x, y) => {
        window.scrollTo(x, y);
      }, config.viewport.scrollX || 0, config.viewport.scrollY || 0);
      
      // Wait for scroll to complete
      await page.waitForTimeout(500);
    }
    
    // Capture the specific region
    const screenshot = await page.screenshot({
      type: 'png',
      clip: {
        x: config.rect.x,
        y: config.rect.y,
        width: config.rect.width,
        height: config.rect.height,
      },
      encoding: 'base64',
    });
    
    const imageBase64 = `data:image/png;base64,${screenshot}`;
    
    return {
      success: true,
      image: imageBase64,
      capturedAt: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('Web capture error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Capture failed',
    };
  } finally {
    // Close page to free resources
    if (page) {
      await page.close();
    }
  }
}

/**
 * Cleanup browser instance (call on server shutdown)
 */
export async function cleanupBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
