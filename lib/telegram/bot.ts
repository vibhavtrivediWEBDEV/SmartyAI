/**
 * Telegram Bot API Client
 * Handles all communication with Telegram Bot API
 */

import type {
  TelegramUpdate,
  TelegramMessage,
  TelegramInlineKeyboardMarkup,
  TelegramInlineKeyboardButton,
} from './types'

// ============================================
// TELEGRAM BOT API CLIENT
// ============================================

export class TelegramBotAPI {
  private readonly token: string
  private readonly baseUrl: string

  constructor(token: string) {
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required')
    }
    this.token = token
    this.baseUrl = `https://api.telegram.org/bot${token}`
  }

  // ============================================
  // WEBHOOK MANAGEMENT
  // ============================================

  /**
   * Set webhook for production mode
   */
  async setWebhook(webhookUrl: string, secretToken?: string): Promise<boolean> {
    const params: Record<string, any> = {
      url: webhookUrl,
      allowed_updates: ['message', 'edited_message', 'callback_query'],
      drop_pending_updates: true,
    }

    if (secretToken) {
      params.secret_token = secretToken
    }

    const response = await this.request('setWebhook', params)
    return response.ok
  }

  /**
   * Delete webhook (for development/polling mode)
   */
  async deleteWebhook(): Promise<boolean> {
    const response = await this.request('deleteWebhook', { drop_pending_updates: true })
    return response.ok
  }

  /**
   * Get webhook info
   */
  async getWebhookInfo(): Promise<any> {
    const response = await this.request('getWebhookInfo', {})
    return response.result
  }

  // ============================================
  // MESSAGE SENDING
  // ============================================

  /**
   * Send text message
   */
  async sendMessage(
    chatId: number,
    text: string,
    options?: {
      parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML'
      disable_web_page_preview?: boolean
      reply_to_message_id?: number
      reply_markup?: TelegramInlineKeyboardMarkup
    }
  ): Promise<TelegramMessage> {
    const response = await this.request('sendMessage', {
      chat_id: chatId,
      text,
      ...options,
    })
    return response.result
  }

  /**
   * Send document
   */
  async sendDocument(
    chatId: number,
    document: string | Buffer | Blob,
    options?: {
      filename?: string
      caption?: string
      parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML'
      reply_to_message_id?: number
      reply_markup?: TelegramInlineKeyboardMarkup
    }
  ): Promise<TelegramMessage> {
    const formData = new FormData()
    formData.append('chat_id', chatId.toString())

    if (typeof document === 'string') {
      // File path or URL
      formData.append('document', document)
    } else {
      // Blob or Buffer - convert to Blob if needed
      const blob = Buffer.isBuffer(document) 
        ? new Blob([document.buffer.slice(document.byteOffset, document.byteOffset + document.byteLength)], { type: 'application/octet-stream' })
        : document
      formData.append('document', blob, options?.filename || 'file')
    }

    if (options?.caption) {
      formData.append('caption', options.caption)
    }
    if (options?.parse_mode) {
      formData.append('parse_mode', options.parse_mode)
    }
    if (options?.reply_to_message_id) {
      formData.append('reply_to_message_id', options.reply_to_message_id.toString())
    }
    if (options?.reply_markup) {
      formData.append('reply_markup', JSON.stringify(options.reply_markup))
    }

    const response = await this.requestMultipart('sendDocument', formData)
    return response.result
  }

  /**
   * Send photo
   */
  async sendPhoto(
    chatId: number,
    photo: string | Buffer | Blob,
    options?: {
      filename?: string
      caption?: string
      parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML'
      reply_to_message_id?: number
      reply_markup?: TelegramInlineKeyboardMarkup
    }
  ): Promise<TelegramMessage> {
    const formData = new FormData()
    formData.append('chat_id', chatId.toString())

    if (typeof photo === 'string') {
      formData.append('photo', photo)
    } else {
      // Blob or Buffer - convert to Blob if needed
      const blob = Buffer.isBuffer(photo)
        ? new Blob([photo.buffer.slice(photo.byteOffset, photo.byteOffset + photo.byteLength)], { type: 'image/png' })
        : photo
      formData.append('photo', blob, options?.filename || 'photo.png')
    }

    if (options?.caption) {
      formData.append('caption', options.caption)
    }
    if (options?.parse_mode) {
      formData.append('parse_mode', options.parse_mode)
    }
    if (options?.reply_to_message_id) {
      formData.append('reply_to_message_id', options.reply_to_message_id.toString())
    }
    if (options?.reply_markup) {
      formData.append('reply_markup', JSON.stringify(options.reply_markup))
    }

    const response = await this.requestMultipart('sendPhoto', formData)
    return response.result
  }

  /**
   * Edit message text
   */
  async editMessageText(
    chatId: number,
    messageId: number,
    text: string,
    options?: {
      parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML'
      disable_web_page_preview?: boolean
      reply_markup?: TelegramInlineKeyboardMarkup
    }
  ): Promise<TelegramMessage | boolean> {
    const response = await this.request('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options,
    })
    return response.result
  }

  /**
   * Delete message
   */
  async deleteMessage(chatId: number, messageId: number): Promise<boolean> {
    const response = await this.request('deleteMessage', {
      chat_id: chatId,
      message_id: messageId,
    })
    return response.ok
  }

  /**
   * Send chat action (typing, uploading, etc)
   */
  async sendChatAction(
    chatId: number,
    action: 'typing' | 'upload_photo' | 'upload_video' | 'upload_document' | 'find_location'
  ): Promise<boolean> {
    const response = await this.request('sendChatAction', {
      chat_id: chatId,
      action,
    })
    return response.ok
  }

  // ============================================
  // FILE MANAGEMENT
  // ============================================

  /**
   * Get file download URL
   */
  async getFile(fileId: string): Promise<{ filePath: string; url: string }> {
    const response = await this.request('getFile', { file_id: fileId })
    const filePath = response.result.file_path
    const url = `https://api.telegram.org/file/bot${this.token}/${filePath}`
    return { filePath, url }
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const { url } = await this.getFile(fileId)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }
    return new Blob([await response.arrayBuffer()])
  }

  // ============================================
  // INLINE KEYBOARDS
  // ============================================

  /**
   * Create inline keyboard markup
   */
  createInlineKeyboard(buttons: TelegramInlineKeyboardButton[][]): TelegramInlineKeyboardMarkup {
    return {
      inline_keyboard: buttons,
    }
  }

  /**
   * Create confirmation keyboard
   */
  createConfirmationKeyboard(taskId: string): TelegramInlineKeyboardMarkup {
    return this.createInlineKeyboard([
      [
        { text: '✅ Confirm', callback_data: `confirm:${taskId}` },
        { text: '❌ Cancel', callback_data: `cancel:${taskId}` },
      ],
    ])
  }

  // ============================================
  // BOT INFO
  // ============================================

  /**
   * Get bot info
   */
  async getMe(): Promise<any> {
    const response = await this.request('getMe', {})
    return response.result
  }

  /**
   * Get bot commands
   */
  async getMyCommands(): Promise<any[]> {
    const response = await this.request('getMyCommands', {})
    return response.result
  }

  /**
   * Set bot commands
   */
  async setMyCommands(commands: Array<{ command: string; description: string }>): Promise<boolean> {
    const response = await this.request('setMyCommands', { commands })
    return response.ok
  }

  // ============================================
  // API REQUEST HELPERS
  // ============================================

  /**
   * Make API request (JSON)
   */
  private async request(method: string, params: Record<string, any>): Promise<any> {
    const url = `${this.baseUrl}/${method}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('[Telegram API Error]', method, data)
      throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`)
    }

    return data
  }

  /**
   * Make API request (Multipart/Form-Data)
   */
  private async requestMultipart(method: string, formData: FormData): Promise<any> {
    const url = `${this.baseUrl}/${method}`
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('[Telegram API Error]', method, data)
      throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`)
    }

    return data
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let botInstance: TelegramBotAPI | null = null

/**
 * Get Telegram Bot API instance
 */
export function getTelegramBot(): TelegramBotAPI {
  if (!botInstance) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured')
    }
    botInstance = new TelegramBotAPI(token)
  }
  return botInstance
}

/**
 * Initialize Telegram Bot with webhook
 */
export async function initializeTelegramBot(mode: 'webhook' | 'polling' = 'webhook'): Promise<void> {
  const bot = getTelegramBot()
  
  if (mode === 'webhook') {
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    
    if (!webhookUrl) {
      throw new Error('TELEGRAM_WEBHOOK_URL is required for webhook mode')
    }
    
    await bot.setWebhook(webhookUrl, webhookSecret)
    console.log(`✅ Telegram webhook set: ${webhookUrl}`)
  } else {
    // Delete webhook for polling mode
    await bot.deleteWebhook()
    console.log('✅ Telegram webhook deleted (polling mode)')
  }
}
