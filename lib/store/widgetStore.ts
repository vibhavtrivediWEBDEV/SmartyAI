/**
 * Widget Store - Centralized state management for desktop widgets
 * 
 * Extends the existing widget system to support:
 * - Native widgets (calendar, weather, etc.)
 * - Web widgets (live iframe-based)
 * - Snapshot widgets (static image)
 */

export type WidgetType = "native" | "web" | "snapshot" | "web-capture";

export interface BaseWidget {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface NativeWidget extends BaseWidget {
  category: "native";
  type: "calendar" | "weather" | "photo" | "clock" | 
        "glass-clock" | "glass-calendar" | "glass-weather" | 
        "glass-reminders" | "glass-day" | "glass-mini-calendar" | 
        "glass-world-clock" | "glass-small-world-clock" | 
        "glass-wide-reminders" | "glass-sf-weather";
}

export interface WebWidget extends BaseWidget {
  category: "web";
  type: "web-widget";
  url: string;
  title: string;
  favicon?: string;
  width: number;
  height: number;
  canEmbed?: boolean; // True if iframe embedding is allowed
}

export interface SnapshotWidget extends BaseWidget {
  category: "snapshot";
  type: "snapshot-widget";
  image: string; // Base64 or URL to screenshot
  title: string;
  sourceUrl?: string; // Original URL
  width: number;
  height: number;
}

export interface WebCaptureWidget extends BaseWidget {
  category: "web-capture";
  type: "web-capture-widget";
  image: string; // Base64 PNG screenshot from Puppeteer
  title: string;
  sourceUrl: string; // Original URL
  sourceRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  viewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
  };
  capturedAt: string; // ISO timestamp
  refreshInterval?: number; // Seconds (0 = no refresh)
  width: number;
  height: number;
}

export type Widget = NativeWidget | WebWidget | SnapshotWidget | WebCaptureWidget;

export interface WidgetCreationOptions {
  url: string;
  title: string;
  favicon?: string;
  isLive: boolean;
  imageData?: string;
}

export interface WebCaptureCreationOptions {
  url: string;
  title: string;
  image: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  viewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
  };
  capturedAt: string;
  refreshInterval?: number;
}

/**
 * Widget Store class for managing widgets
 */
export class WidgetStore {
  private static STORAGE_KEY = "os_desktop_widgets";

  /**
   * Load widgets from localStorage
   */
  static loadWidgets(): Widget[] {
    if (typeof window === "undefined") return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const widgets = JSON.parse(stored);
      
      // Migrate old widget format to new format if needed
      return widgets.map((w: any) => {
        // Old format: { id, type, x, y } - assume native
        if (!w.category) {
          return {
            ...w,
            category: "native",
            width: w.width || 160,
            height: w.height || 160
          } as NativeWidget;
        }
        return w;
      });
    } catch (error) {
      console.error("Failed to load widgets:", error);
      return [];
    }
  }

  /**
   * Save widgets to localStorage
   */
  static saveWidgets(widgets: Widget[]): void {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(widgets));
    } catch (error) {
      console.error("Failed to save widgets:", error);
    }
  }

  /**
   * Add a new widget
   */
  static addWidget(widget: Widget): Widget[] {
    const widgets = this.loadWidgets();
    widgets.push(widget);
    this.saveWidgets(widgets);
    return widgets;
  }

  /**
   * Remove a widget by ID
   */
  static removeWidget(id: string): Widget[] {
    const widgets = this.loadWidgets();
    const filtered = widgets.filter(w => w.id !== id);
    this.saveWidgets(filtered);
    return filtered;
  }

  /**
   * Update widget position
   */
  static updatePosition(id: string, x: number, y: number): Widget[] {
    const widgets = this.loadWidgets();
    const updated = widgets.map(w => 
      w.id === id ? { ...w, x, y } : w
    );
    this.saveWidgets(updated);
    return updated;
  }

  /**
   * Update widget size
   */
  static updateSize(id: string, width: number, height: number): Widget[] {
    const widgets = this.loadWidgets();
    const updated = widgets.map(w => 
      w.id === id ? { ...w, width, height } : w
    );
    this.saveWidgets(updated);
    return updated;
  }

  /**
   * Create a web widget from URL
   */
  static createWebWidget(options: WidgetCreationOptions): WebWidget {
    return {
      id: `web-${Date.now()}`,
      category: "web",
      type: "web-widget",
      url: options.url,
      title: options.title,
      favicon: options.favicon,
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      canEmbed: true // Will be updated when iframe loads
    };
  }

  /**
   * Create a snapshot widget
   */
  static createSnapshotWidget(options: WidgetCreationOptions): SnapshotWidget {
    return {
      id: `snapshot-${Date.now()}`,
      category: "snapshot",
      type: "snapshot-widget",
      image: options.imageData || "",
      title: options.title,
      sourceUrl: options.url,
      x: 100,
      y: 100,
      width: 400,
      height: 300
    };
  }

  /**
   * Create a web capture widget (Puppeteer-powered)
   */
  static createWebCaptureWidget(options: WebCaptureCreationOptions): WebCaptureWidget {
    return {
      id: `web-capture-${Date.now()}`,
      category: "web-capture",
      type: "web-capture-widget",
      image: options.image,
      title: options.title,
      sourceUrl: options.url,
      sourceRect: options.rect,
      viewport: options.viewport,
      capturedAt: options.capturedAt,
      refreshInterval: options.refreshInterval || 0,
      x: 100,
      y: 100,
      width: options.rect.width,
      height: options.rect.height
    };
  }
}

/**
 * Helper to check if URL can be embedded in iframe
 * Note: This is a basic check. Some sites may still block iframe via CSP.
 */
export async function checkIframeEmbeddable(url: string): Promise<boolean> {
  // Known sites that block iframe embedding
  const blockedDomains = [
    'youtube.com',
    'youtu.be',
    'facebook.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'linkedin.com',
    'github.com',
    'stackoverflow.com',
    'stackexchange.com'
  ];

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Check against known blocked domains
    if (blockedDomains.some(blocked => domain.includes(blocked))) {
      return false;
    }

    // For other URLs, we'll try embedding and catch errors
    // This will be handled at the component level
    return true;
  } catch {
    return false;
  }
}
