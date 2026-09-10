/**
 * Socket.io Client Hook for Desktop App
 * Enables bidirectional communication with Telegram webhook
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import type { CareerLaunchEvent, CareerProgressEvent, CareerReminderEvent } from '../lib/career/careerEvents'

interface AutomationCommand {
  commandId: string
  userId: string
  command: string
  source: 'telegram' | 'voice' | 'terminal'
  timestamp: number
}

interface WhatsAppUpdatedEvent {
  event: string
  call?: {
    callId: string
    from: string
    type: 'audio' | 'video'
    status: 'ringing' | 'accepted' | 'rejected' | 'missed'
  }
}

interface UseSocketIOOptions {
  userId?: string
  enabled?: boolean
  onCommand?: (command: AutomationCommand) => void
  onCareerProgress?: (event: CareerProgressEvent) => void
  onCareerLaunch?: (event: CareerLaunchEvent) => void
  onCareerReminder?: (event: CareerReminderEvent) => void
}

export function useSocketIO(options: UseSocketIOOptions = {}) {
  const { userId, enabled = true, onCommand, onCareerProgress, onCareerLaunch, onCareerReminder } = options
  const socketRef = useRef<Socket | null>(null)
  const whatsappNotificationRef = useRef<Notification | null>(null)
  const notifiedWhatsAppCallIdRef = useRef<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Store sendResult in ref to avoid circular dependency
  const sendResultRef = useRef<((commandId: string, success: boolean, message?: string) => void) | null>(null)

  useEffect(() => {
    if (!enabled || !userId) {
      return
    }

    // Initialize Socket.io client
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin

    console.log('[Socket.io Client] Connecting to:', socketUrl)

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    })

    socketRef.current = socket

    // Send automation result back to server
    sendResultRef.current = (commandId: string, success: boolean, message?: string) => {
      if (socket.connected) {
        socket.emit('automation-result', {
          commandId,
          success,
          message,
          timestamp: Date.now()
        })
      }
    }

    // 🔥 FIX: Register event listeners IMMEDIATELY in same effect
    if (onCommand) {
      console.log('[Socket.io Client] 🔧 Setting up event listeners for automation events');

      // Handler for automation-command
      const handleCommand = (command: AutomationCommand) => {
        console.log('\n' + '📥'.repeat(80))
        console.log('📨 [Desktop WebSocket] AUTOMATION COMMAND RECEIVED')
        console.log(`   Command ID: ${command.commandId}`)
        console.log(`   Command: ${command.command}`)
        console.log(`   Source: ${command.source}`)
        console.log(`   Timestamp: ${new Date(command.timestamp).toLocaleTimeString()}`)
        console.log('📥'.repeat(80) + '\n')

        onCommand(command)
      }

      socket.on('automation-command', handleCommand)

      console.log('[Socket.io Client] ✅ Event listeners registered');
    }

    if (onCareerProgress) {
      socket.on('career-progress', onCareerProgress)
    }

    if (onCareerLaunch) {
      socket.on('career-launch', onCareerLaunch)
    }

    if (onCareerReminder) {
      socket.on('career-reminder', onCareerReminder)
    }

    socket.on('connect', () => {
      console.log('\n' + '='.repeat(80))
      console.log('✅ [Desktop WebSocket] CONNECTED TO SERVER')
      console.log(`   Socket ID: ${socket.id}`)
      console.log(`   User ID: "${userId}"`)
      console.log(`   User ID Type: ${typeof userId}`)
      console.log(`   Expected Room: user:${userId}`)
      console.log(`   Global Session Key: "${userId}"`)
      console.log('='.repeat(80) + '\n')
      setIsConnected(true)
      setError(null)

      // Join user-specific room
      console.log('\n' + '🚪'.repeat(80))
      console.log('[Desktop WebSocket] JOINING ROOM')
      console.log(`   Event: join-user-room`)
      console.log(`   Payload: "${userId}"`)
      console.log('🚪'.repeat(80) + '\n')

      socket.emit('join-user-room', userId)
      console.log('✅ [Desktop WebSocket] Join event emitted')
    })

    socket.on('room-joined', (data) => {
      console.log('\n' + '▶'.repeat(80))
      console.log('👥 [Desktop WebSocket] ROOM JOINED SUCCESSFULLY')
      console.log(`   Room ID: ${data.roomId}`)
      console.log(`   User ID: ${data.userId}`)
      console.log('▶'.repeat(80) + '\n')
    })

    socket.on('telegram-log-updated', () => {
      window.dispatchEvent(new CustomEvent('smarty:telegram-log-updated'))
    })

    socket.on('whatsapp-updated', (update: WhatsAppUpdatedEvent) => {
      window.dispatchEvent(new CustomEvent('whatsapp-updated'))
      const call = update.call

      // Handle call status changes
      if (update.event.startsWith('call.')) {
        if (call && update.event !== 'call.received' && call.status !== 'ringing') {
          // Dismiss toast and close notification for non-ringing states
          toast.dismiss(`whatsapp-call-${call.callId}`)
          if (whatsappNotificationRef.current?.tag === `whatsapp-call-${call.callId}`) {
            whatsappNotificationRef.current.close()
            whatsappNotificationRef.current = null
          }
          // Clear the notified call ID so a new call can show notifications
          notifiedWhatsAppCallIdRef.current = null
        }

        // Only handle incoming ringing calls
        if (!call || update.event !== 'call.received' || call.status !== 'ringing') {
          return
        }

        // Avoid duplicate notifications for the same call
        if (notifiedWhatsAppCallIdRef.current === call.callId) return
        notifiedWhatsAppCallIdRef.current = call.callId

        toast(`Incoming WhatsApp ${call.type} call`, {
          id: `whatsapp-call-${call.callId}`,
          description: `From ${call.from}`,
          duration: Infinity,
          action: {
            label: 'Open WhatsApp Web',
            onClick: () => { window.open('https://web.whatsapp.com/', 'whatsapp-web') },
          },
        })

        if (!("Notification" in window)) return

        const showNotification = () => {
          if (Notification.permission !== 'granted') return
          whatsappNotificationRef.current?.close()
          const notification = new Notification(`Incoming WhatsApp ${call.type} call`, {
            body: `From ${call.from}`,
            tag: `whatsapp-call-${call.callId}`,
            requireInteraction: true,
          })
          notification.onclick = () => {
            window.focus()
            window.open('https://web.whatsapp.com/', 'whatsapp-web')
            notification.close()
          }
          whatsappNotificationRef.current = notification
        }

        if (Notification.permission === 'granted') showNotification()
        else if (Notification.permission === 'default') void Notification.requestPermission().then(showNotification)
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('\n' + '🔌'.repeat(80))
      console.log('❌ [Desktop WebSocket] DISCONNECTED FROM SERVER')
      console.log(`   Reason: ${reason}`)
      console.log(`   Socket ID: ${socket.id}`)
      console.log(`   User ID: "${userId}"`)
      console.log('🔌'.repeat(80) + '\n')
      setIsConnected(false)

      // Show user-friendly notification
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        console.log('[Desktop WebSocket] 🔄 Server disconnected, will attempt reconnect...')
      } else if (reason === 'ping timeout') {
        console.log('[Desktop WebSocket] ⏱️ Connection timeout, reconnecting...')
      }
    })

    socket.on('connect_error', (error) => {
      console.error('\n' + '❌'.repeat(80))
      console.error('❌ [Desktop WebSocket] CONNECTION ERROR')
      console.error(`   Error: ${error.message}`)
      console.error(`   User ID: "${userId}"`)
      console.error('❌'.repeat(80) + '\n')
      setError(error.message)
    })

    socket.on('error', (error) => {
      console.error('[Desktop WebSocket] Socket error:', error)
      setError(error.toString())
    })

    const heartbeatInterval = window.setInterval(() => {
      if (socket.connected) socket.emit('desktop-heartbeat')
    }, 25000)

    const reconnectWhenAvailable = () => {
      if (!socket.connected) socket.connect()
    }

    window.addEventListener('online', reconnectWhenAvailable)
    document.addEventListener('visibilitychange', reconnectWhenAvailable)

    // Cleanup on unmount
    return () => {
      console.log('\n' + '🧹'.repeat(80))
      console.log('🧹 [Desktop WebSocket] CLEANING UP SOCKET')
      console.log(`   User ID: "${userId}"`)
      console.log(`   Socket ID: ${socket.id}`)
      console.log('🧹'.repeat(80) + '\n')

      socket.off('connect')
      socket.off('disconnect')
      socket.off('room-joined')
      socket.off('telegram-log-updated')
      socket.off('whatsapp-updated')
      socket.off('automation-command')
      socket.off('career-progress')
      socket.off('career-launch')
      socket.off('career-reminder')
      socket.off('connect_error')
      socket.off('error')
      window.clearInterval(heartbeatInterval)
      window.removeEventListener('online', reconnectWhenAvailable)
      document.removeEventListener('visibilitychange', reconnectWhenAvailable)
      whatsappNotificationRef.current?.close()
      whatsappNotificationRef.current = null

      if (socket.connected) {
        socket.disconnect()
      }
    }
  }, [userId, enabled, onCommand, onCareerProgress, onCareerLaunch, onCareerReminder])

  const reconnect = useCallback(() => {
    const socket = socketRef.current
    if (!socket || socket.connected) return
    setError(null)
    socket.connect()
  }, [])

  // Return public API
  return {
    socket: socketRef.current,
    isConnected,
    error,
    reconnect,
    sendMessage: (event: string, data: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data)
      } else {
        console.warn('[Socket.io] Cannot send message: socket not connected')
      }
    }
  }
}
