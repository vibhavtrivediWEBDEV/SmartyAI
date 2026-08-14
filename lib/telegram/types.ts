/**
 * Telegram Integration Types
 * Type definitions for Telegram bot integration
 */

// ============================================
// TELEGRAM API TYPES
// ============================================

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  first_name?: string
  last_name?: string
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
  caption?: string
  document?: TelegramDocument
  photo?: TelegramPhotoSize[]
  entities?: TelegramMessageEntity[]
}

export interface TelegramDocument {
  file_id: string
  file_unique_id: string
  file_name?: string
  mime_type?: string
  file_size?: number
}

export interface TelegramPhotoSize {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  file_size?: number
}

export interface TelegramMessageEntity {
  type: string
  offset: number
  length: number
  url?: string
  user?: TelegramUser
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
  channel_post?: TelegramMessage
  edited_channel_post?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
  chat_instance: string
}

export interface TelegramInlineKeyboardButton {
  text: string
  url?: string
  callback_data?: string
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][]
}

// ============================================
// INTERNAL TYPES
// ============================================

export interface TelegramConnection {
  _id?: string
  userId: string
  telegramChatId: number
  telegramUserId: number
  telegramUsername?: string
  telegramFirstName: string
  telegramLastName?: string
  status: 'active' | 'disconnected' | 'suspended'
  permissions: TelegramPermissions
  linkedAt: Date
  lastSeenAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface TelegramPermissions {
  readFiles: boolean
  writeFiles: boolean
  runAITasks: boolean
  atsAnalysis: boolean
  documentProcessing: boolean
  macAutomation: boolean
  browserAutomation: boolean
}

export interface TelegramLinkingToken {
  _id?: string
  token: string
  userId: string
  createdAt: Date
  expiresAt: Date
  used: boolean
  usedAt?: Date
  telegramChatId?: number
}

export interface TelegramCommand {
  command: string
  description: string
  category: 'system' | 'file' | 'ats' | 'ai' | 'automation'
}

export interface TelegramTask {
  _id?: string
  taskId: string
  userId: string
  telegramChatId: number
  type: 'ats_check' | 'file_processing' | 'ai_task' | 'automation' | 'multi_step'
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  currentStep?: string
  result?: any
  error?: string
  input: TelegramTaskInput
  output?: TelegramTaskOutput
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface TelegramTaskInput {
  message: string
  files?: TelegramFileInfo[]
  context?: Record<string, any>
}

export interface TelegramTaskOutput {
  message?: string
  files?: TelegramFileInfo[]
  actions?: TelegramAction[]
}

export interface TelegramFileInfo {
  fileId: string
  fileName: string
  mimeType: string
  fileSize: number
  url?: string
  telegramFileId?: string
}

export interface TelegramAction {
  type: 'text' | 'file' | 'image' | 'progress' | 'confirmation' | 'error'
  content: string
  data?: any
}

export interface TelegramMessageContext {
  userId: string
  telegramChatId: number
  username: string
  displayName: string
  permissions: TelegramPermissions
  conversationHistory: TelegramConversationMessage[]
}

export interface TelegramConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  files?: TelegramFileInfo[]
  taskId?: string
}

// ============================================
// TELEGRAM BOT COMMANDS
// ============================================

export const TELEGRAM_COMMANDS: TelegramCommand[] = [
  { command: 'start', description: 'Link your Telegram to SmartyAI account', category: 'system' },
  { command: 'help', description: 'Show available commands and features', category: 'system' },
  { command: 'status', description: 'Check your connection and permissions', category: 'system' },
  { command: 'connect', description: 'Get link to connect Telegram in SmartyAI', category: 'system' },
  { command: 'disconnect', description: 'Disconnect Telegram from SmartyAI', category: 'system' },
  { command: 'tasks', description: 'View your recent tasks', category: 'system' },
  { command: 'cancel', description: 'Cancel a running task', category: 'system' },
  { command: 'devices', description: 'List connected devices', category: 'system' },
]

// ============================================
// PERMISSIONS DEFAULTS
// ============================================

export const DEFAULT_PERMISSIONS: TelegramPermissions = {
  readFiles: true,
  writeFiles: true,
  runAITasks: true,
  atsAnalysis: true,
  documentProcessing: true,
  macAutomation: false, // Disabled by default for security
  browserAutomation: false, // Disabled by default for security
}

export const RESTRICTED_PERMISSIONS: TelegramPermissions = {
  readFiles: false,
  writeFiles: false,
  runAITasks: false,
  atsAnalysis: false,
  documentProcessing: false,
  macAutomation: false,
  browserAutomation: false,
}

// ============================================
// FILE TYPE VALIDATION
// ============================================

export const SUPPORTED_FILE_TYPES = {
  documents: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
  spreadsheets: ['xlsx', 'xls', 'csv', 'ods', 'numbers'],
  presentations: ['pptx', 'ppt', 'odp', 'key'],
  images: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
  code: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb'],
  data: ['json', 'xml', 'yaml', 'yml', 'toml'],
  archives: ['zip', 'rar', '7z', 'tar', 'gz'],
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB (Telegram's limit)

export const DANGEROUS_FILE_TYPES = [
  'exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'js', 'jar', 'msi', 'scr', 'pif'
]
