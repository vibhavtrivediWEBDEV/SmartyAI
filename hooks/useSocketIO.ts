/**
 * Socket.io Client Hook for Desktop App
 * Enables bidirectional communication with Telegram webhook
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface AutomationCommand {
  commandId: string
  userId: string
  command: string
  source: 'telegram' | 'voice' | 'terminal'
  timestamp: number
}

interface UseSocketIOOptions {
  userId?: string
  enabled?: boolean
  onCommand?: (command: AutomationCommand) => void
}

export function useSocketIO(options: UseSocketIOOptions = {}) {
  const { userId, enabled = true, onCommand } = options
  const socketRef = useRef<Socket | null>(null)
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
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
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

    socket.on('disconnect', (reason) => {
      console.log('\n' + '🔌'.repeat(80))
      console.log('❌ [Desktop WebSocket] DISCONNECTED')
      console.log(`   Reason: ${reason}`)
      console.log('🔌'.repeat(80) + '\n')
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('\n' + '!'.repeat(80))
      console.error('❌ [Desktop WebSocket] CONNECTION ERROR')
      console.error(`   Error: ${err.message}`)
      console.error('!'.repeat(80) + '\n')
      setError(err.message)
    })

    socket.on('error', (err) => {
      console.error('\n' + '!'.repeat(80))
      console.error('❌ [Desktop WebSocket] SOCKET ERROR')
      console.error(`   Error: ${err.message || err}`)
      console.error('!'.repeat(80) + '\n')
      setError(err.message || 'Socket error')
    })

    return () => {
      console.log('[Socket.io Client] Cleaning up...')
      socket.disconnect()
      socketRef.current = null
      sendResultRef.current = null
      setIsConnected(false)
    }
  }, [userId, enabled]) // Removed onCommand from dependencies

  // Send automation result back to server
  const sendResult = useCallback((commandId: string, success: boolean, message?: string) => {
    if (sendResultRef.current) {
      sendResultRef.current(commandId, success, message)
    }
  }, [])

  // Trigger onCommand callback when command received
  useEffect(() => {
    if (!onCommand || !socketRef.current) {
      console.log('[Socket.io Client] ⚠️ Skipping event listeners setup:', { onCommand: !!onCommand, socket: !!socketRef.current });
      return
    }
    
    const socket = socketRef.current
    
    console.log('[Socket.io Client] 🔧 Setting up event listeners for automation events');
    
    // Handler for old format: automation-command (raw text)
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
    
    // Handler for new format: telegram-automation (sequence)
    const handleTelegramAutomation = (data: any) => {
      console.log('\n' + '🚀'.repeat(80))
      console.log('🤖 [Desktop WebSocket] TELEGRAM AUTOMATION SEQUENCE')
      console.log(`   Command ID: ${data.commandId}`)
      console.log(`   Sequence:`, data.sequence)
      console.log(`   Source: ${data.source}`)
      console.log(`   Timestamp: ${new Date(data.timestamp).toLocaleTimeString()}`)
      console.log('🚀'.repeat(80) + '\n')
      
      onCommand(data)
    }
    
    socket.on('automation-command', handleCommand)
    socket.on('telegram-automation', handleTelegramAutomation)
    
    console.log('[Socket.io Client] ✅ Event listeners registered');
    
    // Listen for automation results from other sources (if needed)
    socket.on('automation-result-ack', (data) => {
      console.log('[Desktop WebSocket] 📨 Result acknowledged by server')
    })
    
    return () => {
      console.log('[Socket.io Client] 🧹 Cleaning up event listeners');
      socket.off('automation-command', handleCommand)
      socket.off('telegram-automation', handleTelegramAutomation)
      socket.off('automation-result-ack')
    }
  }, [onCommand])

  return {
    socket: socketRef.current,
    isConnected,
    error,
    sendResult
  }
}
