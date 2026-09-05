/**
 * Telegram Live Logs Display Component
 * Shows real-time bidirectional communication in terminal
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, MessageCircle, Send, Settings, Wifi, WifiOff } from 'lucide-react'

interface TelegramLog {
  _id: string
  direction: 'incoming' | 'outgoing'
  source: 'telegram' | 'desktop' | 'webhook'
  message: string
  messageType: 'text' | 'command' | 'automation' | 'ai' | 'error'
  commandId?: string
  command?: string
  websocket: {
    connected: boolean
    sent: boolean
    received: boolean
    latency?: number
  }
  success: boolean
  error?: string
  timestamp: string
  metadata?: {
    confidence?: number
    processingTime?: number
    author?: 'user' | 'assistant' | 'system'
  }
}

export function TelegramLiveLogs({ maxLogs = 20 }: { maxLogs?: number }) {
  const [logs, setLogs] = useState<TelegramLog[]>([])
  const [view, setView] = useState<'chat' | 'activity'>('chat')
  const [autoScroll, setAutoScroll] = useState(true)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking')
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Check Telegram connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/telegram/status')
        const data = await response.json()
        
        if (data.connected) {
          setConnectionStatus('connected')
          setConnectionError(null)
        } else {
          setConnectionStatus('disconnected')
          setConnectionError(data.error || 'Telegram not connected')
        }
      } catch (error) {
        setConnectionStatus('error')
        setConnectionError('Failed to check connection status')
      }
    }
    
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/telegram/logs?limit=${maxLogs}`, { cache: 'no-store' })
        const data = await response.json()
        
        if (data.success && data.logs) {
          setLogs(data.logs)
        }
      } catch (error) {
        console.error('[Telegram Live] Failed to fetch logs:', error)
      }
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void fetchLogs()
    }

    void fetchLogs()
    window.addEventListener('smarty:telegram-log-updated', fetchLogs)
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.removeEventListener('smarty:telegram-log-updated', fetchLogs)
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [maxLogs])
  
  // Send message to Telegram
  const sendMessageToTelegram = async () => {
    if (!messageInput.trim() || sending) return
    
    setSending(true)
    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageInput.trim() })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessageInput('')
        console.log('[Telegram] ✅ Message sent successfully')
        console.log('[Telegram] 🧠 AI Response:', data.aiResponse)
        
        // Refresh logs to show the AI response
        // The logs will auto-refresh via the polling interval
      } else {
        console.error('[Telegram] ❌ Failed to send:', data.error)
        
        // Handle different error types
        if (data.errorType === 'AUTH_REQUIRED') {
          setConnectionError('Please log in to send messages')
          setConnectionStatus('error')
        } else if (data.errorType === 'CONNECTION_REQUIRED' || data.needsConnection) {
          setConnectionStatus('disconnected')
          setConnectionError('Telegram not connected')
        } else if (data.errorType === 'BOT_BLOCKED') {
          alert('❌ Bot was blocked by the user. Please unblock the bot in Telegram.')
        } else if (data.errorType === 'INVALID_CHAT_ID') {
          alert('❌ Invalid chat ID. Please reconnect Telegram.')
        } else if (data.errorType === 'INVALID_BOT_TOKEN') {
          alert('❌ Bot token is invalid. Contact support.')
        } else if (data.errorType === 'TELEGRAM_API_UNAVAILABLE') {
          alert('❌ Telegram API is temporarily unavailable. Please try again later.')
        } else {
          alert(`Failed to send: ${data.error}\n\n${data.details || ''}`)
        }
      }
    } catch (error) {
      console.error('[Telegram] Send error:', error)
      alert('Failed to send message. Please check your connection.')
    } finally {
      setSending(false)
    }
  }

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const formatLogIcon = (log: TelegramLog) => {
    const icons = {
      incoming: '📩',
      outgoing: '📤',
      command: '⚡',
      automation: '🤖',
      ai: '🧠',
      error: '❌',
      success: '✅'
    }
    
    if (!log.success) return icons.error
    if (log.messageType === 'command') return icons.command
    if (log.messageType === 'automation') return icons.automation
    if (log.messageType === 'ai') return icons.ai
    return log.direction === 'incoming' ? icons.incoming : icons.outgoing
  }

  const formatLogColor = (log: TelegramLog) => {
    if (!log.success) return 'text-red-400'
    if (log.messageType === 'command') return 'text-yellow-400'
    if (log.messageType === 'automation') return 'text-purple-400'
    if (log.messageType === 'ai') return 'text-blue-400'
    return log.direction === 'incoming' ? 'text-green-400' : 'text-cyan-400'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const isUserAuthored = (log: TelegramLog) => {
    if (log.metadata?.author) return log.metadata.author === 'user'
    return log.direction === 'incoming' || log.message.startsWith('🖥️ ')
  }

  const formatChatMessage = (log: TelegramLog) => log.message.replace(/^🖥️\s*/, '')

  const chatLogs = logs.filter((log) => log.source === 'telegram')

  const formatLogEntry = (log: TelegramLog) => {
    const lines: JSX.Element[] = []
    
    // Main log line
    lines.push(
      <div key={log._id} className={`flex items-start gap-2 font-mono text-sm ${formatLogColor(log)}`}>
        <span className="text-gray-500">[{formatTime(log.timestamp)}]</span>
        <span>{formatLogIcon(log)}</span>
        <span className="text-gray-400">[{log.source.toUpperCase()}]</span>
        <span className="flex-1">
          {log.command ? (
            <>
              <span className="text-yellow-300">Command:</span> "{log.command}"
              {log.websocket.latency && (
                <span className="text-gray-500 ml-2">({log.websocket.latency}ms)</span>
              )}
            </>
          ) : (
            log.message.length > 80 ? log.message.substring(0, 80) + '...' : log.message
          )}
        </span>
        {log.websocket.sent && !log.websocket.received && (
          <span className="animate-pulse text-yellow-400">⏳</span>
        )}
        {log.websocket.received && (
          <span className="text-green-500">✓</span>
        )}
      </div>
    )

    // Error details
    if (log.error) {
      lines.push(
        <div key={`${log._id}-error`} className="ml-20 text-xs text-red-300 font-mono">
          Error: {log.error}
        </div>
      )
    }

    // Metadata
    if (log.metadata?.confidence) {
      lines.push(
        <div key={`${log._id}-meta`} className="ml-20 text-xs text-gray-500 font-mono">
          Confidence: {(log.metadata.confidence * 100).toFixed(0)}%
        </div>
      )
    }

    return lines
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-gray-900 dark:bg-[#1e1e1e] dark:text-white">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 px-5 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#229ED9] text-white shadow-sm">
            <MessageCircle size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">Telegram</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              {connectionStatus === 'connected' ? <Wifi size={11} className="text-emerald-500" /> : <WifiOff size={11} className="text-red-500" />}
              <span>{connectionStatus === 'connected' ? 'Connected and live' : connectionStatus === 'checking' ? 'Checking connection' : connectionError || 'Not connected'}</span>
            </div>
          </div>
        </div>
        <div className="flex rounded-lg bg-black/5 p-0.5 dark:bg-white/8" aria-label="Telegram view">
          <button type="button" onClick={() => setView('chat')} className={`flex h-7 items-center gap-1.5 rounded-md px-3 text-[11px] font-semibold ${view === 'chat' ? 'bg-white text-[#007AFF] shadow-sm dark:bg-white/15 dark:text-sky-400' : 'text-gray-500'}`}>
            <MessageCircle size={13} /> Chat
          </button>
          <button type="button" onClick={() => setView('activity')} className={`flex h-7 items-center gap-1.5 rounded-md px-3 text-[11px] font-semibold ${view === 'activity' ? 'bg-white text-[#007AFF] shadow-sm dark:bg-white/15 dark:text-sky-400' : 'text-gray-500'}`}>
            <Activity size={13} /> Activity
          </button>
        </div>
      </header>

      {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <span>Connect Telegram in Settings to send messages and receive commands.</span>
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('smarty:open-app', { detail: { name: 'Settings' } }))} className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-900 px-2.5 py-1.5 font-semibold text-white dark:bg-amber-500 dark:text-black">
            <Settings size={12} /> Settings
          </button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${view === 'activity' ? 'bg-[#111214] p-4 font-mono' : 'space-y-3 bg-white px-5 py-4 dark:bg-[#1e1e1e]'}`} style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <div className={`grid h-full place-items-center text-center ${view === 'activity' ? 'text-gray-500' : 'text-gray-400'}`}>
              <div><MessageCircle size={28} className="mx-auto mb-2 opacity-50" /><p className="text-xs">No Telegram activity yet</p></div>
            </div>
          ) : view === 'chat' ? (
            chatLogs.map((log) => {
              const isUser = isUserAuthored(log)
              return (
                <motion.div key={log._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[74%]">
                    <div className={`px-3 py-2 text-[13px] leading-relaxed shadow-sm ${isUser ? 'rounded-2xl rounded-br-md bg-[#007AFF] text-white' : 'rounded-2xl rounded-bl-md bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white'} ${!log.success ? 'ring-1 ring-red-500/50' : ''}`}>
                      <p className="whitespace-pre-wrap break-words">{formatChatMessage(log)}</p>
                    </div>
                    <div className={`mt-1 flex items-center gap-1 text-[9px] text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span>{formatTime(log.timestamp)}</span>
                      <span>·</span>
                      <span className="capitalize">{log.messageType}</span>
                      {log.websocket.received && <span className="text-emerald-500">Delivered</span>}
                    </div>
                  </div>
                </motion.div>
              )
            })
          ) : (
            logs.map((log) => (
              <motion.div key={log._id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border-b border-white/8 py-2">
                {formatLogEntry(log)}
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={logsEndRef} />
      </div>

      <div className="shrink-0 border-t border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void sendMessageToTelegram()}
            placeholder={connectionStatus === 'connected' ? 'Message Telegram' : 'Connect Telegram to send'}
            className="h-9 min-w-0 flex-1 rounded-full bg-gray-100 px-4 text-[13px] outline-none ring-[#007AFF]/40 focus:ring-2 dark:bg-white/8"
            disabled={sending || connectionStatus !== 'connected'}
          />
          <button type="button" onClick={() => void sendMessageToTelegram()} disabled={sending || connectionStatus !== 'connected' || !messageInput.trim()} aria-label="Send to Telegram" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#007AFF] text-white transition hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-white/10">
            <Send size={15} />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1 text-[9px] text-gray-400">
          <span>{logs.length} recent events</span>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={autoScroll} onChange={(event) => setAutoScroll(event.target.checked)} /> Follow live activity</label>
        </div>
      </div>
    </div>
  )
}
