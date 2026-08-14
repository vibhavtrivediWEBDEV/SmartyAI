/**
 * SnapPreview - Visual preview overlay when dragging windows to snap zones
 * 
 * Glassmorphic macOS-style preview showing where window will snap
 */

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SnapPreviewProps {
  style: React.CSSProperties | null
  visible: boolean
}

export function SnapPreview({ style, visible }: SnapPreviewProps) {
  if (!style || !visible) return null
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 60px rgba(59, 130, 246, 0.2), 0 0 40px rgba(59, 130, 246, 0.3)'
          }}
          className="snap-preview"
        >
          {/* Optional: Add subtle icon or text */}
          <div 
            className="opacity-60"
            style={{
              color: 'rgba(59, 130, 246, 0.8)',
              fontSize: '14px',
              fontWeight: '500',
              letterSpacing: '0.5px',
              textShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
