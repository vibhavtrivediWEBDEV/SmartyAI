/**
 * Telegram WebSocket Integration
 * Real-time updates and logging to Telegram
 */

import { getTelegramBot } from './bot'

// ============================================
// LOG TYPES
// ============================================

export type TelegramLogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug'

export interface TelegramLog {
  level: TelegramLogLevel
  message: string
  timestamp: Date
  userId?: string
  module?: string
  data?: any
}

// ============================================
// TELEGRAM LOGGER
// ============================================

class TelegramLogger {
  private bot: ReturnType<typeof getTelegramBot> | null = null
  private enabled: boolean = true
  private logBuffer: TelegramLog[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private chatId: number | null = null

  constructor() {
    // Initialize bot
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        this.bot = getTelegramBot()
        this.chatId = process.env.TELEGRAM_CHAT_ID ? parseInt(process.env.TELEGRAM_CHAT_ID) : null
        console.log('[Telegram Logger] Initialized')
      } catch (error) {
        console.error('[Telegram Logger] Failed to initialize:', error)
        this.enabled = false
      }
    }
    
    // Start flush interval (send logs every 5 seconds)
    this.flushInterval = setInterval(() => {
      this.flush()
    }, 5000)
  }

  /**
   * Log a message
   */
  log(
    level: TelegramLogLevel,
    message: string,
    module?: string,
    userId?: string,
    data?: any
  ): void {
    const logEntry: TelegramLog = {
      level,
      message,
      timestamp: new Date(),
      module,
      userId,
      data,
    }

    // Also log to console
    const consoleMessage = `[Telegram ${module || 'App'}] ${message}`
    switch (level) {
      case 'error':
        console.error(consoleMessage, data || '')
        break
      case 'warn':
        console.warn(consoleMessage, data || '')
        break
      default:
        console.log(consoleMessage, data || '')
    }

    // Add to buffer
    this.logBuffer.push(logEntry)

    // Don't immediately send - batch everything to prevent rate limiting
  }

  /**
   * Send logs to Telegram
   */
  private async flush(): Promise<void> {
    if (!this.bot || !this.chatId || this.logBuffer.length === 0) {
      return
    }

    if (!this.enabled) {
      return
    }

    // Get logs to send
    const logsToSend = [...this.logBuffer]
    this.logBuffer = []

    try {
      // Group logs by level
      const grouped = this.groupLogs(logsToSend)

      // Send each group
      for (const [level, logs] of Object.entries(grouped)) {
        const message = this.formatLogs(level as TelegramLogLevel, logs)
        
        // Skip if message is empty or whitespace only
        if (!message || message.trim().length === 0) {
          continue
        }
        
        // Truncate if too long (Telegram limit: 4096 chars)
        const truncatedMessage = message.substring(0, 4000)
        
        await this.bot.sendMessage(this.chatId, truncatedMessage).catch(error => {
          console.error('[Telegram Logger] Failed to send:', error)
          this.enabled = false
        })
      }
    } catch (error) {
      console.error('[Telegram Logger] Flush error:', error)
      // Re-add logs to buffer
      this.logBuffer = [...logsToSend, ...this.logBuffer]
    }
  }

  /**
   * Group logs by level
   */
  private groupLogs(logs: TelegramLog[]): Record<TelegramLogLevel, TelegramLog[]> {
    const grouped: Record<TelegramLogLevel, TelegramLog[]> = {
      info: [],
      warn: [],
      error: [],
      success: [],
      debug: [],
    }

    for (const log of logs) {
      grouped[log.level].push(log)
    }

    return grouped
  }

  /**
   * Format logs for Telegram
   */
  private formatLogs(level: TelegramLogLevel, logs: TelegramLog[]): string {
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      debug: '🔍',
    }[level]

    const lines = logs.map(log => {
      const moduleStr = log.module ? `[${log.module}] ` : ''
      const userStr = log.userId ? `(User: ${log.userId.substring(0, 8)}...) ` : ''
      const timeStr = log.timestamp.toLocaleTimeString()
      const dataStr = log.data ? `\n\`\`\`${JSON.stringify(log.data).substring(0, 100)}\`\`\`` : ''
      
      return `${emoji} ${timeStr} ${moduleStr}${userStr}${log.message}${dataStr}`
    })

    return lines.join('\n\n')
  }

  /**
   * Disable logging to Telegram
   */
  disable(): void {
    this.enabled = false
  }

  /**
   * Enable logging to Telegram
   */
  enable(): void {
    this.enabled = true
  }

  /**
   * Send immediate message
   */
  async sendImmediate(message: string): Promise<void> {
    if (!this.bot || !this.chatId) return

    // Don't use Markdown - causes parsing errors
    await this.bot.sendMessage(this.chatId, message)
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush()
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const telegramLogger = new TelegramLogger()

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export const logToTelegram = {
  info: (message: string, module?: string, userId?: string, data?: any) => 
    telegramLogger.log('info', message, module, userId, data),
  
  warn: (message: string, module?: string, userId?: string, data?: any) => 
    telegramLogger.log('warn', message, module, userId, data),
  
  error: (message: string, module?: string, userId?: string, data?: any) => 
    telegramLogger.log('error', message, module, userId, data),
  
  success: (message: string, module?: string, userId?: string, data?: any) => 
    telegramLogger.log('success', message, module, userId, data),
  
  debug: (message: string, module?: string, userId?: string, data?: any) => 
    telegramLogger.log('debug', message, module, userId, data),
  
  immediate: (message: string) => 
    telegramLogger.sendImmediate(message),
}
