/**
 * Telegram Live Logs Display Component
 * Shows real-time bidirectional communication in terminal
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
  }
}

export function TelegramLiveLogs({ maxLogs = 20, userId }: { maxLogs?: number; userId?: string | null }) {
  const [logs, setLogs] = useState<TelegramLog[]>([])
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
        // Add userId to query if available
        const url = userId 
          ? `/api/telegram/logs?limit=${maxLogs}&userId=${userId}`
          : `/api/telegram/logs?limit=${maxLogs}`
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.success && data.logs) {
          setLogs(data.logs)
        }
      } catch (error) {
        console.error('[Telegram Live] Failed to fetch logs:', error)
      }
    }

    // Initial fetch
    fetchLogs()

    // Poll every 1 second for live updates
    const interval = setInterval(fetchLogs, 1000)

    return () => clearInterval(interval)
  }, [maxLogs, userId])
  
  // Send message to Telegram
  const sendMessageToTelegram = async () => {
    if (!messageInput.trim() || sending) return
    
    setSending(true)
    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageInput.trim(), userId })
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
    <div className="h-full flex flex-col bg-gray-950 rounded-lg overflow-hidden">
      {/* Connection Status Banner */}
      {connectionStatus === 'checking' && (
        <div className="px-3 py-2 bg-yellow-900/30 border-b border-yellow-700 text-yellow-300 text-xs font-mono flex items-center gap-2">
          <span className="animate-pulse">🟡</span>
          <span>Checking Telegram connection...</span>
        </div>
      )}
      
      {connectionStatus === 'connected' && (
        <div className="px-3 py-2 bg-green-900/30 border-b border-green-700 text-green-300 text-xs font-mono flex items-center gap-2">
          <span>🟢</span>
          <span>Telegram connected</span>
        </div>
      )}
      
      {connectionStatus === 'disconnected' && (
        <div className="px-3 py-2 bg-red-900/30 border-b border-red-700 text-xs font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-300">
              <span>🔴</span>
              <span>Telegram is not connected</span>
            </div>
            <button
              onClick={() => window.location.href = '/desktop?app=settings'}
              className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-medium"
            >
              Connect Telegram
            </button>
          </div>
          <div className="mt-1 text-red-400">
            Connect your Telegram account to send messages
          </div>
        </div>
      )}
      
      {connectionStatus === 'error' && (
        <div className="px-3 py-2 bg-orange-900/30 border-b border-orange-700 text-xs font-mono">
          <div className="flex items-center gap-2 text-orange-300">
            <span>⚠️</span>
            <span>Connection error: {connectionError}</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-300 font-mono text-sm font-semibold">
            Telegram Live Logs
          </span>
          <span className="text-gray-600 text-xs">({logs.length} entries)</span>
        </div>
        <label className="flex items-center gap-2 text-gray-400 text-xs">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded"
          />
          Auto-scroll
        </label>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono">
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No logs yet. Send a message from Telegram!
            </div>
          ) : (
            logs.map((log) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border-b border-gray-800 pb-2"
              >
                {formatLogEntry(log)}
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={logsEndRef} />
      </div>
      
      {/* Send Message Input */}
      <div className="p-3 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessageToTelegram()}
            placeholder="Send message to Telegram..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            disabled={sending}
          />
          <button
            onClick={sendMessageToTelegram}
            disabled={sending || !messageInput.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
          >
            {sending ? '⏳' : '📤'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-2 bg-gray-900 border-t border-gray-800 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>📩 Incoming</span>
          <span>📤 Outgoing</span>
          <span>⚡ Commands</span>
          <span>🤖 Automation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live • Updated every 1s</span>
        </div>
      </div>
    </div>
  )
}
