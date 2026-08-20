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
      socket.off('automation-command')
      socket.off('connect_error')
      socket.off('error')
      
      if (socket.connected) {
        socket.disconnect()
      }
    }
  }, [userId, enabled, onCommand])

  // Return public API
  return {
    socket: socketRef.current,
    isConnected,
    error,
    sendMessage: (event: string, data: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data)
      } else {
        console.warn('[Socket.io] Cannot send message: socket not connected')
      }
    }
  }
}
